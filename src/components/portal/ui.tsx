import Link from "next/link";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";
import { IconTile, Sparkline } from "@/components/fx/static";
import { cn } from "@/lib/utils";

export type Tone = "neutral" | "info" | "good" | "warn" | "bad" | "accent";
const TONES: Record<Tone, string> = {
  neutral: "bg-white/[0.06] text-ink-2 ring-white/10",
  info: "bg-blue-soft text-blue ring-blue/25",
  good: "bg-accent-soft text-accent ring-accent/25",
  accent: "bg-accent text-accent-ink ring-accent",
  warn: "bg-warn-soft text-warn ring-warn/25",
  bad: "bg-bad-soft text-bad ring-bad/25",
};
const DOT: Record<Tone, string> = {
  neutral: "bg-muted", info: "bg-blue shadow-[0_0_8px_var(--blue)]", good: "bg-accent shadow-[0_0_8px_var(--accent)]",
  accent: "bg-accent-ink", warn: "bg-warn shadow-[0_0_8px_var(--warn)]", bad: "bg-bad shadow-[0_0_8px_var(--bad)]",
};

export function Pill({ tone = "neutral", children, className, title, dot = true }: { tone?: Tone; children: ReactNode; className?: string; title?: string; dot?: boolean }) {
  return (
    <span title={title} className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[12px] font-medium ring-1 ring-inset", TONES[tone], className)}>
      {dot && <span className={cn("size-1.5 rounded-full", DOT[tone])} aria-hidden />}
      {children}
    </span>
  );
}

