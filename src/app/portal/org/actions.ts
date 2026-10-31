"use server";

import { revalidatePath } from "next/cache";
import { isClientAdmin, requireClient, assert } from "@/lib/authz/policy";
import { db } from "@/lib/supabase/server";
import { audit } from "@/lib/audit";
import { queueEmail } from "@/lib/notify";
import { env } from "@/lib/env";
import { INVITE_TTL_DAYS, newInviteToken } from "@/lib/invites";
import { fieldErrors, inviteSchema } from "@/lib/validation";

export type OrgState = { ok: boolean; message?: string; link?: string; errors?: Record<string, string> };

async function requireClientAdmin() {
  const v = await requireClient();
  assert(isClientAdmin(v), "Only client administrators can manage members.");
  return v;
}

export async function invite(_: OrgState, fd: FormData): Promise<OrgState> {
  const v = await requireClientAdmin();
  // The role list is fixed to client roles; platform roles cannot even be expressed here.
  const parsed = inviteSchema.safeParse({ email: String(fd.get("email") ?? "").trim().toLowerCase(), role: fd.get("role") });
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  const { email, role } = parsed.data;
  if (email.endsWith("@" + env.employeeDomain)) return { ok: false, errors: { email: "Employee accounts are provisioned by azentio.ai, not by client invitation." } };

  await db().from("invitations").update({ status: "revoked" }).eq("org_id", v.active.orgId).eq("email", email).eq("status", "pending");
  const { token, hash } = newInviteToken();
  const { data } = await db().from("invitations").insert({
    org_id: v.active.orgId, email, role, token_hash: hash, invited_by: v.userId,
    expires_at: new Date(Date.now() + INVITE_TTL_DAYS * 864e5).toISOString(),
  }).select("id").single();
  const link = `${env.siteUrl}/invite/${token}`;
  await queueEmail({ idempotencyKey: `invite:${data!.id}`, to: email, template: "invite", subject: `You're invited to ${v.active.orgName} on azentio.ai`,
    payload: { title: `Join ${v.active.orgName} on azentio.ai`, body: `${v.displayName} invited you as ${role === "client_admin" ? "a client administrator" : "a member"}. The invitation expires in ${INVITE_TTL_DAYS} days and works only for ${email}.`, link: `/invite/${token}` } });
  await audit(v, "invitation.created", "invitation", data!.id, { role }, v.active.orgId);
  revalidatePath("/portal/org");
  return { ok: true, message: `Invitation queued for ${email}. It is single-use and expires in ${INVITE_TTL_DAYS} days.`, link };
}

export async function revokeInvite(fd: FormData) {
  const v = await requireClientAdmin();
  const id = String(fd.get("id"));
  await db().from("invitations").update({ status: "revoked" }).eq("id", id).eq("org_id", v.active.orgId).eq("status", "pending");
  await audit(v, "invitation.revoked", "invitation", id, {}, v.active.orgId);
  revalidatePath("/portal/org");
}

export async function setMemberRole(fd: FormData) {
  const v = await requireClientAdmin();
  const membershipId = String(fd.get("membership_id"));
  const makeAdmin = fd.get("admin") === "1";
  // Must belong to THIS organisation; never trust an org id from the form.
  const { data: m } = await db().from("memberships").select("id, user_id, org_id").eq("id", membershipId).eq("org_id", v.active.orgId).maybeSingle();
  assert(m, "Member not found in your organisation.");
  if (!makeAdmin && m.user_id === v.userId) return;
  if (makeAdmin) {
    const { data: held } = await db().from("role_grants").select("id").eq("membership_id", m.id).eq("role", "client_admin").is("revoked_at", null);
    if (!held?.length) await db().from("role_grants").insert({ membership_id: m.id, role: "client_admin", granted_by: v.userId });
  }
  else await db().from("role_grants").update({ revoked_at: new Date().toISOString() }).eq("membership_id", m.id).eq("role", "client_admin").is("revoked_at", null);
  await audit(v, makeAdmin ? "role.granted" : "role.revoked", "membership", m.id, { role: "client_admin" }, v.active.orgId);
  revalidatePath("/portal/org");
}

export async function revokeMember(fd: FormData) {
  const v = await requireClientAdmin();
  const { data: m } = await db().from("memberships").select("id, user_id").eq("id", String(fd.get("membership_id"))).eq("org_id", v.active.orgId).maybeSingle();
  assert(m && m.user_id !== v.userId, "You cannot remove yourself.");
  await db().from("memberships").update({ status: "revoked" }).eq("id", m.id);
  await audit(v, "membership.revoked", "membership", m.id, {}, v.active.orgId);
  revalidatePath("/portal/org");
}

export async function setFlParticipation(fd: FormData) {
  const v = await requireClientAdmin();
  const program = String(fd.get("program_id"));
  const join = fd.get("join") === "1";
  await db().from("fl_participants").upsert({
    program_id: program, org_id: v.active.orgId, status: join ? "consented" : "withdrawn",
    consent_by: v.userId, consented_at: join ? new Date().toISOString() : null, withdrawn_at: join ? null : new Date().toISOString(),
  }, { onConflict: "program_id,org_id" });
  await audit(v, join ? "fl.consented" : "fl.withdrawn", "fl_program", program, {}, v.active.orgId);
  revalidatePath("/portal/org");
}
