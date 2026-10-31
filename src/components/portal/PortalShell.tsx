"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  Bell, Book, Bot, ChevronsUpDown, Cpu, FlaskConical, Home, Layers, LifeBuoy, Lightbulb, LogOut, Megaphone, Menu, Network,
  PenLine, Radio, Search, Settings, Shield, Sparkles, Users, X, Sun, Moon, Compass,
} from "lucide-react";
import { Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import { Wordmark } from "@/components/site/SiteHeader";
import { Avatar } from "@/components/fx/static";
import { PortalBreadcrumbs, PortalTour } from "./PortalTour";
import "./portal-tour.css";
import { cn } from "@/lib/utils";

const ICONS: Record<string, typeof Home> = {
  home: Home, flask: FlaskConical, radio: Radio, book: Book, sparkles: Sparkles, network: Network, layers: Layers,
  lightbulb: Lightbulb, shield: Shield, megaphone: Megaphone, cpu: Cpu, settings: Settings, pen: PenLine,
  lifebuoy: LifeBuoy, users: Users, bot: Bot,
};

export type ShellProps = {
  nav: { href: string; label: string; icon: string; group: string }[];
  user: { name: string; email: string; title: string | null };
  workspace: { name: string; kind: "internal" | "client"; roles: string[] } | null;
  canSwitch: boolean;
  tourKey: string | null;
  unread: number;
  signOut: () => Promise<void>;
  children: ReactNode;
};

function NavList({ nav, path, onNavigate }: { nav: ShellProps["nav"]; path: string; onNavigate?: () => void }) {
  const groups = [...new Set(nav.map((n) => n.group))];
  const isActive = (href: string) => (href === "/portal" ? path === "/portal" : path === href || (path.startsWith(href + "/") && !nav.some((n) => n.href !== href && n.href.startsWith(href + "/") && path.startsWith(n.href))));
  return (
    <nav className="min-h-0 flex-1 overflow-y-auto scroll-thin flex flex-col gap-5" aria-label="Portal">
      {groups.map((g) => (
        <div key={g}>
          <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted/70">{g}</p>
          <ul className="space-y-0.5">
            {nav.filter((n) => n.group === g).map((n) => {
              const Icon = ICONS[n.icon] ?? Home;
              const active = isActive(n.href);
              return (
                <li key={n.href}>
                  <Link href={n.href} onClick={onNavigate} aria-current={active ? "page" : undefined}
                    className={cn("relative isolate flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] transition-colors", active ? "text-ink font-medium" : "text-ink-2 hover:bg-white/[0.04] hover:text-ink")}>
                    {active && (
                      <motion.span layoutId="portal-nav" className="portal-nav-active absolute inset-0 -z-10 rounded-xl" transition={{ duration: .25, ease: [0.22, 1, 0.36, 1] }} />
                    )}
                    <Icon size={17} strokeWidth={1.6} className={active ? "text-accent" : "text-muted"} />
                    {n.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function PortalShell({ nav, user, workspace, canSwitch, tourKey, unread, signOut, children }: ShellProps) {
  const path = usePathname();
  const reduce = useReducedMotion();
  const [dark, setDark] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const searchInput = useRef<HTMLInputElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  // The drawer belongs to the route it was opened on, so navigating closes it.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === path;
  const setOpen = (o: boolean) => setOpenOn(o ? path : null);
  const activeTitle = nav.find(n => n.href === path)?.label ?? nav.find(n => n.href !== "/portal" && path.startsWith(n.href + "/"))?.label ?? "Workspace";
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) { setOpenOn(null); menuButton.current?.focus(); }
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); searchInput.current?.focus(); }
      if (open && e.key === "Tab") {
        const nodes = drawerRef.current?.querySelectorAll<HTMLElement>('a, button, input');
        if (!nodes?.length) return;
        const first=nodes[0], last=nodes[nodes.length-1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", onKey);
    if (open) { document.body.style.overflow="hidden"; drawerRef.current?.querySelector<HTMLElement>("button")?.focus(); }
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow=""; };
  }, [open]);

  const wsBadge = workspace && (
    <Link href="/portal/workspace" title={workspace.name} className="neu group flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-transform hover:-translate-y-px">
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-accent-soft text-[13px] font-semibold text-accent">
        {workspace.name.slice(0, 1)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14px] font-medium text-ink">{workspace.name}</span>
        <span className="block truncate text-[12px] text-muted">{workspace.kind === "internal" ? "Employee workspace" : "Client workspace"}</span>
      </span>
      {canSwitch && <ChevronsUpDown size={15} className="text-muted group-hover:text-ink" />}
    </Link>
  );

  const sidebar = (
    <div className="flex h-full flex-col gap-5 overflow-hidden px-4 py-5">
      <Link href="/" className="px-2 text-[18px]"><Wordmark /></Link>
      {wsBadge}
      <NavList nav={nav} path={path} onNavigate={() => setOpen(false)} />
      <div className="glass mt-auto flex shrink-0 items-center gap-3 rounded-2xl px-3 py-3">
        <Avatar name={user.name} size={38} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[14px] font-medium">{user.name}</span>
          <span className="block truncate text-[12px] text-muted">{user.title ?? user.email}</span>
        </span>
        <form action={signOut}>
          <button className="grid size-9 place-items-center rounded-xl text-muted transition hover:bg-white/5 hover:text-bad" aria-label="Sign out" title="Sign out"><LogOut size={16} /></button>
        </form>
      </div>
    </div>
  );

  return (
    <div className={cn("portal-root relative min-h-svh lg:grid lg:grid-cols-[255px_1fr]", dark && "portal-dark")}>
      <aside className="portal-sidebar glass-strong sticky top-[14px] z-20 hidden lg:block">{sidebar}</aside>

      <AnimatePresence>
        {open && (
          <>
            <motion.div className="fixed inset-0 z-40 bg-ground/70 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} />
            <motion.aside ref={drawerRef} role="dialog" aria-modal="true" aria-label="Workspace navigation" className="glass-strong fixed inset-y-0 left-0 z-50 w-[288px] lg:hidden" initial={reduce ? false : { x: -300 }} animate={{ x: 0 }} exit={{ x: reduce ? 0 : -300 }} transition={{ duration: .3 }}>
              <button onClick={() => setOpen(false)} className="absolute right-3 top-4 grid size-10 place-items-center rounded-full text-ink-2" aria-label="Close menu"><X size={20} /></button>
              {sidebar}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="relative flex min-w-0 flex-col">
        <header className="portal-topbar sticky top-0 z-30 flex h-[72px] items-center gap-5 px-4 backdrop-blur-xl sm:px-8">
          <button ref={menuButton} onClick={() => setOpen(true)} className="grid size-10 place-items-center rounded-full text-ink lg:hidden" aria-label="Open menu" aria-expanded={open}><Menu size={20} /></button>
          <div className="portal-mobile-title lg:hidden"><strong>{activeTitle}</strong><span>{workspace?.name}</span></div>
          <PortalBreadcrumbs nav={nav} />
          <form action="/search" className="relative ml-auto hidden max-w-[300px] flex-1 sm:block" role="search">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input ref={searchInput} name="q" placeholder="Search your workspace…" aria-label="Search"
              className="neu-inset h-10 w-full rounded-full pl-10 pr-4 text-[14px] outline-none ring-1 ring-white/[0.06] placeholder:text-muted focus:ring-2 focus:ring-accent/70" />
          </form>
          <div className="ml-auto flex items-center gap-2">
            {workspace && tourKey && <button id="portal-guide-trigger" type="button" className="portal-guide-trigger" onClick={() => { setGuideOpen(true); requestAnimationFrame(() => document.getElementById("workspace-guide")?.scrollIntoView({ behavior: reduce ? "instant" : "smooth", block: "start" })); }} aria-expanded={guideOpen} aria-controls="workspace-guide" aria-label="Show workspace guide"><Compass size={17} /><span>Guide</span></button>}
            <button type="button" className="portal-theme-button text-muted transition hover:text-ink" onClick={()=>setDark(!dark)} aria-label={dark ? "Use light appearance" : "Use dark appearance"} title={dark ? "Light appearance" : "Dark appearance"}>{dark ? <Sun size={17}/> : <Moon size={17}/>}</button>
            <Link href="/portal/aira" className="border-beam glass hidden items-center gap-2 rounded-full px-4 py-2 text-[13px] font-medium text-ink transition hover:-translate-y-px sm:flex"><Bot size={15} className="text-accent" /> Ask AIRA</Link>
            <Link href="/portal/notifications" className="neu relative grid size-10 place-items-center rounded-full text-ink-2 transition hover:-translate-y-px hover:text-ink" aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}>
              <Bell size={17} />
              {unread > 0 && <span className="absolute -right-0.5 -top-0.5 grid min-w-5 place-items-center rounded-full bg-accent px-1 text-[11px] font-semibold text-accent-ink shadow-[0_0_10px_var(--accent)]">{unread}</span>}
            </Link>
          </div>
        </header>
        <motion.main key={path} initial={false} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduce ? 0 : 0.35, ease: [0.22, 1, 0.36, 1] }} className="portal-content w-full max-w-[1440px] px-4 pb-24 pt-6 sm:px-8">
          {workspace && tourKey && <Suspense fallback={null}><PortalTour key={tourKey} identity={tourKey} nav={nav} workspace={workspace} canSwitch={canSwitch} open={guideOpen} onOpenChange={setGuideOpen} /></Suspense>}
          {children}
        </motion.main>
      </div>
    </div>
  );
}
