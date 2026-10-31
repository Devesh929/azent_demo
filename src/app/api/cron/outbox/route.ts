import { NextResponse, type NextRequest } from "next/server";
import { processOutbox } from "@/lib/notify";
import { env } from "@/lib/env";

// Called by Vercel Cron (Authorization: Bearer CRON_SECRET) to deliver queued email.
export async function GET(req: NextRequest) {
  if (!env.cronSecret || req.headers.get("authorization") !== `Bearer ${env.cronSecret}`) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }
  const results = await processOutbox(50);
  return NextResponse.json({ processed: results.length, results });
}
