"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, FormMessage, Input, Select, Textarea } from "@/components/ui/form";
import { decide, type ModState } from "@/app/portal/moderation/actions";

type Proposal = { title: string; summary: string; region: string; period_label: string };

export function ModerationForm({ id, status, proposal, attributionAllowed, publishAllowed }: { id: string; status: string; proposal: Proposal; attributionAllowed: boolean; publishAllowed: boolean }) {
  const [s, act, pending] = useActionState(decide, { ok: false } as ModState);
  const [summary, setSummary] = useState(proposal.summary);
  const e = s.errors ?? {};
  const live = status === "published" || status === "unpublished";

  return (
    <form action={act} className="space-y-5">
      <input type="hidden" name="id" value={id} />
      {!live && (
        <>
          <Field label="Shared title" name="title" error={e.title}><Input name="title" defaultValue={proposal.title} error={e.title} /></Field>
          <Field label="Shared summary" name="summary" error={e.summary} hint={`Generalise places, dates and anything rare enough to identify someone. ${summary.length}/1500`}>
            <Textarea name="summary" value={summary} onChange={(ev) => setSummary(ev.target.value)} rows={7} error={e.summary} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Region (coarsened)" name="region"><Input name="region" defaultValue={proposal.region} /></Field>
            <Field label="Period label" name="period_label" error={e.period_label}><Input name="period_label" defaultValue={proposal.period_label} error={e.period_label} /></Field>
            <Field label="Evidence quality" name="evidence_quality">
              <Select name="evidence_quality" defaultValue="moderate"><option value="limited">Limited</option><option value="moderate">Moderate</option><option value="strong">Strong</option></Select>
            </Field>
          </div>
          {attributionAllowed ? (
            <Checkbox name="attribution" label="Approve organisation attribution" description="The contributor opted in. Approve only if naming them does not expose anything sensitive." />
          ) : (
            <p className="text-[13px] text-muted">The contributor did not opt in to attribution. The shared copy will be unattributed.</p>
          )}
        </>
      )}
      <Field label="Message to the contributor" name="reason_public" error={e.reason_public} hint="Required for clarification or rejection. Shown to the contributor.">
        <Textarea name="reason_public" rows={3} error={e.reason_public} />
      </Field>
      <Field label="Internal note" name="internal_note" hint="Moderators only. Never shown to contributors or the community.">
        <Textarea name="internal_note" rows={2} />
      </Field>
      <div className="flex flex-wrap gap-2">
        {!live && <Button name="decision" value="publish" disabled={pending || !publishAllowed} title={publishAllowed ? undefined : "No publication consent"}>Publish reviewed copy</Button>}
        {!live && <Button name="decision" value="clarify" variant="secondary" disabled={pending}>Request clarification</Button>}
        {!live && <Button name="decision" value="reject" variant="danger" disabled={pending}>Reject</Button>}
        {status === "published" && <Button name="decision" value="unpublish" variant="danger" disabled={pending}>Temporarily unpublish</Button>}
        {status === "unpublished" && <Button name="decision" value="restore" disabled={pending}>Restore</Button>}
      </div>
      <FormMessage ok={s.ok} message={s.message} />
    </form>
  );
}
