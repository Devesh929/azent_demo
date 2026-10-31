"use client";

import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Stagger, RevealItem } from "@/components/site/motion";
import { cn } from "@/lib/utils";

const PRINCIPLES = [
  { t: "Identity & SSO", d: "Verified work identity plus an approved membership. A domain alone grants nothing." },
  { t: "Role-based access", d: "Publishing, moderating, inviting and administering are separate grants." },
  { t: "Tenant isolation", d: "Every request checks the active organisation, audience and entitlement on the server." },
  { t: "Auditability", d: "Privileged actions, moderation decisions and status changes are append-only records." },
  { t: "Data protection", d: "Shared copies never carry tenant IDs, authors, attachments or reviewer notes." },
  { t: "Human oversight", d: "Recommendations cite evidence and stop for a person. Models are never retrained by a post." },
];

const DECISIONS = [
  { who: "client · Saffron", what: "GET /api/media/q3-briefing.pdf", why: "audience=org (Harbourline)", ok: false },
  { who: "employee · Ava", what: "GET /portal/library/prototype-notes", why: "audience=employees", ok: true },
  { who: "client · Tidewater", what: "GET /portal/playground/workbench", why: "entitled offering", ok: true },
  { who: "anonymous", what: "POST /api/aira (employee topic)", why: "retrieval limited to public", ok: true },
  { who: "client admin · Hana", what: "grant role learning_moderator", why: "platform role, client org", ok: false },
  { who: "moderator · Mei", what: "read draft (unsubmitted)", why: "not submitted for review", ok: false },
  { who: "client · Harbourline", what: "search \"seasonality\"", why: "community + own org only", ok: true },
  { who: "portal admin · Priya", what: "open Tidewater observation", why: "no active support grant", ok: false },
];

export function Trust() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref);
  const reduce = useReducedMotion();
  const [rows, setRows] = useState(DECISIONS.slice(0, 4).map((d, i) => ({ ...d, k: i })));

  useEffect(() => {
    if (!inView || reduce) return;
    let i = 4;
    const t = setInterval(() => {
      setRows((r) => [{ ...DECISIONS[i % DECISIONS.length], k: i }, ...r].slice(0, 5));
      i++;
    }, 1900);
    return () => clearInterval(t);
  }, [inView, reduce]);

  return (
    <section className="relative py-[clamp(96px,14vw,200px)]" aria-labelledby="trust-title">
      <div className="frame grid gap-14 lg:grid-cols-2 lg:gap-20">
        <div>
          <h2 id="trust-title" className="headline text-[clamp(2.4rem,5.6vw,5.4rem)]">Innovation without <span className="serif-accent text-gradient">compromising trust.</span></h2>
          <p className="lede mt-6 max-w-[32rem]">Enterprise AI has to be as accountable as it is intelligent. Access is denied unless identity, membership, audience and permission all agree.</p>
          <Stagger className="mt-12 grid gap-x-10 gap-y-8 sm:grid-cols-2">
            {PRINCIPLES.map((p) => (
              <RevealItem key={p.t}>
                <h3 className="text-[18px] font-medium tracking-[-0.02em]">{p.t}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-ink-2">{p.d}</p>
              </RevealItem>
            ))}
          </Stagger>
        </div>

        <div ref={ref} className="lg:pt-24">
          <div data-ui className="overflow-hidden glass ring-gradient rounded-[28px]">
            <div className="flex items-center justify-between px-6 py-4 text-[13px]">
              <span className="font-medium text-ink">Access decisions</span>
              <span className="flex items-center gap-2 text-muted"><span className="size-2 animate-pulse rounded-full bg-accent" /> Server-side, every request</span>
            </div>
            <ul className="space-y-2 px-4 pb-4">
              <AnimatePresence initial={false}>
                {rows.map((r) => (
                  <motion.li
                    key={r.k}
                    layout
                    initial={{ opacity: 0, y: -16, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className="flex items-center gap-4 rounded-2xl bg-white/[0.04] ring-1 ring-inset ring-white/[0.06] px-4 py-3.5"
                  >
                    <span className={cn("w-16 shrink-0 rounded-full py-1 text-center text-[12px] font-medium", r.ok ? "bg-accent-soft text-accent" : "bg-bad-soft text-bad")}>
                      {r.ok ? "Allow" : "Deny"}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-mono text-[13px] text-ink">{r.what}</span>
                      <span className="block truncate text-[12px] text-muted">{r.who} · {r.why}</span>
                    </span>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          </div>
          <p className="mt-4 text-[13px] text-muted">Illustrative decisions from the synthetic portal. The real checks live in the server policy layer.</p>
        </div>
      </div>
    </section>
  );
}
