// Seeds SYNTHETIC data for judging. Every organisation, person and figure here is fictional.
// Re-runnable: domain tables are truncated first; auth users are reused if they exist.
// Usage: npm run db:seed
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { Client } from "pg";
import { OFFERINGS } from "../src/content/catalog";
import { PERSONAS, type Persona } from "../src/content/personas";

config({ path: ".env.local" });

const SUPABASE_URL = need("NEXT_PUBLIC_SUPABASE_URL");
const SERVICE_KEY = need("SUPABASE_SERVICE_ROLE_KEY");
const DB_URL = need("SUPABASE_DB_URL");
const DEMO_PASSWORD = need("DEMO_PASSWORD");

function need(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is not set in .env.local`);
  return v;
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
const db = new Client({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } });

// ───────────────────────── fixtures ─────────────────────────
const ORGS = [
  { slug: "azentio", name: "Azentio", kind: "internal", industry: "Financial technology", region: "Global" },
  { slug: "harbourline", name: "Harbourline Bank (Demo)", kind: "client", industry: "Commercial banking", region: "South Asia" },
  { slug: "saffron", name: "Saffron Capital (Demo)", kind: "client", industry: "SME lending", region: "Middle East" },
  { slug: "tidewater", name: "Tidewater Credit (Demo)", kind: "client", industry: "Retail & SME banking", region: "Southeast Asia" },
  { slug: "orchid", name: "Orchid Microfinance (Demo)", kind: "client", industry: "Microfinance", region: "Africa" },
] as const;





const ENTITLEMENTS: Record<string, string[]> = {
  harbourline: ["sme-credit-decisioning-workbench", "financial-analysis-intelligence", "credit-strategy-simulator"],
  saffron: ["sme-credit-decisioning-workbench", "similar-portfolio-intelligence", "financial-analysis-intelligence"],
  tidewater: ["riva", "financial-analysis-intelligence", "sme-credit-decisioning-workbench"],
  orchid: [],
};

// A minimal, valid single-page PDF so gated media can be demonstrated without binary fixtures.
function makePdf(title: string, lines: string[]) {
  const esc = (s: string) => s.replace(/[\\()]/g, (m) => "\\" + m);
  const text = [
    "BT /F1 20 Tf 56 760 Td (" + esc(title) + ") Tj ET",
    ...lines.map((l, i) => `BT /F1 11 Tf 56 ${720 - i * 18} Td (${esc(l)}) Tj ET`),
  ].join("\n");
  const objs = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${Buffer.byteLength(text)} >>\nstream\n${text}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  let out = "%PDF-1.4\n";
  const offsets: number[] = [];
  objs.forEach((o, i) => {
    offsets.push(Buffer.byteLength(out));
    out += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const xref = Buffer.byteLength(out);
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`;
  out += offsets.map((o) => String(o).padStart(10, "0") + " 00000 n \n").join("");
  out += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(out);
}

// ───────────────────────── helpers ─────────────────────────
async function q<T = Record<string, unknown>>(sql: string, params: unknown[] = []) {
  return (await db.query(sql, params)).rows as T[];
}
async function one<T = Record<string, unknown>>(sql: string, params: unknown[] = []) {
  const rows = await q<T>(sql, params);
  return rows[0];
}

async function ensureUser(p: Persona) {
  const existing = await one<{ id: string }>("select id from auth.users where email = $1", [p.email]);
  if (existing) {
    await admin.auth.admin.updateUserById(existing.id, { password: DEMO_PASSWORD, email_confirm: true });
    return existing.id;
  }
  const { data, error } = await admin.auth.admin.createUser({
    email: p.email, password: DEMO_PASSWORD, email_confirm: true,
    user_metadata: { display_name: p.name, synthetic: true },
  });
  if (error || !data.user) throw new Error(`createUser ${p.email}: ${error?.message}`);
  return data.user.id;
}

async function upload(path: string, body: Buffer, contentType: string) {
  const { error } = await admin.storage.from("media").upload(path, body, { contentType, upsert: true });
  if (error) throw new Error(`upload ${path}: ${error.message}`);
}

const days = (n: number) => new Date(Date.now() + n * 86400000).toISOString();

