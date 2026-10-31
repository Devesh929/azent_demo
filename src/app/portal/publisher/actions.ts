"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePlatformRole } from "@/lib/authz/policy";
import { db } from "@/lib/supabase/server";
import { audit } from "@/lib/audit";

export type PubState = { ok: boolean; message?: string };

const AUDIENCES = ["public", "community", "employees", "all_clients", "entitled_clients", "org"] as const;
const INTERNAL_KINDS = ["experiment", "prototype_note", "knowledge", "broadcast"];

const contentSchema = z.object({
  kind: z.enum(["banner", "insight", "media", "release_note", "knowledge", "briefing", "experiment", "prototype_note", "resource", "broadcast"]),
  title: z.string().trim().min(4).max(160),
  summary: z.string().trim().max(400).optional(),
  body: z.string().trim().max(8000).optional(),
  audience: z.enum(AUDIENCES),
  org_id: z.uuid().nullable(),
  offering_id: z.uuid().nullable(),
  media_asset_id: z.uuid().nullable(),
  status: z.enum(["draft", "published", "archived"]),
  slug: z.string().trim().regex(/^[a-z0-9-]*$/).max(80).optional(),
});

// Audience must be explicit and coherent; there is no fallback to public.
function checkAudience(a: string, org: string | null, offering: string | null, kind?: string) {
  if (a === "org" && !org) return "Choose the organisation for an organisation-only audience.";
  if (a === "entitled_clients" && !offering) return "Choose the offering whose entitled clients may see this.";
  if (kind && INTERNAL_KINDS.includes(kind) && a !== "employees") return "Experiments, prototype notes, knowledge and broadcasts are employee-only.";
  return null;
}

export async function saveContent(_: PubState, fd: FormData): Promise<PubState> {
  const v = await requirePlatformRole("content_publisher");
  const p = contentSchema.safeParse({
    kind: fd.get("kind"), title: fd.get("title"), summary: fd.get("summary") || undefined, body: fd.get("body") || undefined,
    audience: fd.get("audience"), org_id: fd.get("org_id") || null, offering_id: fd.get("offering_id") || null,
    media_asset_id: fd.get("media_asset_id") || null, status: fd.get("status"), slug: fd.get("slug") || undefined,
  });
  if (!p.success) return { ok: false, message: p.error.issues[0]?.message ?? "Check the form." };
  const err = checkAudience(p.data.audience, p.data.org_id, p.data.offering_id, p.data.kind);
  if (err) return { ok: false, message: err };
  const row = { ...p.data, slug: p.data.slug || null, published_at: p.data.status === "published" ? new Date().toISOString() : null };
  const id = String(fd.get("id") ?? "");
  const res = id
    ? await db().from("content_items").update(row).eq("id", id).select("id").single()
    : await db().from("content_items").insert({ ...row, created_by: v.userId, owner_id: v.userId }).select("id").single();
  if (res.error) return { ok: false, message: res.error.message };
  await audit(v, id ? "content.updated" : "content.created", "content_item", res.data.id, { audience: row.audience, status: row.status });
  revalidatePath("/portal/publisher");
  revalidatePath("/", "layout");
  return { ok: true, message: "Saved." };
}

export async function saveSession(_: PubState, fd: FormData): Promise<PubState> {
  const v = await requirePlatformRole("content_publisher");
  const p = z.object({
    title: z.string().trim().min(4).max(160), description: z.string().trim().max(1000).optional(),
    kind: z.enum(["live", "recording", "webinar"]), audience: z.enum(AUDIENCES), org_id: z.uuid().nullable(), offering_id: z.uuid().nullable(),
    starts_at: z.string().min(10), duration_min: z.coerce.number().int().min(5).max(480), status: z.enum(["scheduled", "live", "ended", "cancelled"]),
    stream_url: z.url().nullable(), recording_asset_id: z.uuid().nullable(),
  }).safeParse({
    title: fd.get("title"), description: fd.get("description") || undefined, kind: fd.get("kind"), audience: fd.get("audience"),
    org_id: fd.get("org_id") || null, offering_id: fd.get("offering_id") || null, starts_at: fd.get("starts_at"), duration_min: fd.get("duration_min"),
    status: fd.get("status"), stream_url: fd.get("stream_url") || null, recording_asset_id: fd.get("recording_asset_id") || null,
  });
  if (!p.success) return { ok: false, message: p.error.issues[0]?.message ?? "Check the form." };
  const err = checkAudience(p.data.audience, p.data.org_id, p.data.offering_id);
  if (err) return { ok: false, message: err };
  const id = String(fd.get("id") ?? "");
  const row = { ...p.data, starts_at: new Date(p.data.starts_at).toISOString() };
  const res = id ? await db().from("live_sessions").update(row).eq("id", id).select("id").single() : await db().from("live_sessions").insert({ ...row, created_by: v.userId }).select("id").single();
  if (res.error) return { ok: false, message: res.error.message };
  await audit(v, id ? "session.updated" : "session.created", "live_session", res.data.id, { audience: row.audience, status: row.status });
  revalidatePath("/portal/publisher");
  return { ok: true, message: "Session saved." };
}

export async function uploadMedia(_: PubState, fd: FormData): Promise<PubState> {
  const v = await requirePlatformRole("content_publisher");
  const file = fd.get("file");
  if (!(file instanceof File) || file.size === 0) return { ok: false, message: "Choose a file." };
  const allowed = ["application/pdf", "video/mp4", "video/webm", "image/png", "image/jpeg"];
  if (!allowed.includes(file.type)) return { ok: false, message: "Allowed types: PDF, MP4, WebM, PNG, JPEG." };
  if (file.size > 4 * 1024 * 1024) return { ok: false, message: "Files must be 4 MB or smaller in this build. Larger recordings need a signed direct upload." };
  const audience = String(fd.get("audience"));
  const org = (fd.get("org_id") as string) || null;
  const offering = (fd.get("offering_id") as string) || null;
  if (!AUDIENCES.includes(audience as never)) return { ok: false, message: "Choose an audience." };
  const err = checkAudience(audience, org, offering);
  if (err) return { ok: false, message: err };
  const title = String(fd.get("title") ?? file.name).trim().slice(0, 160) || file.name;
  const path = `${audience}/${crypto.randomUUID()}-${file.name.replace(/[^\w.-]/g, "_")}`;
  const { error } = await db().storage.from("media").upload(path, file, { contentType: file.type });
  if (error) return { ok: false, message: error.message };
  const { data } = await db().from("media_assets").insert({ title, storage_path: path, mime: file.type, audience, org_id: org, offering_id: offering, created_by: v.userId }).select("id").single();
  await audit(v, "media.uploaded", "media_asset", data?.id, { audience, mime: file.type, size: file.size });
  revalidatePath("/portal/publisher");
  return { ok: true, message: "Uploaded to private storage. It is served only through the access-checked media route." };
}
