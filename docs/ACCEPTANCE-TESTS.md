# Acceptance tests

Automated coverage is marked:

- **[unit]**: `npm test`
- **[live]**: `npm run test:acceptance`, run against hosted Supabase and the running site
- **[manual]**: steps to follow by hand

Personas are listed in the README. "404" means the server responds as if the resource does not exist, so its existence is not disclosed.

## A. Access control

| # | Scenario | Steps | Expected | Coverage |
|---|---|---|---|---|
| A1 | Anon key cannot reach data | Query any table with the public anon key | Empty or error; inserts rejected | [live] |
| A2 | Public visitor | Open `/portal/learning` signed out | Redirect to `/login` | [live] |
| A3 | Private media by URL | Request an org or employee media id signed out | 404; public media 200 | [live] |
| A4 | Cross-tenant media | As Sara (Saffron), open the Harbourline briefing media URL | 404, `media.denied` audited | [manual] |
| A5 | Employee-only tools by URL | As Raj, open `/portal/playground/collections-copilot` | 404 | [manual] |
| A6 | Non-entitled sandbox | As Raj, open `/portal/playground/riva` (Harbourline is not entitled) | 404 | [manual] |
| A7 | Employee ≠ admin | As Ava, open `/portal/admin`, `/portal/moderation`, `/portal/publisher` | 404 each | [unit] [manual] |
| A8 | Domain alone is not employee | Account on `@azentio.com` without approved membership | "Request employee access"; no employee content | [unit] |
| A9 | Admin needs a support grant | As Priya, rule check on a Tidewater `org` resource without and with a grant | Denied, then allowed (expiring) | [unit] [manual] |
| A10 | Client admin cannot escalate | As Hana, inspect invite roles; try a platform role grant in SQL | Only client roles offered; DB trigger rejects | [live] |
| A11 | Multi-membership | Sign in as Maya | Must choose a workspace; sees only the chosen org's data | [manual] |
| A12 | Empty states | Sign in as Zuri (Orchid, no entitlements) | Clear empty states; no other tenant's data shown | [manual] |
| A13 | Missing audience ≠ public | Rule test with undefined audience / `org` without org | Denied | [unit] |

## B. Onboarding

| # | Scenario | Expected | Coverage |
|---|---|---|---|
| B1 | Hana invites a new email as Member | Outbox row queued; demo shows link once; invitation `pending`, 7-day expiry | [manual] |
| B2 | Invite opened by a different signed-in account | Refused with explanation | [manual] |
| B3 | Accept with the right verified email | Terms and sharing explanation shown; acceptance creates membership and client role, then lands on the client dashboard | [manual] |
| B4 | Reuse the same link | "This invitation is not valid" | [manual] |

## C. Collective learning lifecycle

| # | Scenario | Expected | Coverage |
|---|---|---|---|
| C1 | Raj saves a new observation | Private draft; "Nothing has been shared" | [manual] |
| C2 | Draft visibility | Other Harbourline members cannot see a private draft; can see an org-visible one; Saffron never can | [unit] |
| C3 | Moderator vs drafts | Mei's queue excludes drafts; a draft's moderation URL is 404 | [unit] [manual] |
| C4 | Submit without publication consent | Error on the consent field; status unchanged | [manual] |
| C5 | Sensitive content | Lina's submitted item shows flagged account number and email; proposed copy pre-redacted | [unit] [manual] |
| C6 | Clarification | Mei requests clarification; Hana sees the public reason, never the internal note | [manual] |
| C7 | Publish | Shared copy has no org, author, links or notes; attribution only if opted in **and** approved | [live] [manual] |
| C8 | Illegal transition | `draft → published` directly | DB rejects | [live] |
| C9 | Material edit after publish | New version goes back to review; shared copy unchanged until re-approved | [manual] |
| C10 | Report | Sara reports a contribution without naming anyone; Mei unpublishes, then resolves; reporter notified | [manual] |
| C11 | Withdrawal | Raj withdraws; success message shows ms and 0 index rows; item gone from feed, search, export and AIRA | [live] [manual] |
| C12 | Append-only | Update or delete consent, audit, moderation rows | DB rejects | [live] |

## D. Insights & improvement

| # | Scenario | Expected | Coverage |
|---|---|---|---|
| D1 | Seasonality theme | 3 distinct organisations shown; limitations visible | [live] [manual] |
| D2 | Single-org theme | Counts suppressed | [live] [manual] |
| D3 | Omar updates idea status with a client message | History row appended; contributors notified; clients see the message and status only | [manual] |
| D4 | Client view of ideas | Only client-visible ideas, without internal notes or priority | [manual] |
| D5 | Export | CSV columns match the feed; no tenant fields | [manual] |

## E. AIRA, notifications, live

| # | Scenario | Expected | Coverage |
|---|---|---|---|
| E1 | Anonymous AIRA | Never cites `/portal` sources | [live] |
| E2 | Client AIRA on "prompt patterns" | No employee knowledge cited | [manual] |
| E3 | Employee AIRA | May cite employee knowledge, with numbered citations | [manual] |
| E4 | Email honesty | Without `RESEND_API_KEY`, outbox shows `queued`; never "delivered" | [manual] |
| E5 | Live audience | Employee session hidden from clients; Tidewater clinic visible only to Tidewater | [manual] |

## F. Federated learning

| # | Scenario | Expected | Coverage |
|---|---|---|---|
| F1 | `npm run fl:demo` | 8 rounds; dropout round aborted (cohort); intruder rejected (signature); compromised update rejected (norm); candidate registered | [manual] |
| F2 | Ingest without token | 401 | [live] |
| F3 | Payload with extra fields | 422 (strict schema) | [manual] |
| F4 | Model decision | Candidate → approved → deployed → rolled back, each needing a rationale and audited | [manual] |
| F5 | Client admin withdraws FL consent | Next ingested updates from that org recorded as rejected | [manual] |
