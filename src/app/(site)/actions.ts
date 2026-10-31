"use server";

import { db } from "@/lib/supabase/server";
import { queueEmail } from "@/lib/notify";
import { audit } from "@/lib/audit";
import { demoRequestSchema, eventRegistrationSchema, fieldErrors } from "@/lib/validation";

export type FormState = { ok: boolean; message?: string; errors?: Record<string, string> };

const configured = () => !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY;

function entries(fd: FormData) {
  const o: Record<string, unknown> = {};
  for (const [k, v] of fd.entries()) o[k] = typeof v === "string" ? v : undefined;
  o.consent_contact = fd.get("consent_contact") === "on";
  return o;
}

export async function submitDemoRequest(_: FormState, fd: FormData): Promise<FormState> {
  if (fd.get("website")) return { ok: true, message: "Thanks. We will be in touch." }; // honeypot
  const parsed = demoRequestSchema.safeParse(entries(fd));
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  if (!configured()) return { ok: false, message: "The request service is not connected yet. Please try again shortly." };

  const v = parsed.data;
  const { data, error } = await db().from("demo_requests").insert({ ...v, email: v.email.toLowerCase() }).select("id").single();
  if (error) return { ok: false, message: "We could not save your request. Please try again." };
  await queueEmail({
    idempotencyKey: `demo-ack:${data.id}`,
    to: v.email,
    template: "demo_ack",
    subject: "We received your azentio.ai demo request",
    payload: { title: `Thanks, ${v.name.split(" ")[0]}`, body: "Our team will contact you within two working days to arrange your demo." },
  });
  await audit(null, "demo_request.created", "demo_request", data.id, { offering: v.offering_slug ?? null });
  return { ok: true, message: "Request received. A confirmation email is queued and our team will contact you within two working days." };
}

export async function registerForHackathon(_: FormState, fd: FormData): Promise<FormState> {
  if (fd.get("website")) return { ok: true, message: "You are registered." };
  const parsed = eventRegistrationSchema.safeParse(entries(fd));
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  if (!configured()) return { ok: false, message: "Registration is not connected yet. Please try again shortly." };

  const v = parsed.data;
  const { data, error } = await db().from("event_registrations")
    .insert({ ...v, email: v.email.toLowerCase(), event_slug: "hackathon-2026" }).select("id").single();
  if (error?.code === "23505") return { ok: true, message: "You are already registered with this email." };
  if (error) return { ok: false, message: "We could not save your registration. Please try again." };
  await queueEmail({
    idempotencyKey: `hackathon-ack:${data.id}`,
    to: v.email,
    template: "event_ack",
    subject: "You're registered for the azentio.ai Hackathon 2026",
    payload: { title: "You're in", body: "We will send the challenge brief and schedule before kick-off." },
  });
  await audit(null, "event_registration.created", "event_registration", data.id, { event: "hackathon-2026" });
  return { ok: true, message: "You are registered. A confirmation email is queued." };
}