// ───────────────────────── main ─────────────────────────
async function main() {
  await db.connect();
  console.log("Resetting domain tables…");
  await db.query(`
    truncate table
      fl_update_log, fl_model_versions, fl_rounds, fl_participants, fl_programs,
      search_documents, audit_log, email_outbox, notifications, contribution_feedback, saved_searches, bookmarks,
      comments, idea_status_history, idea_assignments, idea_evidence, improvement_ideas, theme_contributions, themes,
      reports, moderation_events, shared_sources, shared_contributions, consent_records, observation_versions,
      observations, support_tickets, playground_runs, hackathon_team_members, hackathon_teams, event_registrations,
      demo_requests, session_registrations, live_sessions, content_feedback, content_items, media_assets,
      entitlements, offerings, support_grants, invitations, role_grants, memberships, profiles, organizations,
      platform_settings
    restart identity cascade
  `);

  // Organisations
  const org: Record<string, string> = {};
  for (const o of ORGS) {
    const r = await one<{ id: string }>(
      "insert into organizations (slug, name, kind, industry, region) values ($1,$2,$3,$4,$5) returning id",
      [o.slug, o.name, o.kind, o.industry, o.region],
    );
    org[o.slug] = r.id;
  }

  // People, memberships, role grants
  console.log("Creating synthetic personas…");
  const user: Record<string, string> = {};
  for (const p of PERSONAS) {
    const id = await ensureUser(p);
    user[p.email.split("@")[0]] = id;
    await q("insert into profiles (id, email, display_name, title) values ($1,$2,$3,$4)", [id, p.email, p.name, p.title]);
    for (const m of p.memberships) {
      const mem = await one<{ id: string }>(
        "insert into memberships (user_id, org_id, status, terms_accepted_at) values ($1,$2,'active',now()) returning id",
        [id, org[m.org]],
      );
      for (const role of m.roles) {
        await q("insert into role_grants (membership_id, role) values ($1,$2)", [mem.id, role]);
      }
    }
  }
  const U = user as Record<
    "ava.employee" | "omar.owner" | "mei.moderator" | "leo.publisher" | "priya.admin" | "noah.ml" |
    "hana.admin" | "raj.analyst" | "sara.admin" | "tom.analyst" | "lina.admin" | "ken.analyst" | "zuri.member" | "maya.advisor",
    string
  >;

  // Offerings & entitlements
  const off: Record<string, string> = {};
  for (const [i, o] of OFFERINGS.entries()) {
    const r = await one<{ id: string }>(
      `insert into offerings (slug, name, kicker, tagline, category, summary, description, capabilities, outcomes, audience, sort)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,'public',$10) returning id`,
      [o.slug, o.name, o.kicker, o.tagline, o.category, o.summary, o.description, JSON.stringify(o.capabilities), JSON.stringify(o.outcomes), i],
    );
    off[o.slug] = r.id;
    await q(
      `insert into search_documents (source_type, source_id, audience, offering_id, title, body, url)
       values ('offering',$1,'public',$1,$2,$3,$4)`,
      [r.id, o.name, `${o.tagline} ${o.summary} ${o.description}`, `/products/${o.slug}`],
    );
  }
  for (const [o, list] of Object.entries(ENTITLEMENTS)) {
    for (const slug of list) await q("insert into entitlements (org_id, offering_id) values ($1,$2)", [org[o], off[slug]]);
  }

  // Gated media in the private bucket
  console.log("Uploading gated media…");
  const media: Record<string, string> = {};
  const mediaDefs = [
    { key: "brochure", path: "public/azentio-ai-overview.pdf", title: "azentio.ai platform overview", audience: "public", org: null, offering: null,
      pdf: makePdf("azentio.ai platform overview", ["Synthetic overview for the hackathon portal.", "Products: decisioning, analysis, portfolio, reporting.", "All examples use synthetic data."]) },
    { key: "internalDeck", path: "employees/collections-copilot-walkthrough.pdf", title: "Collections Copilot prototype walkthrough", audience: "employees", org: null, offering: null,
      pdf: makePdf("INTERNAL - Collections Copilot prototype", ["Employee-only prototype notes.", "Not for client or public distribution.", "Prompt and model choices are experimental."]) },
    { key: "harbourBriefing", path: "orgs/harbourline/q3-briefing.pdf", title: "Harbourline Q3 client briefing", audience: "org", org: "harbourline", offering: null,
      pdf: makePdf("Harbourline Bank (Demo) - Q3 briefing", ["Prepared for Harbourline Bank (Demo) only.", "Workbench adoption: 4 branches onboarded (synthetic).", "Next: seasonality explanation pilot (under review)."]) },
    { key: "workbenchNotes", path: "offerings/workbench-3-2-release.pdf", title: "Workbench 3.2 release notes", audience: "entitled_clients", org: null, offering: "sme-credit-decisioning-workbench",
      pdf: makePdf("SME Credit Decisioning Workbench 3.2", ["Release notes for entitled clients.", "New: evidence panel export.", "Improved: policy rule explanations."]) },
  ] as const;
  for (const m of mediaDefs) {
    await upload(m.path, m.pdf, "application/pdf");
    const r = await one<{ id: string }>(
      `insert into media_assets (title, storage_path, mime, audience, org_id, offering_id, created_by)
       values ($1,$2,'application/pdf',$3,$4,$5,$6) returning id`,
      [m.title, m.path, m.audience, m.org ? org[m.org] : null, m.offering ? off[m.offering] : null, U["leo.publisher"]],
    );
    media[m.key] = r.id;
  }

  // Content for every audience
  console.log("Creating content…");
  const content = [
    { kind: "banner", slug: "hackathon-2026", title: "azentio.ai Hackathon 2026: registrations are open", summary: "Build governed AI for financial services. Teams of up to five.", audience: "public" },
    { kind: "insight", slug: "explainability-is-a-credit-feature", title: "Explainability is a credit feature, not a compliance afterthought", audience: "public",
      summary: "Why every recommendation in a credit workflow should carry its evidence.",
      body: "A credit recommendation that cannot show its working is a liability. When analysts can see which ratios, policies and comparable cohorts drove a recommendation, they challenge it faster and trust it more. We design every decisioning surface so the evidence travels with the answer, and the final decision stays with a person." },
    { kind: "insight", slug: "governed-collective-learning", title: "Governed collective learning: sharing what the market teaches us", audience: "public",
      summary: "How client observations become shared learning without exposing anyone's private information.",
      body: "Clients see the market first. Our collective learning hub lets them propose observations, which moderators de-identify before anything is shared. Trends are only shown when enough distinct organisations contribute, and contributors can withdraw at any time. Collective learning is not model training: no model changes because someone posted an observation." },
    { kind: "insight", slug: "simulate-before-production", title: "Simulate policy before it reaches production", audience: "public",
      summary: "What credit teams learn when they replay a policy change against history.",
      body: "Most policy surprises are visible in advance if you replay the change. Simulation turns a debate about thresholds into a comparison of approval rates, expected loss and concentration, all labelled as projections rather than promises." },
    { kind: "knowledge", title: "Prompt patterns for evidence-cited summaries", audience: "employees", owner: "ava.employee", review: 45,
      summary: "Internal guidance for AIRA prompt design.", body: "Always pass approved, audience-filtered passages only. Require bracketed citations. Refuse when evidence is insufficient. Never include tenant identifiers in prompts." },
    { kind: "prototype_note", title: "Collections Copilot: prototype notes", audience: "employees", owner: "noah.ml", review: 30, media: "internalDeck",
      summary: "Employee-only notes on an experimental collections assistant.", body: "Experimental. Not on the public roadmap. Uses synthetic delinquency scenarios only." },
    { kind: "experiment", title: "Seasonality detector for monthly SME cash flow", audience: "employees", owner: "omar.owner", review: 20,
      summary: "Experiment: detect recurring troughs before ratio analysis.", body: "Hypothesis: flagging seasonal troughs reduces false deterioration alerts. Status: offline evaluation on synthetic statements." },
    { kind: "broadcast", title: "AI Lab all-hands: Q4 priorities", audience: "employees", summary: "Employee broadcast from the AI Lab.",
      body: "Q4 focus: evidence-cited explanations, the collective learning pilot and the federated learning research track." },
    { kind: "release_note", title: "Internal: portal 0.9 release", audience: "employees", summary: "Moderation queue, theme dashboard and withdrawal propagation." , body: "Shipped to the employee environment." },
    { kind: "release_note", title: "Workbench 3.2 is available", audience: "entitled_clients", offering: "sme-credit-decisioning-workbench", media: "workbenchNotes",
      summary: "Evidence panel export and clearer policy explanations.", body: "Entitled clients can now export the evidence panel with each recommendation." },
    { kind: "briefing", title: "Harbourline Q3 briefing", audience: "org", org: "harbourline", media: "harbourBriefing",
      summary: "Your quarterly briefing, prepared for Harbourline Bank (Demo) only.", body: "Adoption progress, open support items and the seasonality pilot status." },
    { kind: "resource", title: "Client guide: contributing observations safely", audience: "all_clients",
      summary: "What to include, what to leave out and how sharing works.", body: "Describe patterns, not people. Never include customer names, account numbers or transaction-level data. Choose who can see each contribution, and withdraw whenever you need to." },
    { kind: "media", title: "azentio.ai platform overview (PDF)", audience: "public", media: "brochure", slug: "platform-overview",
      summary: "A short overview of the azentio.ai product family.", body: "Download the platform overview." },
  ] as const;
  for (const c of content) {
    const cc = c as Record<string, unknown>;
    await q(
      `insert into content_items (kind, slug, title, summary, body, audience, org_id, offering_id, media_asset_id, owner_id, review_due, status, published_at, created_by)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'published',now(),$12)`,
      [
        c.kind, (cc.slug as string) ?? null, c.title, c.summary ?? null, (cc.body as string) ?? null, c.audience,
        cc.org ? org[cc.org as string] : null, cc.offering ? off[cc.offering as string] : null,
        cc.media ? media[cc.media as string] : null, cc.owner ? U[cc.owner as keyof typeof U] : null,
        cc.review ? days(cc.review as number).slice(0, 10) : null, U["leo.publisher"],
      ],
    );
  }

  // Live sessions
  const sessions = [
    { title: "azentio.ai LIVE: explainable credit decisions", kind: "live", audience: "public", starts: 6, status: "scheduled", desc: "A public walkthrough of evidence-backed recommendations." },
    { title: "AI Lab demo day", kind: "live", audience: "employees", starts: 2, status: "scheduled", desc: "Employee-only demos of current experiments." },
    { title: "Workbench 3.2 webinar", kind: "webinar", audience: "entitled_clients", offering: "sme-credit-decisioning-workbench", starts: 9, status: "scheduled", desc: "Invitation-only for Workbench clients." },
    { title: "RIVA onboarding clinic", kind: "webinar", audience: "org", org: "tidewater", starts: 4, status: "scheduled", desc: "A private clinic for Tidewater Credit (Demo)." },
    { title: "Internal recording: moderation workflow training", kind: "recording", audience: "employees", starts: -5, status: "ended", desc: "Recording for moderators.", media: "internalDeck" },
  ];
  for (const s of sessions) {
    await q(
      `insert into live_sessions (title, description, kind, audience, org_id, offering_id, starts_at, duration_min, status, recording_asset_id, created_by)
       values ($1,$2,$3,$4,$5,$6,$7,45,$8,$9,$10)`,
      [s.title, s.desc, s.kind, s.audience, s.org ? org[s.org] : null, s.offering ? off[s.offering] : null, days(s.starts), s.status,
       s.media ? media[s.media] : null, U["leo.publisher"]],
    );
  }

  // ── Collective learning: the illustrative end-to-end scenario ──
  console.log("Creating observations and the seasonality scenario…");
  type Obs = {
    key: string; org: string; author: keyof typeof U; title: string; category: string; body: string; offering?: string;
    status: string; visibility?: string; evidence: string; confidence: string; period: [string, string];
    consent?: [boolean, boolean, boolean, boolean]; flags?: string[];
    shared?: { title: string; summary: string; region: string; period: string; attribution?: string; status?: string; quality?: string };
  };
  const OBS: Obs[] = [
    {
      key: "seasonA", org: "harbourline", author: "raj.analyst", status: "published", evidence: "client_interactions", confidence: "medium",
      title: "Seasonal SME revenue dips read as deterioration", category: "product_gap", offering: "financial-analysis-intelligence",
      period: ["2026-01-01", "2026-06-30"], consent: [true, true, false, false],
      body: "Across several monsoon-dependent SME borrowers in our Kochi branch cluster, Q2 revenue falls 30-40% every year and recovers in Q4. Ratio trend analysis flags these as deteriorating, and analysts override the flag by hand each cycle.",
      shared: { title: "Seasonal SME revenue dips are read as deterioration", summary: "For SMEs with strongly seasonal revenue, a predictable mid-year dip is flagged as deterioration by ratio trend analysis, and analysts routinely override it. A seasonality-aware comparison would reduce false alerts.", region: "South Asia", period: "H1 2026", quality: "moderate" },
    },
    {
      key: "seasonB", org: "saffron", author: "tom.analyst", status: "published", evidence: "aggregated_internal_data", confidence: "medium",
      title: "Agri-linked SMEs show quarterly cash-flow troughs", category: "market_observation", offering: "financial-analysis-intelligence",
      period: ["2026-01-01", "2026-06-30"], consent: [true, true, false, false],
      body: "Agri-input distributors in our book show sharp cash-flow troughs before harvest. Peer comparison against non-seasonal distributors makes them look weaker than they are.",
      shared: { title: "Pre-harvest cash-flow troughs distort peer comparison", summary: "Agri-linked SMEs show recurring pre-harvest cash-flow troughs. Comparing them with non-seasonal peers in the same period overstates weakness.", region: "Middle East", period: "H1 2026", quality: "moderate" },
    },
    {
      key: "seasonC", org: "tidewater", author: "ken.analyst", status: "published", evidence: "client_interactions", confidence: "low",
      title: "Festive retail working capital spikes distort ratios", category: "market_observation", offering: "financial-analysis-intelligence",
      period: ["2026-01-01", "2026-06-30"], consent: [true, true, true, false],
      body: "Retail SMEs build inventory before festive periods; current ratio and inventory days spike and look like stress in the quarter before sales land.",
      shared: { title: "Pre-festive inventory build looks like working-capital stress", summary: "Retail SMEs build inventory ahead of festive seasons, so liquidity and inventory ratios temporarily look stressed in the preceding quarter.", region: "Southeast Asia", period: "H1 2026", attribution: "Tidewater Credit (Demo)", quality: "limited" },
    },
    {
      key: "riva1", org: "tidewater", author: "ken.analyst", status: "published", evidence: "aggregated_internal_data", confidence: "high",
      title: "Validation rules catch mapping errors before submission", category: "successful_practice", offering: "riva",
      period: ["2026-04-01", "2026-09-30"], consent: [true, true, false, false],
      body: "Running cross-report validation two days before the deadline caught three template mapping errors in the last cycle.",
      shared: { title: "Early cross-report validation catches mapping errors", summary: "Running cross-report validation well before the submission deadline surfaces template mapping errors while there is still time to fix them.", region: "Southeast Asia", period: "2026", quality: "strong" },
    },
    {
      key: "withdrawn", org: "saffron", author: "tom.analyst", status: "withdrawn", evidence: "anecdotal", confidence: "low",
      title: "Collateral photos often lack timestamps", category: "operational_challenge", offering: "document-intelligence-studio",
      period: ["2026-03-01", "2026-05-31"], consent: [true, false, false, false],
      body: "Field officers upload collateral photos without timestamps, which slows verification. Withdrawn by the contributor after internal review.",
      shared: { title: "Collateral photos frequently lack capture timestamps", summary: "Collateral photographs often arrive without capture timestamps, which slows verification.", region: "Middle East", period: "H1 2026", status: "withdrawn" },
    },
    {
      key: "pendingSaffron", org: "saffron", author: "sara.admin", status: "submitted", evidence: "client_interactions", confidence: "medium",
      title: "Portfolio comparisons need sub-sector filters", category: "improvement_suggestion", offering: "similar-portfolio-intelligence",
      period: ["2026-07-01", "2026-09-30"], consent: [true, true, false, false],
      body: "Comparable cohorts mix food processing with textile manufacturing because both sit under 'manufacturing'. Sub-sector filters would make comparisons meaningful.",
    },
    {
      key: "flagged", org: "tidewater", author: "lina.admin", status: "submitted", evidence: "aggregated_internal_data", confidence: "medium",
      title: "Reconciliation breaks in the monthly liquidity return", category: "operational_challenge", offering: "riva",
      period: ["2026-08-01", "2026-08-31"], consent: [true, true, false, false],
      body: "The liquidity return failed reconciliation for account 0045128899 and two others because the GL mapping changed mid-month. Contact lina.admin@tidewater.example for the file.",
      flags: ["account_number", "email_address"],
    },
    {
      key: "returned", org: "harbourline", author: "hana.admin", status: "returned", evidence: "anecdotal", confidence: "low",
      title: "Officers want plain-language policy explanations", category: "improvement_suggestion", offering: "sme-credit-decisioning-workbench",
      period: ["2026-06-01", "2026-08-31"], consent: [true, true, false, false],
      body: "Relationship officers struggle to explain policy declines to SME owners. A plain-language explanation of the failed rule would help conversations.",
    },
    {
      key: "draftPrivate", org: "harbourline", author: "raj.analyst", status: "draft", visibility: "private", evidence: "anecdotal", confidence: "low",
      title: "Collateral document turnaround is slowing approvals", category: "operational_challenge",
      period: ["2026-09-01", "2026-09-30"], body: "Private draft: collateral checks take five working days on average at two branches. Need to confirm before sharing anything.",
    },
    {
      key: "draftOrg", org: "harbourline", author: "hana.admin", status: "draft", visibility: "org", evidence: "client_interactions", confidence: "medium",
      title: "Branch teams want bulk statement upload", category: "improvement_suggestion", offering: "financial-analysis-intelligence",
      period: ["2026-08-01", "2026-09-30"], body: "Organisation-only note: branch teams upload statements one by one. Bulk upload would save around an hour per case batch.",
    },
  ];

  const obsId: Record<string, string> = {};
  const sharedId: Record<string, string> = {};
  for (const o of OBS) {
    const r = await one<{ id: string }>(
      `insert into observations (org_id, author_id, title, category, body, offering_id, industry, region, period_start, period_end,
         evidence_type, confidence, visibility, status, sensitive_flags, moderator_id, return_reason, submitted_at, withdrawn_at)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'draft',$14,$15,$16,$17,$18) returning id`,
      [
        org[o.org], U[o.author], o.title, o.category, o.body, o.offering ? off[o.offering] : null,
        ORGS.find((x) => x.slug === o.org)!.industry, ORGS.find((x) => x.slug === o.org)!.region, o.period[0], o.period[1],
        o.evidence, o.confidence, o.visibility ?? "org", JSON.stringify(o.flags ?? []),
        o.status === "draft" ? null : U["mei.moderator"],
        o.status === "returned" ? "Please describe how many officers raised this and over what period, without naming any customer." : null,
        o.status === "draft" ? null : days(-20), o.status === "withdrawn" ? days(-3) : null,
      ],
    );
    obsId[o.key] = r.id;
    // Walk the lifecycle through legal transitions only.
    const path: Record<string, string[]> = {
      draft: [], submitted: ["submitted"], returned: ["submitted", "in_review", "returned"],
      published: ["submitted", "in_review", "published"], withdrawn: ["submitted", "in_review", "published", "withdrawn"],
    };
    for (const s of path[o.status]) await q("update observations set status = $2 where id = $1", [r.id, s]);
    await q("insert into observation_versions (observation_id, version, snapshot, created_by) values ($1,1,$2,$3)",
      [r.id, JSON.stringify({ title: o.title, body: o.body, category: o.category }), U[o.author]]);
    if (o.consent) {
      const [a, b, c, d] = o.consent;
      await q(`insert into consent_records (observation_id, store_process, publish_shared, attribution, training, recorded_by, note)
               values ($1,$2,$3,$4,$5,$6,'Recorded at submission')`, [r.id, a, b, c, d, U[o.author]]);
    }
    if (o.status !== "draft") {
      await q(`insert into moderation_events (observation_id, action, from_status, to_status, actor_id) values ($1,'submit','draft','submitted',$2)`, [r.id, U[o.author]]);
    }
    if (o.key === "seasonB") {
      await q(`insert into moderation_events (observation_id, action, from_status, to_status, reason_public, internal_note, actor_id)
               values ($1,'request_clarification','in_review','returned','Please state the observation period and remove the distributor names.','Names of two distributors in first draft, removed on resubmission.',$2)`,
        [r.id, U["mei.moderator"]]);
      await q(`insert into moderation_events (observation_id, action, from_status, to_status, actor_id) values ($1,'resubmit','returned','submitted',$2)`, [r.id, U[o.author]]);
    }
    if (o.status === "returned") {
      await q(`insert into moderation_events (observation_id, action, from_status, to_status, reason_public, actor_id)
               values ($1,'request_clarification','in_review','returned','Please describe how many officers raised this and over what period, without naming any customer.',$2)`,
        [r.id, U["mei.moderator"]]);
    }
    if (o.shared) {
      const s = await one<{ id: string }>(
        `insert into shared_contributions (title, summary, category, offering_id, industry, region, period_label, evidence_type, confidence,
           attribution_label, status, evidence_quality, published_by, published_at)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'published',$11,$12,$13) returning id`,
        [o.shared.title, o.shared.summary, o.category, o.offering ? off[o.offering] : null, ORGS.find((x) => x.slug === o.org)!.industry,
         o.shared.region, o.shared.period, o.evidence, o.confidence, o.shared.attribution ?? null, o.shared.quality ?? null,
         U["mei.moderator"], days(-10)],
      );
      sharedId[o.key] = s.id;
      await q("insert into shared_sources (shared_id, observation_id, org_id) values ($1,$2,$3)", [s.id, r.id, org[o.org]]);
      await q(`insert into moderation_events (observation_id, shared_id, action, from_status, to_status, reason_public, internal_note, actor_id)
               values ($1,$2,'publish','in_review','published','Published with location and names generalised.','Coarsened region and period; removed branch name.',$3)`,
        [r.id, s.id, U["mei.moderator"]]);
      if (o.shared.status === "withdrawn") {
        await q("update shared_contributions set status = 'withdrawn' where id = $1", [s.id]);
        await q(`insert into moderation_events (observation_id, shared_id, action, from_status, to_status, reason_public, actor_id)
                 values ($1,$2,'withdraw','published','withdrawn','Withdrawn by the contributor.',$3)`, [r.id, s.id, U[o.author]]);
      }
    }
  }

  // Theme + improvement idea (the doc's worked example)
  const theme = await one<{ id: string }>(
    `insert into themes (title, summary, limitations, offering_ids, period_label, status, created_by)
     values ('Seasonality context',
       'Clients in three regions report that predictable seasonal swings in SME revenue, cash flow and inventory are interpreted as deterioration by standard ratio and peer analysis.',
       'Small sample: three contributions from three organisations, each with low or medium confidence. Shows a recurring pattern in contributor experience, not market prevalence or causation.',
       $1, 'H1 2026', 'active', $2) returning id`,
    [[off["financial-analysis-intelligence"]], U["omar.owner"]],
  );
  for (const k of ["seasonA", "seasonB", "seasonC"]) await q("insert into theme_contributions values ($1,$2)", [theme.id, sharedId[k]]);
  const theme2 = await one<{ id: string }>(
    `insert into themes (title, summary, limitations, offering_ids, period_label, status, created_by)
     values ('Early validation in regulatory reporting', 'Running validation earlier in the reporting cycle reduces late mapping fixes.',
       'Single contributing organisation. Counts are suppressed until the minimum cohort is met.', $1, '2026', 'emerging', $2) returning id`,
    [[off["riva"]], U["omar.owner"]],
  );
  await q("insert into theme_contributions values ($1,$2)", [theme2.id, sharedId["riva1"]]);
  for (const t of [theme.id, theme2.id]) {
    const th = await one<{ title: string; summary: string }>("select title, summary from themes where id = $1", [t]);
    await q(`insert into search_documents (source_type, source_id, audience, title, body, url) values ('theme',$1,'community',$2,$3,$4)`,
      [t, th.title, th.summary, `/portal/learning/themes/${t}`]);
  }

  const idea = await one<{ id: string }>(
    `insert into improvement_ideas (title, problem_statement, offering_id, proposed_outcome, owner_id, team, priority, status, theme_id,
       shared_update, internal_notes, client_visible, created_by)
     values ('Seasonality-aware comparison explanation',
       'Ratio trend and peer analysis flag predictable seasonal swings as deterioration, creating false alerts and manual overrides.',
       $1, 'When a borrower shows a recurring seasonal pattern, explanations compare like-for-like periods and say so explicitly.',
       $2, 'Financial Analysis', 'high', 'proposed', $3,
       'We are reviewing a seasonality-aware comparison explanation for Financial Analysis Intelligence. This is under review and is not a delivery commitment.',
       'Sizing pending; depends on statement period tagging. Do not share timelines.', true, $2) returning id`,
    [off["financial-analysis-intelligence"], U["omar.owner"], theme.id],
  );
  for (const k of ["seasonA", "seasonB", "seasonC"]) await q("insert into idea_evidence values ($1,$2)", [idea.id, sharedId[k]]);
  await q("insert into idea_assignments values ($1,$2)", [idea.id, U["omar.owner"]]);
  await q("insert into idea_status_history (idea_id, from_status, to_status, note, actor_id) values ($1,null,'proposed','Created from theme',$2)", [idea.id, U["omar.owner"]]);
  await q("update improvement_ideas set status = 'under_review' where id = $1", [idea.id]);
  await q("insert into idea_status_history (idea_id, from_status, to_status, note, actor_id) values ($1,'proposed','under_review','Evidence reviewed with design',$2)", [idea.id, U["omar.owner"]]);

  const idea2 = await one<{ id: string }>(
    `insert into improvement_ideas (title, problem_statement, offering_id, proposed_outcome, owner_id, team, priority, status, client_visible, shared_update, internal_notes, created_by)
     values ('Validation readiness check in RIVA', 'Teams discover mapping errors close to the deadline.', $1,
       'A readiness check that runs cross-report validation early and summarises open issues.', $2, 'Reporting', 'medium', 'proposed', false, null,
       'Internal only until the theme meets the cohort threshold.', $2) returning id`,
    [off["riva"], U["omar.owner"]],
  );
  await q("insert into idea_evidence values ($1,$2)", [idea2.id, sharedId["riva1"]]);
  await q("insert into idea_status_history (idea_id, from_status, to_status, note, actor_id) values ($1,null,'proposed','Created',$2)", [idea2.id, U["omar.owner"]]);

  // A report awaiting a moderator decision, plus some feedback & comments
  await q(`insert into reports (shared_id, reporter_id, reason, details) values ($1,$2,'misleading','The ratio impact described seems larger than what we see; please check evidence.')`,
    [sharedId["seasonC"], U["sara.admin"]]);
  await q("insert into contribution_feedback values ($1,$2,'useful',now()), ($1,$3,'useful',now()), ($4,$2,'needs_evidence',now())",
    [sharedId["seasonA"], U["sara.admin"], U["lina.admin"], sharedId["seasonC"]]);
  await q("update shared_contributions set useful_count = 2 where id = $1", [sharedId["seasonA"]]);
  await q("update shared_contributions set needs_evidence_count = 1 where id = $1", [sharedId["seasonC"]]);
  await q(`insert into comments (parent_type, parent_id, author_id, body) values ('shared_contribution',$1,$2,'We see the same pattern with tea exporters. Useful framing.')`,
    [sharedId["seasonA"], U["lina.admin"]]);

  // In-app notifications (P0 delivery channel)
  const notes = [
    [U["raj.analyst"], "status", "Your observation was published", "A de-identified version of \"Seasonal SME revenue dips read as deterioration\" is now shared.", "/portal/observations/" + obsId.seasonA],
    [U["hana.admin"], "status", "Clarification requested", "A moderator asked for more detail on \"Officers want plain-language policy explanations\".", "/portal/observations/" + obsId.returned],
    [U["raj.analyst"], "idea", "A theme you contributed to is under review", "\"Seasonality-aware comparison explanation\" is now Under review.", "/portal/ideas/" + idea.id],
    [U["mei.moderator"], "queue", "2 contributions awaiting review", "One is flagged for possible sensitive content.", "/portal/moderation"],
  ];
  for (const n of notes) await q("insert into notifications (user_id, kind, title, body, link) values ($1,$2,$3,$4,$5)", n);

  // Employee innovation
  const team = await one<{ id: string }>(
    `insert into hackathon_teams (name, challenge, offering_id, status, created_by) values ('Seasonality Sleuths','Reduce false deterioration alerts for seasonal SMEs',$1,'building',$2) returning id`,
    [off["financial-analysis-intelligence"], U["ava.employee"]],
  );
  await q("insert into hackathon_team_members values ($1,$2,'lead'), ($1,$3,'member')", [team.id, U["ava.employee"], U["omar.owner"]]);
  await q(`insert into support_tickets (org_id, created_by, subject, body, priority) values ($1,$2,'Evidence export missing cover page','The exported evidence pack has no cover page in the 3.2 build.','low')`,
    [org.harbourline, U["raj.analyst"]]);

  // Federated learning programme (P2): consent is separate from membership and publishing
  const prog = await one<{ id: string }>(
    `insert into fl_programs (slug, name, task, model, feature_schema, min_participants, clip_norm)
     values ('sme-early-warning', 'SME early-warning research programme',
       'Binary classification: 90-day delinquency on synthetic SME facilities',
       'Logistic regression (8 features + bias), FedAvg weighted by sample count',
       $1, 3, 1.0) returning id`,
    [JSON.stringify(["revenue_volatility", "current_ratio", "dscr", "seasonality_index", "months_on_book", "utilisation", "overdue_30_count", "sector_risk"])],
  );
  for (const [slug, status] of [["harbourline", "consented"], ["saffron", "consented"], ["tidewater", "consented"], ["orchid", "invited"]] as const) {
    await q(`insert into fl_participants (program_id, org_id, status, consented_at) values ($1,$2,$3,$4)`,
      [prog.id, org[slug], status, status === "consented" ? days(-14) : null]);
  }

  // Platform settings
  const settings: [string, unknown][] = [
    ["min_cohort_orgs", Number(process.env.MIN_COHORT_ORGS ?? 3)],
    ["withdrawal_propagation", { judging: "synchronous (same transaction)", production_sla_seconds: 300 }],
    ["retention_policy", { consent_history: "7 years", moderation_decisions: "7 years", withdrawn_source: "90 days then purged", audit_log: "7 years" }],
    ["sensitive_patterns", ["account_number", "card_number", "email_address", "phone_number", "national_id", "iban"]],
  ];
  for (const [k, v] of settings) await q("insert into platform_settings (key, value) values ($1,$2)", [k, JSON.stringify(v)]);

  await q(`insert into audit_log (actor_label, action, resource_type, metadata) values ('seed','seed.completed','system',$1)`,
    [JSON.stringify({ orgs: ORGS.length, personas: PERSONAS.length })]);

  await db.end();
  console.log(`Seed complete: ${ORGS.length} organisations, ${PERSONAS.length} personas, ${OBS.length} observations.`);
}

main().catch(async (err) => {
  console.error(err instanceof Error ? err.message : err);
  await db.end().catch(() => {});
  process.exit(1);
});
