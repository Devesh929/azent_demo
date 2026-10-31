"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import { ArrowLeft, ArrowRight, Check, ChevronRight, ChevronUp, Compass, RotateCcw } from "lucide-react";
import { buildPortalTour, matchTourStep, portalBreadcrumbs, restoreTourState, tourContext, type TourNav, type TourState, type TourWorkspace } from "@/lib/portal-tour";

const eventName = "azentio:guide-change";
const memory = new Map<string, string>();
const serverSnapshot = () => null;

function useTourState(key: string, steps: ReturnType<typeof buildPortalTour>) {
  const subscribe = useCallback((notify: () => void) => {
    const changed = () => notify();
    const external = (event: StorageEvent) => { if (event.key === key || event.key === null) { memory.delete(key); notify(); } };
    window.addEventListener(eventName, changed); window.addEventListener("storage", external);
    return () => { window.removeEventListener(eventName, changed); window.removeEventListener("storage", external); };
  }, [key]);
  const snapshot = useCallback(() => {
    if (memory.has(key)) return memory.get(key)!;
    try { return localStorage.getItem(key); } catch { return null; }
  }, [key]);
  const raw = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const state = useMemo(() => restoreTourState(raw, steps), [raw, steps]);
  const save = useCallback((next: TourState) => {
    const value = JSON.stringify({ version: 1, ...next });
    try { localStorage.setItem(key, value); memory.delete(key); } catch { memory.set(key, value); }
    window.dispatchEvent(new Event(eventName));
  }, [key]);
  return [state, save] as const;
}

export function PortalBreadcrumbs({ nav }: { nav: TourNav[] }) {
  const path = usePathname();
  const crumbs = portalBreadcrumbs(nav, path);
  return <nav className="portal-route-crumbs" aria-label="Breadcrumb"><ol>{crumbs.map((crumb, i) => <li key={crumb.href}>{i > 0 && <ChevronRight size={11} aria-hidden="true" />}{i === crumbs.length - 1 ? <span aria-current="page">{crumb.label}</span> : <Link href={crumb.href}>{crumb.label}</Link>}</li>)}</ol></nav>;
}

