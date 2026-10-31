import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { getPublicContentBySlug } from "@/lib/data/public";
import { Reveal, SplitWords } from "@/components/site/motion";
import { formatDate } from "@/lib/utils";

export async function generateMetadata({ params }: PageProps<"/insights/[slug]">): Promise<Metadata> {
  const p = await getPublicContentBySlug((await params).slug);
  return p ? { title: p.title, description: p.summary ?? undefined } : {};
}

export default async function InsightPage({ params }: PageProps<"/insights/[slug]">) {
  const post = await getPublicContentBySlug((await params).slug);
  if (!post || post.kind === "banner") notFound();
  return (
    <article className="frame pb-[clamp(96px,12vw,160px)] pt-[clamp(140px,16vw,200px)]">
      <Link href="/insights" className="inline-flex items-center gap-2 text-[14px] text-muted hover:text-ink"><ArrowLeft size={16} /> All insights</Link>
      <h1 className="headline mt-8 max-w-[20ch] text-[clamp(2.4rem,5.4vw,5rem)]"><SplitWords text={post.title} /></h1>
      <Reveal delay={0.3}>
        <p className="mt-6 text-[14px] text-muted">{formatDate(post.published_at)}</p>
        <p className="lede mt-8 max-w-[42rem]">{post.summary}</p>
        <div className="mt-10 max-w-[42rem] space-y-6 text-[18px] leading-[1.75] text-ink">
          {(post.body ?? "").split(/\n\n+/).map((para, i) => <p key={i}>{para}</p>)}
        </div>
        {post.media_asset_id && (
          <a href={`/api/media/${post.media_asset_id}`} className="mt-10 inline-flex rounded-full bg-surface-2 px-5 py-3 text-[15px] hover:bg-white/[0.09]">Download the attachment</a>
        )}
      </Reveal>
    </article>
  );
}
