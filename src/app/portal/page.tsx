import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Bot, CalendarDays, CheckCircle2, Clock3, FileText, FlaskConical, Lightbulb, MessageSquareWarning, PenLine, Radio, Share2, Shield, Sparkles } from "lucide-react";
import { hasPlatformRole, inEmployeeWorkspace, requireWorkspace } from "@/lib/authz/policy";
import { db } from "@/lib/supabase/server";
import { entitledOfferings, visibleContent, visibleSessions } from "@/lib/data/portal";
import { IDEA_STATUS, OBS_STATUS, type IdeaStatus, type ObsStatus } from "@/lib/constants";
import { Empty, ListRow, Panel, Pill, Stat } from "@/components/portal/ui";
import { Welcome } from "@/components/portal/Welcome";
import { IconTile, Ring } from "@/components/fx/static";
import { Spotlight } from "@/components/fx/client";
import { LinkButton } from "@/components/ui/button";
import { dueWithin, formatDate, formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };

function QuickLink({ href, icon, title, text, tone = "accent" }: { href: string; icon: typeof Radio; title: string; text: string; tone?: "accent" | "blue" | "violet" | "warn" }) {
  return (
    <Link href={href} className="block h-full">
      <Spotlight className="group h-full p-5 hover:-translate-y-1">
        <div className="relative flex items-start justify-between">
          <IconTile icon={icon} tone={tone} />
          <ArrowUpRight size={16} className="text-muted transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent" />
        </div>
        <p className="relative mt-5 text-[15px] font-semibold">{title}</p>
        <p className="relative mt-1 text-[13px] leading-relaxed text-muted">{text}</p>
      </Spotlight>
    </Link>
  );
}

function SessionRow({ title, when, tag }: { title: string; when: string | null; tag?: string }) {
  const d = when ? new Date(when) : null;
  return (
    <div className="flex items-center gap-4 rounded-2xl px-3 py-3 transition hover:bg-white/[0.04]">
      <div className="neu grid w-14 shrink-0 place-items-center rounded-xl py-2 text-center">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-accent">{d ? d.toLocaleString("en-GB", { month: "short" }) : "—"}</span>
        <span className="text-[20px] font-semibold leading-none">{d ? d.getDate() : ""}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-medium">{title}</p>
        <p className="mt-0.5 flex items-center gap-1.5 text-[12px] text-muted"><Clock3 size={12} /> {formatDateTime(when)}</p>
      </div>
      {tag && <Pill tone="info">{tag}</Pill>}
    </div>
  );
}

