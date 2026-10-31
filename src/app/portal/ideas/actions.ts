"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePlatformRole } from "@/lib/authz/policy";
import { db } from "@/lib/supabase/server";
import { audit } from "@/lib/audit";
import { notify } from "@/lib/notify";
import { fieldErrors, ideaSchema, ideaStatusSchema } from "@/lib/validation";
import { IDEA_STATUS } from "@/lib/constants";

export type IState = { ok: boolean; message?: string; errors?: Record<string, string> };

export async function createIdea(_: IState, fd: FormData): Promise<IState> {
  const v = await requirePlatformRole("product_owner");
  const parsed = ideaSchema.safeParse({
    title: fd.get("title"), problem_statement: fd.get("problem_statement"), offering_id: fd.get("offering_id") || null,
    proposed_outcome: fd.get("proposed_outcome"), team: fd.get("team") || undefined, priority: fd.get("priority"),
    theme_id: fd.get("theme_id") || null, evidence: fd.getAll("evidence").map(String),
  });
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  const { evidence, ...idea } = parsed.data;
  // Evidence may only reference approved, currently published shared copies.
  const { data: ok } = evidence.length ? await db().from("shared_contributions").select("id").in("id", evidence).eq("status", "published") : { data: [] };
  const { data, error } = await db().from("improvement_ideas").insert({ ...idea, owner_id: v.userId, created_by: v.userId, status: "proposed" }).select("id").single();
  if (error) return { ok: false, message: error.message };
  if (ok?.length) await db().from("idea_evidence").insert(ok.map((e) => ({ idea_id: data.id, shared_id: e.id })));
  await db().from("idea_assignments").insert({ idea_id: data.id, user_id: v.userId });
  await db().from("idea_status_history").insert({ idea_id: data.id, from_status: null, to_status: "proposed", note: "Created", actor_id: v.userId });
  await audit(v, "idea.created", "improvement_idea", data.id, { evidence: ok?.length ?? 0 });
  redirect(`/portal/ideas/${data.id}`);
}

export async function updateIdeaStatus(_: IState, fd: FormData): Promise<IState> {
  const v = await requirePlatformRole("product_owner");
  const id = String(fd.get("id"));
  const parsed = ideaStatusSchema.safeParse({
    status: fd.get("status"), note: fd.get("note") || undefined, shared_update: fd.get("shared_update") || undefined, client_visible: fd.get("client_visible") === "on",
  });
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  const { data: cur } = await db().from("improvement_ideas").select("status, title, client_visible").eq("id", id).single();
  if (!cur) return { ok: false, message: "Not found." };
  const p = parsed.data;
  if (p.client_visible && !p.shared_update) return { ok: false, errors: { shared_update: "Write the message clients will see before sharing this idea." } };

  await db().from("improvement_ideas").update({ status: p.status, shared_update: p.shared_update ?? null, client_visible: p.client_visible, internal_notes: (fd.get("internal_notes") as string) || null }).eq("id", id);
  if (cur.status !== p.status) {
    await db().from("idea_status_history").insert({ idea_id: id, from_status: cur.status, to_status: p.status, note: p.note ?? null, actor_id: v.userId });
  }
  await audit(v, "idea.updated", "improvement_idea", id, { from: cur.status, to: p.status, client_visible: p.client_visible });

  // Close the loop: contributors whose approved evidence supports this idea get an
  // audience-appropriate update. Only the shared message is sent, never internal notes.
  if (p.client_visible && (cur.status !== p.status || !cur.client_visible)) {
    const { data: ev } = await db().from("idea_evidence").select("shared_id").eq("idea_id", id);
    const { data: src } = ev?.length ? await db().from("shared_sources").select("observations(author_id)").in("shared_id", ev.map((e) => e.shared_id)) : { data: [] };
    const authors = new Set((src ?? []).map((s) => (s.observations as unknown as { author_id: string }).author_id));
    for (const a of authors) {
      await notify({ userId: a, kind: "idea", title: `"${cur.title}" is now ${IDEA_STATUS[p.status].label}`, body: p.shared_update, link: `/portal/ideas/${id}` },
        { idempotencyKey: `idea:${id}:${p.status}:${a}` });
    }
  }
  revalidatePath(`/portal/ideas/${id}`);
  return { ok: true, message: "Saved. Status change recorded in the audit history." };
}
