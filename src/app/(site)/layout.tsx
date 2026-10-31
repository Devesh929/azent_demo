import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SmoothScroll } from "@/components/site/motion";
import { getViewerSafe } from "@/lib/data/public";


export default async function SiteLayout({ children }: LayoutProps<"/">) {
  const viewer = await getViewerSafe();
  return (
    <SmoothScroll>
      <div className="site-shell">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-accent focus:px-4 focus:py-2 focus:text-accent-ink">
        Skip to content
      </a>
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="public-atmosphere absolute inset-0" />
        <div className="dot-pattern absolute inset-0 opacity-30 [mask-image:radial-gradient(ellipse_at_center,#000_20%,transparent_75%)]" />
      </div>
      <SiteHeader signedIn={!!viewer} />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter />
      </div>
    </SmoothScroll>
  );
}
