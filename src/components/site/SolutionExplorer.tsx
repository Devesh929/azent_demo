"use client";

import { useId, useState, type KeyboardEvent } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowRight, ArrowUpRight, Check, BriefcaseBusiness, ShieldCheck, Files, Workflow } from "lucide-react";
import { offeringBySlug } from "@/content/catalog";
import { InteractiveWorkbench } from "./InteractiveWorkbench";

const SOLUTIONS = [
  { name: "SME credit", icon: BriefcaseBusiness, title: "From evidence to a considered decision.", body: "Bring financial statements, policy checks and comparable cohorts into one case. Every recommendation stays with a credit officer for approval.", steps: [{ name: "Understand statements", slug: "financial-analysis-intelligence" }, { name: "Review policy", slug: "sme-credit-decisioning-workbench" }, { name: "Compare peers", slug: "similar-portfolio-intelligence" }] },
  { name: "Credit risk & policy", icon: ShieldCheck, title: "Explore the change before changing the policy.", body: "Replay a proposed policy against synthetic applications, then examine the portfolio context. Review the assumptions before rollout.", steps: [{ name: "Simulate a policy", slug: "credit-strategy-simulator" }, { name: "Explore the cohort", slug: "similar-portfolio-intelligence" }] },
  { name: "Regulatory reporting", icon: Files, title: "A clearer path to reporting readiness.", body: "Connect source fields to a return, surface mapping exceptions and validate the result. A reporting officer reviews the final submission.", steps: [{ name: "Map, validate & review", slug: "riva" }] },
  { name: "Operations", icon: Workflow, title: "Less keying. More understanding.", body: "Turn a document pack into structured fields. Review inconsistencies, then bring the validated evidence into financial analysis.", steps: [{ name: "Extract & validate", slug: "document-intelligence-studio" }, { name: "Interpret the figures", slug: "financial-analysis-intelligence" }] },
];
export function SolutionExplorer() {
  const [active, setActive] = useState(0);
  const [step, setStep] = useState(0);
  const id = useId();
  const reduced = useReducedMotion();
  const solution = SOLUTIONS[active];
  function select(i: number) { setActive(i); setStep(0); }
  function onKey(e: KeyboardEvent<HTMLButtonElement>, index: number) {
    const next = e.key === "ArrowRight" ? (index + 1) % 4 : e.key === "ArrowLeft" ? (index + 3) % 4 : e.key === "Home" ? 0 : e.key === "End" ? 3 : -1;
    if (next < 0) return;
    e.preventDefault(); select(next); document.getElementById(`${id}-tab-${next}`)?.focus();
  }
  return <section className="solution-explorer frame" aria-label="Explore team workflows">
    <div className="solution-tabs liquid-track" role="tablist" aria-label="Your team">{SOLUTIONS.map((s, i) => <button type="button" role="tab" id={`${id}-tab-${i}`} aria-controls={`${id}-panel`} aria-selected={active === i} tabIndex={active === i ? 0 : -1} key={s.name} onClick={() => select(i)} onKeyDown={e => onKey(e, i)}>{active === i && <motion.span className="liquid-pill" layoutId={`${id}-pill`} transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 330, damping: 32 }} />}<s.icon size={18} /><span>{s.name}</span></button>)}</div>
    <div className="solution-panel glass" role="tabpanel" id={`${id}-panel`} aria-labelledby={`${id}-tab-${active}`} tabIndex={0}>
      <AnimatePresence mode="wait" initial={false}><motion.div key={solution.name} className="solution-story" initial={{ opacity: 0, y: reduced ? 0 : 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: reduced ? 0 : .2 }}><div><span className="explorer-overline">A workflow for {solution.name.toLowerCase()}</span><h2>{solution.title}</h2></div><div><p>{solution.body}</p><span className="solution-assurance"><Check size={14} />Evidence in view. People in control.</span></div></motion.div></AnimatePresence>
      <div className="solution-workflow"><div className="solution-steps" aria-label="Workflow steps">{solution.steps.map((s, i) => <button type="button" key={s.slug} aria-pressed={step === i} onClick={() => setStep(i)}><span>{String(i + 1).padStart(2, "0")}</span><strong>{s.name}</strong><ArrowRight size={16} /></button>)}<div className="solution-linked"><span>In this solution</span>{solution.steps.map(s => <Link key={s.slug} href={`/products/${s.slug}`}>{offeringBySlug(s.slug)!.name}<ArrowUpRight size={13} /></Link>)}</div></div><div className="solution-preview"><AnimatePresence mode="wait" initial={false}><motion.div key={`${active}-${step}`} initial={{ opacity: 0, y: reduced ? 0 : 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: reduced ? 0 : .2 }}><InteractiveWorkbench slug={solution.steps[step].slug} /></motion.div></AnimatePresence></div></div>
      <p className="solution-disclaimer">Interactive workflow previews use synthetic data. Explore a step and try its controls.</p>
    </div>
  </section>;
}
