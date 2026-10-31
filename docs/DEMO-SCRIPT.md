# Complete Azentio demonstration playbook

Use this guide with the current light-theme website. It follows the original hackathon assignment and the implemented routes, rather than treating every page as a separate slide.

## The story to tell

> Azentio helps people discover AI offerings, explore them in an authorised workspace, and turn private market observations into reviewed shared knowledge and visible product improvements. Sharing never happens automatically, and retrieval is separate from model training.

Lead with one example throughout: seasonal SME cash flow can look like deterioration when compared with the wrong period.

Use the 12-minute route for judging, the 25–35-minute route for full coverage, and the additional checks for a technical discussion. Demonstrating every branch of every form requires a longer rehearsal or recording.

## Preparation — before the audience arrives

- Use the deployed HTTPS URL as the base for every route in this guide. The local fallback is `http://localhost:3001` with the production server running.
- Verify Supabase credentials, the website URL and Auth callback configuration. If using the seeded persona switcher, enable `DEMO_MODE=true` and use the existing seeded `DEMO_PASSWORD`.
- Rehearse the exact deployed build; a local browser pass does not verify deployment credentials or email delivery.
- Do not run `db:setup` on the shared demonstration database before every presentation. It writes seed data and can interfere with a prepared storyline. Use a separate demo project if you need a clean reset.
- Create a fresh observation with a unique title, for example `DEMO-01 — Seasonal cash-flow context`. Keep its private URL and later shared-copy URL in presenter notes.
- Check the existing Seasonality context theme. Show the actual distinct-organisation count; do not promise it will be three after previous demonstrations or withdrawals. If necessary, prepare approved seasonality observations from Raj (Harbourline), Sara (Saffron) and Lina (Tidewater). Three posts from Raj are still one organisation. Link the evidence to the theme where the UI permits it.
- Keep a second submitted example for clarification/rejection, and a disposable published example for report/unpublish tests. Do not consume the main storyline's record early.
- For real email/invitation acceptance, use a mailbox you control and verify SMTP first. Otherwise show the stored invitation and truthful outbox state.
- If including FL, run and ingest the Python demo beforehand and verify rounds appear at `/portal/fl`. A Vercel deployment alone does not generate training rounds. Do not withdraw a participant until after the training demonstration.
- Use separate browser profiles for simultaneous personas. Tabs in one profile share authentication cookies; changing persona in one tab changes the others too. If using one profile, switch sequentially through `/login` and verify the name and active organisation after every switch.
- Have screenshots ready for email, live media and Python-training contingencies. Explain which evidence is recorded versus live.

## Use the in-dashboard guide

Every selected, accepted workspace has a **Guide** button in the top bar and a compact **Start tour / Resume tour** panel. Open it for a role-specific breadcrumb trail, guidance for the current page, and Back / Next controls. The trail is clickable; specialists also get individual publishing and administration tabs. Real page breadcrumbs above it link back to parent pages such as Observations → Create.

Minimize the guide to work with the interface, reopen it from the top bar, or restart/end it as needed. Progress tracks pages visited, not completed business actions, and is stored in this browser separately for each user and active membership. The guide does not submit forms, publish content, change permissions or switch personas. Switch personas through the login flow when moving between the client, moderator and product-owner chapters below. Public pages have no tour.

## Persona cue card

| Persona | Workspace / role | What to demonstrate |
| --- | --- | --- |
| Signed out | Public | Discovery, catalogue, solutions, forms, public search and media |
| Raj Menon | Harbourline client member | Entitled sandboxes, private observations, consent, withdrawal |
| Sara Al-Amin | Saffron client member | Cross-client reviewed copy, feedback, reports, client-visible updates |
| Lina Hartono | Tidewater client admin | Third organisation's evidence and optional programme consent |
| Hana Iqbal | Harbourline client admin | Invitations, members, approved client roles, FL participation |
| Ava Raman | Employee | Playground, internal library, broadcasts, innovation and team spaces |
| Mei Tan | Learning moderator | Submitted queue, de-identification, clarification, publication, reports |
| Omar Haddad | Product owner | Evidence-linked ideas, statuses, audience-safe updates |
| Leo Fernandes | Content publisher | Content, banners, audiences, sessions, media |
| Priya Nair | Portal administrator | Organisations, entitlements, grants, audit, outbox and leads |
| Noah Okafor | FL coordinator | Participants, training results, update checks, candidate decisions |
| Maya Lindqvist | Multi-organisation member | Explicit workspace selection and switching |
| Zuri Mwangi | Orchid client, no entitlements | Honest empty states and no cross-tenant sample content |

