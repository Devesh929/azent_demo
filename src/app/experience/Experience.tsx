"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Check, ChevronRight, Command, FileText, Fingerprint, Layers3, LockKeyhole, Network, Plus, ScanLine, ShieldCheck, Sparkles } from "lucide-react";
import { SmoothScroll } from "@/components/site/motion";
import "./experience.css";
import { BrandRevealHero } from "@/components/site/home/BrandRevealHero";

const products = [
  { name: "Document intelligence", short: "KYC & onboarding", icon: ScanLine, file: "Identity verification.pdf", title: "A clearer picture. From page one.", description: "Bring document extraction, source evidence and a human review into one considered workflow.", metric: "12 / 12", metricLabel: "Fields extracted", fields: [["Full name", "Alex Morgan"], ["Document type", "Passport"], ["Expiry date", "18 Jun 2030"]], insight: "Document fields are complete. Confirm the source before approving.", action: "Start document review" },
  { name: "Financial analysis", short: "Understand the numbers", icon: Layers3, file: "Annual report — sample.pdf", title: "Find the story behind the numbers.", description: "Move from a financial statement to a structured observation, with the evidence always in view.", metric: "+18.4%", metricLabel: "Illustrative revenue growth", fields: [["Revenue", "$24.8m"], ["Operating margin", "21.6%"], ["Reporting period", "FY 2025"]], insight: "Revenue is growing faster than operating costs. Review the underlying statement.", action: "Start financial review" },
  { name: "Credit decisioning", short: "Decide with context", icon: ShieldCheck, file: "Credit application — sample.pdf", title: "Every decision deserves context.", description: "Explore an explainable assessment alongside its inputs. Keep the final decision with your reviewer.", metric: "A−", metricLabel: "Illustrative risk assessment", fields: [["Applicant", "Northstar Trading"], ["Debt coverage", "1.8×"], ["Requested facility", "$250,000"]], insight: "Coverage is within the sample policy range. Verify the inputs before making a decision.", action: "Start credit review" },
];

function Brand() {
  return <span className={"ax-brand"}><svg width="28" height="30" viewBox="0 0 28 30" fill="none" aria-hidden="true"><path d="M2 28V14C2 6 9 2 13 2V16C13 23 7 28 2 28Z" fill="currentColor"/><path d="M16 2C23 2 26 7 26 14V28C20 28 16 23 16 17V2Z" fill="currentColor" opacity=".7"/></svg>azentio<span>.ai</span></span>;
}

