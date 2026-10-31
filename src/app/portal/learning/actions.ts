"use server";

import { revalidatePath } from "next/cache";
import { requireWorkspace } from "@/lib/authz/policy";
import { db } from "@/lib/supabase/server";
import { audit } from "@/lib/audit";
import { canSeeCommunity, getShared } from "@/lib/data/learning";
import { commentSchema, fieldErrors, reportSchema } from "@/lib/validation";

export type LState = { ok: boolean; message?: string; errors?: Record<string, string> };

// Every action first proves the viewer can see the published parent; comments, bookmarks,
// feedback and reports inherit the parent's audience.
async function visibleShared(id: string) {
  const v = await requireWorkspace();
  const s = await getShared(id);
  if (!canSeeCommunity(v) || !s || s.status !== "published") throw new Error("Not found");
  return { v, s };
}

export async function toggleBookmark(fd: FormData) {
  const { v, s } = await visibleShared(String(fd.get("id")));
  const { data } = await db().from("bookmarks").select("shared_id").eq("user_id", v.userId).eq("shared_id", s.id).maybeSingle();
  if (data) await db().from("bookmarks").delete().eq("user_id", v.userId).eq("shared_id", s.id);
  else await db().from("bookmarks").insert({ user_id: v.userId, shared_id: s.id });
  revalidatePath(`/portal/learning/${s.id}`);
  revalidatePath("/portal/learning");
}

export async function giveFeedback(fd: FormData) {
  const { v, s } = await visibleShared(String(fd.get("id")));
  const value = fd.get("value") === "needs_evidence" ? "needs_evidence" : "useful";
  await db().from("contribution_feedback").upsert({ shared_id: s.id, user_id: v.userId, value }, { onConflict: "shared_id,user_id" });
  const { data: rows } = await db().from("contribution_feedback").select("value").eq("shared_id", s.id);
  await db().from("shared_contributions").update({
    useful_count: (rows ?? []).filter((r) => r.value === "useful").length,
    needs_evidence_count: (rows ?? []).filter((r) => r.value === "needs_evidence").length,
  }).eq("id", s.id);
  revalidatePath(`/portal/learning/${s.id}`);
}

export async function addComment(_: LState, fd: FormData): Promise<LState> {
  const { v, s } = await visibleShared(String(fd.get("id")));
  const parsed = commentSchema.safeParse({ body: fd.get("body") });
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  await db().from("comments").insert({ parent_type: "shared_contribution", parent_id: s.id, author_id: v.userId, body: parsed.data.body });
  await audit(v, "comment.created", "shared_contribution", s.id);
  revalidatePath(`/portal/learning/${s.id}`);
  return { ok: true, message: "Comment added." };
}

export async function reportContribution(_: LState, fd: FormData): Promise<LState> {
  const { v, s } = await visibleShared(String(fd.get("id")));
  const parsed = reportSchema.safeParse({ reason: fd.get("reason"), details: fd.get("details") || undefined });
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  const { data } = await db().from("reports").insert({ shared_id: s.id, reporter_id: v.userId, ...parsed.data }).select("id").single();
  await audit(v, "report.created", "shared_contribution", s.id, { report_id: data?.id, reason: parsed.data.reason });
  return { ok: true, message: "Thank you. A moderator will review it. You do not need to name anyone." };
}

export async function saveSearch(fd: FormData) {
  const v = await requireWorkspace();
  const name = String(fd.get("name") ?? "").trim().slice(0, 80) || "Saved search";
  const query = Object.fromEntries(["q", "offering", "industry", "region", "period", "category"].map((k) => [k, String(fd.get(k) ?? "")]).filter(([, val]) => val));
  await db().from("saved_searches").insert({ user_id: v.userId, name, query, notify: fd.get("notify") === "on" });
  revalidatePath("/portal/learning");
}

export async function deleteSavedSearch(fd: FormData) {
  const v = await requireWorkspace();
  await db().from("saved_searches").delete().eq("id", String(fd.get("id"))).eq("user_id", v.userId);
  revalidatePath("/portal/learning");
}
