"use client";

import Link from "next/link";
import { Check, FileText, LockKeyhole, ShieldCheck, Sparkles } from "lucide-react";
import { ProductPreview } from "./ProductPreview";
import { Reveal } from "../motion";

export function WorkspaceShowcase({ announcement }: { announcement?: string }) {
  return <section id="workspace-showcase" className="workspace-showcase" aria-labelledby="workspace-showcase-title">
    <div className="showcase-intro frame">
      <div><span className="section-kicker">A closer look</span><h2 id="workspace-showcase-title">Your workspace.<br /><span>A clearer perspective.</span></h2></div>
      <div><p>Bring the evidence into focus. Explore a workspace where private observations become considered decisions.</p>{announcement && <Link href="/hackathon" className="showcase-announcement"><span />{announcement}</Link>}</div>
    </div>
    <Reveal y={25} className="showcase-composition">
      <aside className="showcase-satellite showcase-satellite-left" aria-label="Private observation example">
        <div className="showcase-card-label"><FileText size={15} /> New observation <span>Private</span></div>
        <h3>What is the market<br />telling you?</h3><p>Seasonal patterns in SME cash flow deserve a closer look.</p>
        <div className="showcase-private"><LockKeyhole size={13} /> Only visible to you</div>
        <div className="showcase-card-note"><ShieldCheck size={20} /><span>Sharing is your choice.<small>Nothing is published automatically.</small></span></div>
      </aside>
      <div className="hero-workspace showcase-workspace"><ProductPreview /></div>
      <aside className="showcase-satellite showcase-satellite-right" aria-label="Reviewed contribution example">
        <div className="showcase-card-label"><ShieldCheck size={15} /> Review for sharing</div>
        <span className="showcase-approved"><Check size={13} /> Reviewed community copy</span>
        <h3>Context preserved.<br />Identities protected.</h3><p>Share a reviewed version, with identifying details removed.</p>
        <div className="showcase-card-note"><Sparkles size={18} /><span>Seasonality-aware comparison<small>Improvement idea · Under review</small></span></div>
      </aside>
      <div className="showcase-liquid" aria-hidden="true" />
    </Reveal>
    <p className="showcase-caption"><LockKeyhole size={13} /> Interactive interface · Synthetic sample data · Human review throughout</p>
  </section>;
}
