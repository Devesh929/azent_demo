import type { Metadata } from "next";
import { PageIntro } from "@/components/site/PageIntro";
import { DemoForm } from "@/components/site/PublicForms";

export const metadata: Metadata = { title: "Book a demo" };

export default async function DemoPage({ searchParams }: PageProps<"/demo">) {
  const { offering } = await searchParams;
  return (
    <>
      <PageIntro title="See it with your own questions." lede="Tell us what you want to evaluate. We will tailor a walkthrough with synthetic data that resembles your portfolio, never your real customers." />
      <section className="frame grid gap-12 pb-[clamp(96px,12vw,160px)] lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)]">
        <div className="space-y-8 text-[16px] leading-relaxed text-ink-2">
          <div><h2 className="text-[18px] font-semibold text-ink">What happens next</h2><p className="mt-2">A specialist contacts you within two working days to agree scope and attendees.</p></div>
          <div><h2 className="text-[18px] font-semibold text-ink">What you will see</h2><p className="mt-2">The product working end to end, with evidence and human oversight visible at every step.</p></div>
          <div><h2 className="text-[18px] font-semibold text-ink">Your data</h2><p className="mt-2">We only use the details in this form to arrange your demo.</p></div>
        </div>
        <DemoForm offering={typeof offering === "string" ? offering : undefined} />
      </section>
    </>
  );
}
