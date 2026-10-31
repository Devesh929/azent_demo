import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Bookmark, BookmarkCheck, HelpCircle, ThumbsUp } from "lucide-react";
import { requireWorkspace } from "@/lib/authz/policy";
import { canSeeCommunity, getShared } from "@/lib/data/learning";
import { db } from "@/lib/supabase/server";
import { CONFIDENCE, EVIDENCE_TYPES, IDEA_STATUS, OBS_CATEGORIES, type IdeaStatus } from "@/lib/constants";
import { KV, PageHeader, Panel, Pill } from "@/components/portal/ui";
import { CommentForm, ReportForm } from "@/components/portal/LearningForms";
import { giveFeedback, toggleBookmark } from "../actions";
import { formatDate, timeAgo } from "@/lib/utils";

export const metadata: Metadata = { title: "Shared contribution" };

export default async function SharedPage({ params }: PageProps<"/portal/learning/[id]">) {
  const v = await requireWorkspace();
  const { id } = await params;
  const s = await getShared(id);
  if (!canSeeCommunity(v) || !s || s.status !== "published") notFound();

  const [{ data: offering }, { data: bm }, { data: fb }, { data: comments }, { data: themes }, { data: ideas }] = await Promise.all([
    s.offering_id ? db().from("offerings").select("name, slug").eq("id", s.offering_id).single() : Promise.resolve({ data: null }),
    db().from("bookmarks").select("shared_id").eq("user_id", v.userId).eq("shared_id", id).maybeSingle(),
    db().from("contribution_feedback").select("value").eq("user_id", v.userId).eq("shared_id", id).maybeSingle(),
    // Comment authors are shown by display name only; no organisation is attached.
    db().from("comments").select("id, body, created_at, profiles(display_name)").eq("parent_type", "shared_contribution").eq("parent_id", id).eq("status", "visible").order("created_at"),
    db().from("theme_contributions").select("themes(id, title)").eq("shared_id", id),
    db().from("idea_evidence").select("improvement_ideas(id, title, status, client_visible)").eq("shared_id", id),
  ]);
  const linkedIdeas = (ideas ?? []).map((r) => r.improvement_ideas as unknown as { id: string; title: string; status: IdeaStatus; client_visible: boolean })
    .filter((i) => i && (v.isEmployee && v.active.orgKind === "internal" ? true : i.client_visible));

  return (
    <>
      <PageHeader title={s.title} back={{ href: "/portal/learning", label: "Shared learning" }}
        description={<span className="flex flex-wrap gap-2"><Pill tone="info">{OBS_CATEGORIES[s.category as keyof typeof OBS_CATEGORIES]}</Pill>{offering && <Pill>{offering.name}</Pill>}<Pill tone="good">Reviewed · v{s.version}</Pill></span>}
        actions={<form action={toggleBookmark}><input type="hidden" name="id" value={id} />
          <button className="inline-flex h-10 items-center gap-2 rounded-full bg-surface-2 px-4 text-[14px] hover:bg-white/[0.09]">{bm ? <><BookmarkCheck size={16} className="text-accent" /> Bookmarked</> : <><Bookmark size={16} /> Bookmark</>}</button></form>} />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <div className="space-y-5">
          <Panel>
            <p className="text-[17px] leading-relaxed">{s.summary}</p>
            <div className="mt-6"><KV items={[
              ["Region", s.region ?? "Withheld"], ["Period", s.period_label], ["Industry", s.industry ?? "—"],
              ["Evidence", EVIDENCE_TYPES[s.evidence_type as keyof typeof EVIDENCE_TYPES]], ["Confidence", CONFIDENCE[s.confidence as keyof typeof CONFIDENCE]],
              ["Evidence quality (reviewer)", s.evidence_quality ?? "Not assessed"], ["Attribution", s.attribution_label ?? "Unattributed"], ["Published", formatDate(s.published_at)],
            ]} /></div>
          </Panel>
          <Panel title="Was this useful?" description="Quality feedback helps moderators and product owners. There are no leaderboards.">
            <div className="flex flex-wrap gap-2">
              {([["useful", "Useful", ThumbsUp, s.useful_count], ["needs_evidence", "Needs more evidence", HelpCircle, s.needs_evidence_count]] as const).map(([val, label, Icon, n]) => (
                <form key={val} action={giveFeedback}><input type="hidden" name="id" value={id} /><input type="hidden" name="value" value={val} />
                  <button className={`inline-flex h-10 items-center gap-2 rounded-full px-4 text-[14px] ${fb?.value === val ? "bg-accent-soft text-accent" : "bg-surface-2 hover:bg-white/[0.09]"}`}><Icon size={15} /> {label} <span className="tabular-nums text-muted">{n}</span></button>
                </form>
              ))}
            </div>
          </Panel>
          <Panel title={`Discussion (${comments?.length ?? 0})`}>
            <ul className="mb-5 space-y-3">
              {(comments ?? []).map((c) => (
                <li key={c.id} className="rounded-xl bg-white/[0.04] ring-1 ring-inset ring-white/[0.06] p-4">
                  <p className="text-[14px] leading-relaxed">{c.body}</p>
                  <p className="mt-2 text-[12px] text-muted">{(c.profiles as unknown as { display_name: string })?.display_name} · {timeAgo(c.created_at)}</p>
                </li>
              ))}
            </ul>
            <CommentForm id={id} />
          </Panel>
        </div>
        <div className="space-y-5">
          <Panel title="Themes">
            {(themes ?? []).length === 0 ? <p className="text-[14px] text-muted">Not yet grouped into a theme.</p> : (
              <ul className="space-y-2">{(themes ?? []).map((t) => { const th = t.themes as unknown as { id: string; title: string }; return <li key={th.id}><Link href={`/portal/learning/themes/${th.id}`} className="text-[15px] text-accent hover:underline">{th.title}</Link></li>; })}</ul>
            )}
          </Panel>
          <Panel title="Improvement ideas using this">
            {linkedIdeas.length === 0 ? <p className="text-[14px] text-muted">None visible to you yet.</p> : (
              <ul className="space-y-2">{linkedIdeas.map((i) => <li key={i.id} className="flex items-center justify-between gap-3"><Link href={`/portal/ideas/${i.id}`} className="text-[15px] hover:text-accent">{i.title}</Link><Pill tone={IDEA_STATUS[i.status].tone}>{IDEA_STATUS[i.status].label}</Pill></li>)}</ul>
            )}
          </Panel>
          <Panel><ReportForm id={id} /></Panel>
        </div>
      </div>
    </>
  );
}