export default function Experience() {
  const [selected, setSelected] = useState(0);
  const [review, setReview] = useState(0);
  const [running, setRunning] = useState(false);
  const product = products[selected];

  useEffect(() => {
    if (!running) return;
    const timers = [1, 2, 3].map((step) => window.setTimeout(() => {
      setReview(step);
      if (step === 3) setRunning(false);
    }, step * 650));
    return () => timers.forEach(clearTimeout);
  }, [running]);


  const selectProduct = (index: number) => { setRunning(false); setReview(0); setSelected(index); };

  return <div className={"ax-page"}>
    <SmoothScroll>{null}</SmoothScroll>
    <a className={"ax-skip"} href="#explore">Skip motion experience</a>
    <header className={"ax-header"}>
      <Link href="/" aria-label="Azentio home"><Brand /></Link>
      <nav aria-label="Experience navigation"><a href="#explore">The platform</a><a href="#approach">Our approach</a></nav>
      <Link href="/login" className={"ax-navCta"}>Enter workspace <ArrowUpRight size={15} /></Link>
    </header>

    <main>
      <BrandRevealHero target="#explore" />

      <section className={"ax-intro"} id="explore">
        <div className={"ax-sectionMeta"}><span>01 / THE PLATFORM</span><span>LESS FRICTION. MORE PERSPECTIVE.</span></div>
        <div className={"ax-introGrid"} data-reveal><h2>Complexity is a given.<br /><span>Clarity is designed.</span></h2><p>From the first document to the final review, give your teams a connected place to understand, question and act.</p></div>
        <div className={"ax-productTabs"} role="tablist" aria-label="Explore product workflows">{products.map((p, i) => <button key={p.name} id={`experience-tab-${i}`} type="button" role="tab" aria-selected={selected === i} aria-controls="experience-panel" tabIndex={selected === i ? 0 : -1} onClick={() => selectProduct(i)} onKeyDown={e => { if (["ArrowRight", "ArrowLeft", "Home", "End"].includes(e.key)) { e.preventDefault(); const next = e.key === "Home" ? 0 : e.key === "End" ? 2 : (i + (e.key === "ArrowRight" ? 1 : 2)) % 3; selectProduct(next); document.getElementById(`experience-tab-${next}`)?.focus(); } }}><p.icon size={21} /><span>{p.name}<small>{p.short}</small></span><ArrowUpRight size={17} /></button>)}</div>

        <div className={"ax-productPanel"} role="tabpanel" id="experience-panel" aria-labelledby={`experience-tab-${selected}`} data-reveal>
          <div className={"ax-productStory"}><span className={"ax-pill"}><span /> INTERACTIVE CONCEPT</span><h3>{product.title}</h3><p>{product.description}</p><div className={"ax-reviewSteps"}>{["Read the source", "Understand the context", "Ready for human review"].map((label, i) => <div key={label} className={review > i ? "ax-stepDone" : ""}><span>{review > i ? <Check size={13} /> : `0${i + 1}`}</span>{label}</div>)}</div><button className={"ax-darkButton"} disabled={running} onClick={() => { if (review === 3) setReview(0); else setRunning(true); }}>{running ? "Connecting the context…" : review === 3 ? "Reset demonstration" : product.action}<ArrowUpRight size={17} /></button><small className={"ax-demoNote"}>Synthetic data. A visual demonstration, not a live assessment.</small></div>
          <div className={"ax-dashboard"}>
            <div className={"ax-dashboardBar"}><span><span /><span /><span /></span><span><LockKeyhole size={11} /> Secure workspace</span><Command size={14} /></div>
            <div className={"ax-dashboardBody"}>
              <aside className={"ax-dashSidebar"}><Brand /><div><Layers3 size={18} /><ScanLine size={18} /><Network size={18} /><ShieldCheck size={18} /></div><span>AM</span></aside>
              <div className={"ax-dashContent"}>
                <div className={"ax-dashHeading"}><div><span>WORKSPACE / INTELLIGENCE</span><h4>{product.name}</h4></div><span className={"ax-avatar"}>AM</span></div>
                <div className={"ax-fileRow"}><span className={"ax-fileIcon"}><FileText size={20} /></span><div><strong>{product.file}</strong><small>Synthetic sample · Source document</small></div><span className={"ax-fileBadge"}>{review === 3 ? "Reviewed" : "Private"}</span></div>
                <div className={"ax-dashCards"}><div className={"ax-metric"}><span>{product.metricLabel}</span><strong>{product.metric}</strong><svg viewBox="0 0 220 64" fill="none" aria-label="Illustrative upward trend" role="img"><path d="M0 60C20 60 23 31 45 39S70 59 91 29 120 43 140 21 171 30 188 10 205 13 220 3" stroke="#55ffbe" strokeWidth="2"/><path d="M0 60C20 60 23 31 45 39S70 59 91 29 120 43 140 21 171 30 188 10 205 13 220 3V64H0Z" fill="url(#experience-chart)"/><defs><linearGradient id="experience-chart" x2="0" y2="1"><stop stopColor="#55ffbe" stopOpacity=".24"/><stop offset="1" stopColor="#55ffbe" stopOpacity="0"/></linearGradient></defs></svg></div><div className={"ax-fields"}><span>EXTRACTED CONTEXT</span>{product.fields.map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div></div>
                <div className={"ax-insight"}><Sparkles size={19} /><div><strong>Bring the evidence into focus</strong><p>{product.insight}</p><span><FileText size={11} /> Source-linked observation <ChevronRight size={12} /></span></div></div>
                <div className={"ax-reviewStatus"} aria-live="polite"><span className={review === 3 ? "ax-readyDot" : "ax-waitDot"} />{running ? `Reviewing · Step ${Math.min(review + 1, 3)} of 3` : review === 3 ? "Evidence organised. Ready for your review." : "Your review stays at the centre."}<ShieldCheck size={15} /></div>
              </div>
            </div>
            <div className={"ax-floatingNote"}><span><Check size={14} /></span><div>Context connected<small>Source evidence stays attached</small></div></div>
          </div>
        </div>
      </section>

      <section className={"ax-approach"} id="approach">
        <div className={"ax-sectionMeta"}><span>02 / COLLECTIVE INTELLIGENCE</span><span>HUMAN JUDGEMENT, BY DESIGN.</span></div>
        <div className={"ax-approachTop"} data-reveal><h2>Better together.<br /><span>Private by default.</span></h2><p>Useful knowledge starts with an observation. Sharing it should be a considered choice.</p></div>
        <div className={"ax-flow"} data-reveal>{[{ icon: Fingerprint, title: "Your perspective.", text: "Capture an observation in your private workspace. Keep the original source close.", tag: "01 / OBSERVE" }, { icon: ShieldCheck, title: "A thoughtful review.", text: "Refine the context, check the evidence and decide what is appropriate to share.", tag: "02 / REVIEW" }, { icon: Network, title: "A shared advantage.", text: "Turn approved insights into collective knowledge your teams can build on.", tag: "03 / LEARN" }].map(p => <article key={p.tag}><span className={"ax-flowTag"}>{p.tag}</span><div className={"ax-flowIcon"}><p.icon strokeWidth={1.1} size={46} /><span /></div><h3>{p.title}</h3><p>{p.text}</p><span className={"ax-flowEnd"}><Check size={13} /> {p.tag.includes("01") ? "Private draft" : p.tag.includes("02") ? "Human in the loop" : "Reviewed knowledge"}</span></article>)}</div>
      </section>

      <section className={"ax-finale"}>
        <div className={"ax-finaleOrb"} aria-hidden="true"><span /><span /><Plus size={26} /></div>
        <p className={"ax-eyebrow"}>A CLEARER WAY FORWARD</p><h2>Make the connection.<br /><span>See what comes next.</span></h2><p>A workspace for your next observation.<br />A new perspective for your next decision.</p><Link href="/login" className={"ax-mintButton"}>Explore the workspace <ArrowUpRight size={18} /></Link><Link className={"ax-returnLink"} href="/">Visit the main website <ArrowUpRight size={14} /></Link>
      </section>
    </main>
    <footer className={"ax-footer"}><Link href="/" aria-label="Azentio home"><Brand /></Link><span>CONNECTED INTELLIGENCE. CONSIDERED DESIGN.</span><a href="#">Back to top <ArrowUpRight size={14} /></a></footer>
  </div>;
}
