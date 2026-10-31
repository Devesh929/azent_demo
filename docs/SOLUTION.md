# azentio.ai — solution document

This document explains how the build meets the hackathon requirements, where each requirement lives in the
code, and what is deliberately simulated or out of scope.

## 1. Architecture

```
Browser ──► Next.js on Vercel ──────────────────────────────► Supabase (hosted)
             │ proxy.ts: refresh session, optimistic redirect     ├─ Auth: email code / magic link
             │ Server Components & Server Actions                 ├─ Postgres: RLS on, NO client policies,
             │   └─ src/lib/authz: viewer → rules → guards         │   privileges revoked from anon/authenticated
             │ Route handlers: /api/media, /api/aira,             ├─ Storage: private "media" bucket, no policies
             │   /api/fl/ingest, /api/cron/outbox                 └─ Triggers: lifecycle, append-only, search sync
             ├──► Groq (AIRA): only audience-filtered passages
             └──► Resend (email): from a persisted, idempotent outbox
Python FL participants (separate processes) ──► coordinator ──► /api/fl/ingest (metadata only)
```

**Security model in one sentence:** the browser can authenticate but never reads data directly. Every read and
write goes through server code, which resolves the viewer from a verified session and applies the access rule
before using the privileged client.

- **Defence in depth.** All tables have RLS enabled with no policies, and table privileges are revoked from `anon` and
  `authenticated`. Even with the public anon key, PostgREST returns nothing. The storage bucket is private with no
  policies, so media is reachable only through `/api/media/[id]`.
- **One rule, applied twice.** `audienceAllows()` checks a loaded row in code. `audienceFilter()` produces the
  identical predicate inside the SQL query, so lists, counts, search, suggestions, exports and AIRA retrieval
  never fetch a row the viewer could not open.

## 2. Identity & permissions (IAM-01, IAM-02)

| Requirement | Implementation |
|---|---|
| Server-side RBAC + tenant membership + audience + entitlement | `src/lib/authz/viewer.ts` derives authority only from `memberships` and `role_grants` rows; `rules.ts` applies audience and entitlement; each page and action calls a guard (`requireEmployee`, `requireClient`, `requirePlatformRole`) |
| Never from menu, localStorage, email suffix alone or user-supplied tenant ID | Nav is computed server-side and is cosmetic (`nav.ts`). The workspace cookie only *selects among verified memberships*. `org_id` on writes always comes from the session. Employee = verified `@azentio.com` **and** an approved internal membership with the `employee` role |
| Multiple memberships, explicit active workspace | `/portal/workspace`; auto-selected only when a user has exactly one usable membership |
| Least privilege, separate grants | `employee`, `product_owner`, `learning_moderator`, `content_publisher`, `portal_admin`, `fl_coordinator`, `client_member`, `client_admin` are separate grants. A DB trigger refuses platform roles on client organisations |
| Admin access to private client content needs explicit authorisation | Time-boxed `support_grants` (≤ 24 h, reason required, audited). Without one, `org` audiences and private observations stay closed to admins |
| Deny unless permission and audience agree; public must be explicit | `audience` is a non-null enum on every resource; `default` branches deny. Check constraints enforce `org` → `org_id` and `entitled_clients` → `offering_id`. Internal content kinds are constrained to `employees` |

## 3. Authentication & onboarding

- Email code **and** magic link through Supabase Auth (`/login`, `/auth/callback`). Creating an identity grants nothing.
- Employees: verified company domain plus administrator approval (`requestEmployeeAccess` → `approveMembership`).
- Clients: invitation only. Tokens are random, stored only as SHA-256 hashes, single-use (claimed with a conditional update), expire after 7 days, and can be accepted only by the verified account they were addressed to (`/invite/[token]`).
- First-time journey: invitation → verify → workspace terms and sharing explanation ("joining is not consent to share or train") → client dashboard with only entitled features, the active organisation shown, and a switcher for multi-membership users.

## 4. Employee portal (§05)

Dashboard quick links, Playground (guided synthetic scenarios, inputs, deterministic or AI-assisted runs, evidence, structured feedback, labelled "not a decision"), internal Live sessions and recordings (employee audience, publisher-managed), experiments, hackathon team spaces, internal release notes, and a knowledge library with owners, review dates and feedback. Employee-only content is constrained to the `employees` audience, which `audienceFilter` excludes for anonymous visitors and clients, including in AIRA.

## 5. Client portal (§06)

Dashboard (active org, entitled offerings, sessions, contribution status, ideas, empty states with no cross-tenant sample data); entitled sandboxes (employee-only engines and non-entitled offerings return 404 even by URL; runs are isolated by tenant and user); *My observations* and *Our organisation's observations*; shared feed with filters (offering, industry, region, period, topic), saved searches, bookmarks, CSV export (same visibility); improvement ideas with plain-language status; comments and reports inheriting the parent's audience; support tickets private to the org; client admin for invitations, roles (client roles only) and FL programme consent.

## 6. Collective learning (§07–§10)

### Lifecycle (enforced by a database trigger)

```
draft ──submit──► submitted ──claim──► in_review ──publish──► published ──report──► unpublished
  ▲                  │  ▲                 │   │                   │  │                  │
  │                  │  └──resubmit── returned ◄─clarify          │  └─edit (new version)─► submitted
  └──── rejected ◄───┴────────────────────────┘                   └─────withdraw──► withdrawn (terminal)
```

