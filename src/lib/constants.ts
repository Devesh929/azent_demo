// Shared labels used by both server and client components.

export const OBS_CATEGORIES = {
  market_observation: "Market observation",
  emerging_trend: "Emerging trend",
  product_gap: "Product gap",
  operational_challenge: "Operational challenge",
  successful_practice: "Successful practice",
  improvement_suggestion: "Improvement suggestion",
} as const;
export type ObsCategory = keyof typeof OBS_CATEGORIES;

export const OBS_STATUS = {
  draft: { label: "Draft", tone: "neutral", help: "Only you (or your organisation, if you chose that) can see this." },
  submitted: { label: "Submitted", tone: "info", help: "Waiting for a learning moderator. Nothing is shared yet." },
  in_review: { label: "In review", tone: "info", help: "A moderator is preparing a de-identified shared copy." },
  returned: { label: "Clarification requested", tone: "warn", help: "A moderator asked for changes. Amend and resubmit." },
  published: { label: "Shared", tone: "good", help: "A reviewed, de-identified copy is visible to the learning community." },
  rejected: { label: "Not published", tone: "bad", help: "The moderator did not publish this. Your private record is unchanged." },
  withdrawn: { label: "Withdrawn", tone: "neutral", help: "The shared copy is removed from search, feeds and AIRA." },
  unpublished: { label: "Temporarily unpublished", tone: "warn", help: "Hidden while a report is investigated." },
} as const;
export type ObsStatus = keyof typeof OBS_STATUS;

export const EVIDENCE_TYPES = {
  anecdotal: "Anecdotal",
  client_interactions: "Client interactions",
  aggregated_internal_data: "Aggregated internal data",
  market_report: "Market report",
  regulatory_update: "Regulatory update",
  other: "Other",
} as const;

export const CONFIDENCE = { low: "Low", medium: "Medium", high: "High" } as const;

export const IDEA_STATUS = {
  proposed: { label: "Proposed", tone: "neutral" },
  under_review: { label: "Under review", tone: "info" },
  planned: { label: "Planned", tone: "info" },
  in_progress: { label: "In progress", tone: "warn" },
  released: { label: "Released", tone: "good" },
  not_proceeding: { label: "Not proceeding", tone: "bad" },
} as const;
export type IdeaStatus = keyof typeof IDEA_STATUS;

export const AUDIENCE_LABEL = {
  public: "Public",
  community: "Learning community",
  employees: "Employees only",
  all_clients: "All clients",
  entitled_clients: "Entitled clients",
  org: "One organisation",
} as const;

export const SHARING_CHOICES = {
  private: { label: "Only me", help: "A private draft. Nobody else can see it." },
  org: { label: "My organisation", help: "Members of your organisation can see it. It is never shared outside your organisation by default." },
  community: { label: "Propose for the learning community", help: "A moderator reviews it and publishes a de-identified copy only if you consent." },
} as const;
