import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, Lock } from "lucide-react";
import { PageIntro } from "@/components/site/PageIntro";
import { Reveal } from "@/components/site/motion";
import { getPublicSessions } from "@/lib/data/public";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "azentio.ai LIVE" };

export default async function LivePage() {
  const sessions = await getPublicSessions();
  return (
    <>
      <PageIntro title="Conversations where intelligence comes alive." lede="Public walkthroughs and open conversations. Client webinars and employee sessions are listed inside the portal for their invited audiences." />
      <section className="frame pb-[clamp(96px,12vw,160px)]">
        {sessions.length === 0 ? (
          <p className="glass ring-gradient rounded-[28px] p-10 text-[17px] text-ink-2">No public sessions are scheduled right now.</p>
        ) : (
          <ul className="grid gap-4">
            {sessions.map((s, i) => (
              <Reveal key={s.id} delay={i * 0.05}>
                <li className="grid gap-6 glass ring-gradient rounded-[28px] p-[clamp(24px,3vw,40px)] md:grid-cols-[1fr_auto] md:items-center">
                  <div>
                    <p className="flex items-center gap-2 text-[14px] text-accent"><CalendarDays size={16} /> {formatDateTime(s.starts_at)} · {s.duration_min ?? 45} min</p>
                    <h2 className="mt-3 text-[clamp(1.5rem,2.6vw,2.2rem)] font-semibold tracking-[-0.03em]">{s.title}</h2>
                    <p className="mt-3 max-w-[40rem] text-[16px] leading-relaxed text-ink-2">{s.description}</p>
                  </div>
                  <Link href="/hackathon" className="rounded-full bg-accent px-6 py-3 text-center text-[15px] font-medium text-accent-ink">Register interest</Link>
                </li>
              </Reveal>
            ))}
          </ul>
        )}
        <div className="mt-10 flex items-center gap-3 rounded-2xl bg-white/[0.04] ring-1 ring-inset ring-white/[0.06] px-6 py-5 text-[15px] text-ink-2">
          <Lock size={18} className="text-muted" /> Client and employee sessions appear in the portal only for their configured audiences.
          <Link href="/login" className="ml-auto font-medium text-accent hover:underline">Sign in</Link>
        </div>
      </section>
    </>
  );
}
