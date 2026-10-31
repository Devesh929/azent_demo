import "server-only";
import { getViewer } from "@/lib/authz/viewer";
import { db } from "@/lib/supabase/server";

// Public-site reads. Every query pins audience = 'public' explicitly; missing audience is never
// treated as public. If the database is not configured yet, the marketing site still renders.

const configured = () => !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function getViewerSafe() {
  if (!configured()) return null;
  try {
    return await getViewer();
  } catch {
    return null;
  }
}

export type PublicContent = { id: string; slug: string | null; kind: string; title: string; summary: string | null; body: string | null; published_at: string | null; media_asset_id: string | null };
export type PublicSession = { id: string; title: string; description: string | null; kind: string; starts_at: string | null; duration_min: number | null; status: string; stream_url: string | null };

async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  if (!configured()) return fallback;
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

export function getPublicContent(kind?: string) {
  return safe(async () => {
    let q = db().from("content_items")
      .select("id, slug, kind, title, summary, body, published_at, media_asset_id")
      .eq("audience", "public").eq("status", "published")
      .order("published_at", { ascending: false });
    if (kind) q = q.eq("kind", kind);
    const { data } = await q;
    return (data ?? []) as PublicContent[];
  }, [] as PublicContent[]);
}

export function getPublicContentBySlug(slug: string) {
  return safe(async () => {
    const { data } = await db().from("content_items")
      .select("id, slug, kind, title, summary, body, published_at, media_asset_id")
      .eq("audience", "public").eq("status", "published").eq("slug", slug).maybeSingle();
    return (data ?? null) as PublicContent | null;
  }, null);
}

export function getPublicSessions() {
  return safe(async () => {
    const { data } = await db().from("live_sessions")
      .select("id, title, description, kind, starts_at, duration_min, status, stream_url")
      .eq("audience", "public").neq("status", "cancelled")
      .order("starts_at", { ascending: true });
    return (data ?? []) as PublicSession[];
  }, [] as PublicSession[]);
}

export function getBanner() {
  return safe(async () => {
    const { data } = await db().from("content_items")
      .select("title, summary, slug").eq("kind", "banner").eq("audience", "public").eq("status", "published")
      .order("published_at", { ascending: false }).limit(1).maybeSingle();
    return data as { title: string; summary: string | null; slug: string | null } | null;
  }, null);
}

export function isDatabaseConfigured() {
  return configured();
}
