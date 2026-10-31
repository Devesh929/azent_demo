import type { Metadata } from "next";
import Link from "next/link";
import { FlaskConical, Lock } from "lucide-react";
import { inEmployeeWorkspace, requireWorkspace } from "@/lib/authz/policy";
import { ENGINES } from "@/lib/playground";
import { canUseEngine } from "@/lib/data/portal";
import { db } from "@/lib/supabase/server";
import { Empty, ListRow, PageHeader, Panel, Pill } from "@/components/portal/ui";
import { timeAgo } from "@/lib/utils";

export const metadata: Metadata = { title: "Playground" };

export default async function PlaygroundPage() {
  const v = await requireWorkspace();
  const allowed = (await Promise.all(ENGINES.map(async (e) => ((await canUseEngine(v, e)) ? e : null)))).filter(Boolean) as typeof ENGINES;
  const { data: runs } = await db().from("playground_runs").select("id, offering_slug, scenario_key, created_at, saved").eq("user_id", v.userId).eq("org_id", v.active!.orgId).order("created_at", { ascending: false }).limit(10);
  const employee = inEmployeeWorkspace(v);

  return (
    <>
      <PageHeader icon={FlaskConical} title={employee ? "Playground" : "Sandbox demonstrations"}
        description="Guided demonstrations on synthetic data. Choose an offering, inspect the inputs, run it, review the evidence and tell us what you think. Results are never credit or business decisions." />
      {allowed.length === 0 ? (
        <Empty title="No sandbox demonstrations are enabled for your organisation">Ask your azentio.ai contact about access. Sample content from other organisations is never shown in its place.</Empty>
      ) : (
        <ul className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {allowed.map((e) => (
            <li key={e.slug}>
              <Link href={`/portal/playground/${e.slug}`} className="flex h-full flex-col glass ring-gradient rounded-[22px] p-5 transition-all duration-300 hover:-translate-y-1 hover:bg-white/[0.06]">
                <div className="flex items-center justify-between"><FlaskConical size={20} className="text-accent" />{e.internal && <Pill tone="warn"><Lock size={11} /> Employees only</Pill>}</div>
                <p className="mt-4 text-[16px] font-medium">{e.name}</p>
                <p className="mt-1 text-[13px] text-muted">{e.scenarios.length} scenario{e.scenarios.length > 1 ? "s" : ""}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <Panel title="Your recent runs" description="Runs are private to you within this workspace." pad={false} className="p-2">
        {(runs ?? []).length === 0 ? <div className="p-3"><Empty title="No runs yet" /></div> : (
          <ul>{(runs ?? []).map((r) => <li key={r.id}><ListRow title={`${ENGINES.find((e) => e.slug === r.offering_slug)?.name} · ${r.scenario_key.replace(/-/g, " ")}`} meta={timeAgo(r.created_at)} right={r.saved ? <Pill tone="good">Feedback saved</Pill> : undefined} /></li>)}</ul>
        )}
      </Panel>
    </>
  );
}
