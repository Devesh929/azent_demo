import type { Metadata } from "next";
import { ShieldAlert, ShieldCheck } from "lucide-react";
import { requirePlatformRole } from "@/lib/authz/policy";
import { db } from "@/lib/supabase/server";
import { OBS_STATUS, type ObsStatus } from "@/lib/constants";
import { Empty, ListRow, PageHeader, Panel, Pill, Stat } from "@/components/portal/ui";
import { Button } from "@/components/ui/button";
import { resolveReport } from "./actions";
import { timeAgo } from "@/lib/utils";

export const metadata: Metadata = { title: "Moderation" };

type Q = { id: string; title: string; status: ObsStatus; submitted_at: string | null; sensitive_flags: unknown[]; organizations: { name: string } };

export default async function ModerationPage() {
  await requirePlatformRole("learning_moderator");
  // Drafts are excluded at the query: moderators never see unsubmitted work.
  const { data } = await db().from("observations")
    .select("id, title, status, submitted_at, sensitive_flags, organizations(name)")
    .in("status", ["submitted", "in_review", "returned", "unpublished"]).order("submitted_at", { ascending: true });
  const queue = (data ?? []) as unknown as Q[];
  const { data: reports } = await db().from("reports").select("id, reason, details, status, created_at, shared_id, shared_contributions(title)").neq("status", "resolved").order("created_at");
  const waiting = queue.filter((q) => q.status === "submitted" || q.status === "in_review");

  return (
    <>
      <PageHeader icon={ShieldCheck} title="Moderation" description="Review proposed contributions, prepare de-identified shared copies, and handle reports. You see submitted work only, never unsubmitted drafts." />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Stat label="Awaiting review" value={waiting.length} />
        <Stat label="Flagged for sensitive content" value={waiting.filter((q) => q.sensitive_flags?.length).length} tone="warn" />
        <Stat label="Open reports" value={reports?.length ?? 0} />
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <Panel title="Review queue" pad={false} className="p-2">
          {queue.length === 0 ? <div className="p-3"><Empty title="The queue is clear" /></div> : (
            <ul>
              {queue.map((q) => (
                <li key={q.id}>
                  <ListRow href={`/portal/moderation/${q.id}`} title={q.title}
                    meta={<>{q.organizations?.name} · submitted {timeAgo(q.submitted_at)}</>}
                    right={<span className="flex items-center gap-2">
                      {q.sensitive_flags?.length > 0 && <Pill tone="warn"><ShieldAlert size={12} /> {q.sensitive_flags.length}</Pill>}
                      <Pill tone={OBS_STATUS[q.status].tone}>{OBS_STATUS[q.status].label}</Pill>
                    </span>} />
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="Reports" description="Reporters are never asked to name another client, and contributors are never named to reporters.">
          {(reports ?? []).length === 0 ? <Empty title="No open reports" /> : (
            <ul className="space-y-3">
              {(reports ?? []).map((r) => (
                <li key={r.id} className="rounded-xl bg-white/[0.04] ring-1 ring-inset ring-white/[0.06] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[15px] font-medium">{(r.shared_contributions as unknown as { title: string })?.title}</p>
                    <Pill tone="warn">{r.reason}</Pill>
                  </div>
                  {r.details && <p className="mt-2 text-[14px] text-ink-2">{r.details}</p>}
                  <p className="mt-2 text-[12px] text-muted">{timeAgo(r.created_at)}</p>
                  <form action={resolveReport} className="mt-3 flex flex-wrap gap-2">
                    <input type="hidden" name="report_id" value={r.id} />
                    <input name="decision" placeholder="Decision shared with the reporter" className="h-9 min-w-0 flex-1 rounded-lg bg-surface px-3 text-[13px] outline-none ring-1 ring-line focus:ring-accent" />
                    <Button size="sm" variant="secondary">Resolve</Button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
