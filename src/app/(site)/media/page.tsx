import type { Metadata } from "next";
import { Download, PlayCircle } from "lucide-react";
import Link from "next/link";
import { PageIntro } from "@/components/site/PageIntro";
import { Reveal } from "@/components/site/motion";
import { OFFERINGS } from "@/content/catalog";
import { ProductVisual } from "@/components/site/ProductVisual";
import { getPublicContent } from "@/lib/data/public";

export const metadata: Metadata = { title: "Media" };

export default async function MediaPage() {
  const media = (await getPublicContent("media")).filter((m) => m.media_asset_id);
  return (
    <>
      <PageIntro title="See intelligence in action." lede="Product showcases built from the real interfaces, plus approved downloads. Everything here is cleared for public viewing." />
      <section className="frame pb-24">
        <h2 className="text-[clamp(1.6rem,2.6vw,2.2rem)] font-semibold tracking-[-0.03em]">Product showcases</h2>
        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {OFFERINGS.map((o, i) => (
            <Reveal key={o.slug} delay={(i % 3) * 0.05}>
              <Link href={`/products/${o.slug}`} className="group block glass ring-gradient rounded-[28px] p-6 transition-all duration-300 hover:-translate-y-1 hover:bg-white/[0.06]">
                <ProductVisual slug={o.slug} />
                <p className="mt-5 flex items-center gap-2 text-[15px] font-medium group-hover:text-accent"><PlayCircle size={18} /> {o.name}</p>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>
      <section className="frame pb-[clamp(96px,12vw,160px)]">
        <h2 className="text-[clamp(1.6rem,2.6vw,2.2rem)] font-semibold tracking-[-0.03em]">Downloads</h2>
        {media.length === 0 ? (
          <p className="mt-6 text-ink-2">No public downloads yet.</p>
        ) : (
          <ul className="mt-8 grid gap-3">
            {media.map((m) => (
              <li key={m.id}>
                <a href={`/api/media/${m.media_asset_id}`} className="flex items-center justify-between glass ring-gradient rounded-[22px] px-6 py-5 transition-all duration-300 hover:-translate-y-1 hover:bg-white/[0.06]">
                  <span><span className="block text-[17px] font-medium">{m.title}</span><span className="text-[14px] text-muted">{m.summary}</span></span>
                  <Download size={18} className="text-accent" />
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
