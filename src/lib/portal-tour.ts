/** Presentation guidance only. The server-owned navigation selects available routes;
 * every destination retains its own authentication and authorisation checks. */
export type TourNav = { href: string; label: string };
export type TourStep = { id: string; href: string; label: string; title: string; description: string; checks: string[] };
export type TourWorkspace = { kind: "internal" | "client"; roles: string[] };

const stage = (href: string, label: string, title: string, description: string, checks: string[]): TourStep => ({ id: href, href, label, title, description, checks });

export function buildPortalTour(nav: TourNav[], workspace: TourWorkspace, canSwitch = false): TourStep[] {
  const client = workspace.kind === "client";
  const owner = workspace.roles.includes("product_owner");
  const allowed = new Set(nav.map(n => n.href));
  const candidates: TourStep[] = [
    stage("/portal", "Overview", "Start with your workspace", "Check who you are signed in as and which organisation is active before exploring its tools.", ["Identify the active organisation and your role.", "Review the available products, activity and contribution status.", "Use the sidebar for direct navigation or follow this guide."]),
    stage("/portal/playground", "Sandbox", "Explore a product with evidence", "Try a guided scenario using synthetic inputs. Availability follows your workspace's permissions and entitlements.", ["Choose an available product and inspect its scenario inputs.", "Run the sample and review the explanation and source evidence.", "Leave structured feedback. A sandbox output is not an approved business decision."]),
    stage("/portal/observations", "Observe", "Capture a private observation", "Begin with a private draft. Saving and sharing are separate actions.", ["Create an observation with a period, offering, evidence type and confidence.", "Choose Only me or My organisation and save the draft.", "Open the saved observation to review the separate sharing permissions."]),
    stage("/portal/moderation", "Review", "Review before anything is shared", "Moderators review submitted observations and prepare a separate, de-identified community copy.", ["Open and claim a submitted item; unsubmitted private drafts are excluded.", "Check consent, flags, wording, geography and observation period.", "Publish a reviewed copy, request clarification or reject with an appropriate reason."]),
    stage("/portal/learning", "Shared learning", "Explore reviewed community knowledge", "This feed contains approved shared representations, not private source records.", ["Search and filter by offering, topic, region, industry or period.", "Open a contribution to inspect evidence, bookmark, comment or report an issue.", "Save a filtered search or export the permitted results as CSV."]),
    stage("/portal/learning/themes", "Themes", "Look for patterns without overstating them", "Themes connect permitted evidence while preserving uncertainty and suppressing small cohorts.", ["Open a theme and follow its approved evidence links.", "Read the distinct-organisation count and the stated limitations.", "Compare a small theme whose counts are suppressed; repeated posts are not independent organisations."]),
    stage("/portal/ideas", "Improvements", owner ? "Connect evidence to an improvement" : "Follow the product response", "Ideas connect reviewed evidence to a visible product response. A status is not a delivery commitment.", owner ? ["Create or open an idea linked to approved supporting contributions.", "Review its problem, outcome, owner, team and status.", "Record an appropriate status and client-safe message; inspect the update history."] : ["Open an idea available to your workspace and inspect its supporting evidence.", "Read the status, owner/team and latest audience-appropriate update.", "Keep delivery expectations separate from a proposed or under-review idea."]),
    stage("/portal/aira", "Ask AIRA", "Ask a question and follow the citations", "AIRA uses evidence your current identity can access. Retrieval and summarisation do not retrain a model.", ["Ask what approved evidence says about seasonal SME cash flow.", "Open a numbered citation and check its scope and limitations.", "Read any fallback or insufficient-evidence message; do not infer access to hidden sources."]),
    stage("/portal/live", client ? "Sessions" : "Live", "Find sessions for your audience", "Sessions and recordings follow their configured organisation, employee or entitlement audience.", ["Open a relevant session and inspect its schedule or recording.", "Check the audience and available supporting information.", "A missing session or unavailable recording should stay an honest empty state."]),
    stage("/portal/library", client ? "Resources" : "Library", client ? "Find resources for your organisation" : "Explore internal knowledge", "Only resources permitted for your current workspace appear here.", ["Open an available resource and inspect its content and supporting media.", "Check ownership and review information where supplied.", "Use the resource feedback controls where available."]),
    stage("/portal/innovation", "Innovation", "Turn an internal hypothesis into an experiment", "This space is employee-only. Keep experiments and team work grounded in synthetic data.", ["Open or submit an experiment with a hypothesis and evaluation method.", "Create or join a hackathon team space.", "Review internal release notes; these do not become public or client knowledge."]),
    stage("/portal/support", "Support", "Keep a support request in its organisation", "Support tickets are private to the organisation and do not automatically become shared learning.", ["Review your organisation's existing tickets.", "If needed, enter a clear subject, description and priority for a new request.", "Use observations separately when you want to propose reviewed community learning."]),
    stage("/portal/org", "Members", "Manage access within your organisation", "Client administrators manage approved client roles and invitations, not platform roles.", ["Inspect membership and invitation states, including expiry and revocation.", "Invite a controlled email with the appropriate client role.", "Review the separate federated-learning opt-in; workspace membership is not training consent."]),
  ];
  const result = candidates.filter(s => allowed.has(s.href));
  if (allowed.has("/portal/publisher")) result.push(
    stage("/portal/publisher?tab=content", "Content", "Publish with an explicit audience", "Publishing is a separate permission. Prepare content with a deliberate audience and status.", ["Choose the appropriate content kind and enter its title and body.", "Review public, employee, organisation or entitlement audience settings.", "Check status before saving. The tour does not publish on your behalf."]),
    stage("/portal/publisher?tab=sessions", "Broadcasts", "Configure a session or recording", "The session's audience determines who can find and open it.", ["Inspect the schedule, type and session status.", "Choose the correct audience and permitted supporting media.", "Check the saved session from an appropriately authorised identity."]),
    stage("/portal/publisher?tab=media", "Media", "Keep media audience-aware", "Uploaded media is served through permission-checked application routes.", ["Inspect each media item's configured audience.", "Use an allowed file type and a small file within the current upload limit.", "Link media only to content or sessions with the intended audience."]),
  );
  if (allowed.has("/portal/admin")) result.push(
    stage("/portal/admin?tab=orgs", "Organisations", "Review organisations and entitlements", "Entitlements determine which product-specific experiences a client organisation can reach.", ["Inspect organisation status and offering entitlements.", "Use a disposable organisation for any demonstration changes.", "Registration does not automatically create trusted client membership."]),
    stage("/portal/admin?tab=people", "Roles", "Keep administrative capabilities separate", "Employee identity does not automatically grant publishing, moderation or administration.", ["Review pending employee membership approvals.", "Inspect explicit specialist role grants.", "Change a role only when its scope is intended and authorised."]),
    stage("/portal/admin?tab=support", "Support access", "Use reasoned, time-limited support access", "An administrator role alone does not unlock private client content.", ["Inspect the reason, organisation and expiry of each support grant.", "Create a short grant only for an intended support task.", "Revoke temporary access after use; do not assume access to every author-private draft."]),
    stage("/portal/admin?tab=settings", "Settings", "Review platform safeguards", "Configuration includes cohort thresholds and the documented retention policy.", ["Inspect the minimum distinct-organisation threshold; the judging floor is three.", "Review retention and platform settings.", "Keep live configuration changes separate from this navigation tour."]),
    stage("/portal/admin?tab=audit", "Audit", "Follow the record of privileged actions", "Audit events preserve who performed a privileged action and when.", ["Find a recent moderation, consent or administrative event.", "Inspect its action, actor and time.", "Append-only enforcement is a database control, not an editable tour setting."]),
    stage("/portal/admin?tab=outbox", "Email", "Distinguish queued mail from delivery", "The persisted outbox records email processing without promising mailbox delivery.", ["Inspect queued, failed or provider-accepted records.", "Check whether the email provider is configured.", "Process the queue only when intended; provider acceptance is not delivery confirmation."]),
    stage("/portal/admin?tab=leads", "Leads", "Connect public interest to follow-up", "Public demo enquiries and hackathon registrations appear in the operational workspace.", ["Find a prepared demo enquiry or registration.", "Check its submitted product interest and details.", "Treat these records as administrative information, not shared community evidence."]),
  );
  if (allowed.has("/portal/fl")) result.push(stage("/portal/fl", "Federated learning", "Review the separate training programme", "Training runs locally in the optional Python demo. This portal reviews ingested results and governance decisions.", ["Inspect programme consent, participants, accepted updates and failed rounds.", "Compare actual evaluation results and baselines; label simulated controls honestly.", "Review candidate approval, deployment and rollback history. No automatic training or untraining is implied."]));
  if (canSwitch) result.push(stage("/portal/workspace", "Workspaces", "Choose among your approved memberships", "A workspace switch selects an already authorised membership; it does not grant a new one.", ["Confirm the organisation before selecting a workspace.", "Review workspace terms where required.", "Tour progress is kept separately for each user and active membership."]));
  result.push(stage("/portal/notifications", "Notifications", "Close the loop with the latest updates", "Notifications acknowledge workflow changes and keep permitted updates in view.", ["Open a recent contribution, moderation or improvement update.", "Follow its link and verify the current status.", "Mark notifications read when appropriate. Visiting a tour page does not complete its business actions."]));
  return result;
}

