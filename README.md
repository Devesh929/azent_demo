# azentio.ai — website & intelligent collaboration portal

Hackathon build of **azentio.ai**: an immersive public website, plus a secure multi-tenant portal for
employees and clients that turns client market observations into **governed collective learning** and
product improvement. It also includes an opt-in **federated learning** research track.

Everything in this repository uses **synthetic data**.

| | |
|---|---|
| Stack | Next.js 16 (App Router, Turbopack) · React 19 · Tailwind 4 · Motion · React Three Fiber · Supabase (Postgres, Auth, Storage) · Groq (AIRA) · Resend (email) · Python/numpy (FL) |
| Docs | [Solution & traceability](docs/SOLUTION.md) · [Acceptance tests](docs/ACCEPTANCE-TESTS.md) · [Demo script](docs/DEMO-SCRIPT.md) · [Federated learning](docs/federated-learning.md) |

## 1. Set up Supabase (hosted)

1. Create a project at [supabase.com](https://supabase.com) and save the database password.
2. Copy `.env.example` to `.env.local` (already done if you ran the scaffold) and fill in:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`: **Project Settings → API**
   - `SUPABASE_DB_URL`: **Connect → Session pooler** connection string, with your password filled in
3. **Authentication → URL configuration**: set Site URL to `http://localhost:3000` (later your Vercel URL) and add
   `http://localhost:3000/auth/callback` (and the Vercel equivalent) to the redirect URLs.
4. **Authentication → Emails → SMTP**: to send sign-in codes through Resend, enable custom SMTP with host
   `smtp.resend.com`, port `465`, user `resend` and your Resend API key as the password. Without this,
   Supabase's built-in mailer is limited to a few emails per hour.
5. **Authentication → Email templates → Magic link**: include `{{ .Token }}` so emails carry the 6-digit code
   as well as the link.

```bash
npm install
npm run db:setup      # applies supabase/migrations and seeds synthetic organisations, personas and content
npm run dev           # http://localhost:3000
```

## 2. Optional keys

| Variable | Effect when missing |
|---|---|
| `GROQ_API_KEY` | AIRA and the Playground return deterministic, extractive answers, labelled as such |
| `RESEND_API_KEY` | Emails stay **queued** in the outbox and are never shown as delivered |

## 3. Demo personas (judging only)

With `DEMO_MODE=true`, `/login` shows a labelled persona switcher that signs in seeded synthetic accounts with
`DEMO_PASSWORD` (generated into `.env.local`). Real sign-in by email code or magic link always works alongside it.
**Turn `DEMO_MODE` off in production.**

| Persona | Role | Workspace |
|---|---|---|
| Ava Raman | Employee | Azentio |
| Omar Haddad | Product owner | Azentio |
| Mei Tan | Learning moderator | Azentio |
| Leo Fernandes | Content publisher | Azentio |
| Priya Nair | Portal administrator | Azentio |
| Noah Okafor | FL coordinator | Azentio |
| Hana Iqbal / Raj Menon | Client admin / member | Harbourline Bank (Demo) |
| Sara Al-Amin / Tomás Reyes | Client admin / member | Saffron Capital (Demo) |
| Lina Hartono / Ken Wijaya | Client admin / member | Tidewater Credit (Demo) |
| Zuri Mwangi | Client member, no entitlements (empty states) | Orchid Microfinance (Demo) |
| Maya Lindqvist | Member of two organisations (workspace switcher) | Harbourline + Saffron |

## 4. Tests

```bash
npm test                  # unit tests for the access rules, de-identification and scanning
npm run test:acceptance   # live checks against Supabase (and the running site): RLS, append-only logs,
                          # illegal transitions, withdrawal propagation, cohort suppression, media/AIRA leakage
npm run fl:demo           # federated learning demo (Python 3 + numpy), reports rounds into the portal
npm run test:tour         # dashboard guide checks; start production preview on localhost:3001 first
npm run test:ui           # browser checks and screenshots; start the app first; defaults to localhost:3001, or set UI_CHECK_URL
```

The interface uses Azentio's teal/mint palette and Poppins, a Lenis/GSAP landing experience,
interactive synthetic analysis/document/KYC/credit previews, and a frosted-glass portal with
light/dark appearance. See [UI direction](docs/UI-DIRECTION.md). Every dashboard includes a role-aware Workspace guide with linked breadcrumbs, contextual steps and per-user/workspace visit progress; use the Guide button in the top bar. Browser captures and the latest
interaction-check results are written to `.taste-skill/light-site/qa/`. Use `localhost:3000` for development;
Next.js restricts development assets requested through alternate hosts.

## 5. Deploy (Vercel + Supabase cloud)

See [the complete Vercel deployment guide](docs/DEPLOYMENT.md) for environment variables, authentication redirects and the optional Python workflow.

1. Push to GitHub and import into Vercel. Add every variable from `.env.local` (set `NEXT_PUBLIC_SITE_URL` to the Vercel URL).
2. Add the Vercel URL and `/auth/callback` to Supabase's allowed redirect URLs.
3. `vercel.json` schedules a daily outbox sweep; emails are also sent right after they are queued.
4. Run the FL demo from any machine with `NEXT_PUBLIC_SITE_URL` pointing at the deployment to ingest a round.

## Project map

```
src/app/(site)          public website (home, products, solutions, learning, insights, media, live, about, trust, demo, hackathon, search)
src/app/login, auth     email code / magic link sign-in, demo personas
src/app/invite/[token]  single-use, expiring client invitations
src/app/portal          employee & client portals, moderation, ideas, publishing, administration, FL, AIRA
src/app/api             media (audience-checked), AIRA, FL ingest, outbox cron
src/lib/authz           viewer resolution, pure access rules, guards, navigation
src/lib/data            audience-filtered queries (search, learning, portal)
supabase/migrations     schema, triggers, deny-by-default security
scripts                 migrate, seed, acceptance
fl/                     federated learning participants and coordinator
docs/                   solution, acceptance tests, demo script, FL design
```
