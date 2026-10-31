import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Users, EyeOff, Layers } from "lucide-react";
import { requireWorkspace } from "@/lib/authz/policy";
import { canSeeCommunity, offeringsMap, themeStats } from "@/lib/data/learning";
import { db } from "@/lib/supabase/server";
import { IDEA_STATUS, type IdeaStatus } from "@/lib/constants";
import { Empty, PageHeader, Pill } from "@/components/portal/ui";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Themes" };

export default async function ThemesPage() {
  const v = await requireWorkspace();
  if (!canSeeCommunity(v)) notFound();
  const employee = v.isEmployee && v.active.orgKind === "internal";
  const [{ data: themes }, offerings] = await Promise.all([
    db().from("themes").select("id, title, summary, limitations, offering_ids, period_label, status, updated_at, improvement_ideas(id, title, status, client_visible)").neq("status", "archived").order("updated_at", { ascending: false }),
    offeringsMap(),
  ]);
  const stats = await Promise.all((themes ?? []).map((t) => themeStats(t.id)));

  return (
    <>
      <PageHeader icon={Layers} title="Themes" description="Recurring patterns across approved contributions. Counts of contributing organisations appear only when at least three distinct organisations contribute, and one organisation's repeated posts never count twice." />
      {(themes ?? []).length === 0 ? <Empty title="No themes yet" /> : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {(themes ?? []).map((t, i) => {
            const s = stats[i];
            const ideas = ((t.improvement_ideas ?? []) as { id: string; title: string; status: IdeaStatus; client_visible: boolean }[]).filter((x) => employee || x.client_visible);
            return (
              <li key={t.id}>
                <Link href={`/portal/learning/themes/${t.id}`} className="flex h-full flex-col glass ring-gradient rounded-[22px] p-6 transition-all duration-300 hover:-translate-y-1 hover:bg-white/[0.06]">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-[19px] font-semibold tracking-[-0.02em]">{t.title}</h2>
                    {s.suppressed
                      ? <Pill title={`Fewer than ${s.min} organisations`}><EyeOff size={12} /> Counts suppressed</Pill>
                      : <Pill tone="good"><Users size={12} /> {s.orgs} organisations</Pill>}
                  </div>
                  <p className="mt-3 text-[14px] leading-relaxed text-ink-2">{t.summary}</p>
                  <div className="mt-4 flex flex-wrap gap-1.5">{(t.offering_ids as string[]).map((o) => <Pill key={o}>{offerings.get(o)?.name}</Pill>)}</div>
                  <p className="mt-4 rounded-lg bg-warn-soft px-3 py-2 text-[13px] text-warn">{t.limitations}</p>
                  {ideas.length > 0 && <p className="mt-4 text-[13px] text-ink-2">Linked idea: {ideas[0].title} · <span className="text-accent">{IDEA_STATUS[ideas[0].status].label}</span></p>}
                  <p className="mt-auto pt-4 text-[12px] text-muted">{t.period_label} · updated {formatDate(t.updated_at)}</p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
