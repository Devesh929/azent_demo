import "server-only";
import { db } from "@/lib/supabase/server";
import type { Viewer } from "@/lib/authz/viewer";

// Append-only (the table rejects UPDATE/DELETE). Never put private content in metadata.
export async function audit(
  actor: Viewer | null,
  action: string,
  resourceType: string,
  resourceId?: string | null,
  metadata: Record<string, unknown> = {},
  orgId?: string | null,
) {
  await db().from("audit_log").insert({
    actor_id: actor?.userId ?? null,
    actor_label: actor ? actor.email : "anonymous",
    action,
    resource_type: resourceType,
    resource_id: resourceId ?? null,
    org_id: orgId ?? null,
    metadata,
  });
}