export function matchTourStep(steps: TourStep[], pathname: string, search = ""): number {
  const current = new URLSearchParams(search);
  let best = -1, score = -1;
  steps.forEach((step, index) => {
    const [path, query] = step.href.split("?");
    if (!(pathname === path || (path !== "/portal" && pathname.startsWith(path + "/")))) return;
    const expected = new URLSearchParams(query);
    if ([...expected].some(([key, value]) => (current.get(key) ?? (path === "/portal/admin" ? "orgs" : path === "/portal/publisher" ? "content" : "")) !== value)) return;
    const weight = path.length + [...expected].length;
    if (weight > score) { best = index; score = weight; }
  });
  return best;
}

export function tourContext(step: TourStep, pathname: string): Pick<TourStep, "title" | "description" | "checks"> {
  if (step.href === "/portal/observations" && pathname.endsWith("/new")) return { title: "Save your observation privately", description: "Capture a pattern, not identifying customer details. No sharing happens when you save.", checks: ["Complete the title, observation, period, offering and evidence/confidence fields.", "Review any sensitive-content warning and choose Only me or My organisation.", "Save the draft, then review the separate consent choices on its detail page."] };
  if (step.href === "/portal/observations" && pathname !== step.href) return { title: "Review sharing, permissions and history", description: "The original and the approved shared copy have different audiences. Actions depend on authorship and the current status.", checks: ["Read Who can see this and the current version/status.", "If you are the author, choose storage, publication, attribution and future-training permissions separately before proposing a draft.", "Review contributor messages and consent history. Withdraw only when intended; it removes future shared retrieval."] };
  if (step.href === "/portal/learning" && pathname !== step.href) return { title: "Read the reviewed contribution in context", description: "This is a shared representation. Private source details and moderator notes are excluded.", checks: ["Read its evidence, observation period, confidence and limitations.", "Bookmark, comment or give quality feedback where appropriate.", "Report a concern without disclosing another client's identity."] };
  if (step.href === "/portal/moderation" && pathname !== step.href) return { title: "Prepare a safe, reviewed shared copy", description: "Compare the submitted original, consent and proposed publication without widening its audience silently.", checks: ["Claim the review if needed and inspect sensitive-content flags.", "Generalise the shared wording, geography and period; keep internal notes separate from the contributor message.", "Publish with consent, request clarification or reject. Use unpublish/restore only when the status permits."] };
  return step;
}

