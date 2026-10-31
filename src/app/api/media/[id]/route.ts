import { NextResponse } from "next/server";
import { db } from "@/lib/supabase/server";
import { getViewer } from "@/lib/authz/viewer";
import { audienceAllows } from "@/lib/authz/policy";
import { audit } from "@/lib/audit";

// Every media request is authorised here. Objects live in a private bucket with no storage
// policies, so this route (which checks audience, workspace and entitlement) is the only way in.
export async function GET(_req: Request, ctx: RouteContext<"/api/media/[id]">) {
  const { id } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: asset } = await db().from("media_assets")
    .select("id, title, storage_path, external_url, mime, audience, org_id, offering_id").eq("id", id).maybeSingle();
  // Same response for "missing" and "forbidden", so existence is not disclosed.
  if (!asset) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const viewer = asset.audience === "public" ? null : await getViewer();
  if (!audienceAllows(viewer, asset)) {
    await audit(viewer, "media.denied", "media_asset", id, { audience: asset.audience });
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (asset.external_url) return NextResponse.redirect(asset.external_url);
  const { data: file, error } = await db().storage.from("media").download(asset.storage_path!);
  if (error || !file) return NextResponse.json({ error: "Unavailable" }, { status: 502 });
  if (asset.audience !== "public") await audit(viewer, "media.viewed", "media_asset", id, {}, asset.org_id);

  return new NextResponse(file.stream(), {
    headers: {
      "Content-Type": asset.mime ?? "application/octet-stream",
      "Content-Disposition": `inline; filename="${asset.title.replace(/[^\w .-]/g, "")}.pdf"`,
      // Private media must never sit in a shared cache.
      "Cache-Control": asset.audience === "public" ? "public, max-age=300" : "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
