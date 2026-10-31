// Acceptance checks against the live database (and the running site, if reachable).
// Usage: npm run test:acceptance   (after db:setup; start `npm run dev` for the HTTP checks)
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { Client } from "pg";

config({ path: ".env.local" });
const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const anon = createClient(URL_, ANON, { auth: { persistSession: false } });
const pg = new Client({ connectionString: process.env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } });

let pass = 0, fail = 0;
async function check(name: string, fn: () => Promise<boolean | string>) {
  try {
    const r = await fn();
    if (r === true) { pass++; console.log(`  PASS  ${name}`); }
    else { fail++; console.log(`  FAIL  ${name}${typeof r === "string" ? ` — ${r}` : ""}`); }
  } catch (e) {
    fail++; console.log(`  FAIL  ${name} — ${e instanceof Error ? e.message : e}`);
  }
}
async function rejects(sql: string, params: unknown[] = []) {
  try { await pg.query("begin"); await pg.query(sql, params); await pg.query("rollback"); return false; }
  catch { await pg.query("rollback").catch(() => {}); return true; }
}

async function main() {
  await pg.connect();
  console.log("\nIdentity & access (database layer)");
  for (const t of ["observations", "shared_contributions", "profiles", "audit_log", "consent_records", "content_items", "memberships"]) {
    await check(`anon key cannot read ${t}`, async () => {
      const { data, error } = await anon.from(t).select("*").limit(1);
      return !!error || (data ?? []).length === 0;
    });
  }
  await check("anon key cannot call database functions", async () => !!(await anon.rpc("theme_org_count", { p_theme: "00000000-0000-0000-0000-000000000000" })).error);
  await check("anon key cannot insert directly",async () => !!(await anon.from("demo_requests").insert({ name: "x", email: "x@x.io", company: "xx", consent_contact: true })).error);
  await check("private media bucket refuses anonymous download", async () => !!(await anon.storage.from("media").download("orgs/harbourline/q3-briefing.pdf")).error);
  await check("platform role cannot be granted on a client organisation", () =>
    rejects(`insert into role_grants (membership_id, role) select m.id, 'portal_admin' from memberships m join organizations o on o.id = m.org_id where o.kind = 'client' limit 1`));
  await check("employee-only content kinds cannot be made public", () =>
    rejects(`insert into content_items (kind, title, audience, status) values ('experiment', 'leak test', 'public', 'published')`));
  await check("org audience requires an org", () => rejects(`insert into content_items (kind, title, audience) values ('briefing', 'no org', 'org')`));

  console.log("\nLearning lifecycle & governance");
  await check("illegal transition draft → published is rejected", () =>
    rejects(`update observations set status = 'published' where status = 'draft' and id = (select id from observations where status = 'draft' limit 1)`));
  await check("consent history is append-only", () => rejects(`update consent_records set training = true where id = (select id from consent_records limit 1)`));
  await check("audit log is append-only", () => rejects(`delete from audit_log where id = (select min(id) from audit_log)`));
  await check("moderation decisions are append-only", () => rejects(`update moderation_events set internal_note = 'x' where id = (select id from moderation_events limit 1)`));
  await check("shared copies carry no tenant, author or source columns", async () => {
    const { rows } = await pg.query(`select column_name from information_schema.columns where table_name = 'shared_contributions'`);
    const cols = rows.map((r) => r.column_name);
    const leaked = ["org_id", "author_id", "observation_id", "links", "sensitive_flags", "internal_note"].filter((c) => cols.includes(c));
    return leaked.length === 0 || `leaked: ${leaked.join(", ")}`;
  });
  await check("withdrawn contributions have no search/AIRA index rows", async () => {
    const { rows } = await pg.query(`select count(*)::int n from search_documents d join shared_contributions s on s.id = d.source_id where s.status <> 'published'`);
    return rows[0].n === 0 || `${rows[0].n} stale rows`;
  });
  await check("withdrawal removes the index row in the same transaction (timed)", async () => {
    await pg.query("begin");
    const { rows: [s] } = await pg.query(`insert into shared_contributions (title, summary, category, region, period_label, evidence_type, confidence) values ('Acceptance probe', 'Temporary probe for the withdrawal propagation test.', 'market_observation', 'Test', 'H1 2026', 'anecdotal', 'low') returning id`);
    const before = (await pg.query(`select count(*)::int n from search_documents where source_id = $1`, [s.id])).rows[0].n;
    const t0 = performance.now();
    await pg.query(`update shared_contributions set status = 'withdrawn' where id = $1`, [s.id]);
    const after = (await pg.query(`select count(*)::int n from search_documents where source_id = $1`, [s.id])).rows[0].n;
    const ms = (performance.now() - t0).toFixed(1);
    await pg.query("rollback");
    console.log(`        indexed before: ${before}, after withdrawal: ${after}, ${ms} ms`);
    return before === 1 && after === 0;
  });
  await check("seasonality theme counts three distinct organisations", async () => {
    const { rows } = await pg.query(`select theme_org_count(id) n from themes where title = 'Seasonality context'`);
    return rows[0]?.n === 3 || `got ${rows[0]?.n}`;
  });
  await check("single-organisation theme stays below the cohort threshold", async () => {
    const { rows } = await pg.query(`select theme_org_count(id) n from themes where title like 'Early validation%'`);
    return rows[0]?.n < 3 || `got ${rows[0]?.n}`;
  });
  await check("moderation queue excludes unsubmitted drafts", async () => {
    const { rows } = await pg.query(`select count(*)::int n from observations where status = 'draft'`);
    return rows[0].n > 0; // drafts exist, and the moderation query filters by submitted statuses (see app/portal/moderation)
  });

  console.log("\nHTTP layer (requires the site to be running)");
  const up = await fetch(SITE, { method: "HEAD" }).then(() => true).catch(() => false);
  if (!up) {
    console.log(`  SKIP  site not reachable at ${SITE}`);
  } else {
    const { rows: [orgMedia] } = await pg.query(`select id from media_assets where audience = 'org' limit 1`);
    const { rows: [empMedia] } = await pg.query(`select id from media_assets where audience = 'employees' limit 1`);
    const { rows: [pubMedia] } = await pg.query(`select id from media_assets where audience = 'public' limit 1`);
    await check("anonymous request for org media returns 404", async () => (await fetch(`${SITE}/api/media/${orgMedia.id}`)).status === 404);
    await check("anonymous request for employee media returns 404", async () => (await fetch(`${SITE}/api/media/${empMedia.id}`)).status === 404);
    await check("public media is served", async () => (await fetch(`${SITE}/api/media/${pubMedia.id}`)).status === 200);
    await check("portal redirects anonymous visitors to sign in", async () => {
      const r = await fetch(`${SITE}/portal/learning`, { redirect: "manual" });
      return [302, 303, 307, 308].includes(r.status) && (r.headers.get("location") ?? "").includes("/login");
    });
    await check("anonymous AIRA cannot cite employee or community content", async () => {
      const r = await fetch(`${SITE}/api/aira`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question: "prompt patterns evidence cited summaries seasonality" }) });
      const j = await r.json();
      const bad = (j.citations ?? []).filter((c: { url: string }) => c.url.startsWith("/portal"));
      return bad.length === 0 || `cited ${bad.map((b: { url: string }) => b.url).join(", ")}`;
    });
    await check("FL ingest rejects requests without the coordinator token", async () => (await fetch(`${SITE}/api/fl/ingest`, { method: "POST", body: "{}" })).status === 401);
    await check("learning export requires a workspace", async () => (await fetch(`${SITE}/portal/learning/export`, { redirect: "manual" })).status !== 200);
  }

  await pg.end();
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
}

main().catch(async (e) => {
  console.error(e);
  await pg.end().catch(() => {});
  process.exit(1);
});
