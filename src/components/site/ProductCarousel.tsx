"use client";

import { useId, useState, type KeyboardEvent } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowLeft, ArrowRight, ArrowUpRight, Check, SlidersHorizontal, Files, ChartNoAxesCombined, ShieldCheck, Network, TableProperties } from "lucide-react";
import { OFFERINGS } from "@/content/catalog";
import { InteractiveWorkbench } from "./InteractiveWorkbench";

const order = ["financial-analysis-intelligence", "document-intelligence-studio", "sme-credit-decisioning-workbench", "credit-strategy-simulator", "similar-portfolio-intelligence", "riva"];
const labels = ["Financial analysis", "Document intelligence", "Credit decisioning", "Strategy simulator", "Portfolio intelligence", "RIVA reporting"];
const icons = [ChartNoAxesCombined, Files, ShieldCheck, SlidersHorizontal, Network, TableProperties];
export function ProductCarousel({ compact = false }: { compact?: boolean }) {
  const [active, setActive] = useState(0);
  const [direction, setDirection] = useState(1);
  const id = useId();
  const reduced = useReducedMotion();
  const product = OFFERINGS.find(p => p.slug === order[active])!;
  function select(next: number) { setDirection(next > active ? 1 : -1); setActive((next + order.length) % order.length); }
  function onKey(e: KeyboardEvent<HTMLButtonElement>, index: number) {
    const next = e.key === "ArrowRight" ? (index + 1) % 6 : e.key === "ArrowLeft" ? (index + 5) % 6 : e.key === "Home" ? 0 : e.key === "End" ? 5 : -1;
    if (next < 0) return;
    e.preventDefault(); select(next); document.getElementById(`${id}-tab-${next}`)?.focus();
  }
  return <section className={`product-carousel frame ${compact ? "is-compact" : ""}`} aria-label="Explore Azentio products">
    {!compact && <div className="explorer-heading"><div><span className="section-kicker">The product collection</span><h2>Intelligence you<br />can <em>explore.</em></h2></div><p>Six ways to bring clarity to your work.<br />Choose a product. Try the interface.</p></div>}
    <div className="product-tabs liquid-track" role="tablist" aria-label="Products">{labels.map((label, i) => { const Icon = icons[i]; return <button type="button" role="tab" id={`${id}-tab-${i}`} aria-controls={`${id}-panel`} aria-selected={active === i} tabIndex={active === i ? 0 : -1} key={label} onClick={() => select(i)} onKeyDown={e => onKey(e, i)}>{active === i && <motion.span className="liquid-pill" layoutId={`${id}-pill`} transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 330, damping: 32 }} />}<Icon size={17} /><span>{label}</span></button>; })}</div>
    <div className="product-stage glass" role="tabpanel" id={`${id}-panel`} aria-labelledby={`${id}-tab-${active}`} tabIndex={0}>
      <AnimatePresence mode="wait" initial={false} custom={direction}><motion.div key={product.slug} className="product-slide" initial={{ opacity: 0, x: reduced ? 0 : direction * 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: reduced ? 0 : direction * -20 }} transition={{ duration: reduced ? 0 : .25 }}>
        <div className="product-story"><span className="explorer-overline">{product.kicker}</span><h3>{product.name}</h3><p>{product.summary}</p><ul>{product.capabilities.slice(0, 3).map(c => <li key={c}><Check size={14} />{c}</li>)}</ul><Link href={`/products/${product.slug}`} className="mint-button">Explore product<ArrowUpRight size={16} /></Link><span className="explorer-note">Live interface · Synthetic sample data</span></div>
        <div className="explorer-preview"><InteractiveWorkbench slug={product.slug} /></div>
      </motion.div></AnimatePresence>
    </div>
    <div className="carousel-footer"><span><strong>{String(active + 1).padStart(2, "0")}</strong> / 06 <span className="carousel-footer-label">{labels[active]}</span></span><div><button type="button" onClick={() => select(active - 1)} aria-label="Previous product"><ArrowLeft size={19} /></button><button type="button" onClick={() => select(active + 1)} aria-label="Next product"><ArrowRight size={19} /></button></div></div>
  </section>;
}
