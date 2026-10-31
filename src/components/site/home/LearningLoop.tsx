"use client";

import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import { Check, Lock, Minus, Users } from "lucide-react";
import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

const STEPS = [
  { title: "A client notices something.", body: "An analyst records an observation as a private draft. Saving never shares it. They choose who may see it: only them, their organisation, or a proposal to the learning community." },
  { title: "A moderator makes it safe.", body: "Before anything leaves the organisation, a learning moderator removes identifying detail, coarsens place and time, and checks four separate consents. The private original never changes hands." },
  { title: "Patterns emerge across clients.", body: "Reviewed copies from different organisations group into a theme. Trend counts appear only once at least three distinct organisations contribute, and limitations are stated plainly." },
  { title: "The product gets better.", body: "A product owner links the theme to an improvement idea and reports its status back to contributors. Status is not a promise, and no model retrains itself from a post." },
];

const ease = [0.22, 1, 0.36, 1] as const;

function Chip({ on, children }: { on: boolean; children: React.ReactNode }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px]", on ? "bg-accent-soft text-accent" : "bg-surface-3 text-muted")}>
      {on ? <Check size={12} /> : <Minus size={12} />} {children}
    </span>
  );
}

function Visual({ step }: { step: number }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div key={step} initial={{ opacity: 0, y: 20, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -16, scale: 0.98 }} transition={{ duration: 0.55, ease }} className="w-full">
        {step === 0 && (
          <div data-ui className="rounded-3xl bg-surface-2 p-6">
            <div className="flex items-center justify-between text-[12px] text-muted"><span className="flex items-center gap-1.5"><Lock size={12} /> Private draft · only you</span><span>Harbourline Bank (Demo)</span></div>
            <p className="mt-4 text-[18px] font-medium text-ink">Seasonal SME revenue dips read as deterioration</p>
            <p className="mt-3 text-[14px] leading-relaxed text-ink-2">Across several monsoon-dependent SME borrowers in our Kochi branch cluster, Q2 revenue falls 30–40% every year and recovers in Q4. Ratio trend analysis flags these as deteriorating…</p>
            <div className="mt-5 flex flex-wrap gap-2 text-[12px]"><span className="rounded-full bg-surface-3 px-3 py-1 text-ink-2">Product gap</span><span className="rounded-full bg-surface-3 px-3 py-1 text-ink-2">Jan–Jun 2026</span><span className="rounded-full bg-surface-3 px-3 py-1 text-ink-2">Confidence: medium</span></div>
          </div>
        )}
        {step === 1 && (
          <div data-ui className="rounded-3xl bg-surface-2 p-6">
            <p className="text-[12px] text-muted">Moderator · proposed shared copy</p>
            <p className="mt-4 text-[14px] leading-relaxed text-ink-2">
              Across several{" "}
              <motion.span className="rounded bg-warn-soft px-1 text-warn line-through" initial={{ opacity: 1 }} animate={{ opacity: 0.5 }} transition={{ delay: 0.4 }}>monsoon-dependent</motion.span>{" "}
              seasonal SMEs in{" "}
              <motion.span className="rounded bg-warn-soft px-1 text-warn line-through" initial={{ opacity: 1 }} animate={{ opacity: 0.5 }} transition={{ delay: 0.6 }}>our Kochi branch cluster</motion.span>
              <motion.span className="ml-1 rounded bg-accent-soft px-1 text-accent" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}>South Asia</motion.span>, a predictable mid-year dip is flagged as deterioration…
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Chip on>Store & process</Chip><Chip on>Publish reviewed copy</Chip><Chip on={false}>Name my organisation</Chip><Chip on={false}>Use for model training</Chip>
            </div>
          </div>
        )}
        {step === 2 && (
          <div className="space-y-3">
            {["South Asia · H1 2026", "Middle East · H1 2026", "Southeast Asia · H1 2026"].map((r, i) => (
              <motion.div key={r} data-ui className="rounded-2xl bg-white/[0.04] ring-1 ring-inset ring-white/[0.06] px-5 py-4" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.15, duration: 0.6, ease }}>
                <p className="text-[12px] text-muted">{r} · de-identified</p>
                <p className="mt-1 text-[15px] text-ink">{["Seasonal revenue dips read as deterioration", "Pre-harvest troughs distort peer comparison", "Pre-festive inventory looks like stress"][i]}</p>
              </motion.div>
            ))}
            <motion.div className="rounded-2xl bg-accent-soft px-5 py-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
              <div className="flex items-center justify-between"><p className="font-medium text-accent">Theme: Seasonality context</p><span className="flex items-center gap-1.5 text-[13px] text-accent"><Users size={14} /> 3 organisations</span></div>
              <div className="mt-3 h-1.5 rounded-full bg-ground/40"><motion.div className="h-full rounded-full bg-accent" initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ delay: 0.8, duration: 0.8 }} /></div>
              <p className="mt-2 text-[12px] text-ink-2">Minimum cohort met. Small sample: a pattern, not proof of prevalence.</p>
            </motion.div>
          </div>
        )}
        {step === 3 && (
          <div data-ui className="rounded-3xl bg-surface-2 p-6">
            <p className="text-[12px] text-muted">Improvement idea · Financial Analysis Intelligence</p>
            <p className="mt-3 text-[20px] font-medium text-ink">Seasonality-aware comparison explanation</p>
            <div className="mt-5 flex items-center gap-2">
              {["Proposed", "Under review", "Planned", "In progress", "Released"].map((s, i) => (
                <div key={s} className="flex flex-1 flex-col gap-2">
                  <motion.span className={cn("h-1.5 rounded-full", i <= 1 ? "bg-accent" : "bg-surface-3")} initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} style={{ originX: 0 }} transition={{ delay: 0.2 + i * 0.1 }} />
                  <span className={cn("text-[11px]", i === 1 ? "text-accent" : "text-muted")}>{s}</span>
                </div>
              ))}
            </div>
            <p className="mt-5 text-[14px] leading-relaxed text-ink-2">We are reviewing a seasonality-aware comparison. This is under review and is not a delivery commitment.</p>
            <p className="mt-3 text-[12px] text-muted">Linked to 3 approved contributions. Private drafts and moderator notes stay private.</p>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

export function LearningLoop() {
  const ref = useRef<HTMLElement>(null);
  const [step, setStep] = useState(0);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start center", "end center"] });
  useMotionValueEvent(scrollYProgress, "change", (v) => setStep(Math.min(STEPS.length - 1, Math.max(0, Math.floor(v * STEPS.length)))));

  return (
    <section ref={ref} className="relative bg-ground-2 py-[clamp(96px,14vw,200px)]" aria-labelledby="loop-title">
      <div className="frame">
        <h2 id="loop-title" className="headline max-w-[18ch] text-[clamp(2.4rem,5.6vw,5.4rem)]">What clients learn, <span className="serif-accent text-gradient">everyone can use.</span></h2>
        <p className="lede mt-6 max-w-[38rem]">Governed collective learning turns one client&rsquo;s observation into safe, shared knowledge, and into better products. Here is one real path through it, with synthetic data.</p>

        <div className="mt-20 grid gap-12 lg:grid-cols-2 lg:gap-20">
          <ol className="space-y-[16vh] pb-[8vh]">
            {STEPS.map((s, i) => (
              <li key={s.title} className={cn("transition-opacity duration-500", step === i ? "opacity-100" : "opacity-35")}>
                <p className="text-[14px] text-accent">Step {i + 1} of 4</p>
                <h3 className="mt-3 text-[clamp(1.6rem,2.8vw,2.6rem)] font-semibold leading-tight tracking-[-0.03em]">{s.title}</h3>
                <p className="mt-4 max-w-[30rem] text-[17px] leading-relaxed text-ink-2">{s.body}</p>
                <div className="mt-8 lg:hidden"><Visual step={i} /></div>
              </li>
            ))}
          </ol>
          <div className="hidden lg:block">
            <div className="sticky top-[calc(50vh-180px)] flex min-h-[360px] items-center">
              <Visual step={step} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
