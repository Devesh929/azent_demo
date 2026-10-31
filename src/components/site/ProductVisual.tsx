"use client";

import { motion } from "motion/react";
import { Check, FileText, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

// Small, real-looking interface fragments for each product. Synthetic figures, labelled as such.

const rise = (i: number) => ({
  initial: { opacity: 0, y: 10 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { delay: 0.1 + i * 0.08, duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
});

function Shell({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div data-ui className={cn("rounded-2xl bg-ground/80 p-4 text-[12px] text-ink-2 ring-1 ring-line", className)}>
      <div className="mb-3 flex items-center justify-between">
        <span className="font-medium text-ink">{title}</span>
        <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[10px] text-muted">Synthetic</span>
      </div>
      {children}
    </div>
  );
}

function Simulator() {
  const rows = [
    { k: "Approval rate", cur: 62, next: 68 },
    { k: "Expected loss", cur: 41, next: 44 },
    { k: "Top-sector share", cur: 33, next: 29 },
  ];
  return (
    <Shell title="Policy v4.2 vs v4.1">
      <div className="space-y-3">
        {rows.map((r, i) => (
          <motion.div key={r.k} {...rise(i)}>
            <div className="mb-1 flex justify-between"><span>{r.k}</span><span className="text-ink">{r.cur}% → <span className="text-accent">{r.next}%</span></span></div>
            <div className="relative h-2 rounded-full bg-surface-2">
              <div className="absolute inset-y-0 left-0 rounded-full bg-surface-3" style={{ width: `${r.cur}%` }} />
              <motion.div className="absolute inset-y-0 left-0 rounded-full bg-accent/80" initial={{ width: `${r.cur}%` }} whileInView={{ width: `${r.next}%` }} viewport={{ once: true }} transition={{ delay: 0.4 + i * 0.1, duration: 1 }} />
            </div>
          </motion.div>
        ))}
      </div>
    </Shell>
  );
}

function Workbench() {
  const ev = [
    { t: "DSCR 1.42 meets policy minimum 1.25", ok: true },
    { t: "Revenue down 31% in Q2, seasonal pattern", ok: false },
    { t: "No overdue bureau records in 24 months", ok: true },
  ];
  return (
    <Shell title="Case SME-2291 · Recommendation">
      <p className="mb-3 text-[13px] text-ink">Recommend approve with seasonal covenant</p>
      <ul className="space-y-2">
        {ev.map((e, i) => (
          <motion.li key={e.t} {...rise(i)} className="flex items-start gap-2 rounded-lg bg-surface/80 px-3 py-2">
            {e.ok ? <Check size={14} className="mt-px shrink-0 text-accent" /> : <AlertTriangle size={14} className="mt-px shrink-0 text-warn" />}
            {e.t}
          </motion.li>
        ))}
      </ul>
      <p className="mt-3 text-[11px] text-muted">Decision rests with the credit officer.</p>
    </Shell>
  );
}

function Portfolio() {
  const dots = Array.from({ length: 48 }, (_, i) => ({ x: (i * 37) % 100, y: 20 + ((i * 53) % 60), bad: i % 9 === 0 }));
  return (
    <Shell title="Comparable cohort · 412 facilities">
      <div className="relative h-28 rounded-lg bg-surface/60">
        {dots.map((d, i) => (
          <motion.span key={i} className={cn("absolute size-1.5 rounded-full", d.bad ? "bg-bad" : "bg-blue")} style={{ left: `${d.x}%`, top: `${d.y}%` }}
            initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.2 + i * 0.012 }} />
        ))}
        <motion.span className="absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent ring-4 ring-accent/25" style={{ left: "58%", top: "46%" }}
          initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.9, type: "spring" }} />
      </div>
      <div className="mt-3 flex justify-between"><span>Cohort 12-month default</span><span className="text-ink">4.8%</span></div>
      <p className="mt-1 text-[11px] text-muted">Sample is adequate. Sector mix differs from applicant.</p>
    </Shell>
  );
}

function Riva() {
  const checks = [
    { t: "Template LR-07 mapped", s: "ok" },
    { t: "Cross-report totals reconcile", s: "ok" },
    { t: "Field 4.12 source changed", s: "warn" },
    { t: "Approvals recorded", s: "ok" },
  ];
  return (
    <Shell title="Liquidity return · readiness">
      <ul className="space-y-1.5">
        {checks.map((c, i) => (
          <motion.li key={c.t} {...rise(i)} className="flex items-center justify-between rounded-lg bg-surface/80 px-3 py-2">
            {c.t}
            <span className={cn("rounded-full px-2 py-0.5 text-[10px]", c.s === "ok" ? "bg-accent-soft text-accent" : "bg-warn-soft text-warn")}>{c.s === "ok" ? "Pass" : "Review"}</span>
          </motion.li>
        ))}
      </ul>
    </Shell>
  );
}

function Fai() {
  const pts = [42, 46, 31, 29, 44, 58, 61, 45, 33, 30, 47, 60];
  const w = 260, h = 90;
  const path = pts.map((p, i) => `${i === 0 ? "M" : "L"}${(i / (pts.length - 1)) * w},${h - (p / 70) * h}`).join(" ");
  return (
    <Shell title="Revenue trend · 12 quarters">
      <svg viewBox={`0 0 ${w} ${h}`} className="h-24 w-full" role="img" aria-label="Seasonal revenue pattern">
        {[2, 3, 8, 9].map((q) => (
          <rect key={q} x={(q / 11) * w - 8} y={0} width={16} height={h} fill="rgb(246 195 91 / 0.10)" />
        ))}
        <motion.path d={path} fill="none" stroke="var(--accent)" strokeWidth={2} initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 1.4 }} />
      </svg>
      <p className="mt-2 text-ink">Q2 dips recur every year.</p>
      <p className="text-[11px] text-muted">Compare like-for-like seasons before reading this as deterioration.</p>
    </Shell>
  );
}

function Docs() {
  const fields = [["Borrower", "Synthetic Traders Ltd"], ["Statement period", "FY 2025"], ["Total revenue", "4,210,000"], ["Auditor signature", "Missing"]];
  return (
    <Shell title="Document pack · 6 files">
      <div className="flex gap-3">
        <div className="flex flex-col gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.div key={i} {...rise(i)} className="grid h-10 w-8 place-items-center rounded bg-surface-2"><FileText size={14} className="text-muted" /></motion.div>
          ))}
        </div>
        <ul className="flex-1 space-y-1.5">
          {fields.map(([k, v], i) => (
            <motion.li key={k} {...rise(i + 1)} className="flex justify-between rounded-lg bg-surface/80 px-3 py-1.5">
              <span className="text-muted">{k}</span>
              <span className={v === "Missing" ? "text-warn" : "text-ink"}>{v}</span>
            </motion.li>
          ))}
        </ul>
      </div>
    </Shell>
  );
}

const MAP: Record<string, () => React.ReactElement> = {
  "credit-strategy-simulator": Simulator,
  "sme-credit-decisioning-workbench": Workbench,
  "similar-portfolio-intelligence": Portfolio,
  riva: Riva,
  "financial-analysis-intelligence": Fai,
  "document-intelligence-studio": Docs,
};

export function ProductVisual({ slug }: { slug: string }) {
  const C = MAP[slug] ?? Simulator;
  return <C />;
}
