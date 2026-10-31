// Unit tests for the access rules. Run: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { audienceAllows, audienceFilter, canEditObservation, canReadObservation, hasPlatformRole, isClientAdmin } from "../src/lib/authz/rules";
import type { Membership, Viewer } from "../src/lib/authz/viewer";
import { scanSensitive, periodLabel, coarsenRegion } from "../src/lib/sensitive";

const ORG_A = "00000000-0000-0000-0000-00000000000a";
const ORG_B = "00000000-0000-0000-0000-00000000000b";
const INTERNAL = "00000000-0000-0000-0000-0000000000ff";
const OFF_1 = "00000000-0000-0000-0000-000000000001";
const OFF_2 = "00000000-0000-0000-0000-000000000002";

function mem(orgId: string, kind: "internal" | "client", roles: Membership["roles"]): Membership {
  return { id: `m-${orgId}`, orgId, orgName: orgId, orgSlug: orgId, orgKind: kind, status: "active", termsAcceptedAt: "2026-01-01", roles };
}
function viewer(over: Partial<Viewer>): Viewer {
  return {
    userId: "u1", email: "x@example.com", displayName: "X", title: null, memberships: [], pendingMemberships: [], active: null,
    isEmployee: false, platformRoles: new Set(), entitledOfferingIds: [], supportOrgIds: [], ...over,
  };
}
const clientA = viewer({ active: mem(ORG_A, "client", ["client_member"]), memberships: [mem(ORG_A, "client", ["client_member"])], entitledOfferingIds: [OFF_1] });
const clientAdminA = viewer({ active: mem(ORG_A, "client", ["client_member", "client_admin"]) });
const employee = viewer({ userId: "e1", email: "e@azentio.com", isEmployee: true, platformRoles: new Set(["employee"]), active: mem(INTERNAL, "internal", ["employee"]) });
const moderator = viewer({ ...employee, userId: "mod", platformRoles: new Set(["employee", "learning_moderator"]), active: mem(INTERNAL, "internal", ["employee", "learning_moderator"]) });
const admin = viewer({ ...employee, userId: "adm", platformRoles: new Set(["employee", "portal_admin"]), active: mem(INTERNAL, "internal", ["employee", "portal_admin"]) });
const adminWithGrant = viewer({ ...admin, supportOrgIds: [ORG_A] });
// A client account whose email is on the employee domain but holds no employee membership.
const domainOnly = viewer({ email: "spoof@azentio.com", isEmployee: false, active: mem(ORG_B, "client", ["client_member"]) });

test("public content is visible to anonymous visitors", () => {
  assert.equal(audienceAllows(null, { audience: "public" }), true);
});

test("anonymous visitors see nothing else", () => {
  for (const a of ["community", "employees", "all_clients", "entitled_clients", "org"] as const) {
    assert.equal(audienceAllows(null, { audience: a, org_id: ORG_A, offering_id: OFF_1 }), false, a);
  }
});

test("employee-only content is hidden from clients, including employee-domain impostors", () => {
  assert.equal(audienceAllows(clientA, { audience: "employees" }), false);
  assert.equal(audienceAllows(domainOnly, { audience: "employees" }), false);
  assert.equal(audienceAllows(employee, { audience: "employees" }), true);
});

test("organisation content is tenant-isolated, even from employees", () => {
  assert.equal(audienceAllows(clientA, { audience: "org", org_id: ORG_A }), true);
  assert.equal(audienceAllows(clientA, { audience: "org", org_id: ORG_B }), false);
  assert.equal(audienceAllows(employee, { audience: "org", org_id: ORG_A }), false);
});

test("portal admins need an explicit support grant for private client content", () => {
  assert.equal(audienceAllows(admin, { audience: "org", org_id: ORG_A }), false);
  assert.equal(audienceAllows(adminWithGrant, { audience: "org", org_id: ORG_A }), true);
  assert.equal(audienceAllows(adminWithGrant, { audience: "org", org_id: ORG_B }), false);
});

test("entitlement gates offering-specific client content", () => {
  assert.equal(audienceAllows(clientA, { audience: "entitled_clients", offering_id: OFF_1 }), true);
  assert.equal(audienceAllows(clientA, { audience: "entitled_clients", offering_id: OFF_2 }), false);
  assert.equal(audienceAllows(clientA, { audience: "entitled_clients", offering_id: null }), false);
});

test("missing audience metadata is never treated as public", () => {
  assert.equal(audienceAllows(clientA, { audience: undefined as never }), false);
  assert.equal(audienceAllows(clientA, { audience: "org", org_id: null }), false);
});

test("the database filter mirrors the in-code rule", () => {
  assert.equal(audienceFilter(null), "audience.eq.public");
  const f = audienceFilter(clientA);
  assert.ok(f.includes(`and(audience.eq.org,org_id.eq.${ORG_A})`));
  assert.ok(f.includes(`offering_id.in.(${OFF_1})`));
  assert.ok(!f.includes("audience.eq.employees"));
  assert.ok(audienceFilter(employee).includes("audience.eq.employees"));
  assert.ok(!audienceFilter(employee).includes("audience.eq.org"));
});

test("employee status does not imply administrator or moderator rights", () => {
  assert.equal(hasPlatformRole(employee, "portal_admin"), false);
  assert.equal(hasPlatformRole(employee, "learning_moderator"), false);
  assert.equal(hasPlatformRole(moderator, "learning_moderator"), true);
  assert.equal(isClientAdmin(clientA), false);
  assert.equal(isClientAdmin(clientAdminA), true);
});

test("observation read rules: author, org visibility, moderators only after submission", () => {
  const draft = { author_id: "u1", org_id: ORG_A, visibility: "private" as const, status: "draft" };
  assert.equal(canReadObservation(clientA, draft), true);
  assert.equal(canReadObservation(viewer({ ...clientA, userId: "u2" }), draft), false);
  assert.equal(canReadObservation(viewer({ ...clientA, userId: "u2" }), { ...draft, visibility: "org" }), true);
  assert.equal(canReadObservation(moderator, draft), false, "moderators never see unsubmitted drafts");
  assert.equal(canReadObservation(moderator, { ...draft, status: "submitted" }), true);
  assert.equal(canReadObservation(admin, { ...draft, status: "submitted" }), false);
  assert.equal(canReadObservation(adminWithGrant, { ...draft, status: "submitted" }), true);
  assert.equal(canReadObservation(viewer({ ...clientA, active: mem(ORG_B, "client", ["client_member"]) }), draft), false, "other tenant");
});

test("only the author edits, and only in editable states", () => {
  const o = { author_id: "u1", org_id: ORG_A, status: "draft" };
  assert.equal(canEditObservation(clientA, o), true);
  assert.equal(canEditObservation(clientA, { ...o, status: "submitted" }), false);
  assert.equal(canEditObservation(viewer({ ...clientA, userId: "u2" }), o), false);
});

test("sensitive scan flags identifiers, and de-identification coarsens", () => {
  const kinds = scanSensitive("Account 0045128899 failed; email lina@tidewater.example; password: hunter22").map((f) => f.kind);
  assert.ok(kinds.includes("account_number"));
  assert.ok(kinds.includes("email_address"));
  assert.ok(kinds.includes("credential"));
  assert.equal(scanSensitive("Seasonal revenue dips are common in agri SMEs.").length, 0);
  assert.equal(periodLabel("2026-01-01", "2026-06-30"), "H1 2026");
  assert.equal(coarsenRegion("Kochi, India"), "South Asia");
});
