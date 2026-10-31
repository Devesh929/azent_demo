"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox, FormMessage } from "@/components/ui/form";
import { submitForReview, updateConsent, withdrawObservation, type ActionState } from "@/app/portal/observations/actions";

const init: ActionState = { ok: false };

function ConsentBoxes({ defaults, errors, locked }: { defaults?: Partial<Record<string, boolean>>; errors?: Record<string, string>; locked?: boolean }) {
  return (
    <div className="space-y-4">
      <Checkbox name="store_process" defaultChecked={defaults?.store_process ?? true} error={errors?.store_process}
        label="Store and process this contribution" description="Required to keep it in azentio.ai and route it for review." />
      <Checkbox name="publish_shared" defaultChecked={defaults?.publish_shared ?? false} error={errors?.publish_shared}
        label="Publish a reviewed, de-identified copy to the learning community" description="Only the moderator's reviewed copy is shared, never this original or its metadata." />
      <Checkbox name="attribution" defaultChecked={defaults?.attribution ?? false}
        label="Name my organisation on the shared copy" description="Off by default. Attribution also needs a moderator's approval." />
      <Checkbox name="training" defaultChecked={defaults?.training ?? false}
        label="Allow use in a future model-training programme" description="Separate from publishing. Recorded now; any programme needs its own opt-in and cannot be undone by withdrawal once a model is trained." />
      {locked && <p className="text-[13px] text-muted">Storing and processing stays on while the contribution exists.</p>}
    </div>
  );
}

export function SubmitPanel({ id }: { id: string }) {
  const [s, act, pending] = useActionState(submitForReview, init);
  return (
    <form action={act} className="space-y-5">
      <input type="hidden" name="id" value={id} />
      <ConsentBoxes errors={s.errors} />
      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" disabled={pending}>{pending ? "Submitting…" : "Propose for the learning community"}</Button>
        <FormMessage ok={s.ok} message={s.message} />
      </div>
    </form>
  );
}

export function ConsentPanel({ id, current }: { id: string; current: Record<string, boolean> }) {
  const [s, act, pending] = useActionState(updateConsent, init);
  return (
    <form action={act} className="space-y-5">
      <input type="hidden" name="id" value={id} />
      <ConsentBoxes defaults={current} locked />
      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" variant="secondary" disabled={pending}>{pending ? "Saving…" : "Update permissions"}</Button>
        <FormMessage ok={s.ok} message={s.message} />
      </div>
    </form>
  );
}

export function WithdrawPanel({ id }: { id: string }) {
  const [s, act, pending] = useActionState(withdrawObservation, init);
  return (
    <form action={act} className="space-y-4" onSubmit={(e) => { if (!confirm("Withdraw this contribution from the learning community?")) e.preventDefault(); }}>
      <input type="hidden" name="id" value={id} />
      <p className="text-[14px] leading-relaxed text-ink-2">
        Withdrawing removes the shared copy from the feed, search and AIRA straight away and stops future use. People who already read it, or copies made outside azentio.ai, cannot be recalled automatically.
      </p>
      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" variant="danger" disabled={pending}>{pending ? "Withdrawing…" : "Withdraw contribution"}</Button>
        <FormMessage ok={s.ok} message={s.message} />
      </div>
    </form>
  );
}
