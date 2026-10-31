import "server-only";

function read(name: string, fallback?: string) {
  const v = process.env[name];
  if (v === undefined || v === "") {
    if (fallback !== undefined) return fallback;
    throw new Error(`Missing environment variable ${name}. Copy .env.example to .env.local and fill it in.`);
  }
  return v;
}

export const env = {
  get supabaseUrl() { return read("NEXT_PUBLIC_SUPABASE_URL"); },
  get supabaseAnonKey() { return read("NEXT_PUBLIC_SUPABASE_ANON_KEY"); },
  get serviceRoleKey() { return read("SUPABASE_SERVICE_ROLE_KEY"); },
  get siteUrl() { return read("NEXT_PUBLIC_SITE_URL", "http://localhost:3000"); },
  get employeeDomain() { return read("EMPLOYEE_EMAIL_DOMAIN", "azentio.com").toLowerCase(); },
  get groqKey() { return process.env.GROQ_API_KEY || null; },
  get groqModel() { return read("GROQ_MODEL", "openai/gpt-oss-120b"); },
  get resendKey() { return process.env.RESEND_API_KEY || null; },
  get emailFrom() { return read("EMAIL_FROM", "azentio.ai <onboarding@resend.dev>"); },
  get demoMode() { return process.env.DEMO_MODE === "true"; },
  get demoPassword() { return process.env.DEMO_PASSWORD || null; },
  get cronSecret() { return process.env.CRON_SECRET || null; },
  get flIngestToken() { return process.env.FL_INGEST_TOKEN || null; },
  get minCohortOrgs() { return Math.max(3, Number(process.env.MIN_COHORT_ORGS ?? 3)); },
};
