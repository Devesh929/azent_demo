import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowRight, Check } from "lucide-react";
import { OFFERINGS, offeringBySlug } from "@/content/catalog";
import { PageIntro } from "@/components/site/PageIntro";
import { ProductVisual } from "@/components/site/ProductVisual";
import { Reveal } from "@/components/site/motion";
import { buttonClass } from "@/components/ui/button";

export function generateStaticParams() {
  return OFFERINGS.map((o) => ({ slug: o.slug }));
}

export async function generateMetadata({ params }: PageProps<"/products/[slug]">): Promise<Metadata> {
  const o = offeringBySlug((await params).slug);
  return o ? { title: o.name, description: o.summary } : {};
}

export default async function ProductPage({ params }: PageProps<"/products/[slug]">) {
  const o = offeringBySlug((await params).slug);
  if (!o) notFound();
  const others = OFFERINGS.filter((x) => x.slug !== o.slug).slice(0, 3);

  return (
    <>
      <PageIntro title={o.name} lede={o.tagline} aside={<ProductVisual slug={o.slug} />}>
        <div className="flex flex-wrap gap-3">
          <Link href={`/demo?offering=${o.slug}`} className={buttonClass("primary", "lg")}>Book a demo <ArrowRight size={16} /></Link>
          <Link href="/login" className={buttonClass("quiet", "lg")}>Open the sandbox</Link>
        </div>
      </PageIntro>

      <section className="frame grid gap-16 pb-[clamp(96px,12vw,160px)] lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <Reveal>
          <h2 className="text-[clamp(1.8rem,3vw,2.6rem)] font-semibold tracking-[-0.03em]">What it does</h2>
          <p className="mt-6 text-[19px] leading-[1.65] text-ink-2">{o.description}</p>
          <h2 className="mt-16 text-[clamp(1.8rem,3vw,2.6rem)] font-semibold tracking-[-0.03em]">Capabilities</h2>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {o.capabilities.map((c) => (
              <li key={c} className="flex gap-3 glass ring-gradient rounded-[22px] px-5 py-4 text-[16px]">
                <Check size={18} className="mt-0.5 shrink-0 text-accent" /> {c}
              </li>
            ))}
          </ul>
        </Reveal>
        <Reveal delay={0.1} className="lg:pt-2">
          <div className="rounded-[28px] bg-accent p-8 text-accent-ink">
            <h2 className="text-[22px] font-semibold tracking-[-0.02em]">Outcomes clients look for</h2>
            <ul className="mt-5 space-y-3">
              {o.outcomes.map((x) => (
                <li key={x} className="flex gap-3 text-[16px] font-medium"><Check size={18} className="mt-0.5 shrink-0" /> {x}</li>
              ))}
            </ul>
          </div>
          <div className="mt-5 glass ring-gradient rounded-[28px] p-8">
            <h2 className="text-[18px] font-semibold">Clients shape this product</h2>
            <p className="mt-3 text-[15px] leading-relaxed text-ink-2">
              Entitled clients can try {o.name} in a sandbox with synthetic data and propose observations that feed our improvement ideas. Sharing is always their choice.
            </p>
            <Link href="/learning" className="mt-4 inline-flex text-[15px] font-medium text-accent hover:underline">How collective learning works</Link>
          </div>
        </Reveal>
      </section>

      <section className="bg-ground-2 py-[clamp(80px,10vw,140px)]">
        <div className="frame">
          <h2 className="text-[clamp(1.8rem,3vw,2.6rem)] font-semibold tracking-[-0.03em]">Related products</h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {others.map((x) => (
              <Link key={x.slug} href={`/products/${x.slug}`} className="group glass ring-gradient rounded-[28px] p-7 transition-all duration-300 hover:-translate-y-1 hover:bg-white/[0.06]">
                <p className="text-[13px] text-accent">{x.kicker}</p>
                <h3 className="mt-2 text-[22px] font-semibold tracking-[-0.02em] group-hover:text-accent">{x.name}</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-ink-2">{x.tagline}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
