import type { Metadata } from "next";
import { PageIntro } from "@/components/site/PageIntro";
import { HackathonForm } from "@/components/site/PublicForms";
import { Stagger, RevealItem } from "@/components/site/motion";

export const metadata: Metadata = { title: "Hackathon 2026" };

const TRACKS = [
  { t: "Governed collective learning", d: "Turn client observations into safe shared learning and better products." },
  { t: "Explainable decisioning", d: "Recommendations that cite their evidence and stop for a person." },
  { t: "Federated learning research", d: "Train across isolated synthetic datasets without centralising records." },
];

export default function HackathonPage() {
  return (
    <>
      <PageIntro title="Build governed AI for finance." lede="The azentio.ai Hackathon 2026 invites teams of up to five to build enterprise AI that is useful, accountable and safe with other people's data. Synthetic data only." />
      <section className="frame pb-24">
        <Stagger className="grid gap-5 md:grid-cols-3">
          {TRACKS.map((t) => (
            <RevealItem key={t.t} className="glass ring-gradient rounded-[28px] p-8">
              <h2 className="text-[22px] font-semibold tracking-[-0.02em]">{t.t}</h2>
              <p className="mt-3 text-[16px] leading-relaxed text-ink-2">{t.d}</p>
            </RevealItem>
          ))}
        </Stagger>
      </section>
      <section className="frame grid gap-12 pb-[clamp(96px,12vw,160px)] lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)]">
        <div>
          <h2 className="text-[clamp(1.8rem,3vw,2.6rem)] font-semibold tracking-[-0.03em]">Register your interest</h2>
          <p className="mt-4 text-[16px] leading-relaxed text-ink-2">Registration is free. We will send the challenge brief, judging criteria and schedule before kick-off.</p>
        </div>
        <HackathonForm />
      </section>
    </>
  );
}
