import Link from "next/link";
import { OFFERINGS } from "@/content/catalog";

const COLS = [
  { title: "Products", links: OFFERINGS.map((o) => ({ href: `/products/${o.slug}`, label: o.name })) },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/solutions", label: "Solutions" },
      { href: "/trust", label: "Trust & security" },
      { href: "/learning", label: "Collective learning" },
    ],
  },
  {
    title: "Explore",
    links: [
      { href: "/insights", label: "Insights" },
      { href: "/media", label: "Media" },
      { href: "/live", label: "azentio.ai LIVE" },
      { href: "/hackathon", label: "Hackathon 2026" },
      { href: "/search", label: "Search" },
    ],
  },
  {
    title: "Work with us",
    links: [
      { href: "/demo", label: "Book a demo" },
      { href: "/login", label: "Client & employee sign in" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="relative mt-auto overflow-hidden bg-ground-2 pt-24">
      <div className="frame grid gap-12 md:grid-cols-[1.2fr_repeat(4,1fr)]">
        <div className="max-w-xs">
          <p className="text-[15px] leading-relaxed text-ink-2">
            Enterprise AI for financial services, built with evidence, oversight and governed collective learning.
          </p>
          <p className="mt-6 text-[13px] leading-relaxed text-muted">
            Hackathon build. Every organisation, person and figure in the portal is synthetic.
          </p>
        </div>
        {COLS.map((c) => (
          <div key={c.title}>
            <h2 className="text-[13px] font-medium text-muted">{c.title}</h2>
            <ul className="mt-4 space-y-2.5">
              {c.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-[14px] text-ink-2 transition-colors hover:text-accent">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="frame mt-20 flex flex-wrap items-center justify-between gap-4 pb-6 text-[13px] text-muted">
        <span>© {new Date().getFullYear()} Azentio. azentio.ai hackathon edition.</span>
        <span>Private by design. Shared with purpose.</span>
      </div>
      <p
        aria-hidden
        className="pointer-events-none -mb-[0.2em] select-none text-center font-semibold leading-none tracking-[-0.06em] text-surface-2"
        style={{ fontSize: "clamp(80px, 21vw, 340px)" }}
      >
        azentio<span className="text-[rgb(62_230_196/0.18)]">.ai</span>
      </p>
    </footer>
  );
}
