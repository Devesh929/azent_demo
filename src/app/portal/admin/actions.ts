"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePlatformRole, assert } from "@/lib/authz/policy";
import { db } from "@/lib/supabase/server";
import { audit } from "@/lib/audit";
import { processOutbox } from "@/lib/notify";
import { env } from "@/lib/env";

const PLATFORM_ROLES = ["employee", "product_owner", "learning_moderator", "content_publisher", "portal_admin", "fl_coordinator"] as const;
const admin = () => requirePlatformRole("portal_admin");
const done = () => revalidatePath("/portal/admin");

export async function createOrg(fd: FormData) {
  const v = await admin();
  const p = z.object({ name: z.string().trim().min(3).max(120), industry: z.string().trim().max(80), region: z.string().trim().max(80) })
    .safeParse({ name: fd.get("name"), industry: fd.get("industry") ?? "", region: fd.get("region") ?? "" });
  if (!p.success) return;
  const slug = p.data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) + "-" + Math.random().toString(36).slice(2, 6);
  const { data } = await db().from("organizations").insert({ ...p.data, slug, kind: "client" }).select("id").single();
  await audit(v, "org.created", "organization", data?.id, { name: p.data.name });
  done();
}

export async function setOrgStatus(fd: FormData) {
  const v = await admin();
  const id = String(fd.get("org_id"));
  const status = fd.get("status") === "suspended" ? "suspended" : "active";
  await db().from("organizations").update({ status }).eq("id", id).eq("kind", "client");
  await audit(v, `org.${status}`, "organization", id);
  done();
}

export async function toggleEntitlement(fd: FormData) {
  const v = await admin();
  const org = String(fd.get("org_id"));
  const offering = String(fd.get("offering_id"));
  const on = fd.get("on") === "1";
  if (on) await db().from("entitlements").upsert({ org_id: org, offering_id: offering, granted_by: v.userId }, { onConflict: "org_id,offering_id", ignoreDuplicates: true });
  else await db().from("entitlements").delete().eq("org_id", org).eq("offering_id", offering);
  await audit(v, on ? "entitlement.granted" : "entitlement.revoked", "organization", org, { offering });
  done();
}

export async function approveMembership(fd: FormData) {
  const v = await admin();
  const id = String(fd.get("membership_id"));
  const { data: m } = await db().from("memberships").select("id, org_id, status, profiles(email), organizations(kind)").eq("id", id).single();
  assert(m && m.status === "pending");
  const email = (m.profiles as unknown as { email: string }).email.toLowerCase();
  const internal = (m.organizations as unknown as { kind: string }).kind === "internal";
  // Employee provisioning: verified company domain AND an administrator's approval.
  assert(!internal || email.endsWith("@" + env.employeeDomain), "Employee access requires a verified company address.");
  await db().from("memberships").update({ status: "active", approved_by: v.userId }).eq("id", id);
  if (internal) {
    const { data: held } = await db().from("role_grants").select("id").eq("membership_id", id).eq("role", "employee").is("revoked_at", null);
    if (!held?.length) await db().from("role_grants").insert({ membership_id: id, role: "employee", granted_by: v.userId });
  }
  await audit(v, "membership.approved", "membership", id, { internal }, m.org_id);
  done();
}

export async function setPlatformRole(fd: FormData) {
  const v = await admin();
  const membershipId = String(fd.get("membership_id"));
  const role = z.enum(PLATFORM_ROLES).parse(fd.get("role"));
  const grant = fd.get("grant") === "1";
  // An admin cannot strip their own admin role (prevents lock-out); the DB trigger rejects
  // platform roles on client organisations.
  const { data: m } = await db().from("memberships").select("user_id, organizations(kind)").eq("id", membershipId).single();
  assert(m && (m.organizations as unknown as { kind: string }).kind === "internal", "Platform roles exist only on employee memberships.");
  assert(grant || !(m.user_id === v.userId && role === "portal_admin"), "You cannot remove your own administrator role.");
  if (grant) {
    const { data: held } = await db().from("role_grants").select("id").eq("membership_id", membershipId).eq("role", role).is("revoked_at", null);
    if (!held?.length) await db().from("role_grants").insert({ membership_id: membershipId, role, granted_by: v.userId });
  } else {
    await db().from("role_grants").update({ revoked_at: new Date().toISOString() }).eq("membership_id", membershipId).eq("role", role).is("revoked_at", null);
  }
  await audit(v, grant ? "role.granted" : "role.revoked", "membership", membershipId, { role });
  done();
}

export async function createSupportGrant(fd: FormData) {
  const v = await admin();
  const p = z.object({ org_id: z.uuid(), reason: z.string().trim().min(15).max(500), hours: z.coerce.number().int().min(1).max(24) })
    .safeParse({ org_id: fd.get("org_id"), reason: fd.get("reason"), hours: fd.get("hours") });
  if (!p.success) return;
  const { data } = await db().from("support_grants").insert({ admin_id: v.userId, org_id: p.data.org_id, reason: p.data.reason, expires_at: new Date(Date.now() + p.data.hours * 3600e3).toISOString() }).select("id").single();
  await audit(v, "support_grant.created", "support_grant", data?.id, { hours: p.data.hours, reason: p.data.reason }, p.data.org_id);
  done();
}

export async function revokeSupportGrant(fd: FormData) {
  const v = await admin();
  const id = String(fd.get("id"));
  await db().from("support_grants").update({ revoked_at: new Date().toISOString() }).eq("id", id).eq("admin_id", v.userId);
  await audit(v, "support_grant.revoked", "support_grant", id);
  done();
}

export async function updateSetting(fd: FormData) {
  const v = await admin();
  const key = String(fd.get("key"));
  if (key !== "min_cohort_orgs") return;
  const val = Math.max(3, Math.min(50, Number(fd.get("value")) || 3));
  await db().from("platform_settings").upsert({ key, value: val, updated_by: v.userId, updated_at: new Date().toISOString() });
  await audit(v, "setting.updated", "platform_setting", key, { value: val });
  done();
}

export async function runOutbox() {
  const v = await admin();
  const results = await processOutbox(25);
  await audit(v, "outbox.processed", "email_outbox", null, { results: results.length });
  done();
}
