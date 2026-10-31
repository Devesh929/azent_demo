import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireWorkspace } from "@/lib/authz/policy";
import { canSeeCommunity, offeringsMap, SHARED_COLUMNS, themeStats, type Shared } from "@/lib/data/learning";
import { db } from "@/lib/supabase/server";
import { CONFIDENCE, IDEA_STATUS, type IdeaStatus } from "@/lib/constants";
import { Notice, PageHeader, Panel, Pill, Stat } from "@/components/portal/ui";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Theme" };

export default async function ThemePage({ params }: PageProps<"/portal/learning/themes/[id]">) {
  const v = await requireWorkspace();
  if (!canSeeCommunity(v)) notFound();
  const { id } = await params;
  const { data: t } = await db().from("themes").select("*").eq("id", id).maybeSingle();
  if (!t) notFound();
  const employee = v.isEmployee && v.active.orgKind === "internal";
  const [stats, offerings, { data: links }, { data: ideas }] = await Promise.all([
    themeStats(id),
    offeringsMap(),
    db().from("theme_contributions").select(`shared_contributions!inner(${SHARED_COLUMNS}, status)`).eq("theme_id", id).eq("shared_contributions.status", "published"),
    db().from("improvement_ideas").select("id, title, status, shared_update, team, updated_at, client_visible").eq("theme_id", id),
  ]);
  const evidence = (links ?? []).map((l) => l.shared_contributions as unknown as Shared);
  const visibleIdeas = (ideas ?? []).filter((i) => employee || i.client_visible);

  return (
    <>
      <PageHeader title={t.title} back={{ href: "/portal/learning/themes", label: "Themes" }} description={t.summary} />
      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <Stat label="Distinct contributing organisations" value={stats.suppressed ? "Suppressed" : stats.orgs} hint={stats.suppressed ? `Shown from ${stats.min} organisations` : "Each organisation counted once"} />
        <Stat label="Approved contributions" value={stats.suppressed ? "Suppressed" : stats.contributions} hint="Withdrawn and unpublished items excluded" />
        <Stat label="Observation period" value={t.period_label ?? "—"} hint={`Updated ${formatDate(t.updated_at)}`} />
      </div>
      <div className="mb-5"><Notice tone="warn"><strong>Limitations.</strong> {t.limitations} Generated or grouped themes keep their evidence links; frequency is not proof of prevalence or causation.</Notice></div>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <Panel title="Supporting evidence" description="Only approved shared copies you are allowed to read.">
          {stats.suppressed ? (
            <p className="text-[14px] text-ink-2">Individual evidence is listed in the shared feed. Aggregate figures for this theme are suppressed until the minimum cohort is met.</p>
          ) : null}
          <ul className="mt-2 space-y-2">
            {evidence.map((s) => (
              <li key={s.id}>
                <Link href={`/portal/learning/${s.id}`} className="block rounded-xl bg-white/[0.04] ring-1 ring-inset ring-white/[0.06] p-4 hover:bg-white/[0.09]">
                  <p className="text-[15px] font-medium">{s.title}</p>
                  <p className="mt-1 text-[12px] text-muted">{[s.region, s.period_label, `${CONFIDENCE[s.confidence as keyof typeof CONFIDENCE]} confidence`, s.offering_id && offerings.get(s.offering_id)?.name].filter(Boolean).join(" · ")}</p>
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="What is happening with this">
          {visibleIdeas.length === 0 ? <p className="text-[14px] text-muted">No improvement idea has been shared for this theme yet.</p> : (
            <ul className="space-y-4">
              {visibleIdeas.map((i) => (
                <li key={i.id} className="rounded-xl bg-white/[0.04] ring-1 ring-inset ring-white/[0.06] p-4">
                  <div className="flex items-center justify-between gap-3"><Link href={`/portal/ideas/${i.id}`} className="text-[15px] font-medium hover:text-accent">{i.title}</Link><Pill tone={IDEA_STATUS[i.status as IdeaStatus].tone}>{IDEA_STATUS[i.status as IdeaStatus].label}</Pill></div>
                  {i.shared_update && <p className="mt-2 text-[14px] text-ink-2">{i.shared_update}</p>}
                  <p className="mt-2 text-[12px] text-muted">{i.team} team · updated {formatDate(i.updated_at)}</p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
