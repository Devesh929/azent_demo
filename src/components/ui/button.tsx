import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "quiet";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-medium whitespace-nowrap select-none transition-[background-color,color,transform,box-shadow] duration-200 ease-out active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none cursor-pointer";
const variants: Record<Variant, string> = {
  primary: "btn-glow text-accent-ink font-semibold hover:-translate-y-px",
  secondary: "neu text-ink hover:text-ink hover:-translate-y-px",
  ghost: "text-ink-2 hover:text-ink hover:bg-white/5",
  danger: "bg-bad-soft text-bad ring-1 ring-inset ring-bad/30 hover:bg-[rgb(255_122_138/0.22)]",
  quiet: "glass text-ink hover:bg-white/10 hover:-translate-y-px",
};
const sizes: Record<Size, string> = {
  sm: "h-8 px-3.5 text-[13px]",
  md: "h-10 px-5 text-sm",
  lg: "h-12 px-7 text-[15px]",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cn(base, variants[variant], sizes[size], className);
}

export function Button({ variant = "primary", size = "md", className, ...props }: ComponentProps<"button"> & { variant?: Variant; size?: Size }) {
  return <button className={buttonClass(variant, size, className)} {...props} />;
}

export function LinkButton({ variant = "primary", size = "md", className, ...props }: ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return <Link className={buttonClass(variant, size, className)} {...props} />;
}
