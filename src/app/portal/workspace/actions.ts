"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getViewer, WORKSPACE_COOKIE } from "@/lib/authz/viewer";
import { db } from "@/lib/supabase/server";
import { audit } from "@/lib/audit";
import { env } from "@/lib/env";
import { notify } from "@/lib/notify";

async function viewerOrLogin() {
  const v = await getViewer();
  if (!v) redirect("/login");
  return v;
}

export async function chooseWorkspace(fd: FormData) {
  const v = await viewerOrLogin();
  const id = String(fd.get("membership_id") ?? "");
  // Only memberships already verified for this user can be selected.
  const m = v.memberships.find((x) => x.id === id);
  if (!m || (m.orgKind === "internal" && !v.isEmployee)) redirect("/portal/workspace?error=1");
  (await cookies()).set(WORKSPACE_COOKIE, m.id, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 30 });
  await audit(v, "workspace.selected", "membership", m.id, {}, m.orgId);
  redirect(m.orgKind === "client" && !m.termsAcceptedAt ? "/portal/workspace?terms=1" : "/portal");
}

export async function acceptTerms(fd: FormData) {
  const v = await viewerOrLogin();
  const id = String(fd.get("membership_id") ?? "");
  const m = v.memberships.find((x) => x.id === id && x.orgKind === "client");
  if (!m) redirect("/portal/workspace?error=1");
  if (fd.get("understood") !== "on") redirect("/portal/workspace?terms=1&error=terms");
  await db().from("memberships").update({ terms_accepted_at: new Date().toISOString() }).eq("id", m.id).eq("user_id", v.userId);
  await audit(v, "workspace.terms_accepted", "membership", m.id, { note: "Workspace terms only. Not consent to share or train." }, m.orgId);
  redirect("/portal");
}

// Employees ask for access; a portal administrator approves it. The domain alone grants nothing.
export async function requestEmployeeAccess() {
  const v = await viewerOrLogin();
  if (!v.email.endsWith("@" + env.employeeDomain)) redirect("/portal/workspace?error=domain");
  const { data: org } = await db().from("organizations").select("id").eq("kind", "internal").single();
  const { data: existing } = await db().from("memberships").select("id").eq("user_id", v.userId).eq("org_id", org!.id).maybeSingle();
  if (!existing) {
    const { data: m } = await db().from("memberships").insert({ user_id: v.userId, org_id: org!.id, status: "pending" }).select("id").single();
    await audit(v, "membership.requested", "membership", m!.id, {}, org!.id);
    const { data: admins } = await db().from("role_grants").select("memberships!inner(user_id, org_id)").eq("role", "portal_admin").is("revoked_at", null);
    for (const a of (admins ?? []) as unknown as { memberships: { user_id: string } }[]) {
      await notify({ userId: a.memberships.user_id, kind: "access_request", title: "Employee access requested", body: `${v.email} asked for employee access.`, link: "/portal/admin" });
    }
  }
  redirect("/portal/workspace?requested=1");
}
