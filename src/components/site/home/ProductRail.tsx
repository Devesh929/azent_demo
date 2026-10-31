"use client";

import Link from "next/link";
import { motion, useScroll, useTransform, useReducedMotion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { OFFERINGS } from "@/content/catalog";
import { ProductVisual } from "@/components/site/ProductVisual";

// Vertical scroll drives a horizontal rail on wide screens; phones get a native swipe rail.
export function ProductRail() {
  const section = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const [distance, setDistance] = useState(0);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: section, offset: ["start start", "end end"] });
  const x = useTransform(scrollYProgress, [0.08, 0.92], [0, -distance]);

  useEffect(() => {
    const measure = () => {
      if (!track.current) return;
      setDistance(Math.max(0, track.current.scrollWidth - window.innerWidth + 48));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const panels = OFFERINGS.map((o) => (
    <article key={o.slug} className="group relative flex w-[min(86vw,460px)] shrink-0 snap-start flex-col glass ring-gradient rounded-[28px] p-7 transition-all duration-300 hover:-translate-y-1 hover:bg-white/[0.06] lg:w-[460px]">
      <p className="text-[13px] text-accent">{o.kicker}</p>
      <h3 className="mt-3 text-[28px] font-semibold leading-tight tracking-[-0.03em]">{o.name}</h3>
      <p className="mt-3 text-[15px] leading-relaxed text-ink-2">{o.tagline}</p>
      <div className="mt-6">
        <ProductVisual slug={o.slug} />
      </div>
      <Link href={`/products/${o.slug}`} className="mt-6 inline-flex items-center gap-1.5 text-[14px] font-medium text-ink after:absolute after:inset-0">
        Explore {o.name} <ArrowUpRight size={16} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
      </Link>
    </article>
  ));

  return (
    <section ref={section} className="relative lg:h-[320vh]" aria-labelledby="products-title">
      <div className="lg:sticky lg:top-0 lg:flex lg:h-svh lg:flex-col lg:justify-center lg:overflow-hidden">
        <div className="frame flex flex-wrap items-end justify-between gap-6">
          <div>
            <h2 id="products-title" className="headline text-[clamp(2.4rem,5.6vw,5.4rem)]">Built to work. <span className="serif-accent text-gradient">Designed to evolve.</span></h2>
            <p className="lede mt-5 max-w-[34rem]">Six products for credit, analysis and reporting teams, each one explainable and each one shaped by what clients tell us.</p>
          </div>
          <Link href="/products" className="text-[15px] font-medium text-accent hover:underline">View all products</Link>
        </div>

        {/* Wide screens: scroll-linked rail */}
        <motion.div ref={track} style={reduce ? undefined : { x }} className="mt-14 hidden gap-5 pl-[max(16px,calc((100vw-1360px)/2+40px))] lg:flex">
          {panels}
        </motion.div>
        {/* Phones and tablets: native horizontal swipe */}
        <div className="mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-6 scroll-thin lg:hidden">{panels}</div>
      </div>
    </section>
  );
}
