import "server-only";
import { db } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import type { Viewer } from "@/lib/authz/viewer";
import { canSeeCommunity } from "@/lib/authz/rules";
export { canReadObservation, canEditObservation, canSeeCommunity } from "@/lib/authz/rules";

export type Observation = {
  id: string; org_id: string; author_id: string; title: string; category: string; body: string; offering_id: string | null;
  industry: string | null; region: string | null; period_start: string; period_end: string; evidence_type: string; confidence: string;
  links: string[]; visibility: "private" | "org"; status: string; sensitive_flags: { kind: string; label: string; match: string }[] | string[];
  version: number; moderator_id: string | null; return_reason: string | null; created_at: string; updated_at: string; submitted_at: string | null; withdrawn_at: string | null;
};

// Columns safe to show anyone in the learning community. No tenant, author, source or reviewer data.
export const SHARED_COLUMNS =
  "id, version, title, summary, category, offering_id, industry, region, period_label, evidence_type, confidence, attribution_label, useful_count, needs_evidence_count, evidence_quality, published_at, updated_at";
export type Shared = {
  id: string; version: number; title: string; summary: string; category: string; offering_id: string | null; industry: string | null;
  region: string | null; period_label: string; evidence_type: string; confidence: string; attribution_label: string | null;
  useful_count: number; needs_evidence_count: number; evidence_quality: string | null; published_at: string; updated_at: string;
};

export async function getObservation(id: string) {
  const { data } = await db().from("observations").select("*").eq("id", id).maybeSingle();
  return data as Observation | null;
}

export async function latestConsent(observationId: string) {
  const { data } = await db().from("consent_records").select("*").eq("observation_id", observationId).order("created_at", { ascending: false }).limit(1).maybeSingle();
  return data as { store_process: boolean; publish_shared: boolean; attribution: boolean; training: boolean; created_at: string } | null;
}

export type FeedFilter = { offering?: string; industry?: string; region?: string; period?: string; category?: string; q?: string };

/** Approved shared feed. Same rule for the list, the count and the export. */
export async function sharedFeed(v: Viewer, f: FeedFilter = {}, limit = 60) {
  if (!canSeeCommunity(v)) return { rows: [] as Shared[], total: 0 };
  let q = db().from("shared_contributions").select(SHARED_COLUMNS, { count: "exact" }).eq("status", "published");
  if (f.offering) q = q.eq("offering_id", f.offering);
  if (f.industry) q = q.eq("industry", f.industry);
  if (f.region) q = q.eq("region", f.region);
  if (f.period) q = q.eq("period_label", f.period);
  if (f.category) q = q.eq("category", f.category);
  if (f.q) {
    const term = f.q.replace(/[%_,()]/g, " ").trim().slice(0, 80);
    if (term) q = q.or(`title.ilike.%${term}%,summary.ilike.%${term}%`);
  }
  const { data, count } = await q.order("published_at", { ascending: false }).limit(limit);
  return { rows: (data ?? []) as Shared[], total: count ?? 0 };
}

export async function feedFacets() {
  const { data } = await db().from("shared_contributions").select("industry, region, period_label").eq("status", "published");
  const uniq = (k: "industry" | "region" | "period_label") => [...new Set((data ?? []).map((r) => r[k]).filter(Boolean))].sort() as string[];
  return { industries: uniq("industry"), regions: uniq("region"), periods: uniq("period_label") };
}

export async function getShared(id: string) {
  const { data } = await db().from("shared_contributions").select(SHARED_COLUMNS + ", status").eq("id", id).maybeSingle();
  return data as (Shared & { status: string }) | null;
}

/** Theme statistics with small-cohort suppression. Repeated posts from one org never count twice. */
export async function themeStats(themeId: string) {
  const { data: n } = await db().rpc("theme_org_count", { p_theme: themeId });
  const orgs = Number(n ?? 0);
  const { count } = await db().from("theme_contributions")
    .select("shared_id, shared_contributions!inner(status)", { count: "exact", head: true })
    .eq("theme_id", themeId).eq("shared_contributions.status", "published");
  const min = await minCohort();
  return { suppressed: orgs < min, orgs: orgs < min ? null : orgs, contributions: orgs < min ? null : count ?? 0, min };
}

/** Administrator-configured threshold, never below the env floor (itself never below 3). */
export async function minCohort() {
  const { data } = await db().from("platform_settings").select("value").eq("key", "min_cohort_orgs").maybeSingle();
  return Math.max(env.minCohortOrgs, Number(data?.value ?? 0) || 0);
}

export async function offeringsMap() {
  const { data } = await db().from("offerings").select("id, name, slug").order("sort");
  return new Map((data ?? []).map((o: { id: string; name: string; slug: string }) => [o.id, o]));
}
