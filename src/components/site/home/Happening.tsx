import Link from "next/link";
import { ArrowUpRight, Radio } from "lucide-react";
import { Reveal } from "@/components/site/motion";
import type { PublicContent, PublicSession } from "@/lib/data/public";
import { formatDate, formatDateTime } from "@/lib/utils";

const FALLBACK_INSIGHTS = [
  { slug: "explainability-is-a-credit-feature", title: "Explainability is a credit feature, not a compliance afterthought", summary: "Why every recommendation in a credit workflow should carry its evidence." },
  { slug: "governed-collective-learning", title: "Governed collective learning: sharing what the market teaches us", summary: "How client observations become shared learning without exposing private information." },
];

export function Happening({ sessions, insights }: { sessions: PublicSession[]; insights: PublicContent[] }) {
  const next = sessions.find((s) => s.status !== "ended") ?? null;
  const posts = insights.length ? insights.slice(0, 2) : FALLBACK_INSIGHTS;

  return (
    <section className="relative bg-ground-2 py-[clamp(96px,14vw,200px)]" aria-labelledby="happening-title">
      <div className="frame">
        <h2 id="happening-title" className="headline text-[clamp(2.4rem,5.6vw,5.4rem)]">Ideas in <span className="serif-accent text-gradient">motion.</span></h2>

        <div className="mt-14 grid gap-5 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
          <Reveal className="relative flex min-h-[380px] flex-col justify-between overflow-hidden glass ring-gradient rounded-[28px] p-[clamp(24px,3vw,44px)]">
            <div className="absolute -right-24 -top-24 size-[420px] rounded-full bg-[radial-gradient(circle,rgb(62_230_196/0.16),transparent_65%)]" />
            <div className="relative">
              <p className="flex items-center gap-2 text-[14px] text-accent"><Radio size={16} /> azentio.ai LIVE</p>
              <h3 className="mt-4 max-w-[18ch] text-[clamp(1.8rem,3.2vw,3rem)] font-semibold leading-tight tracking-[-0.03em]">
                {next ? next.title : "Conversations where intelligence comes alive."}
              </h3>
              <p className="mt-4 max-w-[32rem] text-[16px] leading-relaxed text-ink-2">
                {next ? next.description : "Product walkthroughs and open conversations with the people building azentio.ai."}
              </p>
            </div>
            <div className="relative mt-10 flex flex-wrap items-center gap-4">
              {next?.starts_at && <span className="rounded-full bg-surface-2 px-4 py-2 text-[14px] text-ink">{formatDateTime(next.starts_at)} · {next.duration_min ?? 45} min</span>}
              <Link href="/live" className="inline-flex items-center gap-1.5 text-[15px] font-medium text-ink hover:text-accent">See the schedule <ArrowUpRight size={16} /></Link>
            </div>
          </Reveal>

          <div className="grid gap-5">
            <Reveal delay={0.1} className="glass ring-gradient rounded-[28px] p-7">
              <p className="text-[14px] text-blue">AI Lab</p>
              <h3 className="mt-3 text-[22px] font-semibold leading-snug tracking-[-0.02em]">Experiment boldly. Engineer purposefully.</h3>
              <p className="mt-3 text-[15px] leading-relaxed text-ink-2">Our employees prototype in a sandbox with synthetic data. The best ideas become products only after review.</p>
            </Reveal>
            <Reveal delay={0.2} className="rounded-[28px] bg-accent p-7 text-accent-ink">
              <p className="text-[14px] font-medium">Hackathon 2026</p>
              <h3 className="mt-3 text-[22px] font-semibold leading-snug tracking-[-0.02em]">Build governed AI for financial services.</h3>
              <Link href="/hackathon" className="mt-5 inline-flex items-center gap-1.5 text-[15px] font-semibold">Register your team <ArrowUpRight size={16} /></Link>
            </Reveal>
          </div>
        </div>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          {posts.map((p, i) => (
            <Reveal key={p.slug} delay={i * 0.08}>
              <Link href={`/insights/${p.slug}`} className="group block h-full glass ring-gradient rounded-[28px] p-7 transition-all duration-300 hover:-translate-y-1 hover:bg-white/[0.06]">
                <p className="text-[14px] text-muted">Perspectives{"published_at" in p && p.published_at ? ` · ${formatDate(p.published_at as string)}` : ""}</p>
                <h3 className="mt-3 text-[22px] font-semibold leading-snug tracking-[-0.02em] group-hover:text-accent">{p.title}</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-ink-2">{p.summary}</p>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
