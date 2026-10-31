import type { Metadata } from "next";
import { Cpu } from "lucide-react";
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { hasPlatformRole, requireEmployee } from "@/lib/authz/policy";
import { getViewer } from "@/lib/authz/viewer";
import { db } from "@/lib/supabase/server";
import { audit } from "@/lib/audit";
import { Empty, KV, Notice, PageHeader, Panel, Pill, Stat } from "@/components/portal/ui";
import { Button } from "@/components/ui/button";
import { formatDate, formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Federated learning" };

const allowed = (v: Awaited<ReturnType<typeof getViewer>>) => hasPlatformRole(v, "fl_coordinator") || hasPlatformRole(v, "portal_admin");

async function decide(fd: FormData) {
  "use server";
  const v = await getViewer();
  if (!allowed(v)) return;
  const id = String(fd.get("id"));
  const action = String(fd.get("action"));
  const note = String(fd.get("note") ?? "").trim();
  const { data: m } = await db().from("fl_model_versions").select("status, program_id").eq("id", id).single();
  if (!m || note.length < 10) return;
  const next: Record<string, string[]> = { candidate: ["approved", "rejected"], approved: ["deployed", "rejected"], deployed: ["rolled_back"] };
  if (!next[m.status]?.includes(action)) return;
  if (action === "deployed") {
    // One deployed version at a time; the previous one becomes the rollback target.
    await db().from("fl_model_versions").update({ status: "rolled_back", decision_note: "Superseded" }).eq("program_id", m.program_id).eq("status", "deployed");
  }
  await db().from("fl_model_versions").update({ status: action, decided_by: v!.userId, decision_note: note, decided_at: new Date().toISOString() }).eq("id", id);
  await audit(v, `fl.model_${action}`, "fl_model_version", id, { note });
  revalidatePath("/portal/fl");
}

type Metrics = Record<string, number | string>;

export default async function FlPage() {
  const v = await requireEmployee();
  if (!allowed(v)) notFound();
  const { data: prog } = await db().from("fl_programs").select("*").single();
  if (!prog) return <Empty title="No programme configured" />;
  const [{ data: parts }, { data: rounds }, { data: models }] = await Promise.all([
    db().from("fl_participants").select("status, consented_at, withdrawn_at, organizations(name)").eq("program_id", prog.id),
    db().from("fl_rounds").select("id, round_no, aggregation, config, status, completed_at, fl_update_log(participant_label, num_examples, update_norm, clipped, accepted, reason)").eq("program_id", prog.id).order("round_no", { ascending: false }),
    db().from("fl_model_versions").select("*").eq("program_id", prog.id).order("created_at", { ascending: false }),
  ]);
  const consented = (parts ?? []).filter((p) => p.status === "consented").length;

  return (
    <>
      <PageHeader icon={Cpu} title="Federated learning research" description="A separate, opt-in programme. Each client environment trains locally on its own synthetic records; only bounded model updates reach the coordinator. Centralising observations is not federated learning, and nothing here is deployed without a human decision." />
      <div className="mb-5 grid gap-4 sm:grid-cols-4">
        <Stat label="Consented participants" value={consented} hint={`Minimum ${prog.min_participants} per round`} />
        <Stat label="Rounds recorded" value={rounds?.length ?? 0} />
        <Stat label="Candidate models" value={(models ?? []).filter((m) => m.status === "candidate").length} />
        <Stat label="Deployed" value={(models ?? []).find((m) => m.status === "deployed")?.version ?? "None"} />
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <Panel title="Programme">
          <KV items={[["Task", prog.task], ["Model", prog.model], ["Features", (prog.feature_schema as string[]).join(", ")], ["Update clipping", `L2 ≤ ${prog.clip_norm}`], ["Status", prog.status]]} />
        </Panel>
        <Panel title="Participants" description="Consent is per organisation and separate from workspace membership and publishing consent.">
          <ul className="space-y-2">{(parts ?? []).map((p, i) => (
            <li key={i} className="flex items-center justify-between rounded-xl bg-white/[0.04] ring-1 ring-inset ring-white/[0.06] px-4 py-3 text-[14px]">
              {(p.organizations as unknown as { name: string }).name}
              <Pill tone={p.status === "consented" ? "good" : p.status === "withdrawn" ? "bad" : "neutral"}>{p.status}{p.consented_at ? ` · ${formatDate(p.consented_at)}` : ""}</Pill>
            </li>
          ))}</ul>
        </Panel>
      </div>

      <Panel className="mt-5" title="Model versions" description="Every aggregate is registered as a candidate. Approval and deployment are separate, recorded human decisions with a rollback path.">
        {(models ?? []).length === 0 ? (
          <Empty title="No rounds ingested yet">Run <code className="rounded bg-surface-2 px-1.5 py-0.5 text-[13px]">python fl/run_demo.py --ingest</code> to train locally in three isolated client environments and report the round here.</Empty>
        ) : (
          <ul className="space-y-4">{(models ?? []).map((m) => {
            const met = m.metrics as Metrics; const base = m.baseline as Metrics;
            return (
              <li key={m.id} className="rounded-xl bg-white/[0.04] ring-1 ring-inset ring-white/[0.06] p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-[16px] font-semibold">Global model {m.version}{m.parent_version && <span className="font-normal text-muted"> · from {m.parent_version}</span>}</p>
                  <Pill tone={m.status === "deployed" ? "good" : m.status === "approved" ? "info" : m.status === "candidate" ? "warn" : "neutral"}>{m.status.replace("_", " ")}</Pill>
                </div>
                <div className="mt-4 overflow-x-auto scroll-thin">
                  <table className="w-full min-w-[520px] text-[13px]">
                    <thead><tr className="text-left text-muted"><th className="py-1.5 font-medium">Holdout metric</th><th className="font-medium">Federated</th>{Object.keys(base).map((k) => <th key={k} className="font-medium">{k.replace(/_/g, " ")}</th>)}</tr></thead>
                    <tbody>{["auc", "accuracy", "log_loss"].filter((k) => k in met).map((k) => (
                      <tr key={k} className="border-t border-line"><td className="py-1.5">{k.toUpperCase().replace("_", " ")}</td><td className="font-medium text-accent">{Number(met[k]).toFixed(3)}</td>
                        {Object.values(base).map((b, i) => <td key={i}>{typeof b === "object" && b && k in (b as Metrics) ? Number((b as Metrics)[k]).toFixed(3) : "—"}</td>)}</tr>
                    ))}</tbody>
                  </table>
                </div>
                {m.decision_note && <p className="mt-3 text-[13px] text-ink-2">Decision: {m.decision_note} · {formatDateTime(m.decided_at)}</p>}
                {["candidate", "approved", "deployed"].includes(m.status) && (
                  <form action={decide} className="mt-4 flex flex-wrap gap-2">
                    <input type="hidden" name="id" value={m.id} />
                    <input name="note" placeholder="Decision rationale (required, 10+ chars)" required minLength={10} className="h-9 min-w-[240px] flex-1 rounded-lg bg-surface px-3 text-[13px] outline-none ring-1 ring-line focus:ring-accent" />
                    {m.status === "candidate" && <><Button size="sm" name="action" value="approved">Approve for deployment review</Button><Button size="sm" variant="danger" name="action" value="rejected">Reject</Button></>}
                    {m.status === "approved" && <><Button size="sm" name="action" value="deployed">Record deployment decision</Button><Button size="sm" variant="danger" name="action" value="rejected">Reject</Button></>}
                    {m.status === "deployed" && <Button size="sm" variant="danger" name="action" value="rolled_back">Roll back</Button>}
                  </form>
                )}
              </li>
            );
          })}</ul>
        )}
      </Panel>

      <Panel className="mt-5" title="Rounds and update validation" description="Coordinator logs hold update metadata only: no training examples, no raw records.">
        {(rounds ?? []).length === 0 ? <Empty title="No rounds yet" /> : (
          <ul className="space-y-4">{(rounds ?? []).map((r) => (
            <li key={r.id} className="rounded-xl bg-white/[0.04] ring-1 ring-inset ring-white/[0.06] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-[15px] font-medium">Round {r.round_no} · {r.aggregation}</p><Pill tone={r.status === "completed" ? "good" : "bad"}>{r.status}</Pill></div>
              <div className="mt-3 overflow-x-auto scroll-thin">
                <table className="w-full min-w-[560px] text-[13px]">
                  <thead><tr className="text-left text-muted"><th className="py-1 font-medium">Participant</th><th className="font-medium">Examples (local)</th><th className="font-medium">Update norm</th><th className="font-medium">Clipped</th><th className="font-medium">Result</th></tr></thead>
                  <tbody>{(r.fl_update_log as { participant_label: string; num_examples: number | null; update_norm: number | null; clipped: boolean | null; accepted: boolean; reason: string | null }[]).map((u) => (
                    <tr key={u.participant_label} className="border-t border-line"><td className="py-1.5">{u.participant_label}</td><td>{u.num_examples ?? "—"}</td><td>{u.update_norm != null ? Number(u.update_norm).toFixed(3) : "—"}</td><td>{u.clipped ? "yes" : "no"}</td>
                      <td>{u.accepted ? <span className="text-accent">accepted</span> : <span className="text-bad">rejected · {u.reason}</span>}</td></tr>
                  ))}</tbody>
                </table>
              </div>
              <p className="mt-2 font-mono text-[11px] text-muted">{JSON.stringify(r.config)}</p>
            </li>
          ))}</ul>
        )}
      </Panel>

      <div className="mt-5"><Notice tone="warn"><strong>Threat model, briefly.</strong> Model updates can leak information about local data, and a malicious participant can poison training. This demonstration clips update norms, rejects anomalous updates, requires a minimum cohort and simulates pairwise-masked secure aggregation. Differential privacy noise is illustrative with a declared, approximate accounting. Local data retention alone is not anonymity or regulatory compliance. See docs/federated-learning.md.</Notice></div>
    </>
  );
}
