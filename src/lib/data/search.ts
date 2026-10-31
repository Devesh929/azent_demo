import "server-only";
import { db } from "@/lib/supabase/server";
import { audienceFilter } from "@/lib/authz/policy";
import type { Viewer } from "@/lib/authz/viewer";

export type SearchHit = { source_type: string; source_id: string; title: string; body: string; url: string; audience: string };

// The single retrieval path for site search, portal search, counts and AIRA. The audience
// filter is applied in the database query itself, so nothing outside the viewer's access is
// ever fetched, counted or sent to an AI provider.
export async function search(viewer: Viewer | null, query: string, opts: { limit?: number; types?: string[] } = {}) {
  const q = query.trim().slice(0, 200);
  if (q.length < 2) return { hits: [] as SearchHit[], total: 0 };
  let req = db()
    .from("search_documents")
    .select("source_type, source_id, title, body, url, audience", { count: "exact" })
    .or(audienceFilter(viewer))
    .textSearch("tsv", q, { type: "websearch", config: "english" })
    .limit(opts.limit ?? 20);
  if (opts.types?.length) req = req.in("source_type", opts.types);
  const { data, count, error } = await req;
  if (error) throw new Error(error.message);
  return { hits: (data ?? []) as SearchHit[], total: count ?? 0 };
}

/** Prefix suggestions with the same visibility rule. */
export async function suggest(viewer: Viewer | null, prefix: string) {
  const p = prefix.trim().replace(/[%_,()]/g, "").slice(0, 60);
  if (p.length < 2) return [];
  const { data } = await db()
    .from("search_documents")
    .select("title, url")
    .or(audienceFilter(viewer))
    .ilike("title", `%${p}%`)
    .limit(6);
  return (data ?? []) as { title: string; url: string }[];
}
