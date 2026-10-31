import "server-only";
import { notFound, redirect } from "next/navigation";
import { getViewer, type AppRole, type Viewer } from "./viewer";

// Pure rules live in rules.ts so they can be unit-tested without the framework.
export * from "./rules";
import { inClientWorkspace, inEmployeeWorkspace, hasPlatformRole } from "./rules";

// ───────────── guards for pages and server actions ─────────────
export async function requireViewer(next?: string): Promise<Viewer> {
  const v = await getViewer();
  if (!v) redirect(`/login${next ? `?next=${encodeURIComponent(next)}` : ""}`);
  return v;
}

/** Signed in AND has chosen a valid workspace (and accepted its terms). */
export async function requireWorkspace(): Promise<Viewer & { active: NonNullable<Viewer["active"]> }> {
  const v = await requireViewer();
  if (!v.active) redirect("/portal/workspace");
  if (v.active.orgKind === "client" && !v.active.termsAcceptedAt) redirect("/portal/workspace?terms=1");
  return v as Viewer & { active: NonNullable<Viewer["active"]> };
}

export async function requireEmployee() {
  const v = await requireWorkspace();
  if (!inEmployeeWorkspace(v)) notFound();
  return v;
}

export async function requireClient() {
  const v = await requireWorkspace();
  if (!inClientWorkspace(v)) notFound();
  return v;
}

export async function requirePlatformRole(role: AppRole) {
  const v = await requireWorkspace();
  if (!hasPlatformRole(v, role)) notFound();
  return v;
}

/** For server actions: throws instead of redirecting so the action fails closed. */
export class AccessDenied extends Error {
  constructor(message = "You do not have permission to do that.") {
    super(message);
  }
}
export function assert(cond: unknown, message?: string): asserts cond {
  if (!cond) throw new AccessDenied(message);
}

export function roleLabel(role: AppRole) {
  return {
    employee: "Employee",
    product_owner: "Product owner",
    learning_moderator: "Learning moderator",
    content_publisher: "Content publisher",
    portal_admin: "Portal administrator",
    fl_coordinator: "FL coordinator",
    client_member: "Client member",
    client_admin: "Client administrator",
  }[role];
}
