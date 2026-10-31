import type { Metadata } from "next";
import { Plus, Lightbulb } from "lucide-react";
import { notFound } from "next/navigation";
import { hasPlatformRole, inEmployeeWorkspace, requireWorkspace } from "@/lib/authz/policy";
import { canSeeCommunity, offeringsMap } from "@/lib/data/learning";
import { db } from "@/lib/supabase/server";
import { IDEA_STATUS, type IdeaStatus } from "@/lib/constants";
import { Empty, ListRow, PageHeader, Panel, Pill } from "@/components/portal/ui";
import { LinkButton } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Improvement ideas" };

export default async function IdeasPage() {
  const v = await requireWorkspace();
  if (!canSeeCommunity(v)) notFound();
  const employee = inEmployeeWorkspace(v);
  // Clients get only ideas explicitly shared with them, and only the client-safe columns.
  let q = db().from("improvement_ideas").select(employee ? "id, title, status, team, priority, offering_id, client_visible, updated_at" : "id, title, status, team, offering_id, shared_update, updated_at");
  if (!employee) q = q.eq("client_visible", true);
  const [{ data }, offerings] = await Promise.all([q.order("updated_at", { ascending: false }), offeringsMap()]);
  const ideas = (data ?? []) as unknown as { id: string; title: string; status: IdeaStatus; team: string | null; priority?: string; offering_id: string | null; client_visible?: boolean; shared_update?: string | null; updated_at: string }[];

  return (
    <>
      <PageHeader icon={Lightbulb} title="Improvement ideas"
        description={employee ? "Ideas linked to approved evidence. Status changes are audited and contributors hear about shared updates." : "Ideas our product teams have shared with clients, with a plain-language status. A status is not a delivery commitment."}
        actions={hasPlatformRole(v, "product_owner") ? <LinkButton href="/portal/ideas/new"><Plus size={16} /> New idea</LinkButton> : undefined} />
      <Panel pad={false} className="p-2">
        {ideas.length === 0 ? <div className="p-3"><Empty title="No ideas shared yet">When product teams act on themes from the learning community, their updates appear here.</Empty></div> : (
          <ul>
            {ideas.map((i) => (
              <li key={i.id}>
                <ListRow href={`/portal/ideas/${i.id}`} title={i.title}
                  meta={<>{[i.offering_id && offerings.get(i.offering_id)?.name, i.team && `${i.team} team`, `updated ${formatDate(i.updated_at)}`].filter(Boolean).join(" · ")}{employee && !i.client_visible && " · internal only"}</>}
                  right={<Pill tone={IDEA_STATUS[i.status].tone}>{IDEA_STATUS[i.status].label}</Pill>}>
                  {!employee && i.shared_update && <p className="mt-2 text-[14px] text-ink-2">{i.shared_update}</p>}
                </ListRow>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
