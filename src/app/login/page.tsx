import Link from "next/link";
import type { Metadata } from "next";
import { LoginForm } from "./LoginForm";
import { signInDemo } from "./actions";
import { Wordmark } from "@/components/site/SiteHeader";
import { ProductPreview } from "@/components/site/home/ProductPreview";
import { LockKeyhole } from "lucide-react";
import { PERSONAS } from "@/content/personas";
import { roleLabel } from "@/lib/authz/policy";
import type { AppRole } from "@/lib/authz/viewer";

export const metadata: Metadata = { title: "Sign in" };

// Show the distinguishing role; base roles only when they are all a persona has.
function personaRoles(memberships: { roles: string[] }[]) {
  const roles = [...new Set(memberships.flatMap((m) => m.roles))] as AppRole[];
  const special = roles.filter((r) => r !== "employee" && r !== "client_member");
  return (special.length ? special : roles).map(roleLabel).join(", ");
}

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const sp = await searchParams;
  const next = typeof sp.next === "string" && sp.next.startsWith("/") ? sp.next : "/portal";
  const demo = process.env.DEMO_MODE === "true";

  return (
    <div className="login-redesign grid min-h-svh lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <div className="relative z-10 flex flex-col px-[clamp(20px,5vw,72px)] py-8">
        <Link href="/" className="text-[19px]"><Wordmark /></Link>
        <div className="my-auto w-full max-w-[420px] py-16">
          <h1 className="headline text-[clamp(2.2rem,4vw,3.4rem)]">Sign in to your workspace</h1>
          <p className="mt-4 text-[16px] leading-relaxed text-ink-2">
            Employees use their verified azentio.com address. Clients join through an invitation from their organisation.
          </p>
          {sp.error === "link" && <p className="mt-6 rounded-xl bg-bad-soft px-4 py-3 text-[14px] text-bad">That sign-in link is invalid or has expired. Request a new code.</p>}
          <div className="mt-10"><LoginForm next={next} /></div>
          <p className="mt-8 text-[13px] leading-relaxed text-muted">
            Signing in does not give you access by itself. Your organisation or an azentio.ai administrator must approve your membership.
          </p>

          {demo && (
            <details className="group mt-12 glass ring-gradient rounded-[22px] p-5 open:pb-6" open>
              <summary className="flex cursor-pointer list-none items-center justify-between text-[15px] font-medium">
                Demo personas
                <span className="rounded-full bg-warn-soft px-2.5 py-0.5 text-[12px] text-warn">Synthetic accounts · judging only</span>
              </summary>
              <p className="mt-3 text-[13px] text-muted">One click signs in as a seeded persona. This switcher only exists while DEMO_MODE is on.</p>
              <ul className="mt-4 grid gap-2">
                {PERSONAS.map((p) => (
                  <li key={p.email}>
                    <form action={signInDemo}>
                      <input type="hidden" name="email" value={p.email} />
                      <input type="hidden" name="next" value={next} />
                      <button className="flex w-full items-center justify-between gap-3 rounded-xl bg-white/[0.04] ring-1 ring-inset ring-white/[0.06] px-4 py-3 text-left transition-colors hover:bg-white/[0.09]">
                        <span>
                          <span className="block text-[14px] font-medium text-ink">{p.name}</span>
                          <span className="block text-[12px] text-muted">{p.memberships.map((m) => m.org).join(" + ")}</span>
                        </span>
                        <span className="text-right text-[12px] text-ink-2">{personaRoles(p.memberships)}</span>
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      </div>
      <div className="login-visual relative hidden overflow-hidden lg:flex">
        <div className="login-visual-inner">
          <h2>One workspace.<br/><span>A clearer perspective.</span></h2>
          <ProductPreview/>
          <p className="login-visual-note"><LockKeyhole size={13}/> Your identity. Your organisation. Your permissions.</p>
        </div>
      </div>
    </div>
  );
}