These are seeded synthetic identities. Ordinary employee access is not moderator, publisher or administrator access.

## Main walkthrough — 25–35 minutes

### 1. Public discovery and visual experience — 2 minutes

**Where:** `/`, then `/products` and `/solutions`.

**Actions:**

1. Slowly scroll the brand film forward, pause, then reverse slightly. Continue to the straight dashboard showcase and guided UI scenes.
2. In Products, select Financial analysis, Documents, Credit, Strategy, Portfolio and RIVA. Run document validation, move the strategy score slider, change the portfolio sector and confirm a sample reporting mapping.
3. In Solutions, choose SME credit and click through the workflow steps. Briefly show the other three team selectors.

**Say:** “The public site explains what each offering does and lets a visitor explore a synthetic interface. These previews are separate from authenticated, entitled workspaces.”

**Covers:** discovery, product communication, solutions, accessible interaction and synthetic demonstrations. Do not spend the entire presentation on the hero.

### 2. Public content and conversion — 1 minute

**Where:** `/learning`, `/trust`, `/insights`, `/media`, `/live`, `/demo`, `/hackathon`, `/search?q=seasonality`, `/about`.

**Actions:** Open one real insight/media item, show the event schedule, then submit one prepared demo enquiry and/or hackathon interest form using a synthetic profile and a mailbox you control. Show that a protected portal route redirects a signed-out visitor to login. Keep most public routes as pre-opened bookmarks rather than reading every page.

**Say:** “Discovery leads into an enquiry or registration. Public search exposes public content, while portal learning and private resources require the correct identity.”

**Covers:** public catalogue/content/media, enquiries, event registration, explicit public audience. Later show the enquiry in Admin → Leads to close this loop.

### 3. Client workspace and product entitlements — 2 minutes

**Persona:** Raj Menon. **Where:** `/portal`, `/portal/playground`, `/portal/live`, `/portal/library`.

**Actions:**

1. Point out Harbourline as the active organisation, entitled offerings, contribution status and relevant sessions.
2. Open an entitled sandbox, select a prepared synthetic scenario, inspect inputs, run it, inspect its evidence, and submit structured feedback.
3. Briefly show client-specific resources and a relevant session.
4. Open `/portal/playground/riva` directly while Harbourline has its original seeded entitlements. It should be unavailable. Also try the employee-only `/portal/playground/collections-copilot`.

**Say:** “The checks apply on the server, even if a user knows the URL. The sandbox output is an illustration, not an approved lending decision.”

**Covers:** tenant context, entitlement checks, isolated sandbox work, evidence, feedback, resources and audience-specific sessions. Confirm entitlements during rehearsal if they were changed previously.

### 4. Capture a private observation — 2 minutes

**Persona:** Raj. **Where:** Observations → New, `/portal/observations/new`.

Fill the prepared sample below. Choose **Only me**, then **Save private draft**. Point out the message **Private draft saved. Nothing has been shared.**, the version, and **Who can see this**.

For the sensitive-content check, temporarily type `demo.person@example.com` in the body, show the warning, then remove it before submitting the main example. Use a separate submitted synthetic record if you want to demonstrate moderator redaction of flagged content.

**Say:** “Save creates a private source, not a community post. The warning assists review; it is not a guarantee that a contribution is safe.”

**Covers:** structured capture, validation, confidence, evidence, private versus organisation-visible drafts, sensitive-content guidance.

