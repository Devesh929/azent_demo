import Link from "next/link";
import type { Metadata } from "next";
import { PageIntro } from "@/components/site/PageIntro";
import { Reveal } from "@/components/site/motion";
import { getPublicContent } from "@/lib/data/public";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Insights" };

export default async function InsightsPage() {
  const posts = await getPublicContent("insight");
  return (
    <>
      <PageIntro title="Perspectives worth sharing." lede="Notes from the people building azentio.ai on explainability, governance and what we learn alongside our clients." />
      <section className="frame pb-[clamp(96px,12vw,160px)]">
        {posts.length === 0 ? (
          <p className="glass ring-gradient rounded-[28px] p-10 text-[17px] text-ink-2">New perspectives are on their way. Connect the database to load published insights.</p>
        ) : (
          <ul className="grid gap-5 md:grid-cols-2">
            {posts.map((p, i) => (
              <Reveal key={p.id} delay={(i % 2) * 0.06} className={i === 0 ? "md:col-span-2" : ""}>
                <Link href={`/insights/${p.slug}`} className="group block h-full glass ring-gradient rounded-[28px] p-[clamp(24px,3vw,44px)] transition-all duration-300 hover:-translate-y-1 hover:bg-white/[0.06]">
                  <p className="text-[14px] text-muted">{formatDate(p.published_at)}</p>
                  <h2 className={`mt-3 font-semibold leading-tight tracking-[-0.03em] group-hover:text-accent ${i === 0 ? "text-[clamp(1.8rem,3.6vw,3.2rem)]" : "text-[24px]"}`}>{p.title}</h2>
                  <p className="mt-4 max-w-[40rem] text-[17px] leading-relaxed text-ink-2">{p.summary}</p>
                </Link>
              </Reveal>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
