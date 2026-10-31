import type { Metadata } from "next";
import { PortalShell } from "@/components/portal/PortalShell";
import { requireViewer } from "@/lib/authz/policy";
import { portalNav } from "@/lib/authz/nav";
import { db } from "@/lib/supabase/server";
import { signOut } from "@/app/login/actions";
import { isDatabaseConfigured } from "@/lib/data/public";

export const metadata: Metadata = { title: { default: "Portal", template: "%s | azentio.ai portal" }, robots: { index: false } };

export default async function PortalLayout({ children }: LayoutProps<"/portal">) {
  if (!isDatabaseConfigured()) {
    return (
      <div className="mx-auto max-w-xl px-6 py-32">
        <h1 className="text-[28px] font-semibold tracking-[-0.03em]">The portal is not connected yet</h1>
        <p className="mt-4 text-[15px] leading-relaxed text-ink-2">Add the Supabase keys to <code className="rounded bg-surface px-1.5">.env.local</code>, then run <code className="rounded bg-surface px-1.5">npm run db:setup</code> and restart the dev server. See the README.</p>
      </div>
    );
  }
  const v = await requireViewer("/portal");
  const { count } = await db().from("notifications").select("id", { count: "exact", head: true }).eq("user_id", v.userId).is("read_at", null);
  const usable = v.memberships.filter((m) => m.orgKind === "client" || v.isEmployee);

  return (
    <PortalShell
      nav={v.active ? portalNav(v) : [{ href: "/portal/workspace", label: "Choose workspace", icon: "home", group: "Workspace" }]}
      user={{ name: v.displayName, email: v.email, title: v.title }}
      workspace={v.active ? { name: v.active.orgName, kind: v.active.orgKind, roles: v.active.roles } : null}
      canSwitch={usable.length > 1}
      tourKey={v.active && (v.active.orgKind === "internal" || v.active.termsAcceptedAt) ? `${v.userId}:${v.active.id}` : null}
      unread={count ?? 0}
      signOut={signOut}
    >
      {children}
    </PortalShell>
  );
}
