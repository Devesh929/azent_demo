// Server-safe visual primitives: no hooks, so they render in Server Components too.
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** Drifting aurora light. Purely decorative; sits behind content. */
export function Aurora({ className, intensity = 1 }: { className?: string; intensity?: number }) {
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)} style={{ opacity: intensity }}>
      <div className="aurora-blob left-[-10%] top-[-20%] h-[520px] w-[620px] bg-[#1fb7a4]" style={{ animation: "drift-a 18s ease-in-out infinite" }} />
      <div className="aurora-blob right-[-12%] top-[-10%] h-[560px] w-[640px] bg-[#235c59]" style={{ animation: "drift-b 22s ease-in-out infinite" }} />
      <div className="aurora-blob left-[30%] top-[25%] h-[420px] w-[520px] bg-[#2ed88e] opacity-30" style={{ animation: "drift-c 26s ease-in-out infinite" }} />
    </div>
  );
}

export function GridBackdrop({ className }: { className?: string }) {
  return <div aria-hidden className={cn("grid-pattern pointer-events-none absolute inset-0", className)} />;
}

/** Icon in a lit, slightly neumorphic tile. */
export function IconTile({ icon: Icon, tone = "accent", size = "md", className }: { icon: LucideIcon; tone?: "accent" | "blue" | "violet" | "warn" | "bad"; size?: "sm" | "md" | "lg"; className?: string }) {
  const tones = {
    accent: "from-[#3ee6c4]/25 to-[#22d3ee]/5 text-accent shadow-[0_0_24px_-6px_rgb(62_230_196/0.6)]",
    blue: "from-[#6c8cff]/30 to-[#6c8cff]/5 text-blue shadow-[0_0_24px_-6px_rgb(108_140_255/0.6)]",
    violet: "from-[#a78bfa]/30 to-[#a78bfa]/5 text-violet shadow-[0_0_24px_-6px_rgb(167_139_250/0.6)]",
    warn: "from-[#f6c35b]/30 to-[#f6c35b]/5 text-warn shadow-[0_0_24px_-6px_rgb(246_195_91/0.5)]",
    bad: "from-[#ff7a8a]/30 to-[#ff7a8a]/5 text-bad shadow-[0_0_24px_-6px_rgb(255_122_138/0.5)]",
  }[tone];
  const dims = { sm: "size-8 rounded-lg [&>svg]:size-4", md: "size-10 rounded-xl [&>svg]:size-[18px]", lg: "size-12 rounded-2xl [&>svg]:size-5" }[size];
  return (
    <span className={cn("ring-gradient grid shrink-0 place-items-center bg-gradient-to-br", tones, dims, className)}>
      <Icon />
    </span>
  );
}

const HUES = [168, 192, 222, 256, 140, 205];
/** Initials avatar with a stable gradient derived from the name. */
export function Avatar({ name, size = 36, className }: { name: string; size?: number; className?: string }) {
  const h = HUES[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % HUES.length];
  const initials = name.split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  return (
    <span
      className={cn("grid shrink-0 place-items-center rounded-full font-semibold text-[#04101f]", className)}
      style={{ width: size, height: size, fontSize: size * 0.36, background: `linear-gradient(135deg, hsl(${h} 80% 72%), hsl(${h + 40} 75% 58%))`, boxShadow: `0 0 0 2px rgb(3 6 20), 0 0 18px -4px hsl(${h} 80% 60% / 0.7)` }}
      aria-hidden
    >
      {initials}
    </span>
  );
}

/** Tiny line chart with a soft area fill. */
export function Sparkline({ data, className, color = "var(--accent)", height = 36 }: { data: number[]; className?: string; color?: string; height?: number }) {
  const w = 120;
  const max = Math.max(...data), min = Math.min(...data);
  const pts = data.map((d, i) => [(i / (data.length - 1)) * w, height - 4 - ((d - min) / (max - min || 1)) * (height - 8)]);
  const line = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const id = `sg${Math.abs(data.reduce((a, b) => a * 31 + b, 7)) % 99999}`;
  return (
    <svg viewBox={`0 0 ${w} ${height}`} className={cn("w-full", className)} style={{ height }} preserveAspectRatio="none" aria-hidden>
      <defs><linearGradient id={id} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor={color} stopOpacity="0.35" /><stop offset="1" stopColor={color} stopOpacity="0" /></linearGradient></defs>
      <path d={`${line} L${w},${height} L0,${height} Z`} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/** Progress ring. */
export function Ring({ value, size = 64, stroke = 6, label, color = "var(--accent)" }: { value: number; size?: number; stroke?: number; label?: ReactNode; color?: string }) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r;
  return (
    <span className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgb(148 170 255 / 0.12)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(1, Math.max(0, value)))} style={{ filter: `drop-shadow(0 0 6px ${color})` }} />
      </svg>
      {label && <span className="absolute text-[13px] font-semibold tabular-nums">{label}</span>}
    </span>
  );
}

/** A labelled glowing status dot. */
export function LiveDot({ className }: { className?: string }) {
  return <span className={cn("live-dot inline-block size-2 rounded-full bg-accent", className)} aria-hidden />;
}
