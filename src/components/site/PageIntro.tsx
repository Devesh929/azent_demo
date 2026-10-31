import type { ReactNode } from "react";
import { Reveal, SplitWords } from "@/components/site/motion";
import { GridBackdrop } from "@/components/fx/static";

/** Page opening: the last `accent` words of the title are set in the serif gradient. */
export function PageIntro({ title, lede, children, aside, accent = 2 }: { title: string; lede?: string; children?: ReactNode; aside?: ReactNode; accent?: number }) {
  const words = title.split(" ");
  const head = words.slice(0, Math.max(0, words.length - accent)).join(" ");
  const tail = words.slice(-accent).join(" ");
  return (
    <section className="page-intro relative overflow-hidden">
      <GridBackdrop className="opacity-80" />
      <div className="absolute left-1/2 top-0 h-[460px] w-[900px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(62_230_196/0.18),rgb(108_140_255/0.08)_60%,transparent)] blur-2xl" />
      <div className={`page-intro-layout frame relative ${aside ? "has-aside" : ""}`}>
        <div>
          <h1 className="display">
            {head && <><SplitWords text={head} /> </>}
            <SplitWords text={tail} delay={0.15} className="serif-accent tracking-[-0.02em]" wordClassName="text-gradient pr-[0.06em]" />
          </h1>
          {lede && (
            <Reveal delay={0.3}>
              <p className="lede mt-8 max-w-[38rem]">{lede}</p>
            </Reveal>
          )}
          {children && <Reveal delay={0.4} className="mt-10">{children}</Reveal>}
        </div>
        {aside && <Reveal delay={0.35} className="float-slow">{aside}</Reveal>}
      </div>
    </section>
  );
}
