import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { env } from "@/lib/env";

// Session-bound client. Used ONLY for authentication (who is this?), never for data access.
export async function createAuthClient() {
  const cookieStore = await cookies();
  return createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) cookieStore.set(name, value, options);
        } catch {
          // Called from a Server Component; the proxy refreshes the session instead.
        }
      },
    },
  });
}

// Privileged data client. Every call site must have passed an authz check first.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Untyped = SupabaseClient<any, "public", "public", any, any>;
let adminClient: Untyped | null = null;
export function db(): Untyped {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  adminClient ??= createClient<any>(env.supabaseUrl, env.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return adminClient;
}
