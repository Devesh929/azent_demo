"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FormMessage, Input, Select } from "@/components/ui/form";
import { invite, type OrgState } from "@/app/portal/org/actions";

export function InviteForm({ demo }: { demo: boolean }) {
  const [s, act, pending] = useActionState(invite, { ok: false } as OrgState);
  return (
    <form action={act} className="space-y-4">
      <Field label="Email" name="email" error={s.errors?.email}><Input name="email" type="email" error={s.errors?.email} /></Field>
      <Field label="Role" name="role" hint="Clients can grant only client roles. Employee, moderator, publisher and administrator roles are never available here.">
        <Select name="role" defaultValue="client_member"><option value="client_member">Member</option><option value="client_admin">Client administrator</option></Select>
      </Field>
      <Button disabled={pending}>Send invitation</Button>
      <FormMessage ok={s.ok} message={s.message} />
      {s.ok && s.link && demo && (
        <p className="break-all rounded-xl bg-white/[0.04] ring-1 ring-inset ring-white/[0.06] p-3 text-[12px] text-ink-2">Demo mode: invitation link (shown once) <span className="text-ink">{s.link}</span></p>
      )}
    </form>
  );
}
