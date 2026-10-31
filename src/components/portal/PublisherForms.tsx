"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FormMessage, Input, Select, Textarea } from "@/components/ui/form";
import { AUDIENCE_LABEL } from "@/lib/constants";
import { saveContent, saveSession, uploadMedia, type PubState } from "@/app/portal/publisher/actions";

type Opt = { id: string; name: string };
const init: PubState = { ok: false };

function AudienceFields({ orgs, offerings, defaults }: { orgs: Opt[]; offerings: Opt[]; defaults?: { audience?: string; org_id?: string | null; offering_id?: string | null } }) {
  const [aud, setAud] = useState(defaults?.audience ?? "employees");
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Field label="Audience" name="audience" hint="Always explicit. Nothing defaults to public.">
        <Select name="audience" value={aud} onChange={(e) => setAud(e.target.value)}>{Object.entries(AUDIENCE_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</Select>
      </Field>
      <Field label="Organisation" name="org_id"><Select name="org_id" defaultValue={defaults?.org_id ?? ""} disabled={aud !== "org"}><option value="">—</option>{orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}</Select></Field>
      <Field label="Offering" name="offering_id"><Select name="offering_id" defaultValue={defaults?.offering_id ?? ""}><option value="">—</option>{offerings.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}</Select></Field>
    </div>
  );
}

export function ContentForm({ orgs, offerings, media }: { orgs: Opt[]; offerings: Opt[]; media: Opt[] }) {
  const [s, act, pending] = useActionState(saveContent, init);
  return (
    <form action={act} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Type" name="kind"><Select name="kind" defaultValue="release_note">
          {["banner", "insight", "media", "release_note", "briefing", "resource", "knowledge", "experiment", "prototype_note", "broadcast"].map((k) => <option key={k} value={k}>{k.replace("_", " ")}</option>)}
        </Select></Field>
        <Field label="Status" name="status"><Select name="status" defaultValue="draft"><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></Select></Field>
        <Field label="Slug (public items)" name="slug"><Input name="slug" placeholder="my-article" /></Field>
      </div>
      <Field label="Title" name="title"><Input name="title" required /></Field>
      <Field label="Summary" name="summary"><Input name="summary" /></Field>
      <Field label="Body" name="body"><Textarea name="body" rows={5} /></Field>
      <AudienceFields orgs={orgs} offerings={offerings} />
      <Field label="Attachment" name="media_asset_id"><Select name="media_asset_id" defaultValue=""><option value="">None</option>{media.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</Select></Field>
      <div className="flex items-center gap-4"><Button disabled={pending}>Save content</Button><FormMessage ok={s.ok} message={s.message} /></div>
    </form>
  );
}

export function SessionForm({ orgs, offerings, media }: { orgs: Opt[]; offerings: Opt[]; media: Opt[] }) {
  const [s, act, pending] = useActionState(saveSession, init);
  return (
    <form action={act} className="space-y-4">
      <Field label="Title" name="title"><Input name="title" required /></Field>
      <Field label="Description" name="description"><Textarea name="description" rows={2} /></Field>
      <div className="grid gap-4 sm:grid-cols-4">
        <Field label="Kind" name="kind"><Select name="kind" defaultValue="live"><option value="live">Live</option><option value="webinar">Webinar</option><option value="recording">Recording</option></Select></Field>
        <Field label="Starts" name="starts_at"><Input type="datetime-local" name="starts_at" required /></Field>
        <Field label="Minutes" name="duration_min"><Input type="number" name="duration_min" defaultValue={45} /></Field>
        <Field label="Status" name="status"><Select name="status" defaultValue="scheduled"><option value="scheduled">Scheduled</option><option value="live">Live</option><option value="ended">Ended</option><option value="cancelled">Cancelled</option></Select></Field>
      </div>
      <AudienceFields orgs={orgs} offerings={offerings} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Stream URL" name="stream_url"><Input name="stream_url" placeholder="https://" /></Field>
        <Field label="Recording" name="recording_asset_id"><Select name="recording_asset_id" defaultValue=""><option value="">None</option>{media.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</Select></Field>
      </div>
      <div className="flex items-center gap-4"><Button disabled={pending}>Save session</Button><FormMessage ok={s.ok} message={s.message} /></div>
    </form>
  );
}

export function UploadForm({ orgs, offerings }: { orgs: Opt[]; offerings: Opt[] }) {
  const [s, act, pending] = useActionState(uploadMedia, init);
  return (
    <form action={act} className="space-y-4">
      <Field label="Title" name="title"><Input name="title" /></Field>
      <Field label="File" name="file" hint="PDF, MP4, WebM, PNG or JPEG up to 4 MB. Stored privately."><input type="file" name="file" accept=".pdf,.mp4,.webm,.png,.jpg,.jpeg" className="block w-full text-[14px] text-ink-2 file:mr-3 file:rounded-full file:border-0 file:bg-surface-3 file:px-4 file:py-2 file:text-ink" /></Field>
      <AudienceFields orgs={orgs} offerings={offerings} />
      <div className="flex items-center gap-4"><Button disabled={pending}>{pending ? "Uploading…" : "Upload"}</Button><FormMessage ok={s.ok} message={s.message} /></div>
    </form>
  );
}
