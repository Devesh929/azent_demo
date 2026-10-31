// Deterministic sandbox engines over SYNTHETIC scenarios. Outputs are demonstrations, never
// credit or business decisions, and every result says so.

export type Param = { key: string; label: string; min: number; max: number; step: number; unit?: string };
export type Scenario = { key: string; title: string; description: string; defaults: Record<string, number>; context: Record<string, string | number> };
export type Check = { label: string; status: "pass" | "warn" | "fail"; detail: string };
export type Result = { headline: string; verdict: string; metrics: { label: string; value: string }[]; checks: Check[]; evidence: string[]; caveats: string[] };
export type Engine = { slug: string; name: string; internal?: boolean; params: Param[]; scenarios: Scenario[]; run: (s: Scenario, p: Record<string, number>) => Result };

const pct = (n: number) => `${(n * 100).toFixed(1)}%`;
const SANDBOX = "Sandbox output on synthetic data. Not a credit or business decision.";

const workbench: Engine = {
  slug: "sme-credit-decisioning-workbench", name: "SME Credit Decisioning Workbench",
  params: [
    { key: "dscr", label: "Debt-service cover", min: 0.6, max: 2.5, step: 0.05, unit: "×" },
    { key: "leverage", label: "Debt / EBITDA", min: 0.5, max: 7, step: 0.1, unit: "×" },
    { key: "overdue", label: "Overdue bureau records (24m)", min: 0, max: 6, step: 1 },
  ],
  scenarios: [
    { key: "seasonal-retailer", title: "Seasonal retailer", description: "Revenue dips every Q2 and recovers in Q4.", defaults: { dscr: 1.42, leverage: 2.8, overdue: 0 }, context: { sector: "Retail", q2_drop: 31 } },
    { key: "stretched-manufacturer", title: "Stretched manufacturer", description: "Growing fast with rising leverage.", defaults: { dscr: 1.08, leverage: 4.9, overdue: 1 }, context: { sector: "Manufacturing", q2_drop: 4 } },
  ],
  run(s, p) {
    const checks: Check[] = [
      { label: "Debt-service cover ≥ 1.25×", status: p.dscr >= 1.25 ? "pass" : p.dscr >= 1.1 ? "warn" : "fail", detail: `${p.dscr.toFixed(2)}× against policy minimum 1.25×` },
      { label: "Leverage ≤ 4.0×", status: p.leverage <= 4 ? "pass" : p.leverage <= 5 ? "warn" : "fail", detail: `${p.leverage.toFixed(1)}× Debt/EBITDA` },
      { label: "No recent overdue records", status: p.overdue === 0 ? "pass" : p.overdue <= 1 ? "warn" : "fail", detail: `${p.overdue} record(s) in 24 months` },
      { label: "Revenue stability", status: Number(s.context.q2_drop) > 20 ? "warn" : "pass", detail: Number(s.context.q2_drop) > 20 ? `Q2 revenue falls ${s.context.q2_drop}% but recovers every year: likely seasonal` : "No material intra-year swings" },
    ];
    const fails = checks.filter((c) => c.status === "fail").length;
    const warns = checks.filter((c) => c.status === "warn").length;
    const verdict = fails ? "Refer to credit committee" : warns ? "Approve with conditions" : "Approve";
    return {
      headline: "Recommendation for the credit officer", verdict,
      metrics: [{ label: "Policy checks passed", value: `${checks.filter((c) => c.status === "pass").length} of ${checks.length}` }, { label: "Sector", value: String(s.context.sector) }],
      checks,
      evidence: [
        `Policy SME-v4.2 rules evaluated: DSCR, leverage, bureau history, revenue stability.`,
        Number(s.context.q2_drop) > 20 ? "Like-for-like quarter comparison shows the dip recurs annually, so it is not treated as deterioration." : "Trend analysis on 12 synthetic quarters.",
        warns ? "Suggested condition: seasonal covenant tied to Q4 cash position." : "No conditions suggested.",
      ],
      caveats: [SANDBOX, "The decision rests with a credit officer."],
    };
  },
};

