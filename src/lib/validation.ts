import { z } from "zod";
import { OBS_CATEGORIES, EVIDENCE_TYPES, CONFIDENCE, IDEA_STATUS } from "./constants";

// The same schemas run in the browser (instant feedback) and on the server (the real check).

const keys = <T extends Record<string, unknown>>(o: T) => Object.keys(o) as [keyof T & string, ...(keyof T & string)[]];
const trimmed = (min: number, max: number, label: string) =>
  z.string().trim().min(min, `${label} needs at least ${min} characters`).max(max, `${label} must be ${max} characters or fewer`);

export const observationSchema = z.object({
  title: trimmed(8, 140, "Title"),
  category: z.enum(keys(OBS_CATEGORIES)),
  body: trimmed(40, 4000, "Description"),
  offering_id: z.uuid().nullable().optional(),
  industry: z.string().trim().max(80).optional().nullable(),
  region: z.string().trim().max(80).optional().nullable(),
  period_start: z.iso.date("Choose when the observation period starts"),
  period_end: z.iso.date("Choose when the observation period ends"),
  evidence_type: z.enum(keys(EVIDENCE_TYPES)),
  confidence: z.enum(keys(CONFIDENCE)),
  visibility: z.enum(["private", "org"]),
  links: z.array(z.url("Links must be full URLs").max(500)).max(5).default([]),
}).refine((v) => v.period_end >= v.period_start, { path: ["period_end"], message: "The period must end on or after it starts" });
export type ObservationInput = z.infer<typeof observationSchema>;

export const consentSchema = z.object({
  store_process: z.literal(true, "Storing and processing is required to keep a contribution"),
  publish_shared: z.boolean(),
  attribution: z.boolean(),
  training: z.boolean(),
});

export const demoRequestSchema = z.object({
  name: trimmed(2, 120, "Name"),
  email: z.email("Enter a valid work email"),
  company: trimmed(2, 160, "Company"),
  job_title: z.string().trim().max(120).optional(),
  offering_slug: z.string().max(80).optional(),
  message: z.string().trim().max(2000).optional(),
  consent_contact: z.literal(true, "We need your permission to contact you about this request"),
});

export const eventRegistrationSchema = z.object({
  name: trimmed(2, 120, "Name"),
  email: z.email("Enter a valid email"),
  organisation: z.string().trim().max(160).optional(),
  team_name: z.string().trim().max(80).optional(),
  idea: z.string().trim().max(2000).optional(),
  consent_contact: z.literal(true, "Please confirm we can contact you about the event"),
});

export const ideaSchema = z.object({
  title: trimmed(6, 160, "Title"),
  problem_statement: trimmed(20, 2000, "Problem statement"),
  offering_id: z.uuid().nullable().optional(),
  proposed_outcome: trimmed(10, 2000, "Proposed outcome"),
  team: z.string().trim().max(80).optional(),
  priority: z.enum(["low", "medium", "high", "critical"]),
  theme_id: z.uuid().nullable().optional(),
  evidence: z.array(z.uuid()).max(30).default([]),
});

export const ideaStatusSchema = z.object({
  status: z.enum(keys(IDEA_STATUS)),
  note: z.string().trim().max(1000).optional(),
  shared_update: z.string().trim().max(1000).optional(),
  client_visible: z.boolean(),
});

export const sharedCopySchema = z.object({
  title: trimmed(8, 140, "Shared title"),
  summary: trimmed(40, 1500, "Shared summary"),
  region: z.string().trim().max(80).optional().nullable(),
  period_label: trimmed(2, 40, "Period"),
  attribution: z.boolean(),
  evidence_quality: z.enum(["limited", "moderate", "strong"]),
  reason_public: z.string().trim().max(600).optional(),
  internal_note: z.string().trim().max(1000).optional(),
});

export const commentSchema = z.object({ body: trimmed(2, 2000, "Comment") });
export const reportSchema = z.object({
  reason: z.enum(["misleading", "confidential", "inappropriate", "duplicate", "other"]),
  details: z.string().trim().max(2000).optional(),
});

export const inviteSchema = z.object({
  email: z.email("Enter a valid email"),
  role: z.enum(["client_member", "client_admin"]),
});

export function fieldErrors(err: z.ZodError) {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const k = issue.path.join(".") || "_";
    out[k] ??= issue.message;
  }
  return out;
}
