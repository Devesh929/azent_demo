"use client";

import { useId, useState } from "react";
import { Activity, ArrowUpRight, Check, ChevronDown, FileCheck2, FileText, Fingerprint, LayoutDashboard, LockKeyhole, Search, ShieldCheck, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export type PreviewMode = "analysis" | "documents" | "credit";
const MODES = { analysis: "Financial analysis", documents: "Document intelligence", credit: "Credit intelligence" };

export function RevenueChart({ compact = false }: { compact?: boolean }) {
  const id = useId().replace(/:/g, "");
  return (
    <div className={cn("revenue-chart", compact && "revenue-chart-compact")}>
      <div className="chart-caption"><span>Seasonal revenue pattern</span><span>Illustrative · ₹m</span></div>
      <svg viewBox="0 0 580 175" role="img" aria-label="Synthetic revenue rises and falls over six periods, with a seasonal dip highlighted">
        <defs><linearGradient id={id} x1="0" x2="0" y1="0" y2="1"><stop stopColor="#2ed88e" stopOpacity=".24"/><stop offset="1" stopColor="#2ed88e" stopOpacity="0"/></linearGradient></defs>
        {[30, 70, 110, 150].map((y, i) => <g key={y}><line x1="30" x2="565" y1={y} y2={y} stroke="currentColor" opacity=".08"/><text x="0" y={y + 4} fill="currentColor" opacity=".5" fontSize="10">{60-i*20}</text></g>)}
        <rect x="258" y="16" width="80" height="137" rx="4" fill="#2ed88e" opacity=".07"/>
        <path d="M30 132 C65 134 81 81 119 98 S174 41 211 65 S270 138 300 116 S354 48 389 74 S442 16 480 46 S531 26 565 20 L565 160 L30 160Z" fill={`url(#${id})`}/>
        <path className="chart-trace" d="M30 132 C65 134 81 81 119 98 S174 41 211 65 S270 138 300 116 S354 48 389 74 S442 16 480 46 S531 26 565 20" fill="none" stroke="#13a678" strokeWidth="2.5" strokeLinecap="round" pathLength="1"/>
        <circle cx="300" cy="116" r="5" fill="#16303d" stroke="#55ffbe" strokeWidth="3"/>
        {["Jan", "Mar", "May", "Jul", "Sep", "Nov"].map((m, i) => <text key={m} x={35+i*103} y="174" fill="currentColor" opacity=".55" fontSize="10">{m}</text>)}
      </svg>
    </div>
  );
}

function DocumentView() {
  const [scanned, setScanned] = useState(false);
  return (
    <div className="document-preview">
      <div className="document-sheet">
        <div className="sheet-brand"><FileText size={19}/><span>Identity document<br/><small>SYNTHETIC SAMPLE</small></span></div>
        <div className="document-identity"><div className="identity-portrait"><Fingerprint size={36}/></div><div><strong>Alex Morgan</strong><span>Sample identity · DEMO-024</span><span>Valid until 12 Nov 2030</span></div></div>
        <div className="document-field"><span>Name</span><strong>Alex Morgan</strong><Check size={13}/></div>
        <div className="document-field"><span>Document match</span><strong>{scanned ? "Checked in demo" : "Ready to check"}</strong><Check size={13}/></div>
        <div className="scan-line" aria-hidden/>
        <div className="document-machine">AZENTIO&lt;&lt;SYNTHETIC&lt;&lt;SAMPLE<br/>DEMO024&lt;&lt;NO&lt;REAL&lt;IDENTITY&lt;&lt;</div>
      </div>
      <div className="document-checks"><span className="preview-badge"><ShieldCheck size={12}/> Human review required</span><h4>From documents<br/>to clear evidence.</h4><p>Extract fields. Find inconsistencies. Keep a reviewer in control.</p>{["Identity fields", "Document consistency", "Missing signatures"].map((t,i)=><div className="check-line" key={t}><span className={cn("check-dot",i===2&&"check-dot-warn")}>{i===2 ? "!" : <Check size={10}/>}</span>{t}<small>{i===2 ? "Review" : "Extracted"}</small></div>)}<button type="button" className="preview-action" onClick={()=>setScanned(!scanned)}>{scanned ? "Reset sample" : "Check sample document"}<ArrowUpRight size={13}/></button><small className="preview-disclaimer">Simulated KYC preview. No identity verification is performed.</small></div>
    </div>
  );
}

function AnalysisView() {
  const [evidence, setEvidence] = useState(0);
  const items = ["Seasonal comparison", "Synthetic financial statement", "Analyst review note"];
  return <><div className="preview-metrics"><div><span>Observation period</span><strong>H2 2026</strong></div><div><span>Evidence sources</span><strong>03 <small>reviewable</small></strong></div><div><span>Scenario</span><strong>Seasonal SME</strong></div></div><RevenueChart/><div className="analysis-callout"><Sparkles size={17}/><div><strong>Context changes the picture.</strong><p>A recurring seasonal dip may need a different comparison. Review the evidence before drawing a conclusion.</p></div></div><div className="evidence-heading"><strong>Behind the insight</strong><span>3 synthetic sources</span></div><div className="preview-evidence">{items.map((s,i)=><div key={s}><button type="button" aria-expanded={evidence===i} onClick={()=>setEvidence(evidence===i ? -1 : i)}><FileText size={14}/><span>{s}</span><span className="source-approved"><Check size={11}/> Reviewed</span><ChevronDown size={13} className={evidence===i?"rotate-180":""}/></button>{evidence===i&&<p>Illustrative source {i+1}. Compare equivalent periods and confirm the context with a reviewer.</p>}</div>)}</div></>;
}

function CreditView() {
  const [selected, setSelected] = useState("Base case");
  return <div className="credit-preview"><div className="preview-segment" aria-label="Synthetic credit scenario">{["Base case","Seasonal stress"].map(t=><button key={t} aria-pressed={selected===t} onClick={()=>setSelected(t)}>{t}</button>)}</div><div className="credit-verdict"><ShieldCheck size={26}/><span>Illustrative recommendation</span><h4>{selected==="Base case"?"Review with context.":"Additional review needed."}</h4><p>A sandbox recommendation supports a credit officer. It never replaces a decision.</p></div>{["Policy conditions","Cash-flow context","Comparable evidence"].map((t,i)=><div className="check-line" key={t}><Check size={13}/>{t}<small>{selected==="Seasonal stress"&&i===1?"Needs review":"Evidence available"}</small></div>)}<div className="analysis-callout"><LockKeyhole size={16}/><p>Sample data only. No credit decision is made.</p></div></div>;
}

export function ProductPreview({ mode = "analysis", className, sidebar = true }: { mode?: PreviewMode; className?: string; sidebar?: boolean }) {
  return <div className={cn("product-preview", className)} data-ui>
    <div className="preview-toolbar"><span className="preview-wordmark"><span className="mini-brand"/>azentio.ai</span><span className="preview-search"><Search size={12}/> Search evidence, documents and insights <kbd>⌘ K</kbd></span><span className="preview-avatar">AM</span></div>
    <div className="preview-body">{sidebar&&<aside className="preview-sidebar"><span className="preview-workspace">Demo workspace<ChevronDown size={12}/></span>{[[LayoutDashboard,"Overview"],[Activity,"Analysis"],[FileCheck2,"Documents"],[ShieldCheck,"Credit"],[FileText,"Evidence"]].map(([Icon,label],i)=>{const ItemIcon=Icon as typeof Activity;return <span key={String(label)} className={cn("preview-nav-item",((mode==="analysis"&&i===1)||(mode==="documents"&&i===2)||(mode==="credit"&&i===3))&&"selected")}><ItemIcon size={14}/>{String(label)}</span>})}<div className="preview-private"><LockKeyhole size={13}/><span>Synthetic data<br/>Private by design</span></div></aside>}
      <div className="preview-content"><div className="preview-title"><div><span className="preview-overline">INTELLIGENCE WORKSPACE</span><h3>{MODES[mode]}</h3></div><span className="preview-badge"><span/>Synthetic preview</span></div><div key={mode} className="preview-scene">{mode==="analysis"?<AnalysisView/>:mode==="documents"?<DocumentView/>:<CreditView/>}</div></div>
    </div>
  </div>;
}
