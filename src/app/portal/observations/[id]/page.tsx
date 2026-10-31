import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Eye, Lock, Users, Globe2 } from "lucide-react";
import { requireClient } from "@/lib/authz/policy";
import { db } from "@/lib/supabase/server";
import { canEditObservation, canReadObservation, getObservation, latestConsent, SHARED_COLUMNS, type Shared } from "@/lib/data/learning";
import { CONFIDENCE, EVIDENCE_TYPES, OBS_CATEGORIES, OBS_STATUS, type ObsStatus } from "@/lib/constants";
import { KV, Notice, PageHeader, Panel, Pill } from "@/components/portal/ui";
import { ObservationForm } from "@/components/portal/ObservationForm";
import { ConsentPanel, SubmitPanel, WithdrawPanel } from "@/components/portal/ObservationActions";
import { Button } from "@/components/ui/button";
import { deleteDraft } from "../actions";
import { formatDate, formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Observation" };

export default async function ObservationPage({ params, searchParams }: PageProps<"/portal/observations/[id]">) {
  const v = await requireClient();
  const { id } = await params;
  const sp = await searchParams;
  const o = await getObservation(id);
  // Not found and not allowed look identical, so existence is never disclosed.
  if (!o || !canReadObservation(v, o)) notFound();

  const isAuthor = o.author_id === v.userId;
  const status = o.status as ObsStatus;
  const [{ data: offerings }, consent, { data: events }, { data: consents }, { data: src }] = await Promise.all([
    db().from("offerings").select("id, name").order("sort"),
    latestConsent(id),
    // reason_public only. Internal reviewer notes never reach contributors.
    db().from("moderation_events").select("id, action, from_status, to_status, reason_public, created_at").eq("observation_id", id).order("created_at"),
    db().from("consent_records").select("store_process, publish_shared, attribution, training, note, created_at").eq("observation_id", id).order("created_at", { ascending: false }),
    db().from("shared_sources").select("shared_id").eq("observation_id", id).maybeSingle(),
  ]);
  let shared: (Shared & { status: string }) | null = null;
  if (src) {
    const { data } = await db().from("shared_contributions").select(SHARED_COLUMNS + ", status").eq("id", src.shared_id).single();
    shared = data as unknown as Shared & { status: string };
  }
  const offering = offerings?.find((x) => x.id === o.offering_id)?.name;
  const editable = isAuthor && canEditObservation(v, o);

  const audiences = [
    { icon: Lock, who: "You", what: "The full original, every version and its history.", on: true },
    { icon: Users, who: `${v.active.orgName} members`, what: "The original, because you chose organisation visibility.", on: o.visibility === "org" },
    { icon: Eye, who: "Learning moderators", what: "The original, only after you submit it for review.", on: status !== "draft" },
    { icon: Globe2, who: "Learning community", what: "Only the moderator's reviewed, de-identified copy. Never this original, your name or your organisation unless you opt in.", on: !!shared && shared.status === "published" },
  ];

  return (
    <>
      <PageHeader title={o.title} back={{ href: "/portal/observations", label: "Observations" }}
        description={<span className="flex flex-wrap items-center gap-2"><Pill tone={OBS_STATUS[status].tone}>{OBS_STATUS[status].label}</Pill> {OBS_STATUS[status].help}</span>} />

      {sp.saved === "1" && <div className="mb-6"><Notice tone="good">Private draft saved. Nothing has been shared.</Notice></div>}
      {status === "returned" && o.return_reason && <div className="mb-6"><Notice tone="warn"><strong>Moderator request:</strong> {o.return_reason}</Notice></div>}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <div className="space-y-5">
          {editable ? (
            <Panel title="Your observation" description={`Version ${o.version}`}>
              <ObservationForm offerings={offerings ?? []} published={status === "published"}
                initial={{ ...o, offering_id: o.offering_id ?? "", industry: o.industry ?? "", region: o.region ?? "", links: o.links }} />
            </Panel>
          ) : (
            <Panel title="Observation" description={`Version ${o.version}`}>
              <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-ink">{o.body}</p>
              <div className="mt-5"><KV items={[
                ["Type", OBS_CATEGORIES[o.category as keyof typeof OBS_CATEGORIES]], ["Offering", offering ?? "None"],
                ["Period", `${formatDate(o.period_start)} – ${formatDate(o.period_end)}`],
                ["Evidence", EVIDENCE_TYPES[o.evidence_type as keyof typeof EVIDENCE_TYPES]], ["Confidence", CONFIDENCE[o.confidence as keyof typeof CONFIDENCE]],
              ]} /></div>
            </Panel>
          )}

          {isAuthor && ["draft", "returned"].includes(status) && (
            <Panel title="Propose for the learning community" description="Choose each permission separately. A moderator reviews and de-identifies a copy before anything is shared.">
              <SubmitPanel id={o.id} />
            </Panel>
          )}

          {shared && (
            <Panel title="What the community sees" description={`Shared copy · version ${shared.version} · ${shared.status}`}>
              <p className="text-[16px] font-medium">{shared.title}</p>
              <p className="mt-2 text-[15px] leading-relaxed text-ink-2">{shared.summary}</p>
              <p className="mt-3 text-[13px] text-muted">{shared.region ?? "Region withheld"} · {shared.period_label} · {shared.attribution_label ?? "Unattributed"}</p>
            </Panel>
          )}

          {isAuthor && ["submitted", "in_review", "returned", "published", "unpublished"].includes(status) && (
            <Panel title="Withdraw"><WithdrawPanel id={o.id} /></Panel>
          )}
          {isAuthor && status === "draft" && (
            <form action={deleteDraft}><input type="hidden" name="id" value={o.id} /><Button variant="ghost" size="sm">Delete this draft</Button></form>
          )}
        </div>

        <div className="space-y-5">
          <Panel title="Who can see this">
            <ul className="space-y-3">
              {audiences.map((a) => (
                <li key={a.who} className={`flex gap-3 rounded-xl p-3 ${a.on ? "bg-surface-2" : "opacity-45"}`}>
                  <a.icon size={18} className={a.on ? "mt-0.5 text-accent" : "mt-0.5 text-muted"} />
                  <span><span className="block text-[14px] font-medium">{a.who}{!a.on && " · not now"}</span><span className="text-[13px] text-ink-2">{a.what}</span></span>
                </li>
              ))}
            </ul>
          </Panel>

          {isAuthor && consent && (
            <Panel title="Permissions" description="Narrowing takes effect immediately. Widening always goes back through review.">
              <ConsentPanel id={o.id} current={{ store_process: consent.store_process, publish_shared: consent.publish_shared, attribution: consent.attribution, training: consent.training }} />
            </Panel>
          )}

          <Panel title="History">
            <ol className="space-y-3 text-[14px]">
              <li className="text-ink-2">Created {formatDateTime(o.created_at)}</li>
              {(events ?? []).map((e) => (
                <li key={e.id}>
                  <span className="text-ink">{e.action.replace(/_/g, " ")}</span> <span className="text-muted">· {formatDateTime(e.created_at)}</span>
                  {e.reason_public && <p className="mt-0.5 text-[13px] text-ink-2">{e.reason_public}</p>}
                </li>
              ))}
            </ol>
          </Panel>

          {(consents ?? []).length > 0 && (
            <Panel title="Consent history" description="Every change is recorded and kept under the retention policy.">
              <ul className="space-y-2 text-[13px]">
                {(consents ?? []).map((c, i) => (
                  <li key={i} className="rounded-lg bg-surface-2 px-3 py-2">
                    <span className="text-muted">{formatDateTime(c.created_at)}</span>
                    <span className="mt-1 flex flex-wrap gap-1.5">
                      {([["Store", c.store_process], ["Publish", c.publish_shared], ["Attribute", c.attribution], ["Training", c.training]] as const).map(([k, on]) => (
                        <Pill key={k} tone={on ? "good" : "neutral"}>{k}: {on ? "yes" : "no"}</Pill>
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </div>
      </div>
    </>
  );
}
