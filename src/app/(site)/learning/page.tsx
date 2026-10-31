import Link from "next/link";
import type { Metadata } from "next";
import { PageIntro } from "@/components/site/PageIntro";
import { LearningLoop } from "@/components/site/home/LearningLoop";
import { Reveal } from "@/components/site/motion";
import { buttonClass } from "@/components/ui/button";

export const metadata: Metadata = { title: "Collective learning", description: "How client observations become governed shared learning." };

const DIFFERENCES = [
  { t: "Collective learning hub", d: "Clients submit observations, trends and suggestions. Moderators publish reviewed, de-identified copies to authorised participants. This is the community workflow, and it is live in the portal.", tag: "In the portal" },
  { t: "AI-assisted synthesis", d: "AIRA summarises only evidence the reader is allowed to see and cites the approved contributions it used. Retrieval and summarisation do not retrain any model.", tag: "In the portal" },
  { t: "Federated machine learning", d: "A separate, opt-in research programme. Each client environment trains locally and sends only bounded model updates for aggregation. Raw training records stay local.", tag: "Opt-in research track" },
];

const COMMITMENTS = [
  "Saving a draft never shares it. Organisation-only content is never shared by default.",
  "Storing, publishing, attribution and model training are four separate permissions.",
  "Shared copies carry no tenant IDs, author profiles, attachments or reviewer notes.",
  "Trend counts appear only when at least three distinct organisations contribute.",
  "Withdrawal removes the shared copy from search, feeds and AIRA immediately in this environment.",
  "Material that was already viewed or copied elsewhere cannot be recalled automatically.",
];

export default function LearningPage() {
  return (
    <>
      <PageIntro title="Learning together, safely." lede="Our clients see the market first. Governed collective learning lets them share what they see without exposing customers, colleagues or competitive detail, and turns it into better products." />
      <section className="frame pb-24">
        <div className="grid gap-5 lg:grid-cols-3">
          {DIFFERENCES.map((d, i) => (
            <Reveal key={d.t} delay={i * 0.06} className="glass ring-gradient rounded-[28px] p-8">
              <p className="text-[13px] text-accent">{d.tag}</p>
              <h2 className="mt-3 text-[24px] font-semibold tracking-[-0.02em]">{d.t}</h2>
              <p className="mt-4 text-[16px] leading-relaxed text-ink-2">{d.d}</p>
            </Reveal>
          ))}
        </div>
      </section>
      <LearningLoop />
      <section className="frame grid gap-12 py-[clamp(96px,12vw,160px)] lg:grid-cols-2">
        <h2 className="headline text-[clamp(2.2rem,4.6vw,4.2rem)]">Our commitments to contributors.</h2>
        <div>
          <ul className="space-y-4">
            {COMMITMENTS.map((c) => (
              <li key={c} className="glass ring-gradient rounded-[22px] px-6 py-5 text-[17px] leading-relaxed text-ink">{c}</li>
            ))}
          </ul>
          <Link href="/login" className={buttonClass("primary", "lg", "mt-10")}>Clients: sign in to contribute</Link>
        </div>
      </section>
    </>
  );
}
