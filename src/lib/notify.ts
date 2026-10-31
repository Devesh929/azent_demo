import "server-only";
import { after } from "next/server";
import { Resend } from "resend";
import { db } from "@/lib/supabase/server";
import { env } from "@/lib/env";

type Note = { userId: string; kind: string; title: string; body?: string; link?: string };

// In-app notification (P0). Optionally also queues an email in the outbox (P1).
// Queuing is not delivery: the outbox row says "queued" until the provider accepts it.
export async function notify(n: Note, email?: { idempotencyKey: string; subject?: string }) {
  await db().from("notifications").insert({ user_id: n.userId, kind: n.kind, title: n.title, body: n.body ?? null, link: n.link ?? null });
  if (email) {
    const { data: p } = await db().from("profiles").select("email").eq("id", n.userId).single();
    if (p?.email) {
      await queueEmail({
        idempotencyKey: email.idempotencyKey,
        to: p.email,
        template: n.kind,
        subject: email.subject ?? n.title,
        payload: { title: n.title, body: n.body, link: n.link },
      });
    }
  }
}

export async function queueEmail(e: { idempotencyKey: string; to: string; template: string; subject: string; payload: Record<string, unknown> }) {
  // unique(idempotency_key) makes re-queuing the same event a no-op.
  await db().from("email_outbox").upsert(
    { idempotency_key: e.idempotencyKey, to_email: e.to, template: e.template, subject: e.subject, payload: e.payload },
    { onConflict: "idempotency_key", ignoreDuplicates: true },
  );
  // Try delivery once the response is sent; the daily cron and the admin button catch the rest.
  if (env.resendKey) {
    try {
      after(() => processOutbox(5).then(() => undefined));
    } catch {
      // Not inside a request scope (e.g. scripts); the queue will be processed later.
    }
  }
}

function render(subject: string, payload: Record<string, unknown>) {
  const link = payload.link ? `${env.siteUrl}${payload.link}` : env.siteUrl;
  const esc = (s: unknown) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
  return `<!doctype html><body style="margin:0;background:#070b1a;font-family:Inter,Arial,sans-serif;color:#e8ecf8">
  <div style="max-width:520px;margin:0 auto;padding:40px 28px">
    <p style="font-size:15px;font-weight:600;letter-spacing:-.01em;margin:0 0 28px">azentio<span style="color:#3ee6c4">.ai</span></p>
    <h1 style="font-size:22px;line-height:1.3;margin:0 0 12px">${esc(payload.title ?? subject)}</h1>
    <p style="font-size:15px;line-height:1.6;color:#b8c0d9;margin:0 0 28px">${esc(payload.body)}</p>
    <a href="${esc(link)}" style="display:inline-block;background:#3ee6c4;color:#04201b;padding:12px 20px;border-radius:999px;font-weight:600;text-decoration:none">Open in azentio.ai</a>
    <p style="font-size:12px;color:#6c7699;margin-top:36px">You receive this because of activity in your azentio.ai workspace. Synthetic hackathon environment.</p>
  </div></body>`;
}

// Outbox worker: claims queued rows, sends with the provider's idempotency key, records the
// provider id. Only a provider acceptance marks a row "sent".
export async function processOutbox(limit = 20) {
  const { data: rows } = await db().from("email_outbox").select("*").eq("status", "queued").lt("attempts", 5).order("created_at").limit(limit);
  const results: { id: string; status: string; error?: string }[] = [];
  const resend = env.resendKey ? new Resend(env.resendKey) : null;

  for (const row of rows ?? []) {
    const { data: claimed } = await db().from("email_outbox")
      .update({ status: "sending", attempts: row.attempts + 1 })
      .eq("id", row.id).eq("status", "queued").select("id");
    if (!claimed?.length) continue; // another worker took it

    if (!resend) {
      await db().from("email_outbox").update({ status: "queued", last_error: "RESEND_API_KEY not configured; not sent" }).eq("id", row.id);
      results.push({ id: row.id, status: "queued", error: "no provider configured" });
      continue;
    }
    const { data, error } = await resend.emails.send(
      { from: env.emailFrom, to: row.to_email, subject: row.subject, html: render(row.subject, row.payload) },
      { idempotencyKey: row.idempotency_key },
    );
    if (error) {
      await db().from("email_outbox").update({ status: row.attempts + 1 >= 5 ? "failed" : "queued", last_error: error.message }).eq("id", row.id);
      results.push({ id: row.id, status: "failed", error: error.message });
    } else {
      await db().from("email_outbox").update({ status: "sent", provider_message_id: data?.id, sent_at: new Date().toISOString(), last_error: null }).eq("id", row.id);
      results.push({ id: row.id, status: "sent" });
    }
  }
  return results;
}
