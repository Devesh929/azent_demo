"use client";

import { useEffect, useRef } from "react";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import reveal from "../../../../public/experience/original-upscaled/manifest.json";
import backdrops from "../../../../public/experience/original-upscaled/backdrops.json";
import "@/app/experience/experience.css";

export function BrandRevealHero({ target = "#workspace-showcase" }: { target?: string }) {
  const root = useRef<HTMLDivElement>(null);
  const scene = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const poster = useRef<HTMLImageElement>(null);
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      const element = canvas.current;
      const context = element?.getContext("2d", { alpha: true });
      if (!element || !context || !scene.current || !root.current) return;
      const mobile = window.innerWidth < 700;
      const hero = root.current.querySelector<HTMLElement>(".ax-heroCopy");
      const lastFrame = reveal.frames - 1;
      const bitmaps = new Map<number, ImageBitmap>();
      const inFlight = new Set<number>();
      const failed = new Set<number>();
      const controller = new AbortController();
      // Coarse anchors guarantee a complete reveal early. Detail is decoded only
      // near the current playhead, keeping decoded pixel memory bounded.
      const anchorStep = Math.ceil(lastFrame / 16);
      const anchors = [0, lastFrame, ...Array.from({ length: Math.floor((lastFrame - 1) / anchorStep) }, (_, i) => (i + 1) * anchorStep)];
      const anchorSet = new Set(anchors);
      const cacheLimit = mobile ? 40 : 32;
      let alive = true;
      let wanted = 0;
      let drawn = -1;
      let lastWidth = 0;
      let lastHeight = 0;
      let workers = 0;
      let pending: number[] = [];

      const draw = () => {
        if (!alive || !bitmaps.size || (wanted === 0 && !bitmaps.has(0))) return;
        const width = element.clientWidth;
        const height = element.clientHeight;
        const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
        const resized = width !== lastWidth || height !== lastHeight;
        if (resized) {
          element.width = Math.round(width * ratio);
          element.height = Math.round(height * ratio);
          lastWidth = width; lastHeight = height;
        }
        const nearest = bitmaps.has(wanted) ? wanted : [...bitmaps.keys()].reduce((a, b) => Math.abs(b - wanted) < Math.abs(a - wanted) ? b : a);
        if (drawn === nearest && !resized) return;
        const frame = bitmaps.get(nearest)!;
        const w = element.width;
        const h = element.height;
        context.clearRect(0, 0, w, h);
        const palette = backdrops[nearest];
        ["--edge-tl", "--edge-tr", "--edge-bl", "--edge-br"].forEach((variable, i) => root.current?.style.setProperty(variable, palette[i]));
        // Full frame, including source margins: never crop with object-fit: cover.
        const scale = Math.min(w / frame.width, h / frame.height);
        context.drawImage(frame, (w - frame.width * scale) / 2, (h - frame.height * scale) / 2, frame.width * scale, frame.height * scale);
        element.style.opacity = "1";
        if (poster.current) poster.current.style.opacity = "0";
        element.dataset.frame = String(nearest);
        element.dataset.cache = String(bitmaps.size);
        drawn = nearest;
      };

      const evict = () => {
        while (bitmaps.size > cacheLimit) {
          const candidates = [...bitmaps.keys()].filter(i => !anchorSet.has(i) && i !== wanted && i !== drawn);
          if (!candidates.length) break;
          const farthest = candidates.reduce((a, b) => Math.abs(b - wanted) > Math.abs(a - wanted) ? b : a);
          bitmaps.get(farthest)?.close();
          bitmaps.delete(farthest);
        }
      };
      const pump = () => {
        while (alive && workers < 3 && pending.length) {
          const index = pending.shift()!;
          if (bitmaps.has(index) || inFlight.has(index) || failed.has(index)) continue;
          workers++; inFlight.add(index);
          void (async () => {
            try {
              const response = await fetch(`/experience/original-upscaled/${mobile ? "mobile" : "desktop"}/${String(index).padStart(3, "0")}.webp`, { signal: controller.signal, cache: "force-cache" });
              if (!response.ok) throw new Error("Frame unavailable");
              const bitmap = await createImageBitmap(await response.blob());
              if (!alive) { bitmap.close(); return; }
              bitmaps.set(index, bitmap);
              draw(); evict();
            } catch {
              if (alive) failed.add(index);
            } finally {
              workers--; inFlight.delete(index);
              if (alive) pump();
            }
          })();
        }
      };
      const schedule = () => {
        const step = mobile ? 2 : 1;
        const near = [wanted];
        for (let distance = 1; distance <= 9; distance++) near.push(wanted + distance * step, wanted - distance * step);
        pending = [...new Set([...near, ...anchors])].filter(i => i >= 0 && i <= lastFrame && !bitmaps.has(i) && !inFlight.has(i) && !failed.has(i));
        pump();
      };
      schedule();
      const playhead = { progress: 0 };
      const animation = gsap.context(() => {
        const timeline = gsap.timeline({ scrollTrigger: { trigger: scene.current, start: "top top", end: "bottom bottom", scrub: 0.32 } });
        timeline.to(playhead, { progress: 1, duration: 1, ease: "none", onUpdate: () => {
          const p = playhead.progress;
          if (hero) hero.inert = p > 0.44;
          // Brief natural breathing room at both ends; no playback independent of scroll.
          const next = Math.round(gsap.utils.clamp(0, 1, (p - 0.035) / 0.855) * lastFrame);
          if (next !== wanted) {
            wanted = next;
            element.dataset.requestedFrame = String(wanted);
            draw(); schedule();
          }
        } }, 0);
        timeline.fromTo(".ax-art", { x: 0, xPercent: mobile ? 0 : 18, y: mobile ? 120 : 0, scale: 1 }, { x: 0, xPercent: 0, y: 0, scale: 1, duration: 0.55, ease: "power1.inOut" }, 0);
        timeline.to(".ax-heroCopy", { opacity: 0, y: -45, duration: 0.25, ease: "none" }, 0.13);
        timeline.to(".ax-scrollHint", { opacity: 0, duration: 0.08, ease: "none" }, 0.04);
        timeline.fromTo(".ax-sceneCaption", { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.14, ease: "none" }, 0.63);
        timeline.fromTo(".ax-sectorLegend", { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.1, ease: "none" }, 0.76);
        gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach(el => gsap.fromTo(el, { y: 30 }, { y: 0, duration: 0.9, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 94%", once: true } }));
      }, root);
      const observer = new ResizeObserver(draw);
      observer.observe(element);
      void document.fonts.ready.then(() => { if (alive) ScrollTrigger.refresh(); });
      return () => {
        alive = false; controller.abort();
        animation.revert(); observer.disconnect();
        if (hero) hero.inert = false;
        bitmaps.forEach(bitmap => bitmap.close()); bitmaps.clear();
        element.style.opacity = "0";
        if (poster.current) poster.current.style.opacity = "1";
      };
    });
    return () => media.revert();
  }, []);

  return <div ref={root} className="ax-page ax-heroModule">
      <section className={"ax-scene"} ref={scene} aria-label="Scroll to explore the connected intelligence animation">
        <div className={"ax-sticky"}>
          <div className="ax-heroCopy">
            <p className="ax-eyebrow"><span /> A MORE CONNECTED PERSPECTIVE</p>
            <h1>Intelligence.<br /><span>Connected.</span></h1>
            <p className="ax-heroLede">From core banking to customer experience,<br className="ax-desktopBreak" /> discover a more connected way forward.</p>
            <a href={target} className="ax-heroLink">Explore the platform <ArrowUpRight size={19} /></a>
          </div>
          <div className={"ax-art"}>
            <picture>
              <source media="(prefers-reduced-motion: reduce)" srcSet="/experience/original-upscaled/desktop/189.webp" />
              <source media="(max-width: 699px)" srcSet="/experience/original-upscaled/mobile/000.webp" />
              <img ref={poster} src="/experience/original-upscaled/desktop/000.webp" width={reveal.width} height={reveal.height} alt="Azentio's emblem connects core banking, risk and compliance, customer experience, and payments and treasury." fetchPriority="high" className="ax-poster" />
            </picture>
            <canvas ref={canvas} className="ax-canvas" aria-hidden="true" />
          </div>
          <div className="ax-sceneCaption"><span>THE AZENTIO ECOSYSTEM</span><p>Built to move<br />business forward.</p></div>
          <ul className="ax-sectorLegend" aria-label="Featured sectors">{["Core Banking", "Risk & Compliance", "Customer Experience", "Payments & Treasury"].map(sector => <li key={sector}>{sector}</li>)}</ul>
          <a href={target} className="ax-scrollHint"><span><ArrowDown size={16} /></span>Scroll to explore</a>
        </div>
      </section>

  </div>;
}
