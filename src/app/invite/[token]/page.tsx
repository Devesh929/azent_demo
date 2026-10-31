import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Check } from "lucide-react";
import { getViewer, WORKSPACE_COOKIE } from "@/lib/authz/viewer";
import { db } from "@/lib/supabase/server";
import { hashToken } from "@/lib/invites";
import { audit } from "@/lib/audit";
import { roleLabel } from "@/lib/authz/policy";
import type { AppRole } from "@/lib/authz/viewer";
import { Wordmark } from "@/components/site/SiteHeader";
import { Button, LinkButton } from "@/components/ui/button";

export const metadata: Metadata = { title: "Invitation", robots: { index: false } };

async function load(token: string) {
  const { data } = await db().from("invitations").select("id, org_id, email, role, status, expires_at, organizations(name)").eq("token_hash", hashToken(token)).maybeSingle();
  return data as null | { id: string; org_id: string; email: string; role: AppRole; status: string; expires_at: string; organizations: { name: string } };
}

async function accept(fd: FormData) {
  "use server";
  const token = String(fd.get("token"));
  const v = await getViewer();
  if (!v) redirect(`/login?next=/invite/${token}`);
  const inv = await load(token);
  // Single-use, unexpired, and only for the verified account it was addressed to.
  if (!inv || inv.status !== "pending" || new Date(inv.expires_at) < new Date() || inv.email.toLowerCase() !== v.email) redirect(`/invite/${token}?error=1`);
  if (fd.get("understood") !== "on") redirect(`/invite/${token}?error=terms`);

  const { data: claimed } = await db().from("invitations").update({ status: "accepted", accepted_by: v.userId, accepted_at: new Date().toISOString() }).eq("id", inv.id).eq("status", "pending").select("id");
  if (!claimed?.length) redirect(`/invite/${token}?error=1`);

  const { data: existing } = await db().from("memberships").select("id").eq("user_id", v.userId).eq("org_id", inv.org_id).maybeSingle();
  const now = new Date().toISOString();
  const membershipId = existing
    ? (await db().from("memberships").update({ status: "active", terms_accepted_at: now }).eq("id", existing.id).select("id").single()).data!.id
    : (await db().from("memberships").insert({ user_id: v.userId, org_id: inv.org_id, status: "active", terms_accepted_at: now }).select("id").single()).data!.id;
  const roles: AppRole[] = inv.role === "client_admin" ? ["client_member", "client_admin"] : [inv.role];
  // The unique index covers active grants only, so check before inserting.
  const { data: held } = await db().from("role_grants").select("role").eq("membership_id", membershipId).is("revoked_at", null);
  for (const role of roles.filter((r) => !(held ?? []).some((h) => h.role === r))) {
    await db().from("role_grants").insert({ membership_id: membershipId, role });
  }
  await audit(v, "invitation.accepted", "invitation", inv.id, { role: inv.role }, inv.org_id);
  (await cookies()).set(WORKSPACE_COOKIE, membershipId, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/" });
  redirect("/portal");
}

export default async function InvitePage({ params, searchParams }: PageProps<"/invite/[token]">) {
  const { token } = await params;
  const sp = await searchParams;
  const [inv, v] = await Promise.all([load(token), getViewer()]);
  const valid = inv && inv.status === "pending" && new Date(inv.expires_at) > new Date();

  return (
    <div className="mx-auto flex min-h-svh max-w-xl flex-col px-5 py-10">
      <Link href="/" className="text-[19px]"><Wordmark /></Link>
      <div className="my-auto py-12">
        {!valid ? (
          <>
            <h1 className="headline text-[36px]">This invitation is not valid</h1>
            <p className="mt-4 text-[16px] text-ink-2">It may have expired, been revoked or already been used. Ask your organisation&rsquo;s administrator for a new one.</p>
          </>
        ) : (
          <>
            <p className="text-[14px] text-accent">Invitation</p>
            <h1 className="headline mt-3 text-[clamp(2rem,5vw,3rem)]">Join {inv.organizations.name}</h1>
            <p className="mt-4 text-[16px] text-ink-2">as {roleLabel(inv.role)}. This invitation is for <strong className="text-ink">{inv.email}</strong> only.</p>
            {sp.error === "1" && <p className="mt-6 rounded-xl bg-bad-soft px-4 py-3 text-[14px] text-bad">This invitation can only be accepted by the account it was sent to.</p>}
            {!v ? (
              <LinkButton href={`/login?next=/invite/${token}`} size="lg" className="mt-8">Verify {inv.email} to continue</LinkButton>
            ) : v.email !== inv.email.toLowerCase() ? (
              <p className="mt-8 rounded-xl bg-warn-soft px-4 py-3 text-[14px] text-warn">You are signed in as {v.email}. Sign out and sign in as {inv.email} to accept.</p>
            ) : (
              <form action={accept} className="mt-8 glass ring-gradient rounded-[22px] p-6">
                <input type="hidden" name="token" value={token} />
                <h2 className="text-[17px] font-semibold">Workspace terms and sharing</h2>
                <ul className="mt-4 space-y-2 text-[14px] text-ink-2">
                  {["You will see only what your organisation is entitled to.", "Joining is not consent to share anything or to train any model.", "Your observations start private. Sharing is a separate, reviewed choice you can withdraw."].map((t) => <li key={t} className="flex gap-2"><Check size={16} className="mt-0.5 shrink-0 text-accent" />{t}</li>)}
                </ul>
                <label className="mt-5 flex items-start gap-3 text-[14px]"><input type="checkbox" name="understood" className="mt-0.5 size-5 accent-[var(--accent)]" /> I have read the workspace terms and understand how sharing works.</label>
                {sp.error === "terms" && <p className="mt-2 text-[13px] text-bad">Please confirm to continue.</p>}
                <Button size="lg" className="mt-6">Accept and enter workspace</Button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}