export function PageHeader({ title, description, actions, back, icon }: { title: string; description?: ReactNode; actions?: ReactNode; back?: { href: string; label: string }; icon?: LucideIcon }) {
  return (
    <header className="portal-page-header relative mb-8">
      <div className="relative flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          {back && <Link href={back.href} className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-white/[0.04] px-3 py-1 text-[12px] text-muted ring-1 ring-white/10 transition hover:text-ink">← {back.label}</Link>}
          <div className="flex items-center gap-4">
            {icon && <IconTile icon={icon} size="lg" />}
            <h1 className="text-[clamp(1.7rem,2.6vw,2.4rem)] font-semibold leading-tight tracking-[-0.035em]">{title}</h1>
          </div>
          {description && <div className="mt-3 max-w-[50rem] text-[15px] leading-relaxed text-ink-2">{description}</div>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}

export function Panel({ title, description, actions, children, className, pad = true, icon, glow }: { title?: ReactNode; description?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string; pad?: boolean; icon?: LucideIcon; glow?: boolean }) {
  return (
    <section className={cn("portal-panel glass ring-gradient relative rounded-[22px]", glow && "border-beam", pad && "p-5 sm:p-6", className)}>
      {(title || actions) && (
        <div className={cn("mb-5 flex flex-wrap items-start justify-between gap-3", !pad && "px-5 pt-5 sm:px-6 sm:pt-6")}>
          <div className="flex items-start gap-3">
            {icon && <IconTile icon={icon} size="sm" />}
            <div>
              {title && <h2 className="text-[16px] font-semibold tracking-[-0.015em]">{title}</h2>}
              {description && <p className="mt-1 text-[13px] leading-relaxed text-muted">{description}</p>}
            </div>
          </div>
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

export function Stat({ label, value, hint, tone, icon, trend }: { label: string; value: ReactNode; hint?: ReactNode; tone?: Tone; icon?: LucideIcon; trend?: number[] }) {
  const color = tone === "warn" ? "var(--warn)" : tone === "bad" ? "var(--bad)" : tone === "info" ? "var(--blue)" : "var(--accent)";
  return (
    <div className="portal-stat glass ring-gradient relative overflow-hidden rounded-[22px] p-5">
      <div data-stat-glow aria-hidden className="pointer-events-none absolute -right-10 -top-10 size-32 rounded-full opacity-40 blur-2xl" style={{ background: color }} />
      <div className="relative flex items-start justify-between gap-3">
        <p className="text-[13px] font-medium text-muted">{label}</p>
        {icon && <IconTile className="stat-icon" icon={icon} size="sm" tone={tone === "warn" ? "warn" : tone === "bad" ? "bad" : tone === "info" ? "blue" : "accent"} />}
      </div>
      <p className={cn("relative mt-3 text-[34px] font-semibold leading-none tracking-[-0.04em] tabular-nums", tone === "good" && "text-accent", tone === "warn" && "text-warn")}>{value}</p>
      {hint && <p className="relative mt-2 text-[12px] text-muted">{hint}</p>}
      {trend && trend.length > 1 && <Sparkline data={trend} color={color} className="relative mt-3" height={32} />}
    </div>
  );
}

export function Empty({ title, children, action, icon: Icon = Inbox }: { title: string; children?: ReactNode; action?: ReactNode; icon?: LucideIcon }) {
  return (
    <div className="portal-empty relative flex flex-col items-center gap-3 overflow-hidden rounded-[20px] border border-dashed border-white/10 bg-white/[0.02] px-6 py-10 text-center">
      <span className="neu grid size-14 place-items-center rounded-2xl text-muted"><Icon size={22} /></span>
      <p className="text-[15px] font-medium text-ink">{title}</p>
      {children && <div className="max-w-[34rem] text-[14px] leading-relaxed text-ink-2">{children}</div>}
      {action}
    </div>
  );
}

export function KV({ items }: { items: [string, ReactNode][] }) {
  return (
    <dl className="grid gap-x-6 gap-y-3 text-[14px] sm:grid-cols-[auto_1fr]">
      {items.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="text-muted">{k}</dt>
          <dd className="text-ink">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Neumorphic segmented control. */
export function Tabs({ items, active }: { items: { href: string; label: string; count?: number }[]; active: string }) {
  return (
    <nav className="neu-inset mb-6 flex w-fit max-w-full flex-wrap gap-1 rounded-2xl p-1.5" aria-label="Sections">
      {items.map((i) => {
        const on = active === i.href;
        return (
          <Link key={i.href} href={i.href} aria-current={on ? "page" : undefined}
            className={cn("rounded-xl px-4 py-2 text-[13px] font-medium transition-all", on ? "neu text-ink" : "text-muted hover:text-ink")}>
            {i.label}{i.count !== undefined && <span className={cn("ml-2 rounded-full px-1.5 py-px text-[11px] tabular-nums", on ? "bg-accent-soft text-accent" : "bg-white/5")}>{i.count}</span>}
          </Link>
        );
      })}
    </nav>
  );
}

export function ListRow({ href, title, meta, right, children, leading }: { href?: string; title: ReactNode; meta?: ReactNode; right?: ReactNode; children?: ReactNode; leading?: ReactNode }) {
  const inner = (
    <div className="portal-list-row group flex items-start gap-4 rounded-2xl px-4 py-3.5 transition-all duration-200 hover:bg-white/[0.04]">
      {leading}
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-medium text-ink transition-colors group-hover:text-white">{title}</p>
        {meta && <p className="mt-1 text-[13px] text-muted">{meta}</p>}
        {children}
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </div>
  );
  return href ? <Link href={href} className="block">{inner}</Link> : inner;
}

export function Notice({ tone = "info", children }: { tone?: Tone; children: ReactNode }) {
  const bar = { neutral: "before:bg-muted", info: "before:bg-blue", good: "before:bg-accent", accent: "before:bg-accent", warn: "before:bg-warn", bad: "before:bg-bad" }[tone];
  return (
    <div className={cn("relative overflow-hidden rounded-2xl py-3 pl-5 pr-4 text-[14px] leading-relaxed ring-1 ring-inset before:absolute before:inset-y-0 before:left-0 before:w-1", TONES[tone], bar)}>
      {children}
    </div>
  );
}
