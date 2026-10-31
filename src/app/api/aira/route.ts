import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getViewer } from "@/lib/authz/viewer";
import { askAira } from "@/lib/aira";
import { audit } from "@/lib/audit";

// Best-effort per-instance rate limit; production should use a shared store.
const hits = new Map<string, { n: number; t: number }>();
function limited(key: string) {
  const now = Date.now();
  const h = hits.get(key);
  if (!h || now - h.t > 60_000) { hits.set(key, { n: 1, t: now }); return false; }
  h.n++;
  return h.n > 20;
}

export async function POST(req: NextRequest) {
  const body = z.object({ question: z.string().trim().min(3).max(500) }).safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Ask a question of 3 to 500 characters." }, { status: 400 });
  const viewer = await getViewer().catch(() => null);
  const key = viewer?.userId ?? req.headers.get("x-forwarded-for") ?? "anon";
  if (limited(key)) return NextResponse.json({ error: "Too many questions. Try again in a minute." }, { status: 429 });

  const res = await askAira(viewer, body.data.question);
  // Log the event and what was cited, never the question text or answer.
  await audit(viewer, "aira.answered", "aira", null, { mode: res.mode, cited: res.citations.map((c) => c.url) }, viewer?.active?.orgId);
  return NextResponse.json(res, { headers: { "Cache-Control": "private, no-store" } });
}
