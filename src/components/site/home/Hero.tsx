"use client";
import Link from "next/link";
import { ArrowDown, ArrowRight, Check, FileText, LockKeyhole, ShieldCheck, Sparkles } from "lucide-react";
import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { ProductPreview } from "./ProductPreview";
gsap.registerPlugin(ScrollTrigger, useGSAP);

export function Hero({ banner }: { banner: { title: string; summary: string | null } | null }) {
  const root = useRef<HTMLElement>(null);
  useGSAP(()=>{
    const mm=gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)",()=>{
      gsap.from(".hero-copy > *",{y:24,opacity:0,stagger:.09,duration:.9,ease:"power3.out",clearProps:"opacity"});
      gsap.from(".hero-workspace",{y:75,opacity:0,duration:1.2,ease:"power3.out",delay:.2,clearProps:"opacity"});
      gsap.to(".hero-workspace",{rotateX:0,rotateY:0,rotateZ:0,y:-45,scale:1.04,ease:"none",scrollTrigger:{trigger:root.current,start:"top top",end:"bottom 25%",scrub:1}});
      gsap.to(".hero-satellite-left",{x:-45,y:-50,rotate:-9,ease:"none",scrollTrigger:{trigger:root.current,start:"top top",end:"bottom top",scrub:1.2}});
      gsap.to(".hero-satellite-right",{x:45,y:-70,rotate:8,ease:"none",scrollTrigger:{trigger:root.current,start:"top top",end:"bottom top",scrub:1.2}});
      gsap.from(".hero-workspace .chart-trace",{strokeDasharray:1,strokeDashoffset:1,duration:1.8,delay:.5,ease:"power2.inOut"});
    });
    return ()=>mm.revert();
  },{scope:root});
  return <section ref={root} className="cinematic-hero" aria-labelledby="hero-title"><div className="hero-atmosphere" aria-hidden/><div className="hero-stage"><div className="hero-copy">
    {banner ? <Link href="/hackathon" className="hero-announcement"><span/>Hackathon 2026 · Build what comes next<ArrowRight size={13}/></Link> : <span className="hero-announcement"><span/>Enterprise AI. Governed by design.</span>}
    <h1 id="hero-title"><span className="hero-heading-desktop"><em>Intelligence</em> that moves<br/>business forward.</span><span className="hero-heading-mobile"><em>Intelligence.</em><br/>Moving you forward.</span></h1><p>Turn private observations into reviewed knowledge.<br className="hidden sm:block"/> Make better decisions, together.</p><div className="hero-actions"><Link href="/products" className="mint-button">Explore the platform<ArrowRight size={16}/></Link><a href="#intelligence" className="text-button">See how it works<ArrowDown size={15}/></a></div></div>
    <div className="hero-product-stage"><div className="hero-satellite hero-satellite-left" aria-hidden><div className="satellite-heading"><FileText size={15}/>New observation<span>Private draft</span></div><p>What is the market<br/>telling you?</p><div className="satellite-note">Seasonal patterns in SME cash flow need a closer look.</div><div className="satellite-footer"><LockKeyhole size={12}/> Only visible to you</div><div className="satellite-consent"><ShieldCheck size={16}/><div>Sharing is your choice.<small>Nothing is published automatically.</small></div></div></div><div className="hero-workspace"><ProductPreview/></div><div className="hero-satellite hero-satellite-right" aria-hidden><div className="satellite-heading"><ShieldCheck size={15}/>Review for sharing</div><span className="satellite-status"><Check size={12}/> Reviewed community copy</span><div className="satellite-note">Identifying details removed.<br/>Evidence and context preserved.</div><div className="satellite-consent"><Sparkles size={16}/><div>Seasonality-aware comparison<small>Improvement idea · Under review</small></div></div><div className="satellite-footer">A signal becomes a shared possibility.</div></div></div><div className="hero-floor" aria-hidden/></div><div className="hero-bottomline"><span><LockKeyhole size={13}/>Private by design. Shared with purpose.</span><a href="#intelligence">Scroll to explore<ArrowDown size={13}/></a></div></section>;
}