### 5. Explicit consent and submission — 1 minute

**Persona:** Raj. **Where:** the saved observation → **Propose for the learning community**.

Show all four separate choices: store/process, reviewed publication, organisation attribution and future training. Try proposing without publication permission to show validation. Then allow storage and reviewed publication only; leave attribution and training off. Submit and show **Submitted**: nothing is shared yet.

**Say:** “Joining a workspace, publishing a reviewed copy, naming the organisation and joining a training programme are different permissions.”

**Covers:** explicit sharing, consent separation and append-only consent history.

### 6. Human moderation and the separate shared copy — 3 minutes

**Persona:** Mei Tan. **Where:** `/portal/moderation` → the newly submitted observation.

1. Show that the queue contains submitted work, not Raj's unsubmitted private drafts. Claim the item if the UI offers that action.
2. Compare the private source with the proposed shared title/summary. Show sensitive flags on the prepared second example and generalise any identifying geography, dates or unusual details.
3. On the second example, choose **Request clarification** with a contributor-facing message and a separate internal note. Switch to the author briefly to show the public reason, amend and resubmit. Do this branch in the extended demo if time is short.
4. On the main example, review consent, set region and broad period, choose evidence quality, and **Publish reviewed copy**. Keep attribution off.
5. Switch to Sara and open Shared learning. Show the approved copy, not the private source. Do not expect Sara to access Raj's private observation URL.

**Say:** “The original is preserved in its private context. The community receives a separate, reviewed representation without private source metadata or moderator notes.”

**Covers:** review, redaction, clarification, consent checks, publication, audience separation, history and notifications.

### 7. Searchable learning and safe themes — 2 minutes

**Persona:** Sara or Raj. **Where:** `/portal/learning`, `/portal/learning/themes`.

Search the unique demo title or `seasonality`; apply offering, industry, region, period and topic filters. Bookmark a contribution, save the filtered search, export CSV, and open a contribution to show comments, Useful / Needs evidence feedback and reporting.

Open **Seasonality context** and its supporting approved evidence. Explain the actual distinct-organisation count and the sample limitation. Contrast with a small theme where counts are suppressed; use the RIVA example if it remains below the threshold.

**Say:** “Repeated posts from one organisation do not become independent cross-client evidence. Small cohorts are suppressed, and popularity is not market prevalence.”

**Covers:** feed, filters, saved searches, bookmarks, comments, evidence quality, export visibility, aggregation and suppression.

### 8. Product improvement and the client feedback loop — 2 minutes

**Persona:** Omar Haddad, then Sara. **Where:** `/portal/ideas` and an idea detail page.

Open **Seasonality-aware comparison explanation**, or create a new demonstration idea with linked approved contributions. Show the problem, offering, proposed outcome, owner/team, priority, evidence, current status and update history. Move it to **Under review** or another genuinely appropriate demo status and add the client-safe message below. Do not mark it Released just to make the demo look complete.

Switch to Sara: show the permitted idea, visible status, client message and notification; confirm internal notes and priority discussions are absent.

**Say:** “The observation produces a traceable improvement proposal and a visible response. It does not automatically change a model or promise a delivery date.”

**Covers:** evidence-linked ideas, ownership, audited status changes, audience-safe communication and contributor acknowledgement.

### 9. AIRA with permission-aware evidence — 1 minute

**Persona:** Sara, then Ava if time permits. **Where:** `/portal/aira`.

Ask: “What do the approved observations say about seasonal SME cash flow? Cite the evidence and explain the limitations.” Open a citation. Ask a client about employee-only prompt patterns to illustrate that inaccessible sources are excluded. As Ava, compare against permitted internal knowledge where supporting content exists.

**Say:** “AIRA retrieves and summarises material this viewer can already open. This is not model retraining.”

Use the actual answer, including an unsupported-answer refusal. Without Groq credentials, explain the labelled deterministic/extractive fallback. Anonymous AIRA access is an API-level technical check; the current public navigation does not provide a public chat screen.

