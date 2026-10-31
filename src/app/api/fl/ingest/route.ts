import { NextResponse, type NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { db } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import { audit } from "@/lib/audit";

// The coordinator reports round METADATA only. `.strict()` rejects any unexpected field, so a
// payload carrying training examples or raw weights is refused rather than stored.
const update = z.object({
  participant_label: z.string().max(40), org_slug: z.string().max(60).nullable(), num_examples: z.number().int().nonnegative().nullable(),
  update_norm: z.number().nullable(), clipped: z.boolean().nullable(), accepted: z.boolean(), reason: z.string().max(300).nullable(),
}).strict();
const payload = z.object({
  program_slug: z.string(),
  round: z.object({
    round_no: z.number().int().positive(), aggregation: z.string().max(120), config: z.record(z.string(), z.unknown()),
    status: z.enum(["completed", "aborted"]), started_at: z.string(), completed_at: z.string().nullable(), updates: z.array(update).max(50),
  }).strict(),
  model: z.object({
    version: z.string().max(40), parent_version: z.string().max(40).nullable(),
    metrics: z.record(z.string(), z.unknown()), baseline: z.record(z.string(), z.unknown()), report: z.record(z.string(), z.unknown()),
  }).strict().nullable(),
}).strict();

function authorised(req: NextRequest) {
  const want = env.flIngestToken;
  const got = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!want || got.length !== want.length) return false;
  return timingSafeEqual(Buffer.from(got), Buffer.from(want));
}

export async function POST(req: NextRequest) {
  if (!authorised(req)) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const parsed = payload.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Rejected payload", issues: parsed.error.issues.slice(0, 5) }, { status: 422 });
  const p = parsed.data;

  const { data: prog } = await db().from("fl_programs").select("id, min_participants").eq("slug", p.program_slug).single();
  if (!prog) return NextResponse.json({ error: "Unknown programme" }, { status: 404 });
  const { data: orgs } = await db().from("organizations").select("id, slug");
  const { data: consented } = await db().from("fl_participants").select("org_id").eq("program_id", prog.id).eq("status", "consented");
  const allowed = new Set((consented ?? []).map((c) => c.org_id));
  const orgId = (slug: string | null) => (orgs ?? []).find((o) => o.slug === slug)?.id ?? null;

  // Any update from an organisation without current consent is recorded as rejected.
  const updates = p.round.updates.map((u) => {
    const id = orgId(u.org_slug);
    const ok = u.accepted && (!u.org_slug || (id !== null && allowed.has(id)));
    return { ...u, org_id: id, accepted: ok, reason: ok ? u.reason : u.reason ?? "No current programme consent" };
  });
  const acceptedCount = updates.filter((u) => u.accepted).length;
  const status = acceptedCount < prog.min_participants ? "aborted" : p.round.status;

  await db().from("fl_rounds").delete().eq("program_id", prog.id).eq("round_no", p.round.round_no);
  const { data: round, error } = await db().from("fl_rounds").insert({
    program_id: prog.id, round_no: p.round.round_no, aggregation: p.round.aggregation, config: p.round.config,
    status, started_at: p.round.started_at, completed_at: p.round.completed_at,
  }).select("id").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await db().from("fl_update_log").insert(updates.map(({ org_slug: _s, ...u }) => ({ ...u, round_id: round.id })));

  if (p.model && status === "completed") {
    await db().from("fl_model_versions").upsert({ program_id: prog.id, round_id: round.id, ...p.model, status: "candidate" }, { onConflict: "program_id,version" });
  }
  await audit(null, "fl.round_ingested", "fl_round", round.id, { round_no: p.round.round_no, accepted: acceptedCount, status });
  return NextResponse.json({ ok: true, round_id: round.id, status, accepted: acceptedCount });
}
