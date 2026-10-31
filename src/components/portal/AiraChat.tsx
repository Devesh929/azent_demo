"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUp, Bot, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type Answer = { answer: string; mode: "ai" | "extractive" | "none"; citations: { n: number; title: string; url: string; type: string }[]; scope: string };
type Turn = { q: string; a?: Answer; error?: string };

export function AiraChat({ suggestions, compact }: { suggestions: string[]; compact?: boolean }) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);

  async function ask(q: string) {
    if (!q.trim() || busy) return;
    setInput("");
    setBusy(true);
    setTurns((t) => [...t, { q }]);
    try {
      const res = await fetch("/api/aira", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question: q }) });
      const data = await res.json();
      setTurns((t) => t.map((x, i) => (i === t.length - 1 ? (res.ok ? { ...x, a: data } : { ...x, error: data.error }) : x)));
    } catch {
      setTurns((t) => t.map((x, i) => (i === t.length - 1 ? { ...x, error: "AIRA is unavailable right now." } : x)));
    } finally {
      setBusy(false);
      requestAnimationFrame(() => end.current?.scrollIntoView({ behavior: "smooth", block: "end" }));
    }
  }

  // Render [S1] markers as links to the cited source.
  const render = (a: Answer) =>
    a.answer.split(/(\[S\d+\])/g).map((part, i) => {
      const m = part.match(/\[S(\d+)\]/);
      const c = m && a.citations.find((x) => x.n === Number(m[1]));
      return c ? <Link key={i} href={c.url} className="mx-0.5 rounded bg-accent-soft px-1 text-[12px] font-medium text-accent hover:bg-accent hover:text-accent-ink">{c.n}</Link> : <span key={i}>{part}</span>;
    });

  return (
    <div className={cn("flex flex-col glass ring-gradient rounded-[22px]", compact ? "min-h-[420px]" : "min-h-[calc(100svh-220px)]")}>
      <div className="flex-1 space-y-6 overflow-y-auto p-5 sm:p-6 scroll-thin" data-lenis-prevent>
        {turns.length === 0 && (
          <div className="py-6">
            <div className="grid size-12 place-items-center rounded-2xl bg-accent text-accent-ink"><Bot size={22} /></div>
            <p className="mt-4 text-[20px] font-semibold tracking-[-0.02em]">Ask AIRA</p>
            <p className="mt-2 max-w-[34rem] text-[14px] leading-relaxed text-ink-2">AIRA answers from content you are allowed to see and cites approved sources. It does not retrain any model, and withdrawn contributions are never retrieved.</p>
            <div className="mt-5 flex flex-wrap gap-2">{suggestions.map((s) => <button key={s} onClick={() => ask(s)} className="rounded-full bg-surface-2 px-4 py-2 text-[13px] text-ink-2 hover:bg-white/[0.09] hover:text-ink">{s}</button>)}</div>
          </div>
        )}
        <AnimatePresence initial={false}>
          {turns.map((t, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
              <p className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-surface-3 px-4 py-2.5 text-[14px]">{t.q}</p>
              {t.error ? <p className="text-[14px] text-bad">{t.error}</p> : !t.a ? (
                <div className="flex gap-1.5 py-2" aria-label="AIRA is thinking">{[0, 1, 2].map((d) => <motion.span key={d} className="size-2 rounded-full bg-accent" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: d * 0.15 }} />)}</div>
              ) : (
                <div className="max-w-[92%]">
                  <div className="whitespace-pre-wrap text-[15px] leading-relaxed">{render(t.a)}</div>
                  {t.a.citations.length > 0 && (
                    <ol className="mt-3 space-y-1">{t.a.citations.map((c) => <li key={c.n}><Link href={c.url} className="flex items-center gap-2 text-[12px] text-ink-2 hover:text-accent"><span className="grid size-5 shrink-0 place-items-center rounded bg-surface-2 text-[11px]">{c.n}</span>{c.title}<span className="text-muted">· {c.type}</span></Link></li>)}</ol>
                  )}
                  <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted"><Sparkles size={11} /> {t.a.mode === "ai" ? "AI-generated from cited sources (Groq)" : t.a.mode === "extractive" ? "Extractive answer (AI not configured)" : "No accessible sources"} · Scope: {t.a.scope}</p>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={end} />
      </div>
      <form onSubmit={(e) => { e.preventDefault(); ask(input); }} className="flex items-end gap-2 border-t border-line p-3">
        <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); ask(input); } }}
          rows={1} maxLength={500} placeholder="Ask about products, themes or shared learning…" aria-label="Question for AIRA"
          className="max-h-32 min-h-11 flex-1 resize-none rounded-xl bg-white/[0.04] ring-1 ring-inset ring-white/[0.06] px-4 py-3 text-[14px] outline-none ring-1 ring-line focus:ring-accent" />
        <button disabled={busy || !input.trim()} className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent text-accent-ink disabled:opacity-40" aria-label="Send"><ArrowUp size={18} /></button>
      </form>
    </div>
  );
}