export default async function DashboardPage() {
  const v = await requireWorkspace();
  const first = v.displayName.split(" ")[0];
  const sessions = (await visibleSessions(v)).filter((s) => s.status !== "ended").slice(0, 4);
  const today = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "Asia/Kolkata" });

  if (inEmployeeWorkspace(v)) {
    const [{ data: assigned }, content, { count: queue }, { count: shared }, { count: themes }] = await Promise.all([
      db().from("idea_assignments").select("improvement_ideas(id, title, status, updated_at)").eq("user_id", v.userId),
      visibleContent(v, ["broadcast", "knowledge", "experiment", "prototype_note", "release_note"]),
      hasPlatformRole(v, "learning_moderator") ? db().from("observations").select("id", { count: "exact", head: true }).in("status", ["submitted", "in_review"]) : Promise.resolve({ count: null }),
      db().from("shared_contributions").select("id", { count: "exact", head: true }).eq("status", "published"),
      db().from("themes").select("id", { count: "exact", head: true }).neq("status", "archived"),
    ]);
    const ideas = (assigned ?? []).map((a) => a.improvement_ideas as unknown as { id: string; title: string; status: IdeaStatus; updated_at: string });
    const due = content.filter((c) => c.owner_id === v.userId && c.review_due);
    const broadcasts = content.filter((c) => c.kind === "broadcast");
    const isMod = hasPlatformRole(v, "learning_moderator");

    return (
      <>
        <Welcome eyebrow={`${today} · Employee workspace`} title={<>Good to see you, <span className="serif-accent text-gradient">{first}</span>.</>}
          actions={<><LinkButton href="/portal/playground"><FlaskConical size={16} /> Open Playground</LinkButton><LinkButton href="/portal/aira" variant="quiet"><Bot size={16} /> Ask AIRA</LinkButton></>}>
          Experiments, internal sessions and collective learning in one place. Nothing here reaches public or client search.
        </Welcome>

        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Stat label="Approved shared contributions" value={shared ?? 0} icon={Share2} hint="Across the learning community" />
          <Stat label="Active themes" value={themes ?? 0} icon={Sparkles} tone="info" hint="Counts shown from 3 organisations" />
          <Stat label="Ideas assigned to you" value={ideas.length} icon={Lightbulb} tone="good" hint="Evidence shared with you" />
          {isMod
            ? <Stat label="Awaiting moderation" value={queue ?? 0} icon={Shield} tone="warn" hint="Flagged items highlighted" />
            : <Stat label="Knowledge due for review" value={due.length} icon={FileText} tone="warn" />}
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <QuickLink href="/portal/playground" icon={FlaskConical} title="Playground" text="Guided scenarios on synthetic data." />
          <QuickLink href="/portal/live" icon={Radio} title="Internal Live" text="Broadcasts and recordings for employees." tone="blue" />
          <QuickLink href="/portal/innovation" icon={Sparkles} title="Experiments" text="Submit ideas and join hackathon teams." tone="violet" />
          {isMod
            ? <QuickLink href="/portal/moderation" icon={Shield} title={`Moderation · ${queue ?? 0}`} text="Contributions waiting for review." tone="warn" />
            : <QuickLink href="/portal/learning/themes" icon={Lightbulb} title="Themes" text="What the learning community sees." tone="warn" />}
        </div>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
          <Panel title="Assigned improvement ideas" icon={Lightbulb} pad={false} className="p-2">
            {ideas.length === 0 ? <div className="p-3"><Empty title="Nothing assigned to you" icon={Lightbulb}>Ideas you own appear here, with the evidence shared for them.</Empty></div> : (
              <ul>{ideas.map((i) => <li key={i.id}><ListRow href={`/portal/ideas/${i.id}`} leading={<IconTile icon={Lightbulb} size="sm" tone="violet" />} title={i.title} meta={`Updated ${formatDate(i.updated_at)}`} right={<Pill tone={IDEA_STATUS[i.status].tone}>{IDEA_STATUS[i.status].label}</Pill>} /></li>)}</ul>
            )}
          </Panel>
          <Panel title="Upcoming internal sessions" icon={CalendarDays} pad={false} className="p-2">
            {sessions.length === 0 ? <div className="p-3"><Empty title="No sessions scheduled" icon={CalendarDays} /></div> : (
              <div className="p-1">{sessions.map((s) => <SessionRow key={s.id} title={s.title} when={s.starts_at} tag={s.audience === "employees" ? "Employees" : s.audience === "public" ? "Public" : "Clients"} />)}</div>
            )}
          </Panel>
          <Panel title="Your knowledge items due for review" icon={FileText} pad={false} className="p-2">
            {due.length === 0 ? <div className="p-3"><Empty title="Nothing due" icon={CheckCircle2} /></div> : (
              <ul>{due.map((c) => <li key={c.id}><ListRow href={`/portal/library/${c.id}`} leading={<IconTile icon={FileText} size="sm" tone="blue" />} title={c.title} meta={`Review by ${formatDate(c.review_due)}`} right={<Pill tone={dueWithin(c.review_due, 14) ? "warn" : "neutral"}>{c.kind.replace("_", " ")}</Pill>} /></li>)}</ul>
            )}
          </Panel>
          <Panel title="Employee broadcasts" icon={Radio} pad={false} className="p-2">
            {broadcasts.length === 0 ? <div className="p-3"><Empty title="No broadcasts" icon={Radio} /></div> : (
              <ul>{broadcasts.map((c) => <li key={c.id}><ListRow href={`/portal/library/${c.id}`} leading={<IconTile icon={Radio} size="sm" />} title={c.title} meta={c.summary} /></li>)}</ul>
            )}
          </Panel>
        </div>
      </>
    );
  }

  // Client dashboard
  const [offerings, { data: mine }, { data: ideas }] = await Promise.all([
    entitledOfferings(v),
    db().from("observations").select("id, title, status, updated_at").eq("author_id", v.userId).eq("org_id", v.active.orgId).order("updated_at", { ascending: false }),
    db().from("improvement_ideas").select("id, title, status, shared_update, updated_at").eq("client_visible", true).order("updated_at", { ascending: false }).limit(3),
  ]);
  const counts = (mine ?? []).reduce<Record<string, number>>((m, r) => ({ ...m, [r.status]: (m[r.status] ?? 0) + 1 }), {});
  const total = (mine ?? []).length;
  const sharedShare = total ? (counts.published ?? 0) / total : 0;

  return (
    <>
      <Welcome eyebrow={`${today} · ${v.active.orgName}`} title={<>Welcome back, <span className="serif-accent text-gradient">{first}</span>.</>}
        actions={<><LinkButton href="/portal/observations/new"><PenLine size={16} /> Record an observation</LinkButton><LinkButton href="/portal/learning" variant="quiet"><Share2 size={16} /> Shared learning</LinkButton></>}>
        You see only what {v.active.orgName} is entitled to. Observations start private; sharing is always your choice.
      </Welcome>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="My drafts" value={counts.draft ?? 0} icon={PenLine} hint="Private until you choose" />
        <Stat label="Awaiting review" value={(counts.submitted ?? 0) + (counts.in_review ?? 0)} icon={Clock3} tone="info" hint="With a learning moderator" />
        <Stat label="Needs my input" value={counts.returned ?? 0} icon={MessageSquareWarning} tone={counts.returned ? "warn" : undefined} hint="Clarification requests" />
        <Stat label="Shared with community" value={counts.published ?? 0} icon={Share2} tone="good" hint="De-identified copies" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <div className="space-y-5">
        <Panel title="Your observations" description="Your latest work, with a clear next step." actions={<Link href="/portal/observations" className="inline-flex items-center gap-1 text-[12px] text-accent">View all <ArrowUpRight size={13}/></Link>}>
          {(mine ?? []).length === 0 ? <Empty title="Start with an observation" icon={PenLine} action={<LinkButton href="/portal/observations/new" size="sm">Create a private draft</LinkButton>}>Capture a market pattern or product gap. Nothing is shared when you save.</Empty> : <ul>{(mine ?? []).slice(0,4).map(o=><li key={o.id}><ListRow href={`/portal/observations/${o.id}`} title={o.title} meta={`Updated ${formatDate(o.updated_at)}`} leading={<IconTile icon={FileText} size="sm"/>} right={<Pill tone={OBS_STATUS[o.status as ObsStatus].tone}>{OBS_STATUS[o.status as ObsStatus].label}</Pill>}/></li>)}</ul>}
        </Panel>
        <Panel title="Your offerings" description="Sandbox demonstrations use synthetic data." icon={FlaskConical}>
          {offerings.length === 0 ? (
            <Empty title="No offerings are enabled for your organisation yet" icon={FlaskConical}>Your azentio.ai contact can enable sandbox access. You can still contribute observations and read shared learning.</Empty>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {offerings.map((o, i) => (
                <li key={o.id}>
                  <Link href={`/portal/playground/${o.slug}`} className="block h-full">
                    <Spotlight className="group h-full p-5 hover:-translate-y-1" beam={i === 0}>
                      <div className="relative flex items-center justify-between"><IconTile icon={FlaskConical} size="sm" tone={i % 2 ? "blue" : "accent"} /><ArrowUpRight size={15} className="text-muted transition group-hover:text-accent" /></div>
                      <p className="relative mt-4 text-[12px] font-medium text-accent">{o.kicker}</p>
                      <p className="relative mt-1 text-[16px] font-semibold">{o.name}</p>
                      <p className="relative mt-1.5 text-[13px] leading-relaxed text-muted">{o.tagline}</p>
                    </Spotlight>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        </div>
        <div className="space-y-5">
          <Panel title="Your contributions" icon={Share2}>
            <div className="flex items-center gap-5">
              <Ring value={sharedShare} size={92} stroke={8} label={`${Math.round(sharedShare * 100)}%`} />
              <div className="space-y-1.5 text-[13px]">
                <p className="text-ink">{total} observation{total === 1 ? "" : "s"} recorded</p>
                <p className="text-muted"><span className="text-accent">{counts.published ?? 0}</span> shared · {counts.draft ?? 0} private · {counts.withdrawn ?? 0} withdrawn</p>
                <Link href="/portal/observations" className="inline-flex items-center gap-1 text-accent hover:underline">Manage observations <ArrowUpRight size={13} /></Link>
              </div>
            </div>
          </Panel>
          <Panel title="Sessions for you" icon={CalendarDays} pad={false} className="p-2">
            {sessions.length === 0 ? <div className="p-3"><Empty title="No sessions scheduled for your organisation" icon={CalendarDays} /></div> : (
              <div className="p-1">{sessions.map((s) => <SessionRow key={s.id} title={s.title} when={s.starts_at} />)}</div>
            )}
          </Panel>
          <Panel title="Improvement updates" icon={Lightbulb} pad={false} className="p-2">
            {(ideas ?? []).length === 0 ? <div className="p-3"><Empty title="No updates yet" icon={Lightbulb} /></div> : (
              <ul>{(ideas ?? []).map((i) => <li key={i.id}><ListRow href={`/portal/ideas/${i.id}`} title={i.title} meta={i.shared_update} right={<Pill tone={IDEA_STATUS[i.status as IdeaStatus].tone}>{IDEA_STATUS[i.status as IdeaStatus].label}</Pill>} /></li>)}</ul>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}
