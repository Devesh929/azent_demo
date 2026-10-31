"use client";

import { useActionState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Mail, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FormMessage, Input } from "@/components/ui/form";
import { sendCode, verifyCode, type LoginState } from "./actions";

export function LoginForm({ next }: { next: string }) {
  const [sent, send, sending] = useActionState(sendCode, { step: "email" } as LoginState);
  const [verified, verify, verifying] = useActionState(verifyCode, { step: "code" } as LoginState);
  const onCode = sent.step === "code";

  return (
    <AnimatePresence mode="wait">
      {!onCode ? (
        <motion.form key="email" action={send} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-5">
          <input type="hidden" name="next" value={next} />
          <Field label="Work email" name="email" error={sent.error}>
            <Input name="email" type="email" autoComplete="email" placeholder="you@company.com" defaultValue={sent.email} required autoFocus error={sent.error} />
          </Field>
          <Button type="submit" size="lg" className="w-full" disabled={sending}>
            <Mail size={16} /> {sending ? "Sending…" : "Email me a sign-in code"}
          </Button>
        </motion.form>
      ) : (
        <motion.form key="code" action={verify} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          <FormMessage ok message={sent.message} />
          <input type="hidden" name="email" value={sent.email} />
          <input type="hidden" name="next" value={next} />
          <Field label="Sign-in code" name="token" error={verified.error} hint="Or open the link in the email on this device.">
            <Input name="token" inputMode="numeric" autoComplete="one-time-code" placeholder="123456" maxLength={8} autoFocus error={verified.error} className="text-center text-[22px] tracking-[0.4em]" />
          </Field>
          <Button type="submit" size="lg" className="w-full" disabled={verifying}>
            <KeyRound size={16} /> {verifying ? "Checking…" : "Sign in"}
          </Button>
        </motion.form>
      )}
    </AnimatePresence>
  );
}
