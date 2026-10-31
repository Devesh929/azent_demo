import type { Metadata } from "next";
import { PageIntro } from "@/components/site/PageIntro";
import { Reveal, Stagger, RevealItem } from "@/components/site/motion";

export const metadata: Metadata = { title: "About" };

const BELIEFS = [
  { t: "Domain first", d: "We start from how credit, analysis and reporting teams actually work, then apply AI where it removes effort without removing judgement." },
  { t: "Evidence travels with the answer", d: "If a recommendation cannot show its working, it is not ready for a regulated decision." },
  { t: "People decide", d: "Our products prepare, explain and check. A person approves." },
  { t: "Learn together, safely", d: "The market teaches our clients first. We make it safe for them to teach each other, and us." },
];

export default function AboutPage() {
  return (
    <>
      <PageIntro title="Intelligence, engineered for the real world." lede="AI creates value when it moves beyond experimentation and becomes part of how businesses operate. azentio.ai builds intelligent applications that combine domain understanding, advanced AI, intuitive experiences and enterprise-grade engineering." />
      <section className="frame pb-[clamp(96px,12vw,160px)]">
        <Stagger className="grid gap-5 md:grid-cols-2">
          {BELIEFS.map((b) => (
            <RevealItem key={b.t} className="glass ring-gradient rounded-[28px] p-[clamp(24px,3vw,44px)]">
              <h2 className="text-[clamp(1.5rem,2.4vw,2.2rem)] font-semibold tracking-[-0.03em]">{b.t}</h2>
              <p className="mt-4 text-[17px] leading-relaxed text-ink-2">{b.d}</p>
            </RevealItem>
          ))}
        </Stagger>
        <Reveal className="mt-5 rounded-[28px] bg-accent p-[clamp(24px,3vw,44px)] text-accent-ink">
          <p className="max-w-[48rem] text-[clamp(1.3rem,2.2vw,1.9rem)] font-medium leading-snug tracking-[-0.02em]">
            From ideas to intelligent products. From complexity to clarity. From AI potential to meaningful outcomes.
          </p>
        </Reveal>
      </section>
    </>
  );
}
