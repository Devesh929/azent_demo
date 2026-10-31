import type { Metadata } from "next";
import { revalidatePath } from "next/cache";
import { CalendarDays, PlayCircle, Radio } from "lucide-react";
import { requireWorkspace } from "@/lib/authz/policy";
import { getViewer } from "@/lib/authz/viewer";
import { audienceAllows } from "@/lib/authz/policy";
import { visibleSessions } from "@/lib/data/portal";
import { db } from "@/lib/supabase/server";
import { AUDIENCE_LABEL } from "@/lib/constants";
import { Empty, PageHeader, Panel, Pill } from "@/components/portal/ui";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Live" };

async function register(fd: FormData) {
  "use server";
  const v = await getViewer();
  const id = String(fd.get("id"));
  const { data: s } = await db().from("live_sessions").select("audience, org_id, offering_id").eq("id", id).single();
  if (!v || !s || !audienceAllows(v, s)) return;
  await db().from("session_registrations").upsert({ session_id: id, user_id: v.userId }, { onConflict: "session_id,user_id", ignoreDuplicates: true });
  revalidatePath("/portal/live");
}

export default async function LivePortalPage() {
  const v = await requireWorkspace();
  const sessions = await visibleSessions(v);
  const { data: regs } = await db().from("session_registrations").select("session_id").eq("user_id", v.userId);
  const registered = new Set((regs ?? []).map((r) => r.session_id));
  const upcoming = sessions.filter((s) => s.status !== "ended");
  const recordings = sessions.filter((s) => s.status === "ended" && s.recording_asset_id);

  return (
    <>
      <PageHeader icon={Radio} title={v.active.orgKind === "internal" ? "Live & recordings" : "Sessions"}
        description="Sessions and recordings appear only for their configured audience. Recordings stream through an access-checked link." />
      <Panel title="Upcoming" className="mb-5">
        {upcoming.length === 0 ? <Empty title="Nothing scheduled for you" /> : (
          <ul className="grid gap-3 md:grid-cols-2">
            {upcoming.map((s) => (
              <li key={s.id} className="flex flex-col rounded-xl bg-white/[0.04] ring-1 ring-inset ring-white/[0.06] p-5">
                <div className="flex items-center justify-between gap-2"><Pill tone={s.audience === "employees" ? "info" : s.audience === "public" ? "neutral" : "good"}>{AUDIENCE_LABEL[s.audience as keyof typeof AUDIENCE_LABEL]}</Pill><span className="text-[12px] text-muted">{s.kind}</span></div>
                <p className="mt-3 text-[16px] font-medium">{s.title}</p>
                <p className="mt-1 text-[14px] text-ink-2">{s.description}</p>
                <p className="mt-3 flex items-center gap-2 text-[13px] text-muted"><CalendarDays size={14} /> {formatDateTime(s.starts_at)} · {s.duration_min ?? 45} min</p>
                <div className="mt-4">
                  {s.status === "live" && s.stream_url ? <a href={s.stream_url} className="inline-flex rounded-full bg-accent px-4 py-2 text-[14px] font-medium text-accent-ink">Join now</a>
                    : registered.has(s.id) ? <Pill tone="good">Registered</Pill>
                    : <form action={register}><input type="hidden" name="id" value={s.id} /><Button size="sm" variant="secondary">Register</Button></form>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
      <Panel title="Recordings">
        {recordings.length === 0 ? <Empty title="No recordings available to you" /> : (
          <ul className="space-y-2">
            {recordings.map((s) => (
              <li key={s.id}><a href={`/api/media/${s.recording_asset_id}`} className="flex items-center gap-3 rounded-xl bg-white/[0.04] ring-1 ring-inset ring-white/[0.06] p-4 hover:bg-white/[0.09]"><PlayCircle size={20} className="text-accent" /><span><span className="block text-[15px] font-medium">{s.title}</span><span className="text-[13px] text-muted">{formatDateTime(s.starts_at)}</span></span></a></li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
