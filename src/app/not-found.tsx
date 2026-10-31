import Link from "next/link";
import { Wordmark } from "@/components/site/SiteHeader";
import { buttonClass } from "@/components/ui/button";

// Shown for missing pages AND for resources the viewer may not open, so existence is never disclosed.
export default function NotFound() {
  return (
    <main className="relative grid min-h-svh place-items-center overflow-hidden px-6">
      <div className="absolute inset-0 bg-[radial-gradient(50%_50%_at_50%_40%,rgb(62_230_196/0.08),transparent_70%)]" />
      <div className="relative max-w-lg text-center">
        <Link href="/" className="text-[19px]"><Wordmark /></Link>
        <p className="display mt-12 text-[clamp(5rem,16vw,9rem)] text-surface-3">404</p>
        <h1 className="headline mt-4 text-[clamp(1.8rem,4vw,2.6rem)]">Nothing to see here</h1>
        <p className="mt-4 text-[16px] leading-relaxed text-ink-2">
          This page does not exist, or it is not available in your current workspace. If you think you should have access, check the workspace you are signed in to.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link href="/" className={buttonClass("primary", "lg")}>Go home</Link>
          <Link href="/portal/workspace" className={buttonClass("quiet", "lg")}>Switch workspace</Link>
        </div>
      </div>
    </main>
  );
}
