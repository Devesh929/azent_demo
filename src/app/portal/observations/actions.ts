"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireClient } from "@/lib/authz/policy";
import { db } from "@/lib/supabase/server";
import { audit } from "@/lib/audit";
import { notify } from "@/lib/notify";
import { scanSensitive } from "@/lib/sensitive";
import { canEditObservation, getObservation, latestConsent } from "@/lib/data/learning";
import { consentSchema, fieldErrors, observationSchema } from "@/lib/validation";

export type ActionState = { ok: boolean; message?: string; errors?: Record<string, string> };

function readObservation(fd: FormData) {
  return {
    title: fd.get("title"), category: fd.get("category"), body: fd.get("body"),
    offering_id: fd.get("offering_id") || null, industry: fd.get("industry") || null, region: fd.get("region") || null,
    period_start: fd.get("period_start"), period_end: fd.get("period_end"), evidence_type: fd.get("evidence_type"),
    confidence: fd.get("confidence"), visibility: fd.get("visibility") ?? "private",
    links: String(fd.get("links") ?? "").split(/\s+/).map((s) => s.trim()).filter(Boolean),
  };
}

async function notifyModerators(title: string, body: string, link: string, key: string) {
  const { data } = await db().from("role_grants").select("memberships!inner(user_id)").eq("role", "learning_moderator").is("revoked_at", null);
  for (const r of (data ?? []) as unknown as { memberships: { user_id: string } }[]) {
    await notify({ userId: r.memberships.user_id, kind: "queue", title, body, link }, { idempotencyKey: `${key}:${r.memberships.user_id}` });
  }
}

export async function saveObservation(_: ActionState, fd: FormData): Promise<ActionState> {
  const v = await requireClient();
  const parsed = observationSchema.safeParse(readObservation(fd));
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  const input = parsed.data;
  const flags = scanSensitive(input.title, input.body);
  const id = String(fd.get("id") ?? "");

  if (!id) {
    // org_id and author come from the verified session, never from the form.
    const { data, error } = await db().from("observations")
      .insert({ ...input, org_id: v.active.orgId, author_id: v.userId, status: "draft", sensitive_flags: flags })
      .select("id").single();
    if (error) return { ok: false, message: "Could not save the draft." };
    await db().from("observation_versions").insert({ observation_id: data.id, version: 1, snapshot: input, created_by: v.userId });
    await audit(v, "observation.draft_created", "observation", data.id, { visibility: input.visibility }, v.active.orgId);
    redirect(`/portal/observations/${data.id}?saved=1`);
  }

  const o = await getObservation(id);
  if (!o || !canEditObservation(v, o)) return { ok: false, message: "You cannot edit this observation." };
  const version = o.version + 1;
  const patch: Record<string, unknown> = { ...input, sensitive_flags: flags, version };
  // A material edit to a published contribution needs renewed review; the approved shared copy
  // stays exactly as approved until a moderator publishes the new version.
  if (o.status === "published") patch.status = "submitted";
  if (o.status === "rejected") patch.status = "draft";
  const { error } = await db().from("observations").update(patch).eq("id", id);
  if (error) return { ok: false, message: error.message };
  await db().from("observation_versions").insert({ observation_id: id, version, snapshot: input, created_by: v.userId });
  await audit(v, "observation.edited", "observation", id, { version, from_status: o.status }, o.org_id);
  if (o.status === "published") {
    await db().from("moderation_events").insert({ observation_id: id, action: "revision_submitted", from_status: "published", to_status: "submitted", actor_id: v.userId });
    await notifyModerators("Revised contribution awaiting review", `"${input.title}" was edited after publication.`, `/portal/moderation/${id}`, `revision:${id}:${version}`);
  }
  revalidatePath(`/portal/observations/${id}`);
  return { ok: true, message: o.status === "published" ? "Saved as a new version. It needs renewed review; the shared copy is unchanged until then." : "Draft saved. Nothing has been shared." };
}

