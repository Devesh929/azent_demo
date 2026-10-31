"use client";

import { useActionState, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FormMessage, Input, Select, Textarea } from "@/components/ui/form";
import { CONFIDENCE, EVIDENCE_TYPES, OBS_CATEGORIES } from "@/lib/constants";
import { scanSensitive } from "@/lib/sensitive";
import { cn } from "@/lib/utils";
import { saveObservation, type ActionState } from "@/app/portal/observations/actions";

type Values = Partial<Record<"id" | "title" | "category" | "body" | "offering_id" | "industry" | "region" | "period_start" | "period_end" | "evidence_type" | "confidence" | "visibility", string>> & { links?: string[] };

export function ObservationForm({ offerings, initial, published }: { offerings: { id: string; name: string }[]; initial?: Values; published?: boolean }) {
  const [state, action, pending] = useActionState(saveObservation, { ok: false } as ActionState);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [body, setBody] = useState(initial?.body ?? "");
  const [visibility, setVisibility] = useState(initial?.visibility ?? "private");
  const flags = useMemo(() => scanSensitive(title, body), [title, body]);
  const e = state.errors ?? {};

  return (
    <form action={action} className="space-y-6" noValidate>
      {initial?.id && <input type="hidden" name="id" value={initial.id} />}
      {published && (
        <div className="rounded-xl bg-warn-soft px-4 py-3 text-[14px] text-warn">
          This contribution is shared. Saving changes creates a new version that needs renewed review. The current shared copy stays as approved until then.
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Title" name="title" error={e.title} className="md:col-span-2" hint={`${title.length}/140`}>
          <Input name="title" value={title} onChange={(ev) => setTitle(ev.target.value)} maxLength={140} error={e.title} placeholder="Describe the pattern in a sentence" />
        </Field>
        <Field label="Type of contribution" name="category" error={e.category}>
          <Select name="category" defaultValue={initial?.category ?? "market_observation"}>
            {Object.entries(OBS_CATEGORIES).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </Select>
        </Field>
        <Field label="Related offering" name="offering_id">
          <Select name="offering_id" defaultValue={initial?.offering_id ?? ""}>
            <option value="">None</option>
            {offerings.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
          </Select>
        </Field>
        <Field label="What did you observe?" name="body" error={e.body} className="md:col-span-2"
          hint={<>Describe patterns, not people. Leave out customer names, account numbers, transaction-level data, credentials and confidential terms. {body.length}/4000</>}>
          <Textarea name="body" value={body} onChange={(ev) => setBody(ev.target.value)} maxLength={4000} rows={7} error={e.body} />
        </Field>

        <AnimatePresence>
          {flags.length > 0 && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="md:col-span-2">
              <div className="rounded-xl bg-warn-soft p-4 text-[14px] text-warn">
                <p className="flex items-center gap-2 font-medium"><ShieldAlert size={16} /> Possible sensitive content</p>
                <ul className="mt-2 space-y-1 text-ink-2">
                  {flags.map((f) => <li key={f.kind + f.match}>{f.label}: <span className="rounded bg-ground/40 px-1 font-mono text-[13px] text-ink">{f.match}</span></li>)}
                </ul>
                <p className="mt-2 text-[13px] text-ink-2">This check is a prompt, not a guarantee. Flagged items are reviewed before any shared publication.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <Field label="Period starts" name="period_start" error={e.period_start}><Input type="date" name="period_start" defaultValue={initial?.period_start} error={e.period_start} /></Field>
        <Field label="Period ends" name="period_end" error={e.period_end}><Input type="date" name="period_end" defaultValue={initial?.period_end} error={e.period_end} /></Field>
        <Field label="Evidence type" name="evidence_type">
          <Select name="evidence_type" defaultValue={initial?.evidence_type ?? "client_interactions"}>
            {Object.entries(EVIDENCE_TYPES).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </Select>
        </Field>
        <Field label="Confidence" name="confidence">
          <Select name="confidence" defaultValue={initial?.confidence ?? "medium"}>
            {Object.entries(CONFIDENCE).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </Select>
        </Field>
        <Field label="Industry" name="industry"><Input name="industry" defaultValue={initial?.industry ?? ""} placeholder="e.g. SME lending" /></Field>
        <Field label="Region" name="region" hint="Use a broad region. Moderators coarsen place names before sharing."><Input name="region" defaultValue={initial?.region ?? ""} placeholder="e.g. South Asia" /></Field>
        <Field label="Supporting links" name="links" error={e.links} className="md:col-span-2" hint="Up to five public URLs, separated by spaces. Attachments are not accepted in this release.">
          <Input name="links" defaultValue={initial?.links?.join(" ") ?? ""} error={e.links} />
        </Field>
      </div>

      <fieldset>
        <legend className="text-[14px] font-medium text-ink-2">Who can see this draft?</legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {([["private", "Only me", "A private draft. Nobody else can see it."], ["org", "My organisation", "Members of your organisation can read it. It never leaves your organisation by default."]] as const).map(([k, l, h]) => (
            <label key={k} className={cn("cursor-pointer rounded-xl p-4 ring-1 ring-inset transition-colors", visibility === k ? "bg-accent-soft ring-accent" : "bg-surface-2 ring-line hover:ring-line-strong")}>
              <input type="radio" name="visibility" value={k} checked={visibility === k} onChange={() => setVisibility(k)} className="sr-only" />
              <span className="block text-[15px] font-medium text-ink">{l}</span>
              <span className="mt-1 block text-[13px] text-ink-2">{h}</span>
            </label>
          ))}
        </div>
        <p className="mt-3 text-[13px] text-muted">Proposing it to the learning community is a separate step after saving, with explicit consent.</p>
      </fieldset>

      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" size="lg" disabled={pending}>{pending ? "Saving…" : initial?.id ? "Save changes" : "Save private draft"}</Button>
        <FormMessage ok={state.ok} message={state.message} />
      </div>
    </form>
  );
}
