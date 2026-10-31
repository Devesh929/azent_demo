"use server";

import { requireWorkspace } from "@/lib/authz/policy";
import { db } from "@/lib/supabase/server";
import { engineBySlug, type Result } from "@/lib/playground";
import { canUseEngine } from "@/lib/data/portal";
import { groqChat } from "@/lib/groq";
import { audit } from "@/lib/audit";

export type RunResult = { ok: true; runId: string; result: Result; narrative: string | null; narrativeNote: string } | { ok: false; message: string };

export async function runScenario(slug: string, scenarioKey: string, params: Record<string, number>, assisted: boolean): Promise<RunResult> {
  const v = await requireWorkspace();
  const engine = engineBySlug(slug);
  if (!engine || !(await canUseEngine(v, engine))) return { ok: false, message: "This demonstration is not available in your workspace." };
  const scenario = engine.scenarios.find((s) => s.key === scenarioKey);
  if (!scenario) return { ok: false, message: "Unknown scenario." };
  // Clamp every input to the declared range; never trust the browser's numbers.
  const clean = Object.fromEntries(engine.params.map((p) => {
    const raw = Number(params[p.key]);
    return [p.key, Number.isFinite(raw) ? Math.min(p.max, Math.max(p.min, raw)) : scenario.defaults[p.key]];
  }));
  const result = engine.run(scenario, clean);

  let narrative: string | null = null;
  let narrativeNote = "Deterministic demonstration.";
  if (assisted) {
    try {
      narrative = await groqChat([
        { role: "system", content: "You explain sandbox results from a synthetic credit/reporting demo in 3 short sentences. Use only the JSON provided. Never present the result as an approved decision. End with: 'Synthetic sandbox output.'" },
        { role: "user", content: JSON.stringify({ scenario: scenario.title, result }) },
      ], { maxTokens: 220 });
      narrativeNote = narrative ? "AI-assisted explanation of the synthetic result (Groq). Check it against the evidence." : "AI assistance is not configured; showing the deterministic result only.";
    } catch {
      narrativeNote = "AI assistance was unavailable; showing the deterministic result only.";
    }
  }

  const { data } = await db().from("playground_runs").insert({
    user_id: v.userId, org_id: v.active!.orgId, scenario_key: scenario.key, offering_slug: slug, inputs: clean, outputs: { ...result, narrative },
  }).select("id").single();
  await audit(v, "playground.run", "playground_run", data?.id, { offering: slug, scenario: scenario.key, assisted }, v.active!.orgId);
  return { ok: true, runId: data!.id, result, narrative, narrativeNote };
}

export async function saveRunFeedback(runId: string, feedback: { helpful: boolean; accuracy: number; comment: string }) {
  const v = await requireWorkspace();
  // Runs are isolated by tenant AND user.
  const { data } = await db().from("playground_runs").update({
    feedback: { helpful: !!feedback.helpful, accuracy: Math.min(5, Math.max(1, Math.round(feedback.accuracy))), comment: String(feedback.comment ?? "").slice(0, 1000) },
    saved: true,
  }).eq("id", runId).eq("user_id", v.userId).eq("org_id", v.active!.orgId).select("id");
  return { ok: !!data?.length };
}
