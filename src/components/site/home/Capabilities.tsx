"use client";

import { motion } from "motion/react";
import { Bot, Brain, Check, FileText, LineChart, Settings2, ShieldCheck } from "lucide-react";
import { RevealGroup, SplitHeadline, Spotlight } from "@/components/fx/client";
import { IconTile } from "@/components/fx/static";
import { cn } from "@/lib/utils";

// Each tile carries a small live visual of what the capability does.

function DecisionVisual() {
  const rows = ["Policy SME-v4.2", "Risk indicators", "Comparable cohorts"];
  return (
    <div className="mt-6 space-y-2">
      {rows.map((r, i) => (
        <motion.div key={r} className="flex items-center gap-3 rounded-xl bg-white/[0.04] px-3 py-2.5 ring-1 ring-inset ring-white/[0.06]"
          initial={{ opacity: 0, x: -12 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 + i * 0.15 }}>
          <span className="grid size-5 place-items-center rounded-full bg-accent/20 text-accent"><Check size={12} /></span>
          <span className="text-[13px] text-ink-2">{r}</span>
          <span className="ml-auto h-1.5 w-16 overflow-hidden rounded-full bg-white/10">
            <motion.span className="block h-full rounded-full bg-gradient-to-r from-accent to-cyan" initial={{ width: 0 }} whileInView={{ width: `${70 + i * 10}%` }} viewport={{ once: true }} transition={{ delay: 0.4 + i * 0.15, duration: 0.9 }} />
          </span>
        </motion.div>
      ))}
      <motion.div className="btn-glow mt-3 rounded-xl px-3 py-2.5 text-center text-[13px] font-semibold text-accent-ink"
        initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.9 }}>
        Approve with conditions · evidence cited
      </motion.div>
    </div>
  );
}

function DocVisual() {
  return (
    <div className="relative mt-6 h-36">
      {[0, 1, 2].map((i) => (
        <div key={i} className="glass absolute left-1/2 top-2 h-28 w-24 rounded-xl p-2.5" style={{ transform: `translateX(-50%) rotate(${(i - 1) * 9}deg) translateX(${(i - 1) * 34}px)` }}>
          {[0, 1, 2, 3].map((l) => <div key={l} className="mb-1.5 h-1.5 rounded-full bg-white/15" style={{ width: `${90 - l * 15}%` }} />)}
          {i === 1 && <div className="absolute inset-x-0 top-1/2 h-px bg-accent shadow-[0_0_12px_var(--accent)]" style={{ animation: "float-y 2.6s ease-in-out infinite" }} />}
        </div>
      ))}
    </div>
  );
}

