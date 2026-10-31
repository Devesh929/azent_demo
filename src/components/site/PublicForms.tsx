"use client";

import { useActionState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CheckCircle2 } from "lucide-react";
import { OFFERINGS } from "@/content/catalog";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, FormMessage, Honeypot, Input, Select, Textarea } from "@/components/ui/form";
import { registerForHackathon, submitDemoRequest, type FormState } from "@/app/(site)/actions";

const initial: FormState = { ok: false };

function Done({ message }: { message?: string }) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-start gap-4 glass ring-gradient rounded-[28px] p-10">
      <CheckCircle2 size={36} className="text-accent" />
      <h2 className="text-[26px] font-semibold tracking-[-0.02em]">Thank you</h2>
      <p className="text-[16px] leading-relaxed text-ink-2">{message}</p>
    </motion.div>
  );
}

export function DemoForm({ offering }: { offering?: string }) {
  const [state, action, pending] = useActionState(submitDemoRequest, initial);
  const e = state.errors ?? {};
  return (
    <AnimatePresence mode="wait">
      {state.ok ? (
        <Done key="done" message={state.message} />
      ) : (
        <motion.form key="form" action={action} className="relative grid gap-5 glass ring-gradient rounded-[28px] p-[clamp(24px,3vw,40px)] sm:grid-cols-2" noValidate>
          <Honeypot />
          <Field label="Full name" name="name" error={e.name}><Input name="name" autoComplete="name" required error={e.name} /></Field>
          <Field label="Work email" name="email" error={e.email}><Input name="email" type="email" autoComplete="email" required error={e.email} /></Field>
          <Field label="Company" name="company" error={e.company}><Input name="company" autoComplete="organization" required error={e.company} /></Field>
          <Field label="Job title" name="job_title"><Input name="job_title" autoComplete="organization-title" /></Field>
          <Field label="Product of interest" name="offering_slug" className="sm:col-span-2">
            <Select name="offering_slug" defaultValue={offering ?? ""}>
              <option value="">Not sure yet</option>
              {OFFERINGS.map((o) => <option key={o.slug} value={o.slug}>{o.name}</option>)}
            </Select>
          </Field>
          <Field label="What would you like to see?" name="message" className="sm:col-span-2" hint="Please do not include customer or account details.">
            <Textarea name="message" maxLength={2000} />
          </Field>
          <div className="sm:col-span-2">
            <Checkbox name="consent_contact" error={e.consent_contact} label="You may contact me about this request." description="We use these details only to arrange your demo." />
          </div>
          <div className="flex flex-col gap-4 sm:col-span-2">
            <FormMessage ok={false} message={state.message} />
            <Button type="submit" size="lg" disabled={pending} className="w-fit">{pending ? "Sending…" : "Request a demo"}</Button>
          </div>
        </motion.form>
      )}
    </AnimatePresence>
  );
}

export function HackathonForm() {
  const [state, action, pending] = useActionState(registerForHackathon, initial);
  const e = state.errors ?? {};
  return (
    <AnimatePresence mode="wait">
      {state.ok ? (
        <Done key="done" message={state.message} />
      ) : (
        <motion.form key="form" action={action} className="relative grid gap-5 glass ring-gradient rounded-[28px] p-[clamp(24px,3vw,40px)] sm:grid-cols-2" noValidate>
          <Honeypot />
          <Field label="Full name" name="name" error={e.name}><Input name="name" autoComplete="name" error={e.name} /></Field>
          <Field label="Email" name="email" error={e.email}><Input name="email" type="email" autoComplete="email" error={e.email} /></Field>
          <Field label="Organisation or university" name="organisation"><Input name="organisation" /></Field>
          <Field label="Team name" name="team_name" hint="Teams of up to five."><Input name="team_name" /></Field>
          <Field label="Your idea, in a few lines" name="idea" className="sm:col-span-2"><Textarea name="idea" maxLength={2000} /></Field>
          <div className="sm:col-span-2">
            <Checkbox name="consent_contact" error={e.consent_contact} label="You may contact me about the hackathon." />
          </div>
          <div className="flex flex-col gap-4 sm:col-span-2">
            <FormMessage ok={false} message={state.message} />
            <Button type="submit" size="lg" disabled={pending} className="w-fit">{pending ? "Registering…" : "Register"}</Button>
          </div>
        </motion.form>
      )}
    </AnimatePresence>
  );
}
