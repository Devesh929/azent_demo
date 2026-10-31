import type { Metadata } from "next";
import { PageIntro } from "@/components/site/PageIntro";
import { Trust } from "@/components/site/home/Trust";
import { Reveal } from "@/components/site/motion";

export const metadata: Metadata = { title: "Trust & security" };

const CONTROLS = [
  ["Authentication", "Email code or magic link through a managed identity provider. Employees need a verified @azentio.com address and an approved membership. Clients join only by invitation or approval."],
  ["Authorisation", "Role grants, tenant membership, resource audience and product entitlement are checked on the server for every page, action, API call and media request. The database denies direct client access."],
  ["Least privilege", "Being an employee does not make you an administrator. Publishing, moderating, inviting and administering are separate grants. Portal administrators need a time-boxed support grant to open a client's private content."],
  ["Auditability", "Privileged actions, moderation decisions, consent changes and idea status changes are written to append-only logs."],
  ["Privacy in learning", "Shared copies are de-identified, minimum cohort sizes protect trend statistics, and raw private records stay out of shared analytics, search, logs and AI prompts."],
  ["Synthetic by default", "Every sandbox, scenario and dataset in this environment is synthetic. Sandbox outputs are demonstrations, not credit or business decisions."],
];

export default function TrustPage() {
  return (
    <>
      <PageIntro title="Trust is part of the product." lede="How azentio.ai protects identity, tenants and contributions, and what we will not claim." />
      <Trust />
      <section className="frame pb-[clamp(96px,12vw,160px)]">
        <ul className="grid gap-5 md:grid-cols-2">
          {CONTROLS.map(([t, d], i) => (
            <Reveal key={t} delay={(i % 2) * 0.05} className="glass ring-gradient rounded-[28px] p-8">
              <h2 className="text-[22px] font-semibold tracking-[-0.02em]">{t}</h2>
              <p className="mt-3 text-[16px] leading-relaxed text-ink-2">{d}</p>
            </Reveal>
          ))}
        </ul>
      </section>
    </>
  );
}
