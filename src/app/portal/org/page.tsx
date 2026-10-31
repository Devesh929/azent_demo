import type { Metadata } from "next";
import { Users } from "lucide-react";
import { notFound } from "next/navigation";
import { isClientAdmin, requireClient, roleLabel } from "@/lib/authz/policy";
import type { AppRole } from "@/lib/authz/viewer";
import { db } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import { Empty, PageHeader, Panel, Pill } from "@/components/portal/ui";
import { Button } from "@/components/ui/button";
import { InviteForm } from "@/components/portal/InviteForm";
import { revokeInvite, revokeMember, setFlParticipation, setMemberRole } from "./actions";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Members & access" };

type Member = { id: string; status: string; user_id: string; profiles: { display_name: string; email: string }; role_grants: { role: AppRole; revoked_at: string | null }[] };

export default async function OrgPage() {
  const v = await requireClient();
  if (!isClientAdmin(v)) notFound();
  const [{ data: members }, { data: invites }, { data: programs }, { data: parts }] = await Promise.all([
    db().from("memberships").select("id, status, user_id, profiles(display_name, email), role_grants(role, revoked_at)").eq("org_id", v.active.orgId).order("created_at"),
    db().from("invitations").select("id, email, role, status, expires_at, created_at").eq("org_id", v.active.orgId).order("created_at", { ascending: false }).limit(20),
    db().from("fl_programs").select("id, name, task, min_participants, status"),
    db().from("fl_participants").select("program_id, status, consented_at, withdrawn_at").eq("org_id", v.active.orgId),
  ]);

  return (
    <>
      <PageHeader icon={Users} title="Members & access" description={`Manage who can use the ${v.active.orgName} workspace. You can invite and remove members and grant client roles in your organisation only.`} />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <div className="space-y-5">
          <Panel title="Members">
            <ul className="space-y-2">
              {((members ?? []) as unknown as Member[]).map((m) => {
                const roles = m.role_grants.filter((g) => !g.revoked_at).map((g) => g.role);
                const admin = roles.includes("client_admin");
                return (
                  <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white/[0.04] ring-1 ring-inset ring-white/[0.06] px-4 py-3">
                    <span><span className="block text-[15px] font-medium">{m.profiles.display_name}{m.user_id === v.userId && " (you)"}</span><span className="text-[13px] text-muted">{m.profiles.email}</span></span>
                    <span className="flex flex-wrap items-center gap-2">
                      {m.status !== "active" ? <Pill tone="bad">{m.status}</Pill> : roles.map((r) => <Pill key={r} tone={r === "client_admin" ? "info" : "neutral"}>{roleLabel(r)}</Pill>)}
                      {m.status === "active" && m.user_id !== v.userId && (
                        <>
                          <form action={setMemberRole}><input type="hidden" name="membership_id" value={m.id} /><input type="hidden" name="admin" value={admin ? "0" : "1"} /><Button size="sm" variant="ghost">{admin ? "Remove admin" : "Make admin"}</Button></form>
                          <form action={revokeMember}><input type="hidden" name="membership_id" value={m.id} /><Button size="sm" variant="danger">Remove</Button></form>
                        </>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          </Panel>
          <Panel title="Invitations">
            {(invites ?? []).length === 0 ? <Empty title="No invitations yet" /> : (
              <ul className="space-y-2">
                {(invites ?? []).map((i) => {
                  const expired = i.status === "pending" && new Date(i.expires_at) < new Date();
                  return (
                    <li key={i.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white/[0.04] ring-1 ring-inset ring-white/[0.06] px-4 py-3 text-[14px]">
                      <span>{i.email}<span className="block text-[12px] text-muted">{roleLabel(i.role as AppRole)} · sent {formatDate(i.created_at)} · expires {formatDate(i.expires_at)}</span></span>
                      <span className="flex items-center gap-2">
                        <Pill tone={expired ? "bad" : i.status === "accepted" ? "good" : i.status === "pending" ? "info" : "neutral"}>{expired ? "expired" : i.status}</Pill>
                        {i.status === "pending" && !expired && <form action={revokeInvite}><input type="hidden" name="id" value={i.id} /><Button size="sm" variant="ghost">Revoke</Button></form>}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>
        </div>
        <div className="space-y-5">
          <Panel title="Invite someone"><InviteForm demo={env.demoMode} /></Panel>
          <Panel title="Federated learning research" description="A separate, opt-in programme. Your training records stay in your environment; only bounded model updates leave it. Joining the workspace or sharing observations is not consent to this.">
            {(programs ?? []).map((p) => {
              const part = (parts ?? []).find((x) => x.program_id === p.id);
              const on = part?.status === "consented";
              return (
                <div key={p.id} className="rounded-xl bg-white/[0.04] ring-1 ring-inset ring-white/[0.06] p-4">
                  <p className="text-[15px] font-medium">{p.name}</p>
                  <p className="mt-1 text-[13px] text-ink-2">{p.task}</p>
                  <p className="mt-2 text-[12px] text-muted">{on ? `Participating since ${formatDate(part?.consented_at)}` : part?.status === "withdrawn" ? `Withdrew ${formatDate(part.withdrawn_at)}` : "Not participating"}</p>
                  <form action={setFlParticipation} className="mt-3"><input type="hidden" name="program_id" value={p.id} /><input type="hidden" name="join" value={on ? "0" : "1"} />
                    <Button size="sm" variant={on ? "danger" : "secondary"}>{on ? "Withdraw from future rounds" : "Opt in to this programme"}</Button></form>
                  {on && <p className="mt-2 text-[12px] text-muted">Withdrawal stops future participation. A model already aggregated is handled under the programme&rsquo;s lineage policy; it cannot be automatically &ldquo;untrained&rdquo;.</p>}
                </div>
              );
            })}
          </Panel>
        </div>
      </div>
    </>
  );
}
