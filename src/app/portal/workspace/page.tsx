import type { Metadata } from "next";
import { Building2, Check } from "lucide-react";
import { requireViewer } from "@/lib/authz/policy";
import { env } from "@/lib/env";
import { PageHeader, Panel, Pill, Notice, Empty } from "@/components/portal/ui";
import { Button } from "@/components/ui/button";
import { roleLabel } from "@/lib/authz/policy";
import { acceptTerms, chooseWorkspace, requestEmployeeAccess } from "./actions";

export const metadata: Metadata = { title: "Workspace" };

export default async function WorkspacePage({ searchParams }: PageProps<"/portal/workspace">) {
  const v = await requireViewer("/portal/workspace");
  const sp = await searchParams;
  const usable = v.memberships.filter((m) => m.orgKind === "client" || v.isEmployee);
  const needsTerms = sp.terms === "1" && v.active?.orgKind === "client" && !v.active.termsAcceptedAt;
  const employeeDomain = v.email.endsWith("@" + env.employeeDomain);
  const internalPending = v.pendingMemberships.some((m) => m.orgKind === "internal");

  if (needsTerms && v.active) {
    return (
      <div className="mx-auto max-w-2xl">
        <PageHeader icon={Building2} title={`Welcome to ${v.active.orgName}`} description="Before you enter, please read how this workspace works." />
        <Panel>
          <div className="space-y-5 text-[15px] leading-relaxed text-ink-2">
            <div>
              <h2 className="text-[16px] font-semibold text-ink">Workspace terms</h2>
              <p className="mt-2">This workspace is private to {v.active.orgName}. You will see only the demonstrations, sessions and resources your organisation is entitled to. Sandbox outputs use synthetic data and are not credit or business decisions.</p>
            </div>
            <div>
              <h2 className="text-[16px] font-semibold text-ink">How sharing works</h2>
              <ul className="mt-2 space-y-2">
                {[
                  "Joining this workspace is not consent to share anything, or to train any model on your data.",
                  "Your observations start as private drafts. You choose: only you, your organisation, or a proposal to the learning community.",
                  "Community proposals are de-identified and reviewed by a moderator before anything is shared, and only with your explicit consent.",
                  "Storing, publishing, attribution and model training are four separate permissions you can review per contribution.",
                  "You can withdraw a shared contribution at any time. Copies already viewed elsewhere cannot be recalled automatically.",
                ].map((t) => <li key={t} className="flex gap-3"><Check size={16} className="mt-1 shrink-0 text-accent" />{t}</li>)}
              </ul>
            </div>
          </div>
          <form action={acceptTerms} className="mt-8 space-y-5">
            <input type="hidden" name="membership_id" value={v.active.id} />
            <label className="flex items-start gap-3 text-[15px]">
              <input type="checkbox" name="understood" className="mt-0.5 size-5 accent-[var(--accent)]" />
              I have read the workspace terms and understand how sharing works.
            </label>
            {sp.error === "terms" && <p className="text-[13px] text-bad">Please confirm to continue.</p>}
            <Button type="submit" size="lg">Enter workspace</Button>
          </form>
        </Panel>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader icon={Building2} title="Choose a workspace" description="You can belong to more than one organisation. Everything you see and do applies to the workspace you choose here." />
      {sp.requested === "1" && <div className="mb-6"><Notice tone="good">Request sent. A portal administrator will review it.</Notice></div>}
      {sp.error === "1" && <div className="mb-6"><Notice tone="bad">That workspace is not available to you.</Notice></div>}

      {usable.length === 0 ? (
        <Panel>
          <Empty title="You do not have a workspace yet">
            {employeeDomain
              ? internalPending
                ? "Your employee access request is waiting for approval by a portal administrator."
                : "You signed in with a verified azentio.com address. Employee access still needs an administrator's approval."
              : "Clients join through an invitation from their organisation's administrator. Ask them to invite this email address."}
          </Empty>
          {employeeDomain && !internalPending && (
            <form action={requestEmployeeAccess} className="mt-4"><Button type="submit">Request employee access</Button></form>
          )}
        </Panel>
      ) : (
        <ul className="grid gap-3">
          {usable.map((m) => (
            <li key={m.id}>
              <form action={chooseWorkspace}>
                <input type="hidden" name="membership_id" value={m.id} />
                <button className="flex w-full items-center gap-4 glass ring-gradient rounded-[22px] p-5 text-left transition-all duration-300 hover:-translate-y-1 hover:bg-white/[0.06]">
                  <span className={`grid size-12 place-items-center rounded-xl ${m.orgKind === "internal" ? "bg-accent text-accent-ink" : "bg-blue text-ground"}`}><Building2 size={20} /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[16px] font-medium">{m.orgName}</span>
                    <span className="mt-1 flex flex-wrap gap-1.5">{m.roles.map((r) => <Pill key={r}>{roleLabel(r)}</Pill>)}</span>
                  </span>
                  {v.active?.id === m.id && <Pill tone="good">Active</Pill>}
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
