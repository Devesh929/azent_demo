import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Bookmark, Download, ThumbsUp, X, Network } from "lucide-react";
import { requireWorkspace } from "@/lib/authz/policy";
import { canSeeCommunity, feedFacets, offeringsMap, sharedFeed, type FeedFilter } from "@/lib/data/learning";
import { db } from "@/lib/supabase/server";
import { OBS_CATEGORIES, CONFIDENCE } from "@/lib/constants";
import { Empty, PageHeader, Panel, Pill } from "@/components/portal/ui";
import { Button } from "@/components/ui/button";
import { deleteSavedSearch, saveSearch } from "./actions";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Shared learning" };

const KEYS = ["q", "offering", "industry", "region", "period", "category", "saved"] as const;
const sel = "h-10 rounded-full bg-surface-2 px-4 text-[13px] text-ink outline-none ring-1 ring-line focus:ring-accent";

export default async function LearningPage({ searchParams }: PageProps<"/portal/learning">) {
  const v = await requireWorkspace();
  if (!canSeeCommunity(v)) notFound();
  const sp = await searchParams;
  const f = Object.fromEntries(KEYS.map((k) => [k, typeof sp[k] === "string" ? sp[k] : undefined])) as FeedFilter & { saved?: string };

  const [{ rows, total }, facets, offerings, { data: bms }, { data: saved }] = await Promise.all([
    sharedFeed(v, f),
    feedFacets(),
    offeringsMap(),
    db().from("bookmarks").select("shared_id").eq("user_id", v.userId),
    db().from("saved_searches").select("id, name, query").eq("user_id", v.userId).order("created_at", { ascending: false }),
  ]);
  const bookmarked = new Set((bms ?? []).map((b) => b.shared_id));
  const shown = f.saved === "bookmarks" ? rows.filter((r) => bookmarked.has(r.id)) : rows;
  const qs = new URLSearchParams(Object.entries(f).filter(([k, val]) => val && k !== "saved") as [string, string][]).toString();

  return (
    <>
      <PageHeader icon={Network} title="Shared learning"
        description="Approved, de-identified contributions from across the learning community. Everything here passed moderation; private drafts and organisation-only notes never appear."
        actions={<a href={`/portal/learning/export?${qs}`} className="inline-flex h-10 items-center gap-2 rounded-full bg-surface-2 px-4 text-[14px] hover:bg-white/[0.09]"><Download size={15} /> Export CSV</a>} />

      <form className="mb-4 flex flex-wrap items-center gap-2" role="search">
        <input name="q" defaultValue={f.q} placeholder="Search shared learning" aria-label="Search shared learning" className={`${sel} min-w-[220px] flex-1`} />
        <select name="offering" defaultValue={f.offering ?? ""} className={sel} aria-label="Offering"><option value="">All offerings</option>{[...offerings.values()].map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}</select>
        <select name="category" defaultValue={f.category ?? ""} className={sel} aria-label="Topic"><option value="">All topics</option>{Object.entries(OBS_CATEGORIES).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
        <select name="industry" defaultValue={f.industry ?? ""} className={sel} aria-label="Industry"><option value="">All industries</option>{facets.industries.map((x) => <option key={x}>{x}</option>)}</select>
        <select name="region" defaultValue={f.region ?? ""} className={sel} aria-label="Region"><option value="">All regions</option>{facets.regions.map((x) => <option key={x}>{x}</option>)}</select>
        <select name="period" defaultValue={f.period ?? ""} className={sel} aria-label="Observation period"><option value="">All periods</option>{facets.periods.map((x) => <option key={x}>{x}</option>)}</select>
        <Button type="submit" size="md">Apply</Button>
      </form>

      <div className="mb-6 flex flex-wrap items-center gap-2 text-[13px]">
        <Link href="/portal/learning" className={`rounded-full px-3 py-1.5 ${!f.saved ? "bg-surface-3 text-ink" : "bg-surface text-muted"}`}>All</Link>
        <Link href="/portal/learning?saved=bookmarks" className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 ${f.saved === "bookmarks" ? "bg-surface-3 text-ink" : "bg-surface text-muted"}`}><Bookmark size={13} /> Bookmarks</Link>
        {(saved ?? []).map((s) => (
          <span key={s.id} className="flex items-center rounded-full bg-surface">
            <Link href={`/portal/learning?${new URLSearchParams(s.query as Record<string, string>)}`} className="py-1.5 pl-3 pr-1 text-ink-2 hover:text-ink">{s.name}</Link>
            <form action={deleteSavedSearch}><input type="hidden" name="id" value={s.id} /><button className="grid size-7 place-items-center text-muted hover:text-bad" aria-label={`Delete saved search ${s.name}`}><X size={13} /></button></form>
          </span>
        ))}
        {qs && (
          <form action={saveSearch} className="flex items-center gap-1.5">
            {Object.entries(f).filter(([k, val]) => val && k !== "saved").map(([k, val]) => <input key={k} type="hidden" name={k} value={val} />)}
            <input name="name" placeholder="Name this search" className="h-8 rounded-full bg-surface px-3 text-[13px] outline-none ring-1 ring-line focus:ring-accent" />
            <Button size="sm" variant="secondary">Save search</Button>
          </form>
        )}
      </div>

      <p className="mb-3 text-[13px] text-muted">{f.saved === "bookmarks" ? shown.length : total} approved contribution{total === 1 ? "" : "s"}</p>
      {shown.length === 0 ? <Empty title="Nothing matches these filters">Counts and results follow the same visibility rules as the records themselves.</Empty> : (
        <ul className="grid gap-3 md:grid-cols-2">
          {shown.map((s) => (
            <li key={s.id}>
              <Link href={`/portal/learning/${s.id}`} className="flex h-full flex-col glass ring-gradient rounded-[22px] p-5 transition-all duration-300 hover:-translate-y-1 hover:bg-white/[0.06]">
                <div className="flex flex-wrap items-center gap-2">
                  <Pill tone="info">{OBS_CATEGORIES[s.category as keyof typeof OBS_CATEGORIES]}</Pill>
                  {s.offering_id && <Pill>{offerings.get(s.offering_id)?.name}</Pill>}
                  {bookmarked.has(s.id) && <Bookmark size={14} className="text-accent" />}
                </div>
                <p className="mt-3 text-[16px] font-medium leading-snug">{s.title}</p>
                <p className="mt-2 line-clamp-3 text-[14px] leading-relaxed text-ink-2">{s.summary}</p>
                <p className="mt-auto pt-4 text-[12px] text-muted">
                  {[s.region, s.period_label, `${CONFIDENCE[s.confidence as keyof typeof CONFIDENCE]} confidence`, s.attribution_label].filter(Boolean).join(" · ")}
                  <span className="ml-2 inline-flex items-center gap-1"><ThumbsUp size={11} /> {s.useful_count}</span> · {formatDate(s.published_at)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <Panel className="mt-8" title="Where are the numbers?">
        <p className="text-[14px] leading-relaxed text-ink-2">Trend statistics live in <Link href="/portal/learning/themes" className="text-accent hover:underline">Themes</Link>, where counts appear only when at least three distinct organisations contribute. Popularity is never presented as market prevalence.</p>
      </Panel>
    </>
  );
}
