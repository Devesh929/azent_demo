import type { Metadata } from "next";
import { Plus, PenLine } from "lucide-react";
import { requireClient } from "@/lib/authz/policy";
import { db } from "@/lib/supabase/server";
import { OBS_CATEGORIES, OBS_STATUS, type ObsStatus } from "@/lib/constants";
import { Empty, ListRow, Notice, PageHeader, Panel, Pill, Tabs } from "@/components/portal/ui";
import { LinkButton } from "@/components/ui/button";
import { timeAgo } from "@/lib/utils";

export const metadata: Metadata = { title: "Observations" };

type Row = { id: string; title: string; category: keyof typeof OBS_CATEGORIES; status: ObsStatus; visibility: string; updated_at: string; author_id: string; profiles: { display_name: string } };

export default async function ObservationsPage({ searchParams }: PageProps<"/portal/observations">) {
  const v = await requireClient();
  const sp = await searchParams;
  const tab = sp.tab === "org" ? "org" : "mine";

  let q = db().from("observations").select("id, title, category, status, visibility, updated_at, author_id, profiles!observations_author_id_fkey(display_name)").eq("org_id", v.active.orgId);
  // "Ours" shows only drafts that colleagues chose to share inside the organisation.
  q = tab === "mine" ? q.eq("author_id", v.userId) : q.eq("visibility", "org").neq("author_id", v.userId);
  const { data } = await q.order("updated_at", { ascending: false });
  const rows = (data ?? []) as unknown as Row[];

  return (
    <>
      <PageHeader icon={PenLine}
        title="Observations"
        description="Record what you see in the market. Everything starts private. Sharing with the community is a separate, reviewed step."
        actions={<LinkButton href="/portal/observations/new"><Plus size={16} /> New observation</LinkButton>}
      />
      {sp.deleted === "1" && <div className="mb-4"><Notice tone="good">Draft deleted.</Notice></div>}
      <Tabs active={tab === "mine" ? "/portal/observations" : "/portal/observations?tab=org"}
        items={[{ href: "/portal/observations", label: "My observations" }, { href: "/portal/observations?tab=org", label: `${v.active.orgName.replace(" (Demo)", "")} observations` }]} />
      <Panel pad={false} className="p-2">
        {rows.length === 0 ? (
          <div className="p-3">
            <Empty title={tab === "mine" ? "No observations yet" : "Nothing shared inside your organisation yet"}>
              {tab === "mine" ? "Start a private draft. You decide later whether anyone else sees it." : "Colleagues can choose to make drafts visible to your organisation. They appear here, and never outside it by default."}
            </Empty>
          </div>
        ) : (
          <ul>
            {rows.map((r) => (
              <li key={r.id}>
                <ListRow
                  href={`/portal/observations/${r.id}`}
                  title={r.title}
                  meta={<>{OBS_CATEGORIES[r.category]} · {r.visibility === "org" ? "Visible to your organisation" : "Only the author"} · {tab === "org" ? `${r.profiles?.display_name} · ` : ""}updated {timeAgo(r.updated_at)}</>}
                  right={<Pill tone={OBS_STATUS[r.status].tone}>{OBS_STATUS[r.status].label}</Pill>}
                />
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
