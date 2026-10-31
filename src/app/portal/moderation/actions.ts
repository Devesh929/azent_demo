"use server";

import { revalidatePath } from "next/cache";
import { requirePlatformRole } from "@/lib/authz/policy";
import { db } from "@/lib/supabase/server";
import { audit } from "@/lib/audit";
import { notify } from "@/lib/notify";
import { getObservation, latestConsent } from "@/lib/data/learning";
import { fieldErrors, sharedCopySchema } from "@/lib/validation";
import { OBS_STATUS, type ObsStatus } from "@/lib/constants";

export type ModState = { ok: boolean; message?: string; errors?: Record<string, string> };

async function transition(id: string, to: ObsStatus, extra: Record<string, unknown> = {}) {
  const { error } = await db().from("observations").update({ status: to, ...extra }).eq("id", id);
  if (error) throw new Error(error.message.includes("illegal") ? "That change is not allowed from the current status." : error.message);
}

async function tellAuthor(authorId: string, title: string, body: string, link: string, key: string) {
  await notify({ userId: authorId, kind: "status", title, body, link }, { idempotencyKey: key });
}

export async function claim(fd: FormData) {
  const v = await requirePlatformRole("learning_moderator");
  const id = String(fd.get("id"));
  const o = await getObservation(id);
  if (!o || o.status !== "submitted") return;
  await transition(id, "in_review", { moderator_id: v.userId });
  await db().from("moderation_events").insert({ observation_id: id, action: "claim", from_status: "submitted", to_status: "in_review", actor_id: v.userId });
  await audit(v, "moderation.claimed", "observation", id, {}, o.org_id);
  revalidatePath(`/portal/moderation/${id}`);
}