export type TourState = { status: "idle" | "active" | "finished"; visited: string[] };
export function restoreTourState(raw: string | null, steps: TourStep[]): TourState {
  const empty: TourState = { status: "idle", visited: [] };
  if (!raw) return empty;
  try {
    const value = JSON.parse(raw);
    if (value?.version !== 1 || !["idle", "active", "finished"].includes(value.status) || !Array.isArray(value.visited)) return empty;
    const ids = new Set(steps.map(s => s.id));
    return { status: value.status, visited: [...new Set<string>(value.visited.filter((id: unknown): id is string => typeof id === "string" && ids.has(id)))] };
  } catch { return empty; }
}

export function portalBreadcrumbs(nav: TourNav[], pathname: string): TourNav[] {
  const result: TourNav[] = [{ href: "/portal", label: "Dashboard" }];
  if (pathname === "/portal") return result;
  const known: TourNav[] = [...nav, { href: "/portal/notifications", label: "Notifications" }, { href: "/portal/workspace", label: "Choose workspace" }];
  const parents = known.filter(n => n.href !== "/portal" && (pathname === n.href || pathname.startsWith(n.href + "/"))).sort((a, b) => a.href.length - b.href.length);
  result.push(...parents);
  const parent = parents.at(-1);
  if (parent?.href !== pathname) result.push({ href: pathname, label: pathname.endsWith("/new") ? "Create" : "Details" });
  return result.filter((n, i, all) => all.findIndex(x => x.href === n.href) === i);
}