const simulator: Engine = {
  slug: "credit-strategy-simulator", name: "Credit Strategy Simulator",
  params: [
    { key: "score", label: "Minimum credit score", min: 540, max: 760, step: 5 },
    { key: "dscr", label: "Minimum debt-service cover", min: 0.9, max: 1.8, step: 0.05, unit: "×" },
  ],
  scenarios: [
    { key: "tighten", title: "Tighten for a downturn", description: "Raise thresholds ahead of a slowdown.", defaults: { score: 680, dscr: 1.35 }, context: { book: 2400 } },
    { key: "grow", title: "Grow in SME", description: "Loosen thresholds to grow approvals.", defaults: { score: 600, dscr: 1.1 }, context: { book: 2400 } },
  ],
  run(_s, p) {
    // Closed-form approximation of the homepage simulator's synthetic portfolio.
    const approve = Math.max(0.05, Math.min(0.95, 0.62 - (p.score - 640) / 260 - (p.dscr - 1.2) * 0.45));
    const el = Math.max(0.01, 0.041 - (p.score - 640) / 5200 - (p.dscr - 1.2) * 0.018);
    const base = { approve: 0.62, el: 0.041 };
    return {
      headline: "Projected effect against current policy (640 / 1.20×)", verdict: approve > base.approve ? "More approvals, higher expected loss" : "Fewer approvals, lower expected loss",
      metrics: [
        { label: "Approval rate", value: `${pct(approve)} (${approve >= base.approve ? "+" : ""}${((approve - base.approve) * 100).toFixed(1)} pts)` },
        { label: "Expected default rate", value: `${pct(el)} (${el >= base.el ? "+" : ""}${((el - base.el) * 100).toFixed(1)} pts)` },
      ],
      checks: [
        { label: "Within risk appetite (EL ≤ 4.5%)", status: el <= 0.045 ? "pass" : "fail", detail: pct(el) },
        { label: "Approval volume ≥ 45%", status: approve >= 0.45 ? "pass" : "warn", detail: pct(approve) },
      ],
      evidence: ["Replayed against 2,400 synthetic applications.", "Sensitivity is approximately linear in this range."],
      caveats: [SANDBOX, "Projections, not promises."],
    };
  },
};

const fai: Engine = {
  slug: "financial-analysis-intelligence", name: "Financial Analysis Intelligence",
  params: [{ key: "dip", label: "Q2 revenue dip", min: 0, max: 50, step: 1, unit: "%" }, { key: "growth", label: "Year-on-year growth", min: -20, max: 30, step: 1, unit: "%" }],
  scenarios: [
    { key: "monsoon", title: "Monsoon-dependent distributor", description: "Strong seasonal swing, steady growth.", defaults: { dip: 34, growth: 6 }, context: { quarters: 12 } },
    { key: "flat", title: "Non-seasonal services firm", description: "Little seasonality, slowing growth.", defaults: { dip: 3, growth: -4 }, context: { quarters: 12 } },
  ],
  run(_s, p) {
    const seasonal = p.dip >= 15;
    const naiveFlag = p.dip >= 15 || p.growth < 0;
    const realFlag = p.growth < 0;
    return {
      headline: "Revenue trend explanation", verdict: realFlag ? "Underlying decline detected" : seasonal ? "Seasonal pattern, no deterioration" : "Stable",
      metrics: [{ label: "Quarter-on-quarter view", value: naiveFlag ? "Would flag deterioration" : "No flag" }, { label: "Like-for-like (same quarter, prior year)", value: `${p.growth >= 0 ? "+" : ""}${p.growth}%` }],
      checks: [
        { label: "Recurring seasonal pattern", status: seasonal ? "warn" : "pass", detail: seasonal ? `Q2 falls ${p.dip}% in each of the last 3 years` : "No recurring swing" },
        { label: "Year-on-year trend", status: p.growth < 0 ? "fail" : "pass", detail: `${p.growth}% versus the same quarter last year` },
      ],
      evidence: ["Statement lines: revenue, Q1 2024 – Q4 2026 (synthetic).", seasonal ? "Explanation compares like-for-like seasons, as proposed in the 'Seasonality context' idea." : "Quarter-on-quarter and year-on-year agree."],
      caveats: [SANDBOX],
    };
  },
};

const portfolio: Engine = {
  slug: "similar-portfolio-intelligence", name: "Similar Portfolio Intelligence",
  params: [{ key: "size", label: "Facility size (thousands)", min: 50, max: 2000, step: 50 }, { key: "tenor", label: "Tenor (months)", min: 6, max: 84, step: 6 }],
  scenarios: [
    { key: "agri", title: "Agri-inputs distributor", description: "Compare with agri-linked SMEs.", defaults: { size: 450, tenor: 36 }, context: { sector: "Agri-inputs" } },
    { key: "logistics", title: "Regional logistics firm", description: "Compare with logistics SMEs.", defaults: { size: 900, tenor: 60 }, context: { sector: "Logistics" } },
  ],
  run(s, p) {
    const n = Math.max(24, Math.round(520 - Math.abs(p.size - 500) / 4 - Math.abs(p.tenor - 36) * 3));
    const dr = 0.031 + (s.context.sector === "Agri-inputs" ? 0.012 : 0) + p.tenor / 4000;
    return {
      headline: `Comparable cohort: ${s.context.sector}`, verdict: n < 60 ? "Small cohort: interpret with care" : "Adequate comparable cohort",
      metrics: [{ label: "Comparable facilities", value: String(n) }, { label: "12-month default rate", value: pct(dr) }],
      checks: [{ label: "Cohort size ≥ 60", status: n >= 60 ? "pass" : "warn", detail: `${n} facilities` }, { label: "Sector match", status: "pass", detail: String(s.context.sector) }],
      evidence: ["Matched on sector, facility size band and tenor band.", "Synthetic historical portfolio."],
      caveats: [SANDBOX, "Cohort outcomes describe the past, not this applicant."],
    };
  },
};

