import { NextResponse, type NextRequest } from "next/server";
import { getViewer } from "@/lib/authz/viewer";
import { canSeeCommunity, offeringsMap, sharedFeed } from "@/lib/data/learning";
import { audit } from "@/lib/audit";

// Export applies exactly the same visibility rule and columns as the on-screen feed.
export async function GET(req: NextRequest) {
  const v = await getViewer();
  if (!v || !canSeeCommunity(v)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const p = req.nextUrl.searchParams;
  const filter = Object.fromEntries(["q", "offering", "industry", "region", "period", "category"].map((k) => [k, p.get(k) ?? undefined]));
  const { rows } = await sharedFeed(v, filter, 1000);
  const offerings = await offeringsMap();
  const esc = (x: unknown) => `"${String(x ?? "").replace(/"/g, '""')}"`;
  const header = ["title", "summary", "category", "offering", "industry", "region", "period", "evidence_type", "confidence", "attribution", "published_at"];
  const lines = rows.map((r) => [r.title, r.summary, r.category, r.offering_id ? offerings.get(r.offering_id)?.name : "", r.industry, r.region, r.period_label, r.evidence_type, r.confidence, r.attribution_label ?? "", r.published_at].map(esc).join(","));
  await audit(v, "learning.exported", "shared_contribution", null, { rows: rows.length, filter });
  return new NextResponse([header.join(","), ...lines].join("\n"), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="azentio-shared-learning.csv"', "Cache-Control": "private, no-store" },
  });
}