export async function submitForReview(_: ActionState, fd: FormData): Promise<ActionState> {
  const v = await requireClient();
  const id = String(fd.get("id"));
  const o = await getObservation(id);
  if (!o || o.author_id !== v.userId || o.org_id !== v.active.orgId) return { ok: false, message: "You cannot submit this observation." };
  if (!["draft", "returned"].includes(o.status)) return { ok: false, message: "This observation is not in a state that can be submitted." };

  const consent = consentSchema.safeParse({
    store_process: fd.get("store_process") === "on",
    publish_shared: fd.get("publish_shared") === "on",
    attribution: fd.get("attribution") === "on",
    training: fd.get("training") === "on",
  });
  if (!consent.success) return { ok: false, errors: fieldErrors(consent.error) };
  if (!consent.data.publish_shared) return { ok: false, errors: { publish_shared: "To propose this for the community you must allow a reviewed copy to be published." } };

  await db().from("consent_records").insert({ observation_id: id, ...consent.data, recorded_by: v.userId, note: "Recorded on submission" });
  const flags = scanSensitive(o.title, o.body);
  const { error } = await db().from("observations").update({ status: "submitted", submitted_at: new Date().toISOString(), sensitive_flags: flags, return_reason: null }).eq("id", id);
  if (error) return { ok: false, message: error.message };
  await db().from("moderation_events").insert({ observation_id: id, action: o.status === "returned" ? "resubmit" : "submit", from_status: o.status, to_status: "submitted", actor_id: v.userId });
  await audit(v, "observation.submitted", "observation", id, { flags: flags.map((f) => f.kind) }, o.org_id);
  await notifyModerators(
    flags.length ? "Flagged contribution awaiting review" : "Contribution awaiting review",
    flags.length ? `${flags.length} possible sensitive item(s) detected.` : `"${o.title}" was proposed for the learning community.`,
    `/portal/moderation/${id}`, `submit:${id}:${o.version}`,
  );
  revalidatePath(`/portal/observations/${id}`);
  return { ok: true, message: "Submitted for review. Nothing is shared until a moderator publishes a reviewed copy." };
}

export async function withdrawObservation(_: ActionState, fd: FormData): Promise<ActionState> {
  const v = await requireClient();
  const id = String(fd.get("id"));
  const o = await getObservation(id);
  if (!o || o.author_id !== v.userId || o.org_id !== v.active.orgId) return { ok: false, message: "Only the author can withdraw this contribution." };
  if (!["submitted", "in_review", "returned", "published", "unpublished"].includes(o.status)) return { ok: false, message: "There is nothing shared or pending to withdraw." };

  const started = Date.now();
  const { data: src } = await db().from("shared_sources").select("shared_id").eq("observation_id", id).maybeSingle();
  if (src) {
    // The status change fires a trigger that deletes the search/AIRA index row in the same
    // transaction, so retrieval stops returning it immediately.
    await db().from("shared_contributions").update({ status: "withdrawn" }).eq("id", src.shared_id);
  }
  await db().from("observations").update({ status: "withdrawn", withdrawn_at: new Date().toISOString() }).eq("id", id);
  await db().from("moderation_events").insert({ observation_id: id, shared_id: src?.shared_id ?? null, action: "withdraw", from_status: o.status, to_status: "withdrawn", reason_public: "Withdrawn by the contributor.", actor_id: v.userId });
  const { count } = src ? await db().from("search_documents").select("id", { count: "exact", head: true }).eq("source_id", src.shared_id) : { count: 0 };
  const ms = Date.now() - started;
  await audit(v, "observation.withdrawn", "observation", id, { shared_id: src?.shared_id ?? null, index_rows_remaining: count ?? 0, propagation_ms: ms }, o.org_id);
  revalidatePath("/portal/learning");
  revalidatePath(`/portal/observations/${id}`);
  return { ok: true, message: `Withdrawn. Removed from the shared feed, search and AIRA retrieval in ${ms} ms (index rows remaining: ${count ?? 0}). Copies already viewed elsewhere cannot be recalled automatically.` };
}

export async function updateConsent(_: ActionState, fd: FormData): Promise<ActionState> {
  const v = await requireClient();
  const id = String(fd.get("id"));
  const o = await getObservation(id);
  if (!o || o.author_id !== v.userId || o.org_id !== v.active.orgId) return { ok: false, message: "Only the author can change these permissions." };
  const next = {
    store_process: true,
    publish_shared: fd.get("publish_shared") === "on",
    attribution: fd.get("attribution") === "on",
    training: fd.get("training") === "on",
  };
  const prev = await latestConsent(id);
  await db().from("consent_records").insert({ observation_id: id, ...next, recorded_by: v.userId, note: "Updated by contributor" });
  await audit(v, "consent.updated", "observation", id, { from: prev, to: next }, o.org_id);

  // Narrowing takes effect immediately; widening always needs moderation.
  const { data: src } = await db().from("shared_sources").select("shared_id").eq("observation_id", id).maybeSingle();
  if (src && prev?.attribution && !next.attribution) {
    await db().from("shared_contributions").update({ attribution_label: null }).eq("id", src.shared_id);
  }
  if (src && prev?.publish_shared && !next.publish_shared && ["published", "unpublished"].includes(o.status)) {
    return withdrawObservation({ ok: false }, fd);
  }
  revalidatePath(`/portal/observations/${id}`);
  return { ok: true, message: "Permissions updated and recorded in the consent history." };
}

export async function deleteDraft(fd: FormData) {
  const v = await requireClient();
  const id = String(fd.get("id"));
  const o = await getObservation(id);
  if (!o || o.author_id !== v.userId || o.status !== "draft") redirect("/portal/observations");
  await db().from("observations").delete().eq("id", id);
  await audit(v, "observation.draft_deleted", "observation", id, {}, o.org_id);
  redirect("/portal/observations?deleted=1");
}