function AgentVisual() {
  const nodes = ["Task", "Systems", "Approval", "Done"];
  return (
    <div className="mt-6 flex items-center justify-between">
      {nodes.map((n, i) => (
        <div key={n} className="flex flex-1 items-center">
          <div className={cn("neu grid size-11 shrink-0 place-items-center rounded-xl text-[10px] font-semibold", i === 2 ? "text-warn" : i === 3 ? "text-accent" : "text-ink-2")}>{n}</div>
          {i < nodes.length - 1 && (
            <div className="relative mx-1 h-px flex-1 bg-white/15">
              <span className="absolute -top-[3px] size-[7px] rounded-full bg-accent shadow-[0_0_10px_var(--accent)]" style={{ animation: `beam-slide 2.4s ${i * 0.5}s linear infinite` }} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function ChartVisual() {
  const bars = [38, 52, 44, 66, 58, 74, 69, 88];
  return (
    <div className="mt-6 flex h-28 items-end gap-2">
      {bars.map((b, i) => (
        <motion.div key={i} className="flex-1 rounded-t-md bg-gradient-to-t from-blue/30 to-accent" initial={{ height: 0 }} whileInView={{ height: `${b}%` }} viewport={{ once: true }} transition={{ delay: i * 0.06, duration: 0.8, ease: [0.22, 1, 0.36, 1] }} />
      ))}
    </div>
  );
}

function ConfigVisual() {
  return (
    <div className="mt-6 space-y-3">
      {["Rules engine", "Database mapping", "Approval workflow"].map((t, i) => (
        <div key={t} className="flex items-center justify-between">
          <span className="text-[13px] text-ink-2">{t}</span>
          <span className={cn("neu-inset relative h-6 w-11 rounded-full", i !== 1 && "bg-accent/30")}>
            <span className={cn("absolute top-0.5 size-5 rounded-full transition-all", i !== 1 ? "left-[22px] bg-accent shadow-[0_0_10px_var(--accent)]" : "left-0.5 bg-white/40")} />
          </span>
        </div>
      ))}
    </div>
  );
}

function TrustVisual() {
  return (
    <div className="relative mt-6 grid h-32 place-items-center">
      {[1, 0.72, 0.46].map((s, i) => (
        <span key={i} className="absolute rounded-full border border-accent/25" style={{ width: 128 * s, height: 128 * s, animation: `pulse-ring 2.6s ${i * 0.5}s ease-out infinite` }} />
      ))}
      <span className="btn-glow grid size-14 place-items-center rounded-2xl text-accent-ink"><ShieldCheck size={24} /></span>
    </div>
  );
}

const TILES = [
  { icon: Brain, title: "Intelligent decisioning", text: "Policies, evidence and data become recommendations a person approves.", visual: DecisionVisual, span: "lg:col-span-2 lg:row-span-2", tone: "accent" as const },
  { icon: FileText, title: "Document intelligence", text: "Classify, extract and validate across complex packs.", visual: DocVisual, span: "", tone: "blue" as const },
  { icon: Bot, title: "AI agents & automation", text: "Multi-step work with human approval built in.", visual: AgentVisual, span: "", tone: "violet" as const },
  { icon: LineChart, title: "Analytics & insights", text: "Unify sources, find root causes, compare portfolios.", visual: ChartVisual, span: "", tone: "accent" as const },
  { icon: Settings2, title: "Configurable platforms", text: "Adapt rules, mappings and templates without code.", visual: ConfigVisual, span: "", tone: "blue" as const },
  { icon: ShieldCheck, title: "Trusted enterprise AI", text: "SSO, roles, audit trails and human oversight.", visual: TrustVisual, span: "lg:col-span-2", tone: "accent" as const },
];

export function Capabilities() {
  return (
    <section className="relative py-[clamp(96px,12vw,180px)]" aria-labelledby="cap-title">
      <div className="frame">
        <div className="mx-auto max-w-3xl text-center">
          <p className="glass mx-auto inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[13px] text-ink-2"><span className="size-1.5 rounded-full bg-accent shadow-[0_0_8px_var(--accent)]" /> Six capabilities</p>
          <SplitHeadline className="headline mt-6 text-[clamp(2.4rem,5.6vw,5.2rem)]">
            Intelligence in <span className="serif-accent text-gradient">every layer.</span>
          </SplitHeadline>
          <p className="lede mx-auto mt-6 max-w-[36rem]">Each capability keeps people in the decision and leaves an evidence trail behind it.</p>
        </div>

        <RevealGroup className="mt-16 grid auto-rows-[minmax(260px,auto)] gap-4 md:grid-cols-2 lg:grid-cols-4">
          {TILES.map(({ icon, title, text, visual: Visual, span, tone }, i) => (
            <div key={title} data-reveal className={span}>
              <Spotlight className="h-full p-6 hover:-translate-y-1" beam={i === 0}>
                <div className="relative">
                  <IconTile icon={icon} tone={tone} />
                  <h3 className="mt-5 text-[19px] font-semibold tracking-[-0.02em]">{title}</h3>
                  <p className="mt-2 max-w-[28rem] text-[14px] leading-relaxed text-muted">{text}</p>
                  <Visual />
                </div>
              </Spotlight>
            </div>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