export async function decide(_: ModState, fd: FormData): Promise<ModState> {
  const v = await requirePlatformRole("learning_moderator");
  const id = String(fd.get("id"));
  const decision = String(fd.get("decision"));
  const o = await getObservation(id);
  if (!o || o.status === "draft") return { ok: false, message: "Not found." };
  const reason = String(fd.get("reason_public") ?? "").trim();
  const internal = String(fd.get("internal_note") ?? "").trim() || null;

  try {
    if (decision === "clarify" || decision === "reject") {
      if (reason.length < 10) return { ok: false, errors: { reason_public: "Explain the decision to the contributor (10+ characters)." } };
      if (o.status === "submitted") await transition(id, "in_review", { moderator_id: v.userId });
      const to = decision === "clarify" ? "returned" : "rejected";
      await transition(id, to, { return_reason: reason });
      await db().from("moderation_events").insert({ observation_id: id, action: decision === "clarify" ? "request_clarification" : "reject", from_status: "in_review", to_status: to, reason_public: reason, internal_note: internal, actor_id: v.userId });
      await audit(v, `moderation.${to}`, "observation", id, {}, o.org_id);
      await tellAuthor(o.author_id, decision === "clarify" ? "Clarification requested" : "Contribution not published", reason, `/portal/observations/${id}`, `mod:${id}:${to}:${o.version}`);
      revalidatePath("/portal/moderation");
      return { ok: true, message: decision === "clarify" ? "Returned to the contributor with your request." : "Rejected. The contributor has been told why." };
    }

    if (decision === "publish") {
      const consent = await latestConsent(id);
      if (!consent?.publish_shared) return { ok: false, message: "The contributor has not consented to publication." };
      const parsed = sharedCopySchema.safeParse({
        title: fd.get("title"), summary: fd.get("summary"), region: fd.get("region") || null, period_label: fd.get("period_label"),
        attribution: fd.get("attribution") === "on", evidence_quality: fd.get("evidence_quality"), reason_public: reason || undefined, internal_note: internal ?? undefined,
      });
      if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
      const s = parsed.data;
      // Attribution needs BOTH the author's opt-in and this moderator's approval.
      let attribution: string | null = null;
      if (s.attribution && consent.attribution) {
        const { data: org } = await db().from("organizations").select("name").eq("id", o.org_id).single();
        attribution = org?.name ?? null;
      }
      // The shared copy holds only reviewed fields: no org, author, links, flags or notes.
      const copy = {
        title: s.title, summary: s.summary, category: o.category, offering_id: o.offering_id, industry: o.industry,
        region: s.region, period_label: s.period_label, evidence_type: o.evidence_type, confidence: o.confidence,
        attribution_label: attribution, evidence_quality: s.evidence_quality, status: "published", published_by: v.userId, published_at: new Date().toISOString(),
      };
      const { data: src } = await db().from("shared_sources").select("shared_id").eq("observation_id", id).maybeSingle();
      let sharedId = src?.shared_id as string | undefined;
      if (sharedId) {
        const { data: cur } = await db().from("shared_contributions").select("version").eq("id", sharedId).single();
        await db().from("shared_contributions").update({ ...copy, version: (cur?.version ?? 1) + 1 }).eq("id", sharedId);
      } else {
        const { data: created, error } = await db().from("shared_contributions").insert(copy).select("id").single();
        if (error) return { ok: false, message: error.message };
        sharedId = created.id;
        await db().from("shared_sources").insert({ shared_id: sharedId, observation_id: id, org_id: o.org_id });
      }
      if (o.status === "submitted") await transition(id, "in_review", { moderator_id: v.userId });
      await transition(id, "published");
      await db().from("moderation_events").insert({ observation_id: id, shared_id: sharedId, action: "publish", from_status: "in_review", to_status: "published", reason_public: reason || "Published with identifying details generalised.", internal_note: internal, actor_id: v.userId });
      await audit(v, "moderation.published", "observation", id, { shared_id: sharedId, attribution: !!attribution }, o.org_id);
      await tellAuthor(o.author_id, "Your contribution was published", `A reviewed copy of "${o.title}" is now visible to the learning community.`, `/portal/observations/${id}`, `mod:${id}:published:${o.version}`);
      revalidatePath("/portal/moderation");
      revalidatePath("/portal/learning");
      return { ok: true, message: "Published. Only the reviewed copy is visible to the community." };
    }

    if (decision === "unpublish" || decision === "restore") {
      const { data: src } = await db().from("shared_sources").select("shared_id").eq("observation_id", id).single();
      const to = decision === "unpublish" ? "unpublished" : "published";
      await db().from("shared_contributions").update({ status: to }).eq("id", src!.shared_id);
      await transition(id, to);
      await db().from("moderation_events").insert({ observation_id: id, shared_id: src!.shared_id, action: decision, from_status: o.status, to_status: to, reason_public: reason || null, internal_note: internal, actor_id: v.userId });
      await audit(v, `moderation.${decision}`, "observation", id, {}, o.org_id);
      await tellAuthor(o.author_id, decision === "unpublish" ? "Your contribution is temporarily hidden" : "Your contribution is visible again",
        reason || (decision === "unpublish" ? "A moderator is reviewing a report about it." : "The review is complete."), `/portal/observations/${id}`, `mod:${id}:${to}:${Date.now()}`);
      revalidatePath("/portal/moderation");
      return { ok: true, message: decision === "unpublish" ? "Temporarily unpublished and removed from search." : "Restored." };
    }
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : "Something went wrong." };
  }
  return { ok: false, message: `Unknown decision for status ${OBS_STATUS[o.status as ObsStatus]?.label}.` };
}

export async function resolveReport(fd: FormData) {
  const v = await requirePlatformRole("learning_moderator");
  const id = String(fd.get("report_id"));
  const decision = String(fd.get("decision") ?? "").trim() || "Reviewed. No change needed.";
  const { data: r } = await db().from("reports").select("id, reporter_id, shared_id").eq("id", id).single();
  if (!r) return;
  await db().from("reports").update({ status: "resolved", decision, resolved_by: v.userId, resolved_at: new Date().toISOString() }).eq("id", id);
  await audit(v, "report.resolved", "report", id, { shared_id: r.shared_id });
  // The reporter learns the outcome, never the contributor's identity.
  await notify({ userId: r.reporter_id, kind: "report", title: "Your report was reviewed", body: decision, link: `/portal/learning/${r.shared_id}` });
  revalidatePath("/portal/moderation");
}
