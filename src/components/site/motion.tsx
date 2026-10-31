"use client";

import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion, useMotionValue, useReducedMotion, useSpring, type HTMLMotionProps } from "motion/react";
import { useEffect, useRef, type ReactNode } from "react";

/** Inertial smooth scrolling for the public site. Disabled under reduced motion. */
export function SmoothScroll({ children }: { children: ReactNode }) {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let dispose = () => {};
    const setup = () => {
      dispose();
      dispose = () => {};
      if (media.matches) return;
      const lenis = new Lenis({ duration: 1.05, smoothWheel: true, anchors: { offset: -100 } });
      lenis.on("scroll", ScrollTrigger.update);
      const tick = (time: number) => lenis.raf(time * 1000);
      gsap.ticker.add(tick);
      dispose = () => { gsap.ticker.remove(tick); lenis.destroy(); };
    };
    setup();
    media.addEventListener("change", setup);
    return () => {
      dispose();
      media.removeEventListener("change", setup);
    };
  }, []);
  return <>{children}</>;
}

const EASE = [0.22, 1, 0.36, 1] as const;

/** Rises into place once as it enters the viewport. Content is visible without JS. */
export function Reveal({ children, delay = 0, y = 24, className, ...rest }: HTMLMotionProps<"div"> & { delay?: number; y?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={{ duration: 0.9, ease: EASE, delay }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

/** Staggers its direct <RevealItem> children. */
export function Stagger({ children, className, gap = 0.075 }: { children: ReactNode; className?: string; gap?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={false}
      whileInView="show"
      viewport={{ once: true, margin: "-10% 0px" }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: reduce ? 0 : gap } } }}
    >
      {children}
    </motion.div>
  );
}
export function RevealItem({ children, className, ...rest }: HTMLMotionProps<"div">) {
  return (
    <motion.div
      className={className}
      variants={{ hidden: { opacity: 0, y: 22 }, show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: EASE } } }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

/** Headline that rises word by word. */
export function SplitWords({ text, className, delay = 0, wordClassName }: { text: string; className?: string; delay?: number; wordClassName?: string }) {
  const reduce = useReducedMotion();
  const words = text.split(" ");
  return (
    <span className={className} aria-label={text}>
      {words.map((w, i) => (
        <span key={i} className="-mx-[0.08em] -mb-[0.06em] inline-block overflow-hidden px-[0.08em] pb-[0.14em] pt-[0.04em] align-bottom" aria-hidden>
          <motion.span
            className={"inline-block " + (wordClassName ?? "")}
            initial={reduce ? false : { y: "110%" }}
            animate={{ y: "0%" }}
            transition={{ duration: 1, ease: EASE, delay: delay + i * 0.06 }}
          >
            {w}
            {i < words.length - 1 ? " " : ""}
          </motion.span>
        </span>
      ))}
    </span>
  );
}

/** A gentle pull toward the pointer. Use on one or two focal actions per screen only. */
export function Magnetic({ children, strength = 0.28 }: { children: ReactNode; strength?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduce = useReducedMotion();
  const x = useSpring(useMotionValue(0), { stiffness: 220, damping: 18, mass: 0.6 });
  const y = useSpring(useMotionValue(0), { stiffness: 220, damping: 18, mass: 0.6 });
  if (reduce) return <>{children}</>;
  return (
    <motion.span
      ref={ref}
      className="inline-block"
      style={{ x, y }}
      onPointerMove={(e) => {
        const r = ref.current!.getBoundingClientRect();
        x.set((e.clientX - r.left - r.width / 2) * strength);
        y.set((e.clientY - r.top - r.height / 2) * strength);
      }}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.span>
  );
}
