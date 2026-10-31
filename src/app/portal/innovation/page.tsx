import type { Metadata } from "next";
import { Sparkles } from "lucide-react";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireEmployee } from "@/lib/authz/policy";
import { db } from "@/lib/supabase/server";
import { visibleContent } from "@/lib/data/portal";
import { audit } from "@/lib/audit";
import { Empty, ListRow, PageHeader, Panel, Pill } from "@/components/portal/ui";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Innovation" };

const field = "w-full rounded-xl bg-white/[0.04] ring-1 ring-inset ring-white/[0.06] px-3 py-2.5 text-[14px] outline-none ring-1 ring-line focus:ring-accent";

async function submitExperiment(fd: FormData) {
  "use server";
  const v = await requireEmployee();
  const p = z.object({ title: z.string().trim().min(6).max(140), summary: z.string().trim().min(10).max(300), body: z.string().trim().max(4000) })
    .safeParse({ title: fd.get("title"), summary: fd.get("summary"), body: fd.get("body") ?? "" });
  if (!p.success) return;
  // Experiments are employees-only by schema constraint; they can never be made public.
  const { data } = await db().from("content_items").insert({
    kind: "experiment", ...p.data, audience: "employees", owner_id: v.userId, created_by: v.userId,
    status: "published", published_at: new Date().toISOString(), review_due: new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10),
  }).select("id").single();
  await audit(v, "experiment.submitted", "content_item", data?.id);
  revalidatePath("/portal/innovation");
}

async function createTeam(fd: FormData) {
  "use server";
  const v = await requireEmployee();
  const p = z.object({ name: z.string().trim().min(3).max(60), challenge: z.string().trim().min(10).max(200) }).safeParse({ name: fd.get("name"), challenge: fd.get("challenge") });
  if (!p.success) return;
  const { data } = await db().from("hackathon_teams").insert({ ...p.data, created_by: v.userId }).select("id").single();
  await db().from("hackathon_team_members").insert({ team_id: data!.id, user_id: v.userId, role: "lead" });
  revalidatePath("/portal/innovation");
}

async function joinTeam(fd: FormData) {
  "use server";
  const v = await requireEmployee();
  await db().from("hackathon_team_members").upsert({ team_id: String(fd.get("team_id")), user_id: v.userId }, { onConflict: "team_id,user_id", ignoreDuplicates: true });
  revalidatePath("/portal/innovation");
}

export default async function InnovationPage() {
  const v = await requireEmployee();
  const [content, { data: teams }] = await Promise.all([
    visibleContent(v, ["experiment", "release_note"]),
    db().from("hackathon_teams").select("id, name, challenge, status, hackathon_team_members(user_id, role, profiles(display_name))").order("created_at"),
  ]);
  const experiments = content.filter((c) => c.kind === "experiment");
  const notes = content.filter((c) => c.kind === "release_note" && c.audience === "employees");

  return (
    <>
      <PageHeader icon={Sparkles} title="Innovation" description="Experiments, hackathon teams and internal release notes. Everything here is employee-only and excluded from public and client search and AIRA." />
      <div className="grid gap-5 xl:grid-cols-2">
        <Panel title="Experiments" pad={false} className="p-2">
          {experiments.length === 0 ? <div className="p-3"><Empty title="No experiments yet" /></div> : (
            <ul>{experiments.map((c) => <li key={c.id}><ListRow href={`/portal/library/${c.id}`} title={c.title} meta={`${c.summary ?? ""} · review ${formatDate(c.review_due)}`} right={c.owner_id === v.userId ? <Pill tone="info">Yours</Pill> : undefined} /></li>)}</ul>
          )}
        </Panel>
        <Panel title="Submit an experiment" description="Synthetic data only. You become the owner with a 30-day review date.">
          <form action={submitExperiment} className="space-y-3">
            <input name="title" placeholder="Experiment title" className={field} required minLength={6} />
            <input name="summary" placeholder="One-line hypothesis" className={field} required minLength={10} />
            <textarea name="body" placeholder="Method, data used (synthetic), how you will evaluate it" className={`${field} min-h-24`} />
            <Button size="sm">Submit experiment</Button>
          </form>
        </Panel>
        <Panel title="Hackathon team spaces">
          {(teams ?? []).length === 0 ? <Empty title="No teams yet" /> : (
            <ul className="space-y-3">{(teams ?? []).map((t) => {
              const members = (t.hackathon_team_members ?? []) as unknown as { user_id: string; role: string; profiles: { display_name: string } }[];
              const inTeam = members.some((m) => m.user_id === v.userId);
              return (
                <li key={t.id} className="rounded-xl bg-white/[0.04] ring-1 ring-inset ring-white/[0.06] p-4">
                  <div className="flex items-center justify-between gap-3"><p className="text-[15px] font-medium">{t.name}</p><Pill tone="info">{t.status}</Pill></div>
                  <p className="mt-1 text-[14px] text-ink-2">{t.challenge}</p>
                  <p className="mt-2 text-[12px] text-muted">{members.map((m) => `${m.profiles?.display_name}${m.role === "lead" ? " (lead)" : ""}`).join(", ")}</p>
                  {!inTeam && <form action={joinTeam} className="mt-3"><input type="hidden" name="team_id" value={t.id} /><Button size="sm" variant="secondary">Join team</Button></form>}
                </li>
              );
            })}</ul>
          )}
          <form action={createTeam} className="mt-4 flex flex-wrap gap-2">
            <input name="name" placeholder="Team name" className={`${field} w-40 flex-none`} required minLength={3} />
            <input name="challenge" placeholder="Challenge you are tackling" className={`${field} min-w-0 flex-1`} required minLength={10} />
            <Button size="sm">Create team</Button>
          </form>
        </Panel>
        <Panel title="Internal release notes" pad={false} className="p-2">
          {notes.length === 0 ? <div className="p-3"><Empty title="No internal release notes" /></div> : (
            <ul>{notes.map((c) => <li key={c.id}><ListRow href={`/portal/library/${c.id}`} title={c.title} meta={c.summary} /></li>)}</ul>
          )}
        </Panel>
      </div>
    </>
  );
}
