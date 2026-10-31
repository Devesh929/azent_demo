"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";
import { animate, motion, useInView, useMotionValue, useTransform } from "motion/react";
import { useEffect, useRef, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);

/** Card whose surface lights up under the pointer (glass + spotlight + gradient ring). */
export function Spotlight({ className, children, beam, ...rest }: ComponentProps<"div"> & { beam?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={ref}
      onPointerMove={(e) => {
        const r = ref.current!.getBoundingClientRect();
        ref.current!.style.setProperty("--mx", `${e.clientX - r.left}px`);
        ref.current!.style.setProperty("--my", `${e.clientY - r.top}px`);
      }}
      className={cn("glass spotlight ring-gradient rounded-[24px] transition-transform duration-300 ease-out", beam && "border-beam", className)}
      {...rest}
    >
      {children}
    </div>
  );
}

/** Headline that rises in character by character (GSAP SplitText). Short headlines only. */
export function SplitHeadline({ as: Tag = "h2", children, className, scroll = true, delay = 0 }: { as?: "h1" | "h2" | "h3"; children: ReactNode; className?: string; scroll?: boolean; delay?: number }) {
  const ref = useRef<HTMLHeadingElement>(null);
  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      // Split by words: gradient text (background-clip) cannot survive per-character
      // elements, so each word inside a .text-gradient span carries the gradient itself.
      const split = SplitText.create(ref.current!, { type: "words", mask: "words" });
      for (const w of split.words as HTMLElement[]) {
        if (w.closest(".text-gradient") && !w.classList.contains("text-gradient")) w.classList.add("text-gradient", "pr-[0.06em]");
      }
      gsap.from(split.words, {
        yPercent: 115, opacity: 0, rotateX: -35, duration: 1, ease: "expo.out", stagger: 0.07, delay,
        scrollTrigger: scroll ? { trigger: ref.current!, start: "top 85%", once: true } : undefined,
      });
      return () => split.revert();
    });
    return () => mm.revert();
  }, { scope: ref });
  return <Tag ref={ref} className={className}>{children}</Tag>;
}

/** Children with [data-reveal] rise in as a staggered batch on scroll (GSAP ScrollTrigger.batch). */
export function RevealGroup({ children, className, y = 36 }: { children: ReactNode; className?: string; y?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const items = gsap.utils.toArray<HTMLElement>("[data-reveal]", ref.current);
      gsap.set(items, { opacity: 0, y, scale: 0.98 });
      ScrollTrigger.batch(items, {
        start: "top 88%",
        once: true,
        onEnter: (batch) => gsap.to(batch, { opacity: 1, y: 0, scale: 1, duration: 0.9, ease: "expo.out", stagger: 0.08, overwrite: true }),
      });
    });
    return () => mm.revert();
  }, { scope: ref });
  return <div ref={ref} className={className}>{children}</div>;
}

/** Parallax drift on scroll for decorative layers. */
export function Parallax({ children, className, speed = 0.2 }: { children: ReactNode; className?: string; speed?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.to(ref.current, { yPercent: -speed * 100, ease: "none", scrollTrigger: { trigger: ref.current, start: "top bottom", end: "bottom top", scrub: 1 } });
    });
    return () => mm.revert();
  }, { scope: ref });
  return <div ref={ref} className={className}>{children}</div>;
}

/** Counts up to a number when it scrolls into view. */
export function NumberTicker({ value, format = (n: number) => Math.round(n).toLocaleString(), className }: { value: number; format?: (n: number) => string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const mv = useMotionValue(0);
  const text = useTransform(mv, format);
  useEffect(() => {
    if (!inView) return;
    const c = animate(mv, value, { duration: 1.6, ease: [0.22, 1, 0.36, 1] });
    return () => c.stop();
  }, [inView, mv, value]);
  return <motion.span ref={ref} className={className}>{text}</motion.span>;
}

/** Infinite horizontal marquee; pauses on hover. */
export function Marquee({ children, className, duration = 40 }: { children: ReactNode; className?: string; duration?: number }) {
  return (
    <div className={cn("marquee overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_12%,#000_88%,transparent)]", className)}>
      <div className="marquee-track flex w-max gap-4" style={{ ["--marquee-duration" as string]: `${duration}s` }}>
        {children}
        <div aria-hidden className="flex gap-4">{children}</div>
      </div>
    </div>
  );
}

/** 3D tilt toward the pointer for hero-grade cards. */
export function Tilt({ children, className, max = 8 }: { children: ReactNode; className?: string; max?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={ref}
      className={cn("[transform-style:preserve-3d] transition-transform duration-300 ease-out will-change-transform", className)}
      onPointerMove={(e) => {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        const r = ref.current!.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        ref.current!.style.transform = `perspective(900px) rotateX(${-y * max}deg) rotateY(${x * max}deg)`;
      }}
      onPointerLeave={() => { ref.current!.style.transform = ""; }}
    >
      {children}
    </div>
  );
}
