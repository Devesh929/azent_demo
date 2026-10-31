"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/products", label: "Products" },
  { href: "/solutions", label: "Solutions" },
  { href: "/learning", label: "Collective learning" },
  { href: "/insights", label: "Insights" },
  { href: "/live", label: "Live" },
  { href: "/about", label: "About" },
];

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("brand-wordmark inline-flex items-center gap-2 font-semibold tracking-[-0.045em] text-ink", className)}>
      <svg className="brand-symbol" width="25" height="27" viewBox="0 0 28 30" fill="none" aria-hidden><path d="M3 28V14C3 6 10 2 17 2V16C17 23 10 28 3 28Z" fill="currentColor"/><path d="M17 2C24 2 26 7 26 14V27C20 27 16 23 16 17V2Z" fill="currentColor" opacity=".65"/><path d="M17 3V17" stroke="white" strokeOpacity=".6"/></svg>
      <span>azentio.ai</span>
    </span>
  );
}

export function SiteHeader({ signedIn }: { signedIn: boolean }) {
  const path = usePathname();
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  // The menu belongs to the route it was opened on, so navigating closes it.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === path;

  useMotionValueEvent(scrollY, "change", (y) => {
    const prev = scrollY.getPrevious() ?? 0;
    setScrolled(y > 24);
    setHidden(y > 320 && y > prev && !open);
  });
  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    return () => { document.documentElement.style.overflow = ""; };
  }, [open]);

  return (
    <>
      <motion.header
        animate={{ y: hidden ? -88 : 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className={cn("site-navigation fixed inset-x-0 top-0 z-50 px-3 pt-3", path === "/" && "site-navigation-home")}
      >
        <div className={cn("mx-auto flex h-[60px] max-w-[1320px] items-center gap-6 rounded-full px-5 transition-all duration-500", scrolled ? "glass-strong shadow-[0_20px_60px_-20px_rgb(0_0_0/0.8)]" : "bg-transparent")}>
          <Link href="/" className="text-[19px]" aria-label="azentio.ai home">
            <Wordmark />
          </Link>
          <nav className="hidden flex-1 items-center gap-1 lg:flex" aria-label="Main">
            {NAV.map((n) => {
              const active = path === n.href || path.startsWith(n.href + "/");
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className={cn("relative rounded-full px-3.5 py-2 text-[14px] transition-colors", active ? "text-ink" : "text-muted hover:text-ink")}
                >
                  {active && <motion.span layoutId="nav-pill" className="neu absolute inset-0 -z-10 rounded-full" transition={{ type: "spring", stiffness: 380, damping: 32 }} />}
                  {n.label}
                </Link>
              );
            })}
          </nav>
          <div className="ml-auto hidden items-center gap-2 lg:flex">
            <Link href={signedIn ? "/portal" : "/login"} className={buttonClass("ghost", "md")}>
              {signedIn ? "Open portal" : "Sign in"}
            </Link>
            <Link href="/demo" className={buttonClass("primary", "md")}>
              Book a demo
            </Link>
          </div>
          <button
            className="ml-auto grid size-11 place-items-center rounded-full text-ink lg:hidden"
            onClick={() => setOpenOn(open ? null : path)}
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-40 bg-ground pt-[88px] lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <nav className="frame flex flex-col" aria-label="Mobile">
              {NAV.map((n, i) => (
                <motion.div key={n.href} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 * i, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
                  <Link href={n.href} className="block py-3 text-[32px] font-semibold tracking-[-0.03em] text-ink">
                    {n.label}
                  </Link>
                </motion.div>
              ))}
              <div className="mt-8 flex gap-3">
                <Link href="/demo" className={buttonClass("primary", "lg")}>Book a demo</Link>
                <Link href={signedIn ? "/portal" : "/login"} className={buttonClass("quiet", "lg")}>{signedIn ? "Open portal" : "Sign in"}</Link>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