type Props = { nav: TourNav[]; workspace: TourWorkspace; canSwitch: boolean; identity: string; open: boolean; onOpenChange: (value: boolean) => void };
export function PortalTour({ nav, workspace, canSwitch, identity, open, onOpenChange }: Props) {
  const path = usePathname();
  const search = useSearchParams();
  const router = useRouter();
  const steps = useMemo(() => buildPortalTour(nav, workspace, canSwitch), [nav, workspace, canSwitch]);
  const [state, save] = useTourState(`azentio:workspace-guide:v1:${identity}`, steps);
  const index = matchTourStep(steps, path, search.toString());
  const nextUnvisited = steps.findIndex(s => !state.visited.includes(s.id));
  const current = index >= 0 ? steps[index] : null;
  const context = current ? tourContext(current, path) : null;
  const visited = state.visited.length;
  const heading = useRef<HTMLHeadingElement>(null);
  const rail = useRef<HTMLOListElement>(null);
  const restarting = useRef(false);
  const enabled = state.status === "active";

  useEffect(() => {
    if (restarting.current && index !== 0) return;
    restarting.current = false;
    if ((enabled || open) && current && (!state.visited.includes(current.id) || !enabled)) save({ status: "active", visited: state.visited.includes(current.id) ? state.visited : [...state.visited, current.id] });
  }, [enabled, open, current, index, state, save]);
  useEffect(() => { if (open) heading.current?.focus({ preventScroll: true }); }, [open]);
  useEffect(() => {
    const selected = rail.current?.querySelector<HTMLElement>('[aria-current="step"]');
    if (!selected || !rail.current) return;
    const track = rail.current;
    // Move only the horizontal rail: never scroll the dashboard away from a form.
    if (selected.offsetLeft < track.scrollLeft) track.scrollLeft = selected.offsetLeft - 8;
    else if (selected.offsetLeft + selected.offsetWidth > track.scrollLeft + track.clientWidth) track.scrollLeft = selected.offsetLeft + selected.offsetWidth - track.clientWidth + 8;
  }, [index, open]);

  function collapse() { onOpenChange(false); document.getElementById("portal-guide-trigger")?.focus(); }
  function activate() {
    save({ ...state, status: "active" }); onOpenChange(true);
  }
  function restart() { restarting.current = true; save({ status: "active", visited: [] }); onOpenChange(true); router.push(steps[0].href); }
  function end(finished: boolean) { save({ ...state, status: finished ? "finished" : "idle" }); collapse(); }
  const nextIndex = index >= 0 ? index + 1 : nextUnvisited >= 0 ? nextUnvisited : 0;
  const isLast = index === steps.length - 1;

  if (!open) return <section className="workspace-guide-launch" id="workspace-guide" aria-label="Workspace guide">
    <span className="guide-compass"><Compass size={19} /></span><div><strong>{state.status === "finished" ? "Your workspace guide is ready to revisit" : enabled || visited ? "Continue your workspace guide" : "Your workspace, step by step"}</strong><span>{visited ? `${visited} of ${steps.length} pages visited` : "A guided route through the tools available to your role."}</span></div>
    <button type="button" onClick={activate}>{state.status === "finished" ? "Review guide" : enabled || visited ? "Resume tour" : "Start tour"}<ArrowRight size={15} /></button>
  </section>;

  return <section className="workspace-guide" aria-labelledby="workspace-guide-title" id="workspace-guide">
    <header className="guide-header"><div className="guide-heading"><span className="guide-compass"><Compass size={19} /></span><div><h2 id="workspace-guide-title" ref={heading} tabIndex={-1}>Workspace guide</h2><p>{workspace.kind === "client" ? "Client" : "Employee"} journey <span>·</span> {visited} of {steps.length} pages visited</p></div></div><div className="guide-header-actions"><button type="button" onClick={restart} title="Restart guide" aria-label="Restart guide"><RotateCcw size={15} /><span>Restart</span></button><button type="button" onClick={collapse} title="Minimize guide" aria-label="Minimize guide"><ChevronUp size={18} /></button></div></header>
    <div className="guide-progress" role="progressbar" aria-label="Tour pages visited" aria-valuemin={0} aria-valuemax={steps.length} aria-valuenow={visited}><span style={{ width: `${visited / steps.length * 100}%` }} /></div>
    <nav className="guide-route" aria-label="Guided tour steps"><ol ref={rail}>{steps.map((s, i) => <li key={s.id}><Link href={s.href} prefetch={false} aria-current={index === i ? "step" : undefined} className={state.visited.includes(s.id) ? "is-visited" : undefined} onClick={() => { if (!enabled) save({ ...state, status: "active" }); }}><span className="guide-step-number">{state.visited.includes(s.id) && index !== i ? <Check size={11} aria-label="Visited" /> : String(i + 1).padStart(2, "0")}</span>{s.label}</Link>{i < steps.length - 1 && <ChevronRight size={12} aria-hidden="true" />}</li>)}</ol></nav>
    <div className="guide-body"><div className="guide-explanation"><span className="guide-current" role="status">{current ? `Step ${index + 1} of ${steps.length} · ${current.label}` : "Choose a step to continue"}</span><h3>{context?.title ?? "Explore the workspace at your own pace"}</h3><p>{context?.description ?? "Choose a destination above. This guide stays within the pages available to your current identity and workspace."}</p>{current?.href === "/portal/observations" && path === current.href && <Link className="guide-inline-action" href="/portal/observations/new">Create an observation<ArrowRight size={13} /></Link>}</div><ol className="guide-checks" aria-label="What to explore on this page">{(context?.checks ?? ["Use the breadcrumb above the dashboard to return to a parent page.", "Choose a tour step to open its guidance.", "Your work stays under your control; no form is submitted by this guide."]).map((text, i) => <li key={text}><span>{i + 1}</span><p>{text}</p></li>)}</ol></div>
    <footer className="guide-footer"><span>Progress tracks visits, not completed actions.</span><div><button type="button" className="guide-end" onClick={() => end(false)}>End tour</button>{index > 0 && <Link href={steps[index - 1].href} className="guide-back" prefetch={false}><ArrowLeft size={14} />Back</Link>}{isLast ? <button type="button" className="guide-next" onClick={() => end(true)}>Finish tour<Check size={14} /></button> : <Link href={steps[nextIndex].href} className="guide-next" prefetch={false} onClick={() => { if (!enabled) save({ ...state, status: "active" }); }}>Next<ArrowRight size={14} /></Link>}</div></footer>
  </section>;
}
