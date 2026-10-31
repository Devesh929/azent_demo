import Link from "next/link";
import type { Metadata } from "next";
import { Search as SearchIcon } from "lucide-react";
import { getViewerSafe, isDatabaseConfigured } from "@/lib/data/public";
import { search } from "@/lib/data/search";
import { AUDIENCE_LABEL } from "@/lib/constants";
import { AiraChat } from "@/components/portal/AiraChat";

export const metadata: Metadata = { title: "Search" };

const TYPE_LABEL: Record<string, string> = { offering: "Product", content: "Article", shared_contribution: "Shared observation", theme: "Theme", session: "Session" };

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const { q } = await searchParams;
  const query = typeof q === "string" ? q : "";
  const viewer = await getViewerSafe();
  const result = query && isDatabaseConfigured() ? await search(viewer, query, { limit: 30 }) : { hits: [], total: 0 };

  return (
    <section className="frame min-h-[70vh] pb-32 pt-[clamp(140px,16vw,200px)]">
      <h1 className="headline text-[clamp(2.4rem,5vw,4.4rem)]">Search azentio.ai</h1>
      <form className="relative mt-10 max-w-3xl" role="search">
        <SearchIcon size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-muted" />
        <input name="q" defaultValue={query} placeholder="Try “seasonality” or “validation”" aria-label="Search"
          className="h-16 w-full rounded-full bg-surface pl-14 pr-6 text-[17px] text-ink outline-none ring-1 ring-line placeholder:text-muted focus:ring-2 focus:ring-accent" />
      </form>
      <p className="mt-4 text-[14px] text-muted">
        {viewer ? "Results include only what your active workspace may open." : "Showing public results. Sign in to search your workspace and shared learning."}
      </p>
      <div className="mt-12 max-w-3xl">
        <h2 className="mb-4 text-[20px] font-semibold tracking-[-0.02em]">Or ask AIRA</h2>
        <AiraChat compact suggestions={["What does Credit Strategy Simulator do?", "How does collective learning protect contributors?", "Which product helps with regulatory reporting?"]} />
      </div>
      {query && (
        <div className="mt-12">
          <p className="text-[15px] text-ink-2">{result.total} result{result.total === 1 ? "" : "s"} for “{query}”</p>
          <ul className="mt-6 space-y-3">
            {result.hits.map((h) => (
              <li key={h.source_type + h.source_id}>
                <Link href={h.url} className="block glass ring-gradient rounded-[22px] px-6 py-5 transition-all duration-300 hover:-translate-y-1 hover:bg-white/[0.06]">
                  <p className="text-[13px] text-muted">{TYPE_LABEL[h.source_type] ?? h.source_type} · {AUDIENCE_LABEL[h.audience as keyof typeof AUDIENCE_LABEL]}</p>
                  <p className="mt-1 text-[18px] font-medium">{h.title}</p>
                  <p className="mt-1 line-clamp-2 text-[15px] text-ink-2">{h.body}</p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
