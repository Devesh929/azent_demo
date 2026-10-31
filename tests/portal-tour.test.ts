import { strict as assert } from "node:assert";
import { test } from "node:test";
import { buildPortalTour, matchTourStep, portalBreadcrumbs, restoreTourState, tourContext } from "../src/lib/portal-tour";
const nav = (paths: string[]) => paths.map(href => ({ href, label: href.split("/").at(-1)! }));

test("client tour never adds employee or specialist destinations", () => {
  const steps = buildPortalTour(nav(["/portal", "/portal/playground", "/portal/observations", "/portal/learning", "/portal/learning/themes", "/portal/ideas", "/portal/aira"]), { kind: "client", roles: ["client_member"] });
  assert(steps.some(s => s.href === "/portal/observations"));
  for (const path of ["/portal/admin", "/portal/publisher", "/portal/fl", "/portal/moderation", "/portal/innovation", "/portal/org"]) assert(!steps.some(s => s.href.startsWith(path)));
});
test("specialist routes come from server navigation, not a role string alone", () => {
  const steps = buildPortalTour(nav(["/portal", "/portal/aira"]), { kind: "internal", roles: ["employee", "portal_admin", "content_publisher"] });
  assert(!steps.some(s => s.href.startsWith("/portal/admin") || s.href.startsWith("/portal/publisher")));
});
test("administrator and publisher tabs resolve to their own steps", () => {
  const steps = buildPortalTour(nav(["/portal", "/portal/admin", "/portal/publisher"]), { kind: "internal", roles: ["employee", "portal_admin", "content_publisher"] });
  assert.equal(steps[matchTourStep(steps, "/portal/admin")].href, "/portal/admin?tab=orgs");
  assert.equal(steps[matchTourStep(steps, "/portal/admin", "tab=audit")].label, "Audit");
  assert.equal(steps[matchTourStep(steps, "/portal/publisher")].label, "Content");
  assert.equal(steps[matchTourStep(steps, "/portal/publisher", "tab=media")].label, "Media");
  assert.equal(matchTourStep(steps, "/portal/admin", "tab=unknown"), -1);
});
test("nested theme pages beat the parent feed without matching unrelated prefixes", () => {
  const steps = buildPortalTour(nav(["/portal", "/portal/learning", "/portal/learning/themes"]), { kind: "client", roles: [] });
  assert.equal(steps[matchTourStep(steps, "/portal/learning/themes/some-id")].label, "Themes");
  assert.equal(steps[matchTourStep(steps, "/portal/learning/some-id")].label, "Shared learning");
  assert.equal(matchTourStep(steps, "/portal/learning-other"), -1);
});
test("saved tour progress cannot introduce arbitrary or revoked destinations", () => {
  const steps = buildPortalTour(nav(["/portal"]), { kind: "client", roles: [] });
  const restored = restoreTourState(JSON.stringify({ version: 1, status: "active", visited: ["/portal", "/portal", "/portal/admin?tab=orgs", "https://example.com", 9] }), steps);
  assert.deepEqual(restored, { status: "active", visited: ["/portal"] });
  assert.deepEqual(restoreTourState("broken json", steps), { status: "idle", visited: [] });
  assert.deepEqual(restoreTourState('{"version":1,"status":"active","visited":null}', steps), { status: "idle", visited: [] });
});
test("observation guidance distinguishes draft creation from consent and withdrawal", () => {
  const steps = buildPortalTour(nav(["/portal", "/portal/observations"]), { kind: "client", roles: ["client_member"] });
  const observation = steps.find(s => s.href === "/portal/observations")!;
  assert.match(tourContext(observation, "/portal/observations/new").title, /privately/);
  assert.match(tourContext(observation, "/portal/observations/id").title, /sharing/);
  assert.match(tourContext(observation, "/portal/observations/id").checks.join(" "), /If you are the author/);
});
test("breadcrumbs retain real parents without displaying resource identifiers", () => {
  const crumbs = portalBreadcrumbs(nav(["/portal", "/portal/learning", "/portal/learning/themes"]), "/portal/learning/themes/private-id");
  assert.deepEqual(crumbs.map(c => c.href), ["/portal", "/portal/learning", "/portal/learning/themes", "/portal/learning/themes/private-id"]);
  assert.equal(crumbs.at(-1)!.label, "Details");
  assert.equal(portalBreadcrumbs(nav(["/portal", "/portal/observations"]), "/portal/observations/new").at(-1)!.label, "Create");
});