- **Private source vs shared copy.** `observations` holds the private original. `shared_contributions` holds only reviewed fields: no `org_id`, author, links, flags, attachments or reviewer notes. The link lives in `shared_sources`, which is never selected into shared payloads.
- **Saving never shares.** Drafts are private or org-visible. Proposing to the community is a separate step that requires explicit publication consent.
- **Validation** on client and server with the same Zod schemas, plus length and check constraints in SQL. Attachments are omitted in P0 (links only); media uploads use type and size limits and private storage.
- **Sensitive content** is scanned for account and card numbers, emails, phones, IDs, credentials and confidential terms. Flags are shown to authors and moderators and pre-redacted in the proposed copy. A scan is labelled as a prompt, not a guarantee.
- **Moderation**: claim, redact (pre-filled with coarsened region and half-year period), request clarification, reject, publish, unpublish on report, restore. `reason_public` is shown to contributors and `internal_note` never is. A duplicate check uses full-text overlap.
- **Material edits** to a published item create a new version and return it to review; the approved shared copy is unchanged until re-approved. Audiences are never silently widened. Narrowing consent (attribution, publication) takes effect immediately.
- **Reports** never require naming another client. Reporters learn the outcome, not the contributor.
- **Withdrawal** sets the shared copy to `withdrawn`. A trigger deletes its `search_documents` row **in the same transaction**, so search, feeds, exports and AIRA stop returning it immediately. The UI reports the measured propagation time. Production SLA: **≤ 5 minutes** across any added caches and replicas. Already-viewed material and third-party copies cannot be recalled; the UI says so.
- **Notifications**: in-app rows are the system of record (P0). Email goes through a persisted outbox with unique idempotency keys, is sent with the provider's idempotency key, and is marked `sent` only after the provider accepts it. The UI says "Accepted by provider", never "delivered".

### Consent (§09)

Four separately recorded permissions per contribution, kept as **append-only** history: (a) store and process, (b) publish a reviewed shared copy, (c) organisation attribution (also needs moderator approval), (d) future training or federated programme. Workspace membership, publishing consent and FL programme consent (`fl_participants`) are distinct. The contributor sees "Who can see this" for every version.

### Aggregation safeguards

- Theme statistics count **distinct organisations** via `theme_org_count`, so repeated posts from one organisation count once.
- Counts are suppressed below a configurable minimum (judging: 3; never lower than `MIN_COHORT_ORGS`).
- No per-region or per-period breakdowns are published for small themes, and no leaderboards.
- Every theme carries a stated limitation, and popularity is never presented as prevalence.

### Insights & improvement loop (§10)

Searchable approved feed, theme dashboard (offerings, evidence links, period, distinct organisations where safe, limitations, last update), improvement ideas (title, problem, offering, evidence references, outcome, owner/team, priority, status, last update) with audited, append-only status history. Clients see only ideas explicitly marked client-visible, and only the shared update text. Contributors of linked evidence are notified with that text. Quality feedback ("Useful" / "Needs evidence") and reviewer-assessed evidence quality are shown without leaderboards.

## 7. AIRA

Retrieval uses the same audience-filtered `search_documents` query as site search. Only those passages, which are already de-identified for shared items, are sent to Groq, with instructions to cite `[S#]`, refuse when unsupported, and avoid claims of prevalence or contributor identity. Without a key it returns an extractive answer, labelled. Audit logs record the cited URLs, not the question text. AIRA never retrains anything.

## 8. Threat model (portal)

| Threat | Control |
|---|---|
| Direct API / PostgREST access with the anon key | RLS on, no policies, privileges revoked |
| Guessing URLs to private media or employee tools | `/api/media` audience check with the same 404 for "missing" and "forbidden"; Playground engines check entitlement and `internal` |
| Tenant hopping by editing an org id | Server derives `org_id` from the verified active membership; workspace cookie validated on every request |
| Privilege escalation by client admin | Role enum limited to client roles; DB trigger blocks platform roles on client orgs |
| Admin over-reach | Support grants: explicit, reasoned, time-boxed, audited |
| Re-identification from shared learning | De-identified copy, coarsening, moderator review, cohort suppression, no breakdowns |
| Prompt injection via contributions | AIRA instructed to use sources only; sources are moderated shared copies; answers are cited and checkable |
| Spam on public forms | Honeypot, validation, unique registration per email; rate limits recommended for production |
| Log tampering | Append-only triggers on audit, consent, moderation and idea-history tables |

## 9. What is simulated or out of scope

- Products are represented by deterministic sandbox engines on synthetic data, not real credit or reporting systems.
- Microsoft Entra ID is the preferred production identity provider; the hackathon uses Supabase email code and magic link with administrator-approved employee provisioning.
- FL secure aggregation is a simulation (pairwise additive masks without dropout recovery); DP noise is illustrative with declared accounting. See `federated-learning.md`.
- In-memory AIRA rate limiting and 4 MB uploads are hackathon limits. Production would use a shared limiter and signed direct uploads.

## 10. Retention (documented policy, stored in `platform_settings`)

Consent history and moderation decisions: 7 years. Audit log: 7 years. Withdrawn private sources: purged after 90 days. Approved versions are retained for audit but never re-shared after withdrawal.
