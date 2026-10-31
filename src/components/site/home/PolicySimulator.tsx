"use client";

import { animate, motion, useMotionValue, useTransform } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

// A deterministic synthetic portfolio (seeded), so every visitor sees the same numbers.
function rng(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const SECTORS = ["Retail", "Manufacturing", "Agri-inputs", "Services", "Logistics"];
type App = { score: number; dscr: number; sector: number; pd: number };

function buildPortfolio(): App[] {
  const r = rng(2026);
  return Array.from({ length: 2400 }, () => {
    const score = Math.round(480 + r() * 340 + (r() - 0.5) * 60);
    const dscr = Math.max(0.6, 0.7 + r() * 1.3 + (score - 650) / 900);
    const sector = Math.floor(r() * r() * SECTORS.length * 1.6) % SECTORS.length;
    const z = -4.4 + (720 - score) / 55 + (1.3 - dscr) * 1.6 + (sector === 2 ? 0.35 : 0);
    return { score, dscr, sector, pd: 1 / (1 + Math.exp(-z)) };
  });
}

function evaluate(p: App[], minScore: number, minDscr: number) {
  const approved = p.filter((a) => a.score >= minScore && a.dscr >= minDscr);
  const n = approved.length || 1;
  const el = approved.reduce((s, a) => s + a.pd, 0) / n;
  const bySector = SECTORS.map((_, i) => approved.filter((a) => a.sector === i).length / n);
  const buckets = Array.from({ length: 14 }, (_, i) => {
    const lo = 480 + i * 25;
    const inB = p.filter((a) => a.score >= lo && a.score < lo + 25);
    return { lo, total: inB.length, ok: inB.filter((a) => a.score >= minScore && a.dscr >= minDscr).length };
  });
  return { rate: approved.length / p.length, el, top: Math.max(...bySector), topName: SECTORS[bySector.indexOf(Math.max(...bySector))], count: approved.length, buckets };
}

function Num({ value, format }: { value: number; format: (n: number) => string }) {
  const mv = useMotionValue(value);
  const text = useTransform(mv, format);
  useEffect(() => {
    const c = animate(mv, value, { duration: 0.5, ease: [0.22, 1, 0.36, 1] });
    return () => c.stop();
  }, [mv, value]);
  return <motion.span>{text}</motion.span>;
}

const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

export function PolicySimulator() {
  const portfolio = useMemo(() => buildPortfolio(), []);
  const base = useMemo(() => evaluate(portfolio, 640, 1.2), [portfolio]);
  const [score, setScore] = useState(640);
  const [dscr, setDscr] = useState(1.2);
  const res = useMemo(() => evaluate(portfolio, score, dscr), [portfolio, score, dscr]);
  const max = Math.max(...res.buckets.map((b) => b.total));

  const metrics = [
    { label: "Approval rate", v: res.rate, b: base.rate, good: "up" },
    { label: "Expected default rate", v: res.el, b: base.el, good: "down" },
    { label: `Largest sector (${res.topName})`, v: res.top, b: base.top, good: "down" },
  ] as const;

  return (
    <section className="relative py-[clamp(96px,14vw,200px)]" aria-labelledby="sim-title">
      <div className="frame grid gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
        <div className="lg:pt-6">
          <h2 id="sim-title" className="headline text-[clamp(2.4rem,5vw,4.6rem)]">Move the policy. <span className="serif-accent text-gradient">See the portfolio move.</span></h2>
          <p className="lede mt-6 max-w-[30rem]">
            This is Credit Strategy Simulator in miniature. Change the minimum score and debt-service cover, and see approvals, expected defaults and concentration shift against today&rsquo;s policy.
          </p>

          <div className="mt-10 space-y-8">
            <label className="block">
              <span className="flex justify-between text-[15px]"><span className="text-ink-2">Minimum credit score</span><span className="font-medium tabular-nums text-ink">{score}</span></span>
              <input type="range" min={540} max={760} step={5} value={score} onChange={(e) => setScore(+e.target.value)}
                className="mt-3 w-full accent-[var(--accent)]" aria-describedby="sim-note" />
            </label>
            <label className="block">
              <span className="flex justify-between text-[15px]"><span className="text-ink-2">Minimum debt-service cover</span><span className="font-medium tabular-nums text-ink">{dscr.toFixed(2)}×</span></span>
              <input type="range" min={0.9} max={1.8} step={0.05} value={dscr} onChange={(e) => setDscr(+e.target.value)}
                className="mt-3 w-full accent-[var(--accent)]" aria-describedby="sim-note" />
            </label>
            <button onClick={() => { setScore(640); setDscr(1.2); }} className="text-[14px] text-muted underline-offset-4 hover:text-ink hover:underline">
              Reset to current policy
            </button>
          </div>
          <p id="sim-note" className="mt-8 max-w-[30rem] text-[13px] leading-relaxed text-muted">
            Simulation on 2,400 synthetic applications. Projections only. Not a credit decision, and not advice.
          </p>
        </div>

        <div data-ui className="glass ring-gradient rounded-[28px] p-[clamp(20px,3vw,40px)]">
          <div className="grid gap-4 sm:grid-cols-3">
            {metrics.map((m) => {
              const d = m.v - m.b;
              const better = m.good === "up" ? d > 0.0005 : d < -0.0005;
              const worse = m.good === "up" ? d < -0.0005 : d > 0.0005;
              return (
                <div key={m.label} className="rounded-2xl bg-white/[0.04] ring-1 ring-inset ring-white/[0.06] p-5">
                  <p className="text-[13px] text-muted">{m.label}</p>
                  <p className="mt-2 text-[34px] font-semibold tracking-[-0.03em] tabular-nums"><Num value={m.v} format={pct} /></p>
                  <p className={cn("mt-1 text-[13px] tabular-nums", better ? "text-accent" : worse ? "text-bad" : "text-muted")}>
                    {Math.abs(d) < 0.0005 ? "Same as current" : `${d > 0 ? "+" : "−"}${(Math.abs(d) * 100).toFixed(1)} pts vs current`}
                  </p>
                </div>
              );
            })}
          </div>
          <div className="mt-8">
            <div className="flex items-center justify-between text-[13px] text-muted">
              <span>Applications by score band</span>
              <span className="flex items-center gap-4">
                <span className="flex items-center gap-1.5"><i className="size-2.5 rounded-sm bg-accent" />Approved</span>
                <span className="flex items-center gap-1.5"><i className="size-2.5 rounded-sm bg-surface-3" />Declined</span>
              </span>
            </div>
            <div className="mt-4 flex h-52 items-end gap-1.5" role="img" aria-label={`Approves ${res.count} of 2,400 synthetic applications`}>
              {res.buckets.map((b) => (
                <div key={b.lo} className="relative flex h-full flex-1 flex-col justify-end">
                  <div className="relative w-full overflow-hidden rounded-t-md bg-surface-3" style={{ height: `${(b.total / max) * 100}%` }}>
                    <motion.div className="absolute inset-x-0 bottom-0 bg-accent" animate={{ height: `${b.total ? (b.ok / b.total) * 100 : 0}%` }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-2 flex justify-between text-[12px] tabular-nums text-muted"><span>480</span><span>650</span><span>830</span></div>
          </div>
          <p className="mt-6 text-[14px] text-ink-2">
            Approves <span className="font-medium text-ink tabular-nums">{res.count.toLocaleString()}</span> of 2,400 applications.
          </p>
        </div>
      </div>
    </section>
  );
}
