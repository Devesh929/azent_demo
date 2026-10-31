import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

const control =
  "neu-inset w-full rounded-xl px-4 text-[15px] text-ink placeholder:text-muted/70 ring-1 ring-inset ring-white/[0.06] outline-none transition-all focus:ring-2 focus:ring-accent/70 focus:shadow-[0_0_0_4px_rgb(62_230_196/0.12),inset_4px_4px_10px_rgb(0_0_0/0.6)] aria-[invalid=true]:ring-bad [&>option]:bg-surface-solid";

export function Field({ label, name, error, hint, children, className }: { label: string; name: string; error?: string; hint?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={name} className="text-[14px] font-medium text-ink-2">{label}</label>
      {children}
      {hint && !error && <p id={`${name}-hint`} className="text-[13px] text-muted">{hint}</p>}
      {error && <p id={`${name}-error`} role="alert" className="text-[13px] text-bad">{error}</p>}
    </div>
  );
}

export function Input({ className, error, ...props }: ComponentProps<"input"> & { error?: string }) {
  return (
    <input
      id={props.name}
      aria-invalid={!!error}
      aria-describedby={error ? `${props.name}-error` : `${props.name}-hint`}
      className={cn(control, "h-12", className)}
      {...props}
    />
  );
}

export function Textarea({ className, error, ...props }: ComponentProps<"textarea"> & { error?: string }) {
  return (
    <textarea
      id={props.name}
      aria-invalid={!!error}
      aria-describedby={error ? `${props.name}-error` : `${props.name}-hint`}
      className={cn(control, "min-h-32 py-3 leading-relaxed", className)}
      {...props}
    />
  );
}

export function Select({ className, error, children, ...props }: ComponentProps<"select"> & { error?: string }) {
  return (
    <select id={props.name} aria-invalid={!!error} className={cn(control, "h-12 appearance-none bg-[length:16px] pr-10", className)} {...props}>
      {children}
    </select>
  );
}

export function Checkbox({ label, name, error, defaultChecked, description }: { label: ReactNode; name: string; error?: string; defaultChecked?: boolean; description?: ReactNode }) {
  return (
    <div>
      <label className="flex cursor-pointer items-start gap-3 text-[15px] text-ink-2">
        <input type="checkbox" name={name} defaultChecked={defaultChecked} aria-invalid={!!error} className="mt-0.5 size-5 shrink-0 cursor-pointer rounded accent-[var(--accent)]" />
        <span>
          {label}
          {description && <span className="mt-1 block text-[13px] text-muted">{description}</span>}
        </span>
      </label>
      {error && <p role="alert" className="mt-2 text-[13px] text-bad">{error}</p>}
    </div>
  );
}

/** Invisible to people; bots fill it in. */
export function Honeypot() {
  return (
    <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
      <label>Website<input type="text" name="website" tabIndex={-1} autoComplete="off" /></label>
    </div>
  );
}

export function FormMessage({ ok, message }: { ok: boolean; message?: string }) {
  if (!message) return null;
  return (
    <p role="status" className={cn("rounded-xl px-4 py-3 text-[14px]", ok ? "bg-accent-soft text-accent" : "bg-bad-soft text-bad")}>
      {message}
    </p>
  );
}
