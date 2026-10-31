import type { Metadata } from "next";
import { BookOpen } from "lucide-react";
import { requireWorkspace, inEmployeeWorkspace } from "@/lib/authz/policy";
import { visibleContent } from "@/lib/data/portal";
import { AUDIENCE_LABEL } from "@/lib/constants";
import { Empty, ListRow, PageHeader, Panel, Pill, Tabs } from "@/components/portal/ui";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Library" };

const KIND_LABEL: Record<string, string> = {
  knowledge: "Knowledge", prototype_note: "Prototype note", experiment: "Experiment", broadcast: "Broadcast",
  release_note: "Release note", briefing: "Briefing", resource: "Resource", insight: "Insight", media: "Media",
};

export default async function LibraryPage({ searchParams }: PageProps<"/portal/library">) {
  const v = await requireWorkspace();
  const { kind } = await searchParams;
  const all = await visibleContent(v);
  const kinds = [...new Set(all.map((c) => c.kind))];
  const items = typeof kind === "string" ? all.filter((c) => c.kind === kind) : all;

  return (
    <>
      <PageHeader icon={BookOpen} title={inEmployeeWorkspace(v) ? "Knowledge library" : "Resources"}
        description={inEmployeeWorkspace(v) ? "Internal knowledge with owners and review dates, prototype notes, broadcasts and release notes. None of it reaches public or client search." : "Briefings, release notes and guides for your organisation and the offerings you use."} />
      <Tabs active={typeof kind === "string" ? `/portal/library?kind=${kind}` : "/portal/library"}
        items={[{ href: "/portal/library", label: "All", count: all.length }, ...kinds.map((k) => ({ href: `/portal/library?kind=${k}`, label: KIND_LABEL[k] ?? k, count: all.filter((c) => c.kind === k).length }))]} />
      <Panel pad={false} className="p-2">
        {items.length === 0 ? <div className="p-3"><Empty title="Nothing here yet" /></div> : (
          <ul>{items.map((c) => (
            <li key={c.id}><ListRow href={`/portal/library/${c.id}`} title={c.title}
              meta={[KIND_LABEL[c.kind], c.review_due && `review by ${formatDate(c.review_due)}`, formatDate(c.published_at)].filter(Boolean).join(" · ")}
              right={<Pill tone={c.audience === "employees" ? "info" : c.audience === "org" ? "good" : "neutral"}>{AUDIENCE_LABEL[c.audience as keyof typeof AUDIENCE_LABEL]}</Pill>} /></li>
          ))}</ul>
        )}
      </Panel>
    </>
  );
}