const riva: Engine = {
  slug: "riva", name: "RIVA",
  params: [{ key: "days", label: "Days before deadline", min: 0, max: 15, step: 1 }, { key: "changed", label: "Changed source fields", min: 0, max: 8, step: 1 }],
  scenarios: [{ key: "liquidity", title: "Monthly liquidity return", description: "Template LR-07 with a mid-month GL change.", defaults: { days: 2, changed: 3 }, context: { template: "LR-07" } }],
  run(_s, p) {
    const risk = p.changed > 0 && p.days < 3;
    return {
      headline: "Submission readiness", verdict: risk ? "At risk: fix mappings now" : p.changed ? "Ready after review" : "Ready",
      metrics: [{ label: "Changed source fields", value: String(p.changed) }, { label: "Days to deadline", value: String(p.days) }],
      checks: [
        { label: "Cross-report totals reconcile", status: p.changed > 2 ? "fail" : "pass", detail: p.changed > 2 ? "Totals differ from the balance sheet return" : "Reconciled" },
        { label: "Mapped fields validated", status: p.changed ? "warn" : "pass", detail: `${p.changed} field(s) changed source this period` },
        { label: "Approvals recorded", status: "pass", detail: "Preparer and reviewer recorded" },
      ],
      evidence: ["Validation rules LR-07 v12.", "Shared practice: run validation early in the cycle."],
      caveats: [SANDBOX],
    };
  },
};

const docs: Engine = {
  slug: "document-intelligence-studio", name: "Document Intelligence Studio",
  params: [{ key: "quality", label: "Scan quality", min: 40, max: 100, step: 5, unit: "%" }],
  scenarios: [{ key: "pack", title: "SME loan document pack", description: "Statements, registration and bank letters.", defaults: { quality: 85 }, context: { files: 6 } }],
  run(_s, p) {
    const conf = p.quality / 100;
    return {
      headline: "Extraction and validation", verdict: conf < 0.7 ? "Route to reviewer" : "Structured data ready",
      metrics: [{ label: "Fields extracted", value: "38" }, { label: "Average confidence", value: pct(Math.min(0.98, conf * 1.02)) }],
      checks: [
        { label: "Revenue matches across statements", status: "pass", detail: "4,210,000 in both" },
        { label: "Auditor signature present", status: "fail", detail: "Missing on FY2025 statement" },
        { label: "Low-confidence fields", status: conf < 0.7 ? "warn" : "pass", detail: conf < 0.7 ? "9 fields below 0.7" : "None below 0.7" },
      ],
      evidence: ["6 synthetic documents classified.", "Cross-document checks on borrower name, period and totals."],
      caveats: [SANDBOX],
    };
  },
};

// Employee-only experiment. Never listed to clients and refused by URL.
const copilot: Engine = {
  slug: "collections-copilot", name: "Collections Copilot (internal prototype)", internal: true,
  params: [{ key: "dpd", label: "Days past due", min: 1, max: 120, step: 1 }],
  scenarios: [{ key: "early", title: "Early-stage arrears", description: "Suggest next best contact strategy.", defaults: { dpd: 12 }, context: {} }],
  run(_s, p) {
    return {
      headline: "Suggested contact strategy (experimental)", verdict: p.dpd < 30 ? "Friendly reminder" : p.dpd < 90 ? "Restructuring conversation" : "Escalate to specialist",
      metrics: [{ label: "Days past due", value: String(p.dpd) }],
      checks: [{ label: "Prototype guardrails", status: "warn", detail: "Experimental model, offline evaluation only" }],
      evidence: ["Rules prototype; no customer data used."], caveats: [SANDBOX, "Employee-only experiment. Not on any roadmap."],
    };
  },
};

export const ENGINES: Engine[] = [workbench, simulator, fai, portfolio, riva, docs, copilot];
export const engineBySlug = (slug: string) => ENGINES.find((e) => e.slug === slug);