### 10. Withdrawal and reported content — 2 minutes

**Persona:** Raj, Sara, then Mei where needed. **Where:** the new observation, Shared learning, AIRA, Moderation.

Only after showing the theme/idea loop, have Raj withdraw the newly published demo contribution. Read the actual confirmation and propagation result. Refresh Sara's feed, search, bookmark/export results and ask a new AIRA question. The withdrawn source should no longer be retrieved; remaining seasonality evidence can still support an answer. An already displayed answer is not erased retroactively.

On a separate disposable contribution, have Sara report an issue, then Mei temporarily unpublish it and resolve the report or restore it. Show the contributor/reporter notifications without exposing another client's identity.

**Say:** “Withdrawal removes future retrieval. It cannot recall a screenshot, an already read answer or an external copy. Reporting is a separate moderation workflow.”

**Covers:** withdrawal propagation, search/index invalidation, future AIRA retrieval, report handling and truthful limits.

### 11. Employee-only innovation — 2 minutes

**Persona:** Ava Raman. **Where:** `/portal`, `/portal/playground`, `/portal/live`, `/portal/library`, `/portal/innovation`.

Show the employee dashboard and internal Playground. Open one internal session/recording and a knowledge item with owner, review date and feedback. Submit a prepared synthetic experiment, create or join a hackathon team, and show internal release notes.

Open `/portal/admin`, `/portal/moderation` and `/portal/publisher` directly as Ava: ordinary employee membership must not grant these specialist roles.

**Say:** “Employees have their own innovation space, but administrative, moderation and publishing permissions remain separate.”

**Covers:** internal experiences, experiments, team spaces, library lifecycle, broadcasts and least privilege.

### 12. Client onboarding, members and support — 2 minutes

**Persona:** Hana Iqbal. **Where:** `/portal/org`, `/portal/support`.

Invite a controlled email as a client member. Show pending status, expiry, allowed client roles and revocation. For the full onboarding demonstration, open the link in a separate browser profile, verify the intended account, accept workspace terms and sharing explanation, and enter Harbourline. Try reopening the consumed link. An arbitrary external email account does not acquire membership automatically.

Demonstrate client-role changes only on a disposable member. Create one synthetic support ticket and show that it stays in the organisation. Point out the separate organisation-level FL opt-in; leave it unchanged until after the training section.

**Covers:** invitation-only onboarding, intended identity, single use, expiry, membership states, role boundaries, support and programme consent. If email is not configured, show the demo invitation link only in demo mode and call it a demo convenience.

### 13. Publishing and operational administration — 3 minutes

**Persona:** Leo, then Priya.

As Leo, open `/portal/publisher`: Content, Live & recordings and Media. Prepare a synthetic draft and show explicit Public, Employees only, One organisation or Entitled clients audiences as appropriate. Show the form rather than publishing junk during judging. If demonstrating actual media upload, use a prepared small supported file under the current 4 MB limit; compare permitted playback with a denied direct `/api/media/<id>` request from the wrong identity.

As Priya, open `/portal/admin`:

| Tab | Show |
| --- | --- |
| Organisations | Organisation status, offering entitlement matrix; registration form |
| People & roles | Employee approvals and separate capability grants |
| Support access | Reasoned, expiring support grants; admin role alone does not unlock client-private content |
| Settings | Minimum distinct-organisation cohort and retention/platform settings |
| Audit log | Newly generated moderation, consent or administrative events; explain append-only enforcement |
| Email outbox | Queued / failed / Accepted by provider, as actually recorded; never call it delivered |
| Leads | The enquiry or hackathon registration created near the beginning |

Use a disposable organisation/member for entitlement or status changes. For support access, compare a specific organisation-visible resource before and after a short, reasoned grant; revoke it afterward. A support grant does not imply unrestricted access to every author-private draft.

**Covers:** publishing separation, media access, operational controls, entitlements, grants, audit, notification discipline and public-to-admin lead capture.

