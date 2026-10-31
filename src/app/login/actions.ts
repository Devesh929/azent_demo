"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { z } from "zod";
import { createAuthClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import { PERSONA_EMAILS } from "@/content/personas";
import { WORKSPACE_COOKIE } from "@/lib/authz/viewer";

export type LoginState = { step: "email" | "code"; email?: string; message?: string; error?: string };

const safeNext = (n: unknown) => (typeof n === "string" && n.startsWith("/") && !n.startsWith("//") ? n : "/portal");

export async function sendCode(_: LoginState, fd: FormData): Promise<LoginState> {
  const email = z.email().safeParse(String(fd.get("email") ?? "").trim().toLowerCase());
  if (!email.success) return { step: "email", error: "Enter a valid email address." };
  const next = safeNext(fd.get("next"));
  const supabase = await createAuthClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: email.data,
    options: {
      // Creating an auth identity grants nothing: access needs an approved membership.
      shouldCreateUser: true,
      emailRedirectTo: `${env.siteUrl}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });
  if (error) {
    const rate = /rate|seconds/i.test(error.message);
    return { step: "email", email: email.data, error: rate ? "Too many attempts. Please wait a minute and try again." : "We could not send a code. Please try again." };
  }
  return { step: "code", email: email.data, message: `We sent a sign-in code and link to ${email.data}.` };
}

export async function verifyCode(_: LoginState, fd: FormData): Promise<LoginState> {
  const email = String(fd.get("email") ?? "").toLowerCase();
  const token = String(fd.get("token") ?? "").replace(/\s/g, "");
  if (!/^\d{6,8}$/.test(token)) return { step: "code", email, error: "Enter the code from the email." };
  const supabase = await createAuthClient();
  const { error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
  if (error) return { step: "code", email, error: "That code is invalid or has expired." };
  redirect(safeNext(fd.get("next")));
}

// DEMO_MODE only: password sign-in for the seeded synthetic personas, so judges can switch
// roles quickly. Refused for any address that is not a seeded persona.
export async function signInDemo(fd: FormData) {
  if (!env.demoMode || !env.demoPassword) throw new Error("Demo sign-in is disabled.");
  const email = String(fd.get("email") ?? "").toLowerCase();
  if (!PERSONA_EMAILS.has(email)) throw new Error("Not a demo persona.");
  const supabase = await createAuthClient();
  await supabase.auth.signOut();
  (await cookies()).delete(WORKSPACE_COOKIE);
  const { error } = await supabase.auth.signInWithPassword({ email, password: env.demoPassword });
  if (error) throw new Error("Demo sign-in failed. Run `npm run db:seed` to create the personas.");
  redirect(safeNext(fd.get("next")));
}

export async function signOut() {
  const supabase = await createAuthClient();
  await supabase.auth.signOut();
  (await cookies()).delete(WORKSPACE_COOKIE);
  redirect("/");
}
