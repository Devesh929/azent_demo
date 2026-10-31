"use client";

import { BadgeCheck, Brain, FileSearch, Fingerprint, GitBranch, Lock, Scale, ShieldCheck, Sparkles, Users } from "lucide-react";
import { Marquee, NumberTicker, RevealGroup } from "@/components/fx/client";

const CHIPS = [
  { icon: Brain, t: "Explainable decisioning" }, { icon: FileSearch, t: "Document intelligence" }, { icon: Scale, t: "Policy simulation" },
  { icon: ShieldCheck, t: "Server-side access control" }, { icon: Fingerprint, t: "Verified identity" }, { icon: Users, t: "Governed collective learning" },
  { icon: Lock, t: "Private by default" }, { icon: GitBranch, t: "Federated research track" }, { icon: BadgeCheck, t: "Append-only audit" }, { icon: Sparkles, t: "Evidence-cited AI" },
];

const STATS = [
  { v: 6, label: "AI products", suffix: "" },
  { v: 30, label: "Security checks passing", suffix: "/30" },
  { v: 3, label: "Organisations before any trend is shown", suffix: "+" },
  { v: 4, label: "Separate consents per contribution", suffix: "" },
];

export function SignalBand() {
  return (
    <section className="relative py-16" aria-label="Platform highlights">
      <Marquee duration={45}>
        {CHIPS.map(({ icon: Icon, t }) => (
          <span key={t} className="glass flex items-center gap-2.5 rounded-full px-5 py-2.5 text-[14px] text-ink-2">
            <Icon size={16} className="text-accent" /> {t}
          </span>
        ))}
      </Marquee>
      <RevealGroup className="frame mt-14 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {STATS.map((s) => (
          <div key={s.label} data-reveal className="glass ring-gradient relative overflow-hidden rounded-[24px] p-6">
            <div aria-hidden className="absolute -right-8 -top-8 size-28 rounded-full bg-accent/20 blur-2xl" />
            <p className="relative text-[clamp(2.4rem,4.5vw,3.6rem)] font-semibold leading-none tracking-[-0.05em]">
              <NumberTicker value={s.v} className="text-gradient" />
              <span className="text-[0.5em] text-muted">{s.suffix}</span>
            </p>
            <p className="relative mt-3 text-[14px] text-ink-2">{s.label}</p>
          </div>
        ))}
      </RevealGroup>
    </section>
  );
}
