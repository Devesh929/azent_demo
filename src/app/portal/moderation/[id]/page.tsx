import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { requirePlatformRole } from "@/lib/authz/policy";
import { db } from "@/lib/supabase/server";
import { getObservation, latestConsent } from "@/lib/data/learning";
import { coarsenRegion, periodLabel, redact, scanSensitive } from "@/lib/sensitive";
import { CONFIDENCE, EVIDENCE_TYPES, OBS_CATEGORIES, OBS_STATUS, type ObsStatus } from "@/lib/constants";
import { KV, Notice, PageHeader, Panel, Pill } from "@/components/portal/ui";
import { ModerationForm } from "@/components/portal/ModerationForm";
import { Button } from "@/components/ui/button";
import { claim } from "../actions";
import { formatDate, formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Review contribution" };

function highlight(text: string, matches: string[]) {
  if (!matches.length) return text;
  const re = new RegExp(`(${matches.map((m) => m.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "g");
  return text.split(re).map((part, i) => matches.includes(part) ? <mark key={i} className="rounded bg-warn-soft px-0.5 text-warn">{part}</mark> : part);
}

export default async function ReviewPage({ params }: PageProps<"/portal/moderation/[id]">) {
  const v = await requirePlatformRole("learning_moderator");
  const { id } = await params;
  const o = await getObservation(id);
  if (!o || o.status === "draft") notFound();

  const status = o.status as ObsStatus;
  const flags = scanSensitive(o.title, o.body);
  const consent = await latestConsent(id);
  const [{ data: org }, { data: offering }, { data: events }, { data: versions }] = await Promise.all([
    db().from("organizations").select("name").eq("id", o.org_id).single(),
    o.offering_id ? db().from("offerings").select("name").eq("id", o.offering_id).single() : Promise.resolve({ data: null }),
    db().from("moderation_events").select("action, reason_public, internal_note, created_at").eq("observation_id", id).order("created_at"),
    db().from("observation_versions").select("version, created_at").eq("observation_id", id).order("version", { ascending: false }),
  ]);
  // Duplicate check against approved shared copies with overlapping terms.
  const terms = o.title.toLowerCase().match(/[a-z]{5,}/g)?.slice(0, 6).join(" | ") ?? "";
  const { data: similar } = terms
    ? await db().from("search_documents").select("title, url").eq("source_type", "shared_contribution").textSearch("tsv", terms, { config: "english" }).limit(4)
    : { data: [] };

  const proposal = {
    title: o.title.replace(/\b(our|my)\b\s*/gi, ""),
    summary: redact(o.body, flags).replace(/\b(in|at) our [\w\s-]+? (branch|branches|cluster|office)\b/gi, "in one region").slice(0, 1500),
    region: coarsenRegion(o.region) ?? "",
    period_label: periodLabel(o.period_start, o.period_end),
  };

  return (
    <>
      <PageHeader title={o.title} back={{ href: "/portal/moderation", label: "Moderation" }}
        description={<span className="flex flex-wrap items-center gap-2"><Pill tone={OBS_STATUS[status].tone}>{OBS_STATUS[status].label}</Pill> From {org?.name} · version {o.version}</span>}
        actions={status === "submitted" ? <form action={claim}><input type="hidden" name="id" value={id} /><Button variant="secondary">Claim for review</Button></form> : o.moderator_id === v.userId ? <Pill tone="info">Assigned to you</Pill> : null} />

      <div className="grid gap-5 xl:grid-cols-2">
        <div className="space-y-5">
          <Panel title="Private source" description="Visible to moderators because it was submitted. It is never published as-is.">
            <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{highlight(o.body, flags.map((f) => f.match))}</p>
            <div className="mt-5"><KV items={[
              ["Type", OBS_CATEGORIES[o.category as keyof typeof OBS_CATEGORIES]], ["Offering", offering?.name ?? "None"],
              ["Period", `${formatDate(o.period_start)} – ${formatDate(o.period_end)}`], ["Region given", o.region ?? "—"],
              ["Evidence", EVIDENCE_TYPES[o.evidence_type as keyof typeof EVIDENCE_TYPES]], ["Confidence", CONFIDENCE[o.confidence as keyof typeof CONFIDENCE]],
              ["Links", o.links.length ? o.links.join(", ") : "None"],
            ]} /></div>
          </Panel>
          {flags.length > 0 && (
            <Notice tone="warn">
              <p className="flex items-center gap-2 font-medium"><ShieldAlert size={16} /> {flags.length} possible sensitive item(s)</p>
              <ul className="mt-1">{flags.map((f) => <li key={f.kind + f.match}>{f.label}: {f.match}</li>)}</ul>
              <p className="mt-1 text-[13px]">They are pre-redacted in the proposed copy. Automated checks are not a privacy guarantee: read the copy in full.</p>
            </Notice>
          )}
          <Panel title="Consent on record">
            {consent ? (
              <div className="flex flex-wrap gap-2">
                {([["Store & process", consent.store_process], ["Publish copy", consent.publish_shared], ["Attribution", consent.attribution], ["Model training", consent.training]] as const).map(([k, on]) => (
                  <Pill key={k} tone={on ? "good" : "neutral"}>{k}: {on ? "yes" : "no"}</Pill>
                ))}
              </div>
            ) : <p className="text-[14px] text-bad">No consent recorded. Do not publish.</p>}
          </Panel>
          {(similar ?? []).length > 0 && (
            <Panel title="Possible duplicates" description="Approved shared copies with overlapping terms.">
              <ul className="space-y-1 text-[14px]">{(similar ?? []).map((s) => <li key={s.url}><a href={s.url} className="text-accent hover:underline">{s.title}</a></li>)}</ul>
            </Panel>
          )}
          <Panel title="History">
            <ul className="space-y-2 text-[13px]">
              {(events ?? []).map((e, i) => (
                <li key={i}><span className="text-ink">{e.action.replace(/_/g, " ")}</span> <span className="text-muted">· {formatDateTime(e.created_at)}</span>
                  {e.reason_public && <p className="text-ink-2">To contributor: {e.reason_public}</p>}
                  {e.internal_note && <p className="text-warn">Internal: {e.internal_note}</p>}
                </li>
              ))}
              <li className="text-muted">{versions?.length ?? 1} version(s) on record</li>
            </ul>
          </Panel>
        </div>

        <Panel title={status === "published" || status === "unpublished" ? "Published copy controls" : "Proposed shared copy"}
          description="Only these reviewed fields are published. Tenant, author, links, flags and notes are never included.">
          <ModerationForm id={id} status={status} proposal={proposal} attributionAllowed={!!consent?.attribution} publishAllowed={!!consent?.publish_shared} />
        </Panel>
      </div>
    </>
  );
}
