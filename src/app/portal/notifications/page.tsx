import type { Metadata } from "next";
import { Bell } from "lucide-react";
import { revalidatePath } from "next/cache";
import { requireViewer } from "@/lib/authz/policy";
import { getViewer } from "@/lib/authz/viewer";
import { db } from "@/lib/supabase/server";
import { Empty, ListRow, PageHeader, Panel, Pill } from "@/components/portal/ui";
import { Button } from "@/components/ui/button";
import { timeAgo } from "@/lib/utils";

export const metadata: Metadata = { title: "Notifications" };

async function markAllRead() {
  "use server";
  const v = await getViewer();
  if (!v) return;
  await db().from("notifications").update({ read_at: new Date().toISOString() }).eq("user_id", v.userId).is("read_at", null);
  revalidatePath("/portal", "layout");
}

export default async function NotificationsPage() {
  const v = await requireViewer("/portal/notifications");
  const [{ data }, { data: mail }] = await Promise.all([
    db().from("notifications").select("*").eq("user_id", v.userId).order("created_at", { ascending: false }).limit(50),
    db().from("email_outbox").select("subject, status, created_at, sent_at").eq("to_email", v.email).order("created_at", { ascending: false }).limit(10),
  ]);
  return (
    <>
      <PageHeader icon={Bell} title="Notifications" description="In-app notifications are the system of record. Email copies show their real delivery state."
        actions={<form action={markAllRead}><Button variant="secondary" size="sm">Mark all as read</Button></form>} />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,8fr)_minmax(0,4fr)]">
        <Panel pad={false} className="p-2">
          {(data ?? []).length === 0 ? <div className="p-3"><Empty title="You're all caught up" /></div> : (
            <ul>{(data ?? []).map((n) => (
              <li key={n.id}><ListRow href={n.link ?? undefined} title={<span className="flex items-center gap-2">{!n.read_at && <span className="size-2 rounded-full bg-accent" aria-label="Unread" />}{n.title}</span>} meta={`${n.body ?? ""} · ${timeAgo(n.created_at)}`} /></li>
            ))}</ul>
          )}
        </Panel>
        <Panel title="Email copies" description="Queued is not delivered. A message is marked sent only after the provider accepts it.">
          {(mail ?? []).length === 0 ? <p className="text-[14px] text-muted">No emails for this address.</p> : (
            <ul className="space-y-2">{(mail ?? []).map((m, i) => (
              <li key={i} className="flex items-start justify-between gap-3 rounded-xl bg-white/[0.04] ring-1 ring-inset ring-white/[0.06] px-3 py-2.5 text-[13px]">
                <span>{m.subject}<span className="block text-muted">{timeAgo(m.sent_at ?? m.created_at)}</span></span>
                <Pill tone={m.status === "sent" ? "good" : m.status === "failed" ? "bad" : "neutral"}>{m.status === "sent" ? "Accepted by provider" : m.status}</Pill>
              </li>
            ))}</ul>
          )}
        </Panel>
      </div>
    </>
  );
}
