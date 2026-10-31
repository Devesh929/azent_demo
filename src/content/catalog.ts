// Public product catalogue. Single source for the website and the database seed.
export const OFFERINGS = [
  {
    slug: "credit-strategy-simulator", name: "Credit Strategy Simulator", kicker: "Credit policy intelligence",
    tagline: "Simulate policy changes before they reach production.", category: "Intelligent Decisioning",
    summary: "Model the effect of a credit policy change on approvals, risk exposure and portfolio outcomes before deployment.",
    description: "Credit Strategy Simulator replays historical and synthetic application flows against a proposed policy, so risk teams can see approval-rate, loss and concentration effects side by side with the current policy. Every simulated outcome is labelled as a simulation and traceable to the rules and data that produced it.",
    capabilities: ["Policy versioning and side-by-side comparison", "Approval, loss and concentration projections", "Segment-level sensitivity analysis", "Exportable evidence pack for credit committee"],
    outcomes: ["Fewer surprises after policy rollout", "Faster committee review", "Documented rationale for every change"],
  },
  {
    slug: "sme-credit-decisioning-workbench", name: "SME Credit Decisioning Workbench", kicker: "Explainable credit intelligence",
    tagline: "Analysis, policy and recommendation in one evidence-backed workbench.", category: "Intelligent Decisioning",
    summary: "Bring financial analysis, policy evaluation, risk review and credit recommendations into one workbench with human oversight.",
    description: "The Workbench assembles an SME application's financials, policy checks and risk indicators into a single case view. Recommendations cite the evidence behind them and always route to a credit officer for the decision.",
    capabilities: ["Case assembly from statements and bureau data", "Policy rule evaluation with explanations", "Risk indicator review", "Recommendation with cited evidence and human approval"],
    outcomes: ["Consistent analysis across officers", "Shorter time to decision", "Auditable recommendations"],
  },
  {
    slug: "similar-portfolio-intelligence", name: "Similar Portfolio Intelligence", kicker: "Contextual portfolio insights",
    tagline: "Compare an application with the portfolio segments it most resembles.", category: "Analytics & Insights",
    summary: "Compare financing applications with relevant historical portfolio segments to understand patterns, risk indicators and comparable outcomes.",
    description: "Similar Portfolio Intelligence finds historical cohorts that resemble a new application on sector, size, tenor and behaviour, and shows how those cohorts performed, with the caveats of small or skewed samples made explicit.",
    capabilities: ["Cohort matching on configurable features", "Outcome distributions for comparable segments", "Small-sample warnings", "Drill-down to cohort definitions"],
    outcomes: ["Context for every credit decision", "Earlier sight of emerging segment risk"],
  },
  {
    slug: "riva", name: "RIVA", kicker: "Reporting intelligence, validation & analytics",
    tagline: "Configurable regulatory reporting with validation built in.", category: "Configurable AI Platforms",
    summary: "A configurable reporting environment connecting data sources, mapping report fields, supporting validation and simplifying reporting workflows.",
    description: "RIVA maps source systems to regulatory report templates, validates fields and cross-report consistency before submission, and keeps a versioned record of every mapping and approval.",
    capabilities: ["Source-to-template field mapping", "Validation rules and cross-report checks", "Versioned templates and approvals", "Exception queues for reporting teams"],
    outcomes: ["Fewer resubmissions", "Traceable reporting lineage"],
  },
  {
    slug: "financial-analysis-intelligence", name: "Financial Analysis Intelligence", kicker: "Statement understanding",
    tagline: "Spread, interpret and compare financial statements with context.", category: "Document Intelligence",
    summary: "Extract and spread financial statements, compute ratios and explain movements in the context of the borrower's sector and cycle.",
    description: "Financial Analysis Intelligence reads statements, spreads them into a standard template and explains ratio movements. Explanations reference the source lines and note when context, such as seasonality, may change the interpretation.",
    capabilities: ["Statement extraction and spreading", "Ratio computation and trend analysis", "Narrative explanation with source references", "Peer and period comparison"],
    outcomes: ["Faster, more consistent spreading", "Explanations analysts can verify"],
  },
  {
    slug: "document-intelligence-studio", name: "Document Intelligence Studio", kicker: "Documents to structured data",
    tagline: "Classify, extract and validate across complex documents.", category: "Document Intelligence",
    summary: "Classify documents, extract structured fields, validate across related documents and flag inconsistencies for review.",
    description: "Document Intelligence Studio turns mixed document packs into structured, validated data. Cross-document checks surface inconsistencies, and low-confidence fields route to a reviewer.",
    capabilities: ["Document classification", "Field extraction with confidence", "Cross-document validation", "Reviewer queues"],
    outcomes: ["Less manual keying", "Inconsistencies caught before decisioning"],
  },
];

export type Offering = (typeof OFFERINGS)[number];
export const offeringBySlug = (slug: string) => OFFERINGS.find((o) => o.slug === slug);
