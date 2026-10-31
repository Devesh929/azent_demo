import "server-only";
import { db } from "@/lib/supabase/server";
import { audienceAllows, audienceFilter, inEmployeeWorkspace } from "@/lib/authz/policy";
import type { Viewer } from "@/lib/authz/viewer";

export type Session = { id: string; title: string; description: string | null; kind: string; audience: string; org_id: string | null; offering_id: string | null; starts_at: string | null; duration_min: number | null; status: string; stream_url: string | null; recording_asset_id: string | null };
export type Content = { id: string; kind: string; title: string; summary: string | null; body: string | null; audience: string; org_id: string | null; offering_id: string | null; media_asset_id: string | null; owner_id: string | null; review_due: string | null; published_at: string | null; tags: string[] };

// Both queries filter by audience inside the database, then re-check each row in code.
export async function visibleSessions(v: Viewer) {
  const { data } = await db().from("live_sessions").select("*").or(audienceFilter(v)).neq("status", "cancelled").order("starts_at");
  return ((data ?? []) as Session[]).filter((s) => audienceAllows(v, s as never));
}

export async function visibleContent(v: Viewer, kinds?: string[]) {
  let q = db().from("content_items").select("id, kind, title, summary, body, audience, org_id, offering_id, media_asset_id, owner_id, review_due, published_at, tags")
    .or(audienceFilter(v)).eq("status", "published").neq("kind", "banner").neq("audience", "public");
  if (kinds?.length) q = q.in("kind", kinds);
  const { data } = await q.order("published_at", { ascending: false });
  return ((data ?? []) as Content[]).filter((c) => audienceAllows(v, c as never));
}

/** Employees may run every engine; clients only non-internal engines for entitled offerings. */
export async function canUseEngine(v: Viewer, e: { slug: string; internal?: boolean }) {
  if (inEmployeeWorkspace(v)) return true;
  if (e.internal || v.active?.orgKind !== "client") return false;
  const { data } = await db().from("offerings").select("id").eq("slug", e.slug).maybeSingle();
  return !!data && v.entitledOfferingIds.includes(data.id);
}

export async function entitledOfferings(v: Viewer) {
  if (!v.entitledOfferingIds.length) return [];
  const { data } = await db().from("offerings").select("id, slug, name, kicker, tagline").in("id", v.entitledOfferingIds).order("sort");
  return (data ?? []) as { id: string; slug: string; name: string; kicker: string; tagline: string }[];
}
