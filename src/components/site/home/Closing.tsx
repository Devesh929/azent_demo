"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import { Magnetic, Reveal } from "@/components/site/motion";

// Reuses the hero's scene in its converged state, so the page loads one copy of three.js.
const IntelligenceCore = dynamic(() => import("@/components/three/IntelligenceCore"), { ssr: false });

export function Closing() {
  return (
    <section className="relative overflow-hidden py-[clamp(120px,18vw,260px)]" aria-labelledby="cta-title">
      <div className="pointer-events-none absolute inset-0 opacity-60" aria-hidden>
        <IntelligenceCore settled centered className="h-full w-full" />
      </div>
      <div className="absolute inset-0 bg-[radial-gradient(50%_60%_at_50%_50%,rgb(5_8_22/0.55),var(--ground)_85%)]" />
      <div className="frame relative text-center">
        <Reveal>
          <h2 id="cta-title" className="display mx-auto max-w-[14ch] text-[clamp(2.8rem,7.4vw,7.2rem)]">The next intelligent idea <span className="serif-accent text-gradient">starts here.</span></h2>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="lede mx-auto mt-8 max-w-[34rem]">Explore a product, share a challenge, or build with us at the hackathon.</p>
        </Reveal>
        <Reveal delay={0.2} className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Magnetic>
            <Link href="/demo" className={buttonClass("primary", "lg")}>Start a conversation <ArrowRight size={16} /></Link>
          </Magnetic>
          <Link href="/hackathon" className={buttonClass("quiet", "lg")}>Register for the hackathon</Link>
        </Reveal>
      </div>
    </section>
  );
}
