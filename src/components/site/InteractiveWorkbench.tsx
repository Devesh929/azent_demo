"use client";

import { useId, useState } from "react";
import { ArrowUpRight, Check, ChevronDown, FileText, Layers3, LockKeyhole, Search, ShieldCheck } from "lucide-react";
import { ProductPreview } from "./home/ProductPreview";

type LabKind = "strategy" | "portfolio" | "reporting";
const names: Record<LabKind, string> = { strategy: "Policy planning", portfolio: "Portfolio context", reporting: "Reporting readiness" };

function ScenarioLab({ kind }: { kind: LabKind }) {
  const [tab, setTab] = useState("Workspace");
  const [score, setScore] = useState(660);
  const [sector, setSector] = useState("Retail");
  const [resolved, setResolved] = useState(false);
  const inputId = useId();
  const scores = Array.from({ length: 60 }, (_, i) => 540 + i * 5);
  const approvals = scores.filter(s => s >= score).length;
  const baseline = scores.filter(s => s >= 660).length;
  const peerCount = sector === "Retail" ? 48 : sector === "Manufacturing" ? 24 : 36;
  const peers = Array.from({ length: peerCount }, (_, i) => ({ revenue: .4 + ((i * 37) % 96) / 20, cover: .8 + ((i * 19) % 72) / 40, flag: i % 17 === 0 }));
  const flagged = peers.filter(p => p.flag).length;
  return <div className="lab-shell" data-ui data-demo-kind={kind}>
    <div className="lab-toolbar"><span className="lab-brand"><i />azentio.ai</span><span className="lab-search"><Search size={13} />Search evidence and context</span><span className="lab-avatar">AM</span></div>
    <div className="lab-layout">
      <aside className="lab-sidebar"><span>Demo workspace <ChevronDown size={11} /></span>{["Workspace", "Evidence"].map(t => <button type="button" key={t} aria-pressed={tab === t} onClick={() => setTab(t)}>{t === "Workspace" ? <Layers3 size={15} /> : <FileText size={15} />}{t}</button>)}<small><LockKeyhole size={12} /> Private sample</small></aside>
      <div className="lab-main"><div className="lab-heading"><div><span>INTELLIGENCE WORKSPACE</span><h3>{names[kind]}</h3></div><span className="lab-status">Synthetic preview</span></div>
        {tab === "Evidence" ? <div className="lab-evidence"><h4>Keep the source in view.</h4><p>These records describe the illustrative workflow. They contain no customer data.</p>{["Synthetic scenario inputs", "Sample policy and assumptions", "Reviewer interpretation"].map((t, i) => <div key={t}><FileText size={16} /><span>{t}<small>Demo evidence {i + 1} · Available for review</small></span><Check size={14} /></div>)}</div> : kind === "strategy" ? <>
          <div className="lab-metric-row"><div><span>Approval rate</span><strong>{(approvals / scores.length * 100).toFixed(1)}<small>%</small></strong></div><div><span>Applications approved</span><strong>{approvals}<small> / {scores.length}</small></strong></div><div><span>Change vs score 660</span><strong>{approvals - baseline > 0 ? "+" : ""}{approvals - baseline}<small> cases</small></strong></div></div>
          <div className="lab-chart-card"><div className="lab-chart-title"><strong>Applications by score band</strong><span><i />Approved <i />Declined</span></div><div className="lab-histogram" role="img" aria-label={`${approvals} of 60 synthetic cases meet the score cutoff`}>{Array.from({ length: 10 }, (_, i) => { const band = scores.filter(s => s >= 540 + i * 30 && s < 570 + i * 30); const approved = band.filter(s => s >= score).length; return <div key={i}><span className="lab-bar-total" style={{ height: `${band.length / 6 * 100}%` }}><span style={{ height: `${band.length ? approved / band.length * 100 : 0}%` }} /></span></div>; })}</div><div className="lab-axis"><span>540</span><span>630</span><span>720</span><span>840</span></div></div>
          <div className="lab-control"><label htmlFor={inputId}>Minimum score <strong>{score}</strong></label><input id={inputId} aria-label="Demo minimum score" type="range" min="580" max="760" step="5" value={score} onChange={e => setScore(Number(e.target.value))} /><button type="button" onClick={() => setScore(660)}>Reset comparison</button></div>
          <p className="lab-finding"><ShieldCheck size={15} />Move the threshold to explore the trade-off. This is a simulation, not a credit decision.</p>
        </> : kind === "portfolio" ? <>
          <div className="lab-filter"><span>Comparable cohort</span><label>Sector<select aria-label="Demo portfolio sector" value={sector} onChange={e => setSector(e.target.value)}><option>Retail</option><option>Manufacturing</option><option>Services</option></select></label></div>
          <div className="lab-metric-row"><div><span>Synthetic peers</span><strong>{peerCount}</strong></div><div><span>Review flags</span><strong>{flagged}</strong></div><div><span>Observation period</span><strong className="lab-text-value">12 months</strong></div></div>
          <div className="lab-chart-card"><div className="lab-chart-title"><strong>Revenue and debt coverage</strong><span>Illustrative cohort</span></div><svg className="lab-scatter" viewBox="0 0 520 260" role="img" aria-label="Synthetic peers compared on revenue in millions and debt coverage">{[0, 1, 2, 3].map(v => <g key={v}><line x1="42" x2="488" y1={220 - v * 60} y2={220 - v * 60} stroke="currentColor" opacity=".1" /><text x="9" y={224 - v * 60}>{v}×</text></g>)}{[0, 2, 4, 6].map(v => <text key={v} x={40 + v / 6 * 440} y="248">{v}m</text>)}{peers.map((p, i) => <circle key={i} cx={42 + p.revenue / 6 * 440} cy={220 - p.cover / 3 * 180} r={p.flag ? 5 : 3.5} fill={p.flag ? "#a87523" : "#16986b"} opacity={p.flag ? 1 : .55} />)}</svg></div><p className="lab-finding"><Search size={15} />{flagged} of {peerCount} sample peers need a closer look. A comparison provides context, not a verdict.</p>
        </> : <>
          <div className="lab-metric-row"><div><span>Checks passed</span><strong>{resolved ? "4" : "3"}<small> / 4</small></strong></div><div><span>Mapping exceptions</span><strong>{resolved ? "0" : "1"}</strong></div><div><span>Return</span><strong className="lab-text-value">LR-07</strong></div></div>
          <div className="lab-report-table"><div><span>Validation rule</span><span>Status</span></div>{["Template fields mapped", "Cross-report totals reconcile", "Source lineage available", "Cash-equivalent mapping confirmed"].map((t, i) => <div key={t}><span><FileText size={13} />{t}</span><span className={i === 3 && !resolved ? "lab-warning" : "lab-pass"}>{i === 3 && !resolved ? "Review" : "Pass"}</span></div>)}</div><div className="lab-mapping"><span>Field 4.12 · Cash equivalents</span><strong>{resolved ? "Ledger.cash_equivalents" : "Source mapping needs confirmation"}</strong><button type="button" onClick={() => setResolved(!resolved)}>{resolved ? "Reset sample return" : "Confirm sample source mapping"}<ArrowUpRight size={14} /></button></div><p className="lab-finding"><ShieldCheck size={15} />{resolved ? "Sample validation complete. A reporting officer still reviews the return." : "One source mapping needs a review before this sample return is ready."}</p>
        </>}
      </div>
    </div>
  </div>;
}

export function InteractiveWorkbench({ slug }: { slug: string }) {
  if (slug === "financial-analysis-intelligence") return <ProductPreview mode="analysis" />;
  if (slug === "document-intelligence-studio") return <ProductPreview mode="documents" />;
  if (slug === "sme-credit-decisioning-workbench") return <ProductPreview mode="credit" />;
  return <ScenarioLab kind={slug === "riva" ? "reporting" : slug === "similar-portfolio-intelligence" ? "portfolio" : "strategy"} />;
}
