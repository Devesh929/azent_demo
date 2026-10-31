"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, FormMessage, Input, Select, Textarea } from "@/components/ui/form";
import { IDEA_STATUS } from "@/lib/constants";
import { createIdea, updateIdeaStatus, type IState } from "@/app/portal/ideas/actions";

export function NewIdeaForm({ offerings, themes, evidence, preTheme }: { offerings: { id: string; name: string }[]; themes: { id: string; title: string }[]; evidence: { id: string; title: string; theme_ids: string[] }[]; preTheme?: string }) {
  const [s, act, pending] = useActionState(createIdea, { ok: false } as IState);
  const e = s.errors ?? {};
  return (
    <form action={act} className="space-y-5">
      <Field label="Title" name="title" error={e.title}><Input name="title" error={e.title} /></Field>
      <Field label="Problem statement" name="problem_statement" error={e.problem_statement}><Textarea name="problem_statement" rows={4} error={e.problem_statement} /></Field>
      <Field label="Proposed outcome" name="proposed_outcome" error={e.proposed_outcome}><Textarea name="proposed_outcome" rows={3} error={e.proposed_outcome} /></Field>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Offering" name="offering_id"><Select name="offering_id"><option value="">None</option>{offerings.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}</Select></Field>
        <Field label="Team" name="team"><Input name="team" placeholder="e.g. Financial Analysis" /></Field>
        <Field label="Priority" name="priority"><Select name="priority" defaultValue="medium"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option></Select></Field>
      </div>
      <Field label="Theme" name="theme_id"><Select name="theme_id" defaultValue={preTheme ?? ""}><option value="">None</option>{themes.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}</Select></Field>
      <fieldset>
        <legend className="text-[14px] font-medium text-ink-2">Supporting contributions</legend>
        <p className="mt-1 text-[13px] text-muted">Only approved shared copies can be linked. You never see the private originals.</p>
        <div className="mt-3 max-h-72 space-y-2 overflow-y-auto pr-2 scroll-thin">
          {evidence.map((x) => (
            <label key={x.id} className="flex cursor-pointer items-start gap-3 rounded-xl bg-white/[0.04] ring-1 ring-inset ring-white/[0.06] px-4 py-3 text-[14px]">
              <input type="checkbox" name="evidence" value={x.id} defaultChecked={!!preTheme && x.theme_ids.includes(preTheme)} className="mt-0.5 size-4 accent-[var(--accent)]" /> {x.title}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="flex items-center gap-4"><Button size="lg" disabled={pending}>Create idea</Button><FormMessage ok={s.ok} message={s.message} /></div>
    </form>
  );
}

export function IdeaStatusForm({ id, status, sharedUpdate, internalNotes, clientVisible }: { id: string; status: string; sharedUpdate: string | null; internalNotes: string | null; clientVisible: boolean }) {
  const [s, act, pending] = useActionState(updateIdeaStatus, { ok: false } as IState);
  return (
    <form action={act} className="space-y-4">
      <input type="hidden" name="id" value={id} />
      <Field label="Status" name="status"><Select name="status" defaultValue={status}>{Object.entries(IDEA_STATUS).map(([k, x]) => <option key={k} value={k}>{x.label}</option>)}</Select></Field>
      <Field label="Note for the history" name="note"><Input name="note" placeholder="Why the status changed" /></Field>
      <Field label="Message clients will see" name="shared_update" error={s.errors?.shared_update} hint="Describe the theme and the decision in plain language. No roadmaps, dates, other clients' cases or delivery promises.">
        <Textarea name="shared_update" rows={3} defaultValue={sharedUpdate ?? ""} error={s.errors?.shared_update} />
      </Field>
      <Checkbox name="client_visible" defaultChecked={clientVisible} label="Show this idea and message to clients" description="Contributors of linked evidence are notified." />
      <Field label="Internal notes" name="internal_notes" hint="Employees only. Never shown to clients."><Textarea name="internal_notes" rows={3} defaultValue={internalNotes ?? ""} /></Field>
      <div className="flex items-center gap-4"><Button disabled={pending}>Save</Button><FormMessage ok={s.ok} message={s.message} /></div>
    </form>
  );
}
