# Deploy azentio.ai to Vercel

## Runtime

The public website, animated landing page, client/employee portals and API routes are one Next.js application. Deploy the repository root as **Next.js** using **Node.js 24.x** (also declared in package.json).

Supabase provides hosted Postgres, Auth and Storage. Groq provides optional AIRA inference; Resend provides optional outbound email. These services are not deployed inside Vercel.

The optional `fl/` training/coordinator demo uses Python 3.10+ and NumPy on your own machine. The web application never launches Python, and `npm run build` does not run it. Its authenticated ingestion endpoint is a normal Next.js API route. Existing FL results remain visible without running training again.

## Import the repository

1. In Vercel, import `Devesh929/azent_demo`, branch `main`.
2. Framework: **Next.js**. Root directory: repository root (`./`).
3. Install command: `npm ci`. Build command: `npm run build`. Keep the framework's default output directory and runtime settings.
4. Add environment variables before deploying. Do not add `npm run db:setup` or `npm run fl:demo` to the build command.

## Credentials and environment variables

The existing credentials are in `.env.local` in your local project root. This file is intentionally gitignored and is not in GitHub. `.env.example` documents variable names without credentials.

Import the values from your local `.env.local` into Vercel's project environment variables for Production. Add Preview values as well if you want preview deployments to use the same synthetic demo services. Keep server credentials under their existing names; never prefix them with `NEXT_PUBLIC_`.

| Variable | Purpose / deployment setting |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Required for the full portal: existing Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Required: existing Supabase anonymous/publishable client key |
| `SUPABASE_SERVICE_ROLE_KEY` | Required: server-only Supabase service-role key |
| `NEXT_PUBLIC_SITE_URL` | Required: the canonical deployed HTTPS URL, no trailing slash; replace localhost |
| `EMPLOYEE_EMAIL_DOMAIN` | Employee email domain; default `azentio.com`; approved membership is still required |
| `GROQ_API_KEY` | Optional: enables live AIRA/Playground model responses |
| `GROQ_MODEL` | Optional: default `openai/gpt-oss-120b` |
| `RESEND_API_KEY` | Optional: enables queued outbound email delivery |
| `EMAIL_FROM` | Resend-approved sender; use a verified sender/domain for real recipients |
| `CRON_SECRET` | Secret protecting the daily email-outbox endpoint configured in vercel.json |
| `DEMO_MODE` | `true` for the synthetic judging persona switcher; `false` for a normal production login |
| `DEMO_PASSWORD` | Existing seeded demo password; required for the persona switcher when demo mode is enabled |
| `FL_INGEST_TOKEN` | Optional: shared secret only needed when reporting new Python FL rounds |
| `MIN_COHORT_ORGS` | `3` by default; minimum distinct organisations for shared trend statistics |
| `SUPABASE_DB_URL` | Local migration/seeding credential; not required in Vercel's application environment |

If a service key is omitted, the application does not gain that service: missing Groq uses labelled deterministic answers; missing Resend leaves mail queued. Supabase credentials and an initialized database are needed for the working authenticated portal.

After changing environment variables, redeploy so build-time public variables are updated.

## Supabase configuration

Reuse the existing initialized Supabase project to keep the current synthetic personas and data. Do not re-seed it as part of every Vercel build.

For a new database only, configure your local `.env.local`, then run locally:

```sh
npm ci
npm run db:setup
```

In Supabase Authentication URL configuration:

- Set Site URL to your canonical deployed URL.
- Add `https://YOUR-DEPLOYMENT.vercel.app/auth/callback` to allowed redirect URLs.
- Add callback URLs for any custom domains or preview deployments you use.

Keep the configured email-code/magic-link templates and SMTP setup. Resend application emails and Supabase Auth emails have separate configuration; a Vercel `RESEND_API_KEY` alone does not configure Supabase's SMTP.

## Optional federated-learning training

On a machine with Python and NumPy, set the local `.env.local` `NEXT_PUBLIC_SITE_URL` to the deployed URL and use the same `FL_INGEST_TOKEN` as Vercel, then run:

```sh
python fl/run_demo.py --ingest
```

No Python hosting is required for the website. See `fl/README.md` and `docs/federated-learning.md` for the training workflow and its limits.

## Verify the deployed application

Open `/`, `/products`, `/solutions`, `/experience` and `/login`. Confirm the scroll reveal loads, product controls respond and a synthetic persona can enter `/portal` when demo mode is enabled. Test an email login after updating Supabase redirects and SMTP. The daily outbox route is already declared in `vercel.json`.

Official references: [Vercel environment variables](https://vercel.com/docs/environment-variables), [supported Node.js versions](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions).
