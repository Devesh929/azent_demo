import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { hasPlatformRole, inEmployeeWorkspace, requireWorkspace } from "@/lib/authz/policy";
import { canSeeCommunity, offeringsMap } from "@/lib/data/learning";
import { db } from "@/lib/supabase/server";
import { IDEA_STATUS, type IdeaStatus } from "@/lib/constants";
import { KV, Notice, PageHeader, Panel, Pill } from "@/components/portal/ui";
import { IdeaStatusForm } from "@/components/portal/IdeaForms";
import { formatDate, formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Improvement idea" };

type IdeaRow = {
  id: string; title: string; status: IdeaStatus; team: string | null; offering_id: string | null; shared_update: string | null;
  client_visible: boolean; updated_at: string;
  // Employee-only columns; absent for clients.
  problem_statement?: string; proposed_outcome?: string; priority?: string; internal_notes?: string | null;
  themes?: { id: string; title: string } | null; profiles?: { display_name: string } | null;
};

const STEPS: IdeaStatus[] =["proposed", "under_review", "planned", "in_progress", "released"];

export default async function IdeaPage({ params }: PageProps<"/portal/ideas/[id]">) {
  const v = await requireWorkspace();
  if (!canSeeCommunity(v)) notFound();
  const { id } = await params;
  const employee = inEmployeeWorkspace(v);
  // Clients never receive internal columns, even ones the page would not render.
  const cols = employee
    ? "*, themes(id, title), profiles!improvement_ideas_owner_id_fkey(display_name)"
    : "id, title, status, team, offering_id, shared_update, client_visible, updated_at";
  const { data } = await db().from("improvement_ideas").select(cols).eq("id", id).maybeSingle();
  const idea = data as unknown as IdeaRow | null;
  if (!idea || (!employee && !idea.client_visible)) notFound();

  const [offerings, { data: ev }, { data: history }] = await Promise.all([
    offeringsMap(),
    db().from("idea_evidence").select("shared_contributions!inner(id, title, region, period_label, status)").eq("idea_id", id).eq("shared_contributions.status", "published"),
    employee ? db().from("idea_status_history").select("from_status, to_status, note, created_at, profiles(display_name)").eq("idea_id", id).order("created_at", { ascending: false }) : Promise.resolve({ data: [] }),
  ]);
  const status = idea.status as IdeaStatus;
  const step = STEPS.indexOf(status);
  const evidence = (ev ?? []).map((e) => e.shared_contributions as unknown as { id: string; title: string; region: string; period_label: string });
  const canEdit = hasPlatformRole(v, "product_owner");

  return (
    <>
      <PageHeader title={idea.title} back={{ href: "/portal/ideas", label: "Improvement ideas" }}
        description={<span className="flex flex-wrap items-center gap-2"><Pill tone={IDEA_STATUS[status].tone}>{IDEA_STATUS[status].label}</Pill>{idea.offering_id && <Pill>{offerings.get(idea.offering_id)?.name}</Pill>}{employee && !idea.client_visible && <Pill tone="warn">Internal only</Pill>}</span>} />

      <Panel className="mb-5">
        <div className="flex gap-2">
          {STEPS.map((s, i) => (
            <div key={s} className="flex-1">
              <div className={`h-1.5 rounded-full ${status === "not_proceeding" ? "bg-bad/40" : i <= step ? "bg-accent" : "bg-surface-3"}`} />
              <p className={`mt-2 text-[12px] ${i === step ? "text-accent" : "text-muted"}`}>{IDEA_STATUS[s].label}</p>
            </div>
          ))}
        </div>
        {status === "not_proceeding" && <p className="mt-3 text-[14px] text-bad">This idea is not proceeding.</p>}
      </Panel>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <div className="space-y-5">
          {!employee ? (
            <Panel title="Latest update">
              <p className="text-[16px] leading-relaxed">{idea.shared_update}</p>
              <p className="mt-3 text-[13px] text-muted">{idea.team} team · updated {formatDate(idea.updated_at)}</p>
              <div className="mt-4"><Notice tone="info">Status reflects current thinking and is not a delivery commitment.</Notice></div>
            </Panel>
          ) : (
            <Panel title="Idea">
              <KV items={[
                ["Problem", idea.problem_statement], ["Proposed outcome", idea.proposed_outcome],
                ["Owner", `${(idea.profiles as { display_name: string } | null)?.display_name ?? "—"} · ${idea.team ?? ""}`], ["Priority", idea.priority],
                ["Theme", idea.themes ? <Link href={`/portal/learning/themes/${idea.themes.id}`} className="text-accent hover:underline">{idea.themes.title}</Link> : "—"],
                ["Client message", idea.shared_update ?? "Not shared with clients"], ["Internal notes", idea.internal_notes ?? "—"],
              ]} />
            </Panel>
          )}
          <Panel title="Supporting evidence" description="Approved shared contributions only.">
            {evidence.length === 0 ? <p className="text-[14px] text-muted">No approved evidence is currently linked.</p> : (
              <ul className="space-y-2">{evidence.map((e) => (
                <li key={e.id}><Link href={`/portal/learning/${e.id}`} className="block rounded-xl bg-white/[0.04] ring-1 ring-inset ring-white/[0.06] p-4 hover:bg-white/[0.09]"><p className="text-[15px] font-medium">{e.title}</p><p className="mt-1 text-[12px] text-muted">{e.region} · {e.period_label}</p></Link></li>
              ))}</ul>
            )}
          </Panel>
        </div>
        {employee && (
          <div className="space-y-5">
            {canEdit && (
              <Panel title="Update status"><IdeaStatusForm id={id} status={status} sharedUpdate={idea.shared_update} internalNotes={idea.internal_notes ?? null} clientVisible={idea.client_visible} /></Panel>
            )}
            <Panel title="Status history" description="Append-only.">
              <ul className="space-y-2 text-[13px]">
                {(history ?? []).map((h, i) => (
                  <li key={i}>{h.from_status ? `${IDEA_STATUS[h.from_status as IdeaStatus].label} → ` : ""}<span className="text-ink">{IDEA_STATUS[h.to_status as IdeaStatus].label}</span>
                    <span className="text-muted"> · {(h.profiles as unknown as { display_name: string })?.display_name} · {formatDateTime(h.created_at)}</span>
                    {h.note && <p className="text-ink-2">{h.note}</p>}</li>
                ))}
              </ul>
            </Panel>
          </div>
        )}
      </div>
    </>
  );
}