### 14. Optional federated learning — 3 minutes

**Persona:** Noah Okafor. **Where:** `/portal/fl`; optional prepared terminal/recording.

1. State this is a separate opt-in programme, not the observation feed.
2. Show the three isolated synthetic participants, task, feature contract and participant consent.
3. Show locally generated training rounds, aggregation method, accepted updates and evaluation against prevalence, local-only and centralised-reference baselines. Read the run's actual metrics.
4. Show the scripted failures where available: round 2 dropout/cohort abort, round 3 unauthenticated sender rejection, round 4 abnormal update rejection.
5. Show the candidate version. Approve with a rationale, record the deployment decision and roll it back using a disposable demo candidate; this records a governance decision, not deployment of a real lending model into a customer system.
6. At the end, as a client admin, show withdrawal from future participation. Explain that previously aggregated models retain lineage and need an explicit policy; no automatic untraining is promised.

**Say:** “Training records stay in the local participant simulation. The portal receives round/model metadata. Updates can still leak information or be poisoned; local retention alone is not a privacy guarantee.”

Default averaging does not provide secure aggregation. If using the optional masked aggregation or DP flags, label them simulated/illustrative and show their limits and accounting. Do not present them as production-certified privacy controls.

## Prepared text — copy before presenting

### Main observation

- Title: `DEMO-01 — Seasonal cash-flow context`
- Type: Product gap
- Offering: Financial Analysis Intelligence
- Body: `In a synthetic SME review exercise, seasonal retailers show a predictable mid-year revenue dip. Comparing that period with the immediately preceding quarter can make normal seasonality appear to be deterioration. Analysts need a same-season comparison and an explanation linked to the source statements. This is a limited demonstration sample, not a claim about market prevalence.`
- Period: `2026-01-01` to `2026-06-30`
- Evidence: Aggregated internal data (describe it as synthetic in the body)
- Confidence: Medium
- Industry: SME lending
- Region: South Asia
- Visibility: Only me
- Supporting links: blank unless you have a genuine public supporting source

### Reviewed shared summary

`A synthetic SME review exercise suggests that predictable seasonal revenue movements can be misread when compared with an adjacent period. A same-season comparison and source-linked explanation may help analysts interpret the movement. Evidence is limited and requires further validation.`

### Clarification message

`Please state the observation period and explain whether the comparison uses the same seasonal period. Remove customer-level details before resubmitting.`

### Improvement idea

- Title: `Seasonality-aware comparison explanation`
- Problem: `Adjacent-period comparisons can obscure predictable seasonal movement.`
- Proposed outcome: `Show a same-season comparison with a source-linked explanation and clear limitations.`
- Initial status: Under review
- Client update: `We are reviewing a seasonality-aware comparison explanation using approved community evidence. No delivery date is committed. Further validation is required.`

### Employee experiment

- Title: `Same-season comparison explanation`
- Hypothesis: `Source-linked same-season comparisons may reduce misinterpretation in synthetic reviews.`
- Method: `Use synthetic seasonal and non-seasonal examples, compare explanations, and record analyst feedback. No customer records or production decisions.`

## 12-minute judging route

| Time | Persona / screen | Essential proof |
| --- | --- | --- |
| 0:00–1:15 | Public `/` and `/products` | Brand film, straight workspace, one working product control |
| 1:15–2:15 | Raj `/portal` and sandbox | Organisation context, entitled demo, evidence |
| 2:15–3:45 | Raj observation | Private save, warning, four consent choices, submission |
| 3:45–5:15 | Mei moderation | Review and publish a separate de-identified copy |
| 5:15–6:15 | Sara shared learning/themes | Reviewed feed, distinct organisations, limitations, small-cohort suppression |
| 6:15–7:15 | Omar idea, then Sara | Evidence-linked status update and client-safe visibility |
| 7:15–8:00 | Sara AIRA | Permission-aware citations, no retraining |
| 8:00–9:00 | Raj withdrawal | Future feed/search/AIRA retrieval stops |
| 9:00–10:00 | Ava then client direct URL | Employee experience and server-enforced denial |
| 10:00–11:00 | Priya admin | Entitlements, separate roles, audit/outbox |
| 11:00–12:00 | Noah FL or closing | Optional training results and honest scope, or deeper core questions |

