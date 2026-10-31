"use client";

import { useActionState, useState } from "react";
import { Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FormMessage, Select, Textarea } from "@/components/ui/form";
import { addComment, reportContribution, type LState } from "@/app/portal/learning/actions";

export function CommentForm({ id }: { id: string }) {
  const [s, act, pending] = useActionState(addComment, { ok: false } as LState);
  return (
    <form action={act} className="space-y-3">
      <input type="hidden" name="id" value={id} />
      <Field label="Add a comment" name="body" error={s.errors?.body} hint="Comments are visible to the same learning community as this contribution. Do not include client or customer details.">
        <Textarea name="body" rows={3} maxLength={2000} error={s.errors?.body} />
      </Field>
      <div className="flex items-center gap-3"><Button size="sm" disabled={pending}>Post comment</Button><FormMessage ok={s.ok} message={s.message} /></div>
    </form>
  );
}

export function ReportForm({ id }: { id: string }) {
  const [open, setOpen] = useState(false);
  const [s, act, pending] = useActionState(reportContribution, { ok: false } as LState);
  if (!open) return <button onClick={() => setOpen(true)} className="flex items-center gap-2 text-[13px] text-muted hover:text-bad"><Flag size={14} /> Report this contribution</button>;
  return (
    <form action={act} className="space-y-3 rounded-xl bg-white/[0.04] ring-1 ring-inset ring-white/[0.06] p-4">
      <input type="hidden" name="id" value={id} />
      <Field label="Reason" name="reason">
        <Select name="reason" defaultValue="misleading">
          <option value="misleading">Misleading</option><option value="confidential">Contains confidential information</option>
          <option value="inappropriate">Inappropriate</option><option value="duplicate">Duplicate</option><option value="other">Other</option>
        </Select>
      </Field>
      <Field label="Details (optional)" name="details" hint="You do not need to name any other client."><Textarea name="details" rows={3} /></Field>
      <div className="flex items-center gap-3"><Button size="sm" variant="danger" disabled={pending || s.ok}>Send report</Button><FormMessage ok={s.ok} message={s.message} /></div>
    </form>
  );
}
