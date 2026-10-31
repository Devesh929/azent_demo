// Pure access rules: no framework or database imports, so they are unit-testable and
// identical wherever they run. Guards that redirect or query live in policy.ts.
import type { AppRole, Viewer } from "./viewer";

export type Audience = "public" | "community" | "employees" | "all_clients" | "entitled_clients" | "org";
export type AudienceTarget = { audience: Audience; org_id?: string | null; offering_id?: string | null };

export const inEmployeeWorkspace = (v: Viewer | null) => !!v && v.isEmployee && v.active?.orgKind === "internal";
export const inClientWorkspace = (v: Viewer | null) => !!v && v.active?.orgKind === "client";
export const hasPlatformRole = (v: Viewer | null, role: AppRole) => inEmployeeWorkspace(v) && v!.platformRoles.has(role);
export const isClientAdmin = (v: Viewer | null) => inClientWorkspace(v) && v!.active!.roles.includes("client_admin");

// The required access rule: a viewer may see a resource only when its audience permits their
// identity AND their active membership is valid where the audience depends on it. Missing
// metadata never means public.
export function audienceAllows(v: Viewer | null, t: AudienceTarget): boolean {
  switch (t.audience) {
    case "public":
      return true;
    case "community":
    case "all_clients":
      return inEmployeeWorkspace(v) || inClientWorkspace(v);
    case "employees":
      return inEmployeeWorkspace(v);
    case "entitled_clients":
      if (inEmployeeWorkspace(v)) return true;
      return inClientWorkspace(v) && !!t.offering_id && v!.entitledOfferingIds.includes(t.offering_id);
    case "org":
      if (!t.org_id) return false;
      if (inClientWorkspace(v) && v!.active!.orgId === t.org_id) return true;
      // Portal admins need an explicit, unexpired support grant for that tenant.
      return hasPlatformRole(v, "portal_admin") && v!.supportOrgIds.includes(t.org_id);
    default:
      return false;
  }
}

// PostgREST filter applying the same rule inside the query, so search results, counts,
// suggestions and AIRA retrieval can never include rows the viewer could not open.
export function audienceFilter(v: Viewer | null): string {
  const parts = ["audience.eq.public"];
  if (inEmployeeWorkspace(v) || inClientWorkspace(v)) parts.push("audience.eq.community", "audience.eq.all_clients");
  if (inEmployeeWorkspace(v)) parts.push("audience.eq.employees", "audience.eq.entitled_clients");
  if (inClientWorkspace(v)) {
    if (v!.entitledOfferingIds.length) {
      parts.push(`and(audience.eq.entitled_clients,offering_id.in.(${v!.entitledOfferingIds.join(",")}))`);
    }
    parts.push(`and(audience.eq.org,org_id.eq.${v!.active!.orgId})`);
  }
  if (hasPlatformRole(v, "portal_admin") && v!.supportOrgIds.length) {
    parts.push(`and(audience.eq.org,org_id.in.(${v!.supportOrgIds.join(",")}))`);
  }
  return parts.join(",");
}

type ObsRef = { author_id: string; org_id: string; visibility?: "private" | "org"; status: string };

/** Read rule for a private source observation. */
export function canReadObservation(v: Viewer, o: ObsRef) {
  if (o.author_id === v.userId && inClientWorkspace(v) && v.active?.orgId === o.org_id) return true;
  if (inClientWorkspace(v) && v.active?.orgId === o.org_id && o.visibility === "org") return true;
  // Moderators see only what was submitted for review, never unsubmitted drafts.
  if (hasPlatformRole(v, "learning_moderator") && o.status !== "draft") return true;
  if (hasPlatformRole(v, "portal_admin") && v.supportOrgIds.includes(o.org_id)) return true;
  return false;
}

export const canEditObservation = (v: Viewer, o: ObsRef) =>
  o.author_id === v.userId && inClientWorkspace(v) && v.active?.orgId === o.org_id && ["draft", "returned", "rejected", "published"].includes(o.status);

export const canSeeCommunity = (v: Viewer | null) => inEmployeeWorkspace(v) || inClientWorkspace(v);
