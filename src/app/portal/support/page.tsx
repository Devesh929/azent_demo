import type { Metadata } from "next";
import { LifeBuoy } from "lucide-react";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireClient } from "@/lib/authz/policy";
import { db } from "@/lib/supabase/server";
import { audit } from "@/lib/audit";
import { Empty, ListRow, PageHeader, Panel, Pill } from "@/components/portal/ui";
import { Button } from "@/components/ui/button";
import { timeAgo } from "@/lib/utils";

export const metadata: Metadata = { title: "Support" };

const field = "w-full rounded-xl bg-white/[0.04] ring-1 ring-inset ring-white/[0.06] px-3 py-2.5 text-[14px] outline-none ring-1 ring-line focus:ring-accent";

async function openTicket(fd: FormData) {
  "use server";
  const v = await requireClient();
  const p = z.object({ subject: z.string().trim().min(4).max(160), body: z.string().trim().min(10).max(4000), priority: z.enum(["low", "medium", "high"]) })
    .safeParse({ subject: fd.get("subject"), body: fd.get("body"), priority: fd.get("priority") });
  if (!p.success) return;
  const { data } = await db().from("support_tickets").insert({ ...p.data, org_id: v.active.orgId, created_by: v.userId }).select("id").single();
  await audit(v, "support.opened", "support_ticket", data?.id, {}, v.active.orgId);
  revalidatePath("/portal/support");
}

export default async function SupportPage() {
  const v = await requireClient();
  // Tickets are private to the organisation; they never feed shared learning or idea status.
  const { data } = await db().from("support_tickets").select("id, subject, status, priority, created_at, profiles(display_name)").eq("org_id", v.active.orgId).order("created_at", { ascending: false });
  return (
    <>
      <PageHeader icon={LifeBuoy} title="Support" description={`Private to ${v.active.orgName}. Support cases are never shown to other clients or in shared improvement updates.`} />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <Panel title="Your organisation's tickets" pad={false} className="p-2">
          {(data ?? []).length === 0 ? <div className="p-3"><Empty title="No tickets" /></div> : (
            <ul>{(data ?? []).map((t) => <li key={t.id}><ListRow title={t.subject} meta={`${(t.profiles as unknown as { display_name: string })?.display_name} · ${timeAgo(t.created_at)} · ${t.priority} priority`} right={<Pill tone={t.status === "open" ? "info" : t.status === "resolved" ? "good" : "neutral"}>{t.status.replace("_", " ")}</Pill>} /></li>)}</ul>
          )}
        </Panel>
        <Panel title="Open a ticket">
          <form action={openTicket} className="space-y-3">
            <input name="subject" placeholder="Subject" className={field} required minLength={4} />
            <textarea name="body" placeholder="What happened? Please leave out customer or account details." className={`${field} min-h-28`} required minLength={10} />
            <select name="priority" className={field} defaultValue="medium"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select>
            <Button size="sm">Open ticket</Button>
          </form>
        </Panel>
      </div>
    </>
  );
}
