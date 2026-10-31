import type { Metadata } from "next";
import { Settings } from "lucide-react";
import { requirePlatformRole, roleLabel } from "@/lib/authz/policy";
import type { AppRole } from "@/lib/authz/viewer";
import { db } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import { minCohort } from "@/lib/data/learning";
import { Empty, Notice, PageHeader, Panel, Pill, Tabs } from "@/components/portal/ui";
import { Button } from "@/components/ui/button";
import { approveMembership, createOrg, createSupportGrant, revokeSupportGrant, runOutbox, setOrgStatus, setPlatformRole, toggleEntitlement, updateSetting } from "./actions";
import { formatDateTime, timeAgo } from "@/lib/utils";

export const metadata: Metadata = { title: "Administration" };

const field = "h-10 rounded-xl bg-white/[0.04] ring-1 ring-inset ring-white/[0.06] px-3 text-[14px] outline-none ring-1 ring-line focus:ring-accent";
const PLATFORM: AppRole[] = ["product_owner", "learning_moderator", "content_publisher", "portal_admin", "fl_coordinator"];

type Mem = { id: string; status: string; user_id: string; profiles: { display_name: string; email: string }; organizations: { name: string; kind: string }; role_grants: { role: AppRole; revoked_at: string | null }[] };

export default async function AdminPage({ searchParams }: PageProps<"/portal/admin">) {
  const v = await requirePlatformRole("portal_admin");
  const tab = String((await searchParams).tab ?? "orgs");
  const tabs = [
    { href: "/portal/admin?tab=orgs", label: "Organisations" }, { href: "/portal/admin?tab=people", label: "People & roles" },
    { href: "/portal/admin?tab=support", label: "Support access" }, { href: "/portal/admin?tab=settings", label: "Settings" },
    { href: "/portal/admin?tab=audit", label: "Audit log" }, { href: "/portal/admin?tab=outbox", label: "Email outbox" }, { href: "/portal/admin?tab=leads", label: "Leads" },
  ];

  let body: React.ReactNode = null;
  if (tab === "orgs") {
    const [{ data: orgs }, { data: offerings }, { data: ents }] = await Promise.all([
      db().from("organizations").select("id, name, kind, industry, region, status").order("kind").order("name"),
      db().from("offerings").select("id, name").order("sort"),
      db().from("entitlements").select("org_id, offering_id"),
    ]);
    body = (
      <div className="space-y-5">
        <Panel title="Organisations and entitlements" description="Entitlements decide which sandbox demonstrations, sessions and resources a client organisation can reach.">
          <div className="overflow-x-auto scroll-thin">
            <table className="w-full min-w-[760px] text-[13px]">
              <thead><tr className="text-left text-muted"><th className="py-2 pr-3 font-medium">Organisation</th>{(offerings ?? []).map((o) => <th key={o.id} className="px-2 py-2 font-medium">{o.name.split(" ").slice(0, 2).join(" ")}</th>)}<th /></tr></thead>
              <tbody>
                {(orgs ?? []).map((o) => (
                  <tr key={o.id} className="border-t border-line">
                    <td className="py-2.5 pr-3"><span className="font-medium text-ink">{o.name}</span><span className="block text-muted">{o.kind} · {o.region}</span></td>
                    {(offerings ?? []).map((off) => {
                      const on = (ents ?? []).some((e) => e.org_id === o.id && e.offering_id === off.id);
                      return <td key={off.id} className="px-2">{o.kind === "client" ? <form action={toggleEntitlement}><input type="hidden" name="org_id" value={o.id} /><input type="hidden" name="offering_id" value={off.id} /><input type="hidden" name="on" value={on ? "0" : "1"} /><button className={`size-7 rounded-lg ${on ? "bg-accent text-accent-ink" : "bg-surface-2 text-muted hover:bg-white/[0.09]"}`} aria-label={`${on ? "Revoke" : "Grant"} ${off.name} for ${o.name}`}>{on ? "✓" : "+"}</button></form> : <span className="text-muted">—</span>}</td>;
                    })}
                    <td>{o.kind === "client" && <form action={setOrgStatus}><input type="hidden" name="org_id" value={o.id} /><input type="hidden" name="status" value={o.status === "active" ? "suspended" : "active"} /><Button size="sm" variant={o.status === "active" ? "ghost" : "secondary"}>{o.status === "active" ? "Suspend" : "Reactivate"}</Button></form>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
        <Panel title="Register a client organisation" description="A registered organisation is required before anyone can be invited to it.">
          <form action={createOrg} className="flex flex-wrap gap-2">
            <input name="name" placeholder="Organisation name" className={`${field} min-w-[220px] flex-1`} required />
            <input name="industry" placeholder="Industry" className={field} /><input name="region" placeholder="Region" className={field} />
            <Button>Create</Button>
          </form>
        </Panel>
      </div>
    );
  } else if (tab === "people") {
    const { data } = await db().from("memberships").select("id, status, user_id, profiles(display_name, email), organizations(name, kind), role_grants(role, revoked_at)").order("created_at");
    const mems = (data ?? []) as unknown as Mem[];
    const pending = mems.filter((m) => m.status === "pending");
    const internal = mems.filter((m) => m.organizations.kind === "internal" && m.status === "active");
    body = (
      <div className="space-y-5">
        <Panel title="Pending approvals">
          {pending.length === 0 ? <Empty title="No pending memberships" /> : (
            <ul className="space-y-2">{pending.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white/[0.04] ring-1 ring-inset ring-white/[0.06] px-4 py-3 text-[14px]">
                <span>{m.profiles.display_name} · {m.profiles.email}<span className="block text-[12px] text-muted">{m.organizations.name}{m.organizations.kind === "internal" && !m.profiles.email.endsWith("@" + env.employeeDomain) && " · not a company address"}</span></span>
                <form action={approveMembership}><input type="hidden" name="membership_id" value={m.id} /><Button size="sm">Approve</Button></form>
              </li>
            ))}</ul>
          )}
        </Panel>
        <Panel title="Employee role grants" description="Employee status never implies administrator access. Each capability is a separate grant.">
          <ul className="space-y-2">{internal.map((m) => {
            const roles = m.role_grants.filter((g) => !g.revoked_at).map((g) => g.role);
            return (
              <li key={m.id} className="rounded-xl bg-white/[0.04] ring-1 ring-inset ring-white/[0.06] px-4 py-3">
                <p className="text-[14px] font-medium">{m.profiles.display_name} <span className="font-normal text-muted">· {m.profiles.email}</span></p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {PLATFORM.map((r) => {
                    const has = roles.includes(r);
                    return (
                      <form key={r} action={setPlatformRole}><input type="hidden" name="membership_id" value={m.id} /><input type="hidden" name="role" value={r} /><input type="hidden" name="grant" value={has ? "0" : "1"} />
                        <button className={`rounded-full px-3 py-1 text-[12px] ${has ? "bg-accent-soft text-accent" : "bg-surface text-muted hover:text-ink"}`} disabled={has && r === "portal_admin" && m.user_id === v.userId}>{has ? "✓ " : "+ "}{roleLabel(r)}</button></form>
                    );
                  })}
                </div>
              </li>
            );
          })}</ul>
        </Panel>
      </div>
    );
  } else if (tab === "support") {
    const [{ data: orgs }, { data: grants }] = await Promise.all([
      db().from("organizations").select("id, name").eq("kind", "client").order("name"),
      db().from("support_grants").select("id, reason, expires_at, revoked_at, created_at, organizations(name), profiles!support_grants_admin_id_fkey(display_name)").order("created_at", { ascending: false }).limit(30),
    ]);
    body = (
      <div className="space-y-5">
        <Notice tone="info">A broad administrator role does not open a client&rsquo;s private observations, briefings or tickets. Request a time-boxed support grant with a reason; it is audited and expires automatically.</Notice>
        <Panel title="Request support access">
          <form action={createSupportGrant} className="grid gap-2 sm:grid-cols-[1fr_2fr_auto_auto]">
            <select name="org_id" className={field}>{(orgs ?? []).map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}</select>
            <input name="reason" placeholder="Reason (ticket reference, what you need to see)" className={field} required minLength={15} />
            <select name="hours" className={field} defaultValue="2"><option value="1">1 hour</option><option value="2">2 hours</option><option value="8">8 hours</option><option value="24">24 hours</option></select>
            <Button>Grant</Button>
          </form>
        </Panel>
        <Panel title="Support grants">
          <ul className="space-y-2">{(grants ?? []).map((g) => {
            const active = !g.revoked_at && new Date(g.expires_at) > new Date();
            return (
              <li key={g.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white/[0.04] ring-1 ring-inset ring-white/[0.06] px-4 py-3 text-[14px]">
                <span>{(g.organizations as unknown as { name: string }).name} · {(g.profiles as unknown as { display_name: string }).display_name}<span className="block text-[12px] text-muted">{g.reason} · until {formatDateTime(g.expires_at)}</span></span>
                <span className="flex items-center gap-2"><Pill tone={active ? "warn" : "neutral"}>{active ? "Active" : g.revoked_at ? "Revoked" : "Expired"}</Pill>{active && <form action={revokeSupportGrant}><input type="hidden" name="id" value={g.id} /><Button size="sm" variant="ghost">Revoke</Button></form>}</span>
              </li>
            );
          })}</ul>
        </Panel>
      </div>
    );
  } else if (tab === "settings") {
    const { data } = await db().from("platform_settings").select("key, value, updated_at");
    body = (
      <div className="space-y-5">
        <Panel title="Minimum cohort for shared trend statistics" description="Counts are suppressed below this many distinct organisations. The judging floor is 3; a production threshold needs approval before launch.">
          <form action={updateSetting} className="flex items-center gap-2"><input type="hidden" name="key" value="min_cohort_orgs" />
            <input name="value" type="number" min={3} defaultValue={await minCohort()} className={`${field} w-24`} /><Button size="sm" variant="secondary">Save</Button>
            <span className="text-[13px] text-muted">Never lower than MIN_COHORT_ORGS ({env.minCohortOrgs}).</span></form>
        </Panel>
        <Panel title="Platform settings">
          <ul className="space-y-2">{(data ?? []).map((s) => <li key={s.key} className="rounded-xl bg-white/[0.04] ring-1 ring-inset ring-white/[0.06] px-4 py-3"><p className="text-[14px] font-medium">{s.key.replace(/_/g, " ")}</p><pre className="mt-1 whitespace-pre-wrap font-mono text-[12px] text-ink-2">{JSON.stringify(s.value, null, 2)}</pre></li>)}</ul>
        </Panel>
      </div>
    );
  } else if (tab === "audit") {
    const { data } = await db().from("audit_log").select("id, actor_label, action, resource_type, resource_id, metadata, created_at").order("id", { ascending: false }).limit(150);
    body = (
      <Panel title="Audit log" description="Append-only. Updates and deletes are rejected by the database.">
        <div className="overflow-x-auto scroll-thin">
          <table className="w-full min-w-[720px] text-[13px]">
            <thead><tr className="text-left text-muted"><th className="py-2 font-medium">When</th><th className="font-medium">Actor</th><th className="font-medium">Action</th><th className="font-medium">Resource</th><th className="font-medium">Details</th></tr></thead>
            <tbody>{(data ?? []).map((a) => (
              <tr key={a.id} className="border-t border-line align-top"><td className="py-2 pr-3 text-muted">{timeAgo(a.created_at)}</td><td className="pr-3">{a.actor_label}</td><td className="pr-3 text-ink">{a.action}</td><td className="pr-3 text-muted">{a.resource_type}</td><td className="max-w-[320px] truncate font-mono text-[11px] text-muted">{JSON.stringify(a.metadata)}</td></tr>
            ))}</tbody>
          </table>
        </div>
      </Panel>
    );
  } else if (tab === "outbox") {
    const { data } = await db().from("email_outbox").select("id, to_email, subject, status, attempts, last_error, created_at, sent_at").order("created_at", { ascending: false }).limit(60);
    body = (
      <Panel title="Email outbox" description={`Persisted, idempotent delivery. ${env.resendKey ? "Resend is configured." : "RESEND_API_KEY is not set, so messages stay queued and are never shown as delivered."}`}
        actions={<form action={runOutbox}><Button size="sm">Process queue now</Button></form>}>
        <ul className="space-y-2">{(data ?? []).map((m) => (
          <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white/[0.04] ring-1 ring-inset ring-white/[0.06] px-4 py-3 text-[13px]">
            <span>{m.subject}<span className="block text-muted">{m.to_email} · {timeAgo(m.created_at)} · {m.attempts} attempt(s){m.last_error ? ` · ${m.last_error}` : ""}</span></span>
            <Pill tone={m.status === "sent" ? "good" : m.status === "failed" ? "bad" : "neutral"}>{m.status === "sent" ? "Accepted by provider" : m.status}</Pill>
          </li>
        ))}</ul>
      </Panel>
    );
  } else {
    const [{ data: demos }, { data: regs }] = await Promise.all([
      db().from("demo_requests").select("name, email, company, offering_slug, created_at, status").order("created_at", { ascending: false }).limit(50),
      db().from("event_registrations").select("name, email, organisation, team_name, created_at").order("created_at", { ascending: false }).limit(50),
    ]);
    body = (
      <div className="grid gap-5 xl:grid-cols-2">
        <Panel title="Demo requests">{(demos ?? []).length === 0 ? <Empty title="None yet" /> : <ul className="space-y-2">{(demos ?? []).map((d, i) => <li key={i} className="rounded-xl bg-white/[0.04] ring-1 ring-inset ring-white/[0.06] px-4 py-3 text-[13px]"><span className="font-medium text-ink">{d.name}</span> · {d.company}<span className="block text-muted">{d.email} · {d.offering_slug ?? "any"} · {timeAgo(d.created_at)}</span></li>)}</ul>}</Panel>
        <Panel title="Hackathon registrations">{(regs ?? []).length === 0 ? <Empty title="None yet" /> : <ul className="space-y-2">{(regs ?? []).map((d, i) => <li key={i} className="rounded-xl bg-white/[0.04] ring-1 ring-inset ring-white/[0.06] px-4 py-3 text-[13px]"><span className="font-medium text-ink">{d.name}</span> · {d.team_name ?? "no team"}<span className="block text-muted">{d.email} · {d.organisation} · {timeAgo(d.created_at)}</span></li>)}</ul>}</Panel>
      </div>
    );
  }

  return (
    <>
      <PageHeader icon={Settings} title="Administration" description="Organisations, role grants, configuration and operational controls. Every privileged action is written to the audit log." />
      <Tabs active={`/portal/admin?tab=${tab}`} items={tabs} />
      {body}
    </>
  );
}