In the short route, keep invitation acceptance, publishing, experiment submission, report handling and full FL training as rehearsed backup demonstrations. Do not claim the 12-minute route clicks every feature.

## Complete coverage checklist / assignment crosswalk

| Requirement | Required demonstration or backup |
| --- | --- |
| 01–02 Discovery and scope | Homepage, six products, four solutions, media, insights, about, demo enquiry, event registration; explain synthetic sandboxes |
| 03 IAM-01 / IAM-02 | Client tenant/entitlement denial, employee specialist-role denial, publisher/moderator/admin separation, private-media URL denial |
| 04 Authentication / onboarding | Real managed email login, invitation acceptance, expiry/single-use/wrong-user handling, membership approval, Maya workspace selection |
| 05 Employee portal | Internal Playground and feedback, employee sessions, library/review date, experiments, teams, release notes, assigned ideas |
| 06 Client portal | Dashboard, entitled sandbox, sessions/resources, observations, shared feed, support, members, empty states |
| 07 Capture | Structured fields, periods, evidence/confidence, validation, sensitive-content prompt, private save, optional supporting links |
| 08 Review / withdrawal | Claim, clarify/resubmit, redact, reject, publish, material edit/re-review, report/unpublish/restore, withdrawal and refreshed retrieval |
| 09 Consent / confidentiality | Four permissions, separate source/copy, opt-in attribution, coarsened fields, consent/history, cohort threshold and suppression |
| 10 Improvement loop | Theme evidence, distinct organisations, limitations, new idea, appropriate status, owner/team, history, client-safe update and notification |
| 11 Optional FL | Three isolated datasets, local training, aggregation/evaluation, dropout and invalid updates, opt-in, candidate decisions, rollback and lineage |
| Cross-cutting | Search/count/export/AI use the same visibility; in-app notifications; honest email status; retention and audit; mobile/reduced-motion access |

Additional boundary demonstrations: Maya must explicitly choose among approved workspaces; Zuri must see empty states rather than another tenant's sample data; a moderator cannot open an unsubmitted draft; an admin needs a support grant for eligible organisation-private content; a client admin cannot grant platform roles.

Some guarantees need technical evidence rather than a UI click. Offer `npm test` results for access rules and, after rehearsing against an isolated test database, `npm run test:acceptance` for database and API checks. Opening a 404 alone does not prove every underlying security property. Do not run the live acceptance suite on the presentation database without checking its writes and setup requirements.

## What to say when asked about limits

- Product screens are approved synthetic sandboxes, not the actual Azentio credit/reporting/document products.
- Authentication uses managed email code/magic links with approved membership; Microsoft Entra SSO is the preferred production integration, not a completed integration here.
- Observation attachments are omitted in this release; supporting links are available. Media uploads are a separate publisher feature.
- Email queued or provider-accepted is not confirmed mailbox delivery. AIRA may use a clearly labelled deterministic fallback without an inference key.
- Collective learning, retrieval/summarisation and federated model training are three distinct mechanisms.
- The production withdrawal SLA is documented as at most five minutes across future caches/replicas; show the actual current judging-environment removal time, not an invented number.
- No automatic retraining, delivery commitment, automatic untraining or regulatory certification is claimed.

## Close

> “We have shown the full loop: discover an offering, explore it within the right workspace, contribute privately, choose sharing explicitly, review the shared representation, learn from permitted evidence and track a product response. Permissions and withdrawal apply across the experience, not just to the menu.”

After rehearsal: leave the main record in its intended starting state, replenish disposable examples, restore any changed entitlements or temporary grants, and keep training-participant withdrawal until the very end. Use fresh records for another run rather than trying to undo terminal withdrawal states.
