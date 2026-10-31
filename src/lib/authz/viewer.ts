import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { createAuthClient, db } from "@/lib/supabase/server";
import { env } from "@/lib/env";

export type AppRole =
  | "employee" | "product_owner" | "learning_moderator" | "content_publisher"
  | "portal_admin" | "fl_coordinator" | "client_member" | "client_admin";

export type Membership = {
  id: string;
  orgId: string;
  orgName: string;
  orgSlug: string;
  orgKind: "internal" | "client";
  status: string;
  termsAcceptedAt: string | null;
  roles: AppRole[];
};

export type Viewer = {
  userId: string;
  email: string;
  displayName: string;
  title: string | null;
  memberships: Membership[];          // active memberships only
  pendingMemberships: Membership[];
  active: Membership | null;          // validated active workspace
  isEmployee: boolean;                // verified domain AND approved internal membership with employee role
  platformRoles: Set<AppRole>;        // roles on the internal membership (only if isEmployee)
  entitledOfferingIds: string[];      // for the active client workspace
  supportOrgIds: string[];            // orgs a portal admin has an explicit, unexpired support grant for
};

export const WORKSPACE_COOKIE = "az_ws";

type MembershipRow = {
  id: string; status: string; terms_accepted_at: string | null;
  organizations: { id: string; name: string; slug: string; kind: "internal" | "client"; status: string };
  role_grants: { role: AppRole; revoked_at: string | null }[];
};

// Resolves the signed-in user from a token validated by Supabase Auth (getUser hits the auth
// server), then derives authority ONLY from database membership and role-grant rows.
// Nothing is read from the request body, localStorage, the navigation, or a client tenant id.
export const getViewer = cache(async (): Promise<Viewer | null> => {
  const auth = await createAuthClient();
  const { data, error } = await auth.auth.getUser();
  if (error || !data.user?.email) return null;
  const user = data.user;
  const email = user.email!.toLowerCase();

  // First sign-in: create a bare profile. A profile grants nothing on its own.
  let { data: profile } = await db().from("profiles").select("id, email, display_name, title").eq("id", user.id).maybeSingle();
  if (!profile) {
    const display = (user.user_metadata?.display_name as string | undefined) ?? email.split("@")[0];
    const ins = await db().from("profiles").insert({ id: user.id, email, display_name: display }).select().single();
    profile = ins.data;
  }

  const { data: rows } = await db()
    .from("memberships")
    .select("id, status, terms_accepted_at, organizations!inner(id, name, slug, kind, status), role_grants(role, revoked_at)")
    .eq("user_id", user.id);

  const all = ((rows ?? []) as unknown as MembershipRow[]).map((r) => ({
    id: r.id,
    orgId: r.organizations.id,
    orgName: r.organizations.name,
    orgSlug: r.organizations.slug,
    orgKind: r.organizations.kind,
    status: r.organizations.status === "active" ? r.status : "suspended",
    termsAcceptedAt: r.terms_accepted_at,
    roles: r.role_grants.filter((g) => !g.revoked_at).map((g) => g.role),
  }));
  const memberships = all.filter((m) => m.status === "active");
  const pendingMemberships = all.filter((m) => m.status === "pending");

  // Employee = verified work email on the employee domain AND an approved internal membership.
  // Domain alone is never enough; membership alone is never enough.
  const domainOk = email.endsWith("@" + env.employeeDomain) && !!user.email_confirmed_at;
  const internal = memberships.find((m) => m.orgKind === "internal" && m.roles.includes("employee"));
  const isEmployee = domainOk && !!internal;
  const platformRoles = new Set<AppRole>(isEmployee ? internal!.roles : []);

  // Active workspace: the cookie only *selects* among memberships already verified above.
  const store = await cookies();
  const wanted = store.get(WORKSPACE_COOKIE)?.value;
  const usable = memberships.filter((m) => m.orgKind === "client" || (m.orgKind === "internal" && isEmployee));
  const active = usable.find((m) => m.id === wanted) ?? (usable.length === 1 ? usable[0] : null);

  let entitledOfferingIds: string[] = [];
  if (active?.orgKind === "client") {
    const { data: ent } = await db().from("entitlements").select("offering_id").eq("org_id", active.orgId);
    entitledOfferingIds = (ent ?? []).map((e: { offering_id: string }) => e.offering_id);
  }

  let supportOrgIds: string[] = [];
  if (platformRoles.has("portal_admin")) {
    const { data: grants } = await db()
      .from("support_grants")
      .select("org_id")
      .eq("admin_id", user.id)
      .is("revoked_at", null)
      .gt("expires_at", new Date().toISOString());
    supportOrgIds = (grants ?? []).map((g: { org_id: string }) => g.org_id);
  }

  return {
    userId: user.id,
    email,
    displayName: profile?.display_name ?? email,
    title: profile?.title ?? null,
    memberships,
    pendingMemberships,
    active,
    isEmployee,
    platformRoles,
    entitledOfferingIds,
    supportOrgIds,
  };
});
