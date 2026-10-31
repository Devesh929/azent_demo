"use client";

import { useState, useTransition } from "react";
import { AnimatePresence, motion } from "motion/react";
import { AlertTriangle, CheckCircle2, Play, Sparkles, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Param, Result, Scenario } from "@/lib/playground";
import { runScenario, saveRunFeedback, type RunResult } from "@/app/portal/playground/actions";

const ICON = { pass: CheckCircle2, warn: AlertTriangle, fail: XCircle };
const TONE = { pass: "text-accent", warn: "text-warn", fail: "text-bad" };

export function PlaygroundRunner({ slug, params, scenarios }: { slug: string; params: Param[]; scenarios: Scenario[] }) {
  const [scenario, setScenario] = useState(scenarios[0]);
  const [values, setValues] = useState<Record<string, number>>(scenarios[0].defaults);
  const [assisted, setAssisted] = useState(false);
  const [run, setRun] = useState<RunResult | null>(null);
  const [pending, start] = useTransition();
  const [fb, setFb] = useState({ helpful: true, accuracy: 4, comment: "", sent: false });

  const pick = (s: Scenario) => { setScenario(s); setValues(s.defaults); setRun(null); };
  const go = () => start(async () => { setFb((f) => ({ ...f, sent: false })); setRun(await runScenario(slug, scenario.key, values, assisted)); });
  const result: Result | null = run?.ok ? run.result : null;

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <div className="space-y-5">
        <section className="glass ring-gradient rounded-[22px] p-5">
          <h2 className="text-[16px] font-semibold">1. Choose a synthetic scenario</h2>
          <div className="mt-4 grid gap-2">
            {scenarios.map((s) => (
              <button key={s.key} onClick={() => pick(s)} className={cn("rounded-xl p-4 text-left ring-1 ring-inset transition-colors", s.key === scenario.key ? "bg-accent-soft ring-accent" : "bg-surface-2 ring-transparent hover:ring-line-strong")}>
                <span className="block text-[15px] font-medium">{s.title}</span>
                <span className="mt-1 block text-[13px] text-ink-2">{s.description}</span>
              </button>
            ))}
          </div>
        </section>
        <section className="glass ring-gradient rounded-[22px] p-5">
          <h2 className="text-[16px] font-semibold">2. Inspect and adjust inputs</h2>
          <div className="mt-4 space-y-5">
            {params.map((p) => (
              <label key={p.key} className="block">
                <span className="flex justify-between text-[14px]"><span className="text-ink-2">{p.label}</span><span className="font-medium tabular-nums">{values[p.key]}{p.unit ?? ""}</span></span>
                <input type="range" min={p.min} max={p.max} step={p.step} value={values[p.key]} onChange={(e) => setValues((v) => ({ ...v, [p.key]: +e.target.value }))} className="mt-2 w-full accent-[var(--accent)]" />
              </label>
            ))}
            {Object.entries(scenario.context).length > 0 && (
              <p className="text-[12px] text-muted">Fixed context: {Object.entries(scenario.context).map(([k, val]) => `${k.replace(/_/g, " ")} ${val}`).join(" · ")}</p>
            )}
          </div>
          <label className="mt-5 flex items-center gap-3 text-[14px] text-ink-2">
            <input type="checkbox" checked={assisted} onChange={(e) => setAssisted(e.target.checked)} className="size-4 accent-[var(--accent)]" />
            <span className="flex items-center gap-1.5"><Sparkles size={14} className="text-accent" /> Add an AI-assisted explanation</span>
          </label>
          <Button onClick={go} disabled={pending} size="lg" className="mt-5 w-full"><Play size={16} /> {pending ? "Running…" : "3. Run demonstration"}</Button>
        </section>
      </div>

      <div className="space-y-5">
        <AnimatePresence mode="wait">
          {!run ? (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid min-h-[300px] place-items-center rounded-2xl bg-surface-2/50 p-8 text-center text-[15px] text-ink-2">
              Run the scenario to see the result, its evidence and its caveats.
            </motion.div>
          ) : !run.ok ? (
            <motion.p key="err" className="rounded-2xl bg-bad-soft p-5 text-bad">{run.message}</motion.p>
          ) : (
            <motion.div key={run.runId} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              <section className="glass ring-gradient rounded-[22px] p-6">
                <p className="text-[13px] text-muted">{result!.headline}</p>
                <p className="mt-2 text-[26px] font-semibold tracking-[-0.02em]">{result!.verdict}</p>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {result!.metrics.map((m) => <div key={m.label} className="rounded-xl bg-white/[0.04] ring-1 ring-inset ring-white/[0.06] p-4"><p className="text-[12px] text-muted">{m.label}</p><p className="mt-1 text-[17px] font-medium tabular-nums">{m.value}</p></div>)}
                </div>
                <ul className="mt-5 space-y-2">
                  {result!.checks.map((c, i) => { const I = ICON[c.status]; return (
                    <motion.li key={c.label} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }} className="flex gap-3 rounded-xl bg-white/[0.04] ring-1 ring-inset ring-white/[0.06] px-4 py-3">
                      <I size={18} className={cn("mt-0.5 shrink-0", TONE[c.status])} /><span><span className="block text-[14px] font-medium">{c.label}</span><span className="text-[13px] text-ink-2">{c.detail}</span></span>
                    </motion.li>); })}
                </ul>
              </section>
              <section className="glass ring-gradient rounded-[22px] p-6">
                <h3 className="text-[15px] font-semibold">Evidence</h3>
                <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[14px] text-ink-2">{result!.evidence.map((e) => <li key={e}>{e}</li>)}</ul>
                {run.narrative && <div className="mt-5 rounded-xl bg-blue-soft p-4 text-[14px] leading-relaxed"><p className="mb-1 flex items-center gap-1.5 text-[12px] font-medium text-blue"><Sparkles size={13} /> AI-assisted</p>{run.narrative}</div>}
                <p className="mt-4 text-[12px] text-muted">{run.narrativeNote}</p>
                <ul className="mt-3 space-y-1">{result!.caveats.map((c) => <li key={c} className="rounded-lg bg-warn-soft px-3 py-2 text-[13px] text-warn">{c}</li>)}</ul>
              </section>
              <section className="glass ring-gradient rounded-[22px] p-6">
                <h3 className="text-[15px] font-semibold">4. Structured feedback</h3>
                {fb.sent ? <p className="mt-3 text-[14px] text-accent">Thanks. Saved with this run, visible only to you and the product team.</p> : (
                  <div className="mt-3 space-y-4">
                    <div className="flex gap-2">{[true, false].map((h) => <button key={String(h)} onClick={() => setFb((f) => ({ ...f, helpful: h }))} className={cn("rounded-full px-4 py-2 text-[13px]", fb.helpful === h ? "bg-accent-soft text-accent" : "bg-surface-2")}>{h ? "Helpful" : "Not helpful"}</button>)}</div>
                    <label className="block text-[14px] text-ink-2">Did the result match your expectation? <span className="tabular-nums text-ink">{fb.accuracy}/5</span>
                      <input type="range" min={1} max={5} value={fb.accuracy} onChange={(e) => setFb((f) => ({ ...f, accuracy: +e.target.value }))} className="mt-2 w-full accent-[var(--accent)]" /></label>
                    <textarea value={fb.comment} onChange={(e) => setFb((f) => ({ ...f, comment: e.target.value }))} placeholder="What would make this more useful? No customer details, please." maxLength={1000} className="min-h-20 w-full rounded-xl bg-white/[0.04] ring-1 ring-inset ring-white/[0.06] p-3 text-[14px] outline-none ring-1 ring-line focus:ring-accent" />
                    <Button size="sm" variant="secondary" onClick={async () => { const r = await saveRunFeedback(run.runId, fb); if (r.ok) setFb((f) => ({ ...f, sent: true })); }}>Save feedback</Button>
                  </div>
                )}
              </section>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
