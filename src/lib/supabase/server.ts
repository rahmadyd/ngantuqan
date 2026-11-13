import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database.types";

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

/** True when the app is pointed at a live Supabase project. */
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);

/**
 * Per-request Supabase client using cookie-based sessions.
 *
 * Server Components cannot write cookies — the proxy owns that path — so the
 * setAll body swallows the write error by design.
 */
export async function createClient() {
  if (!isSupabaseConfigured) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
    );
  }

  const cookieStore = await cookies();

  return createServerClient<Database>(
    SUPABASE_URL!,
    SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Called from a Server Component — the proxy refreshes and writes cookies.
          }
        },
      },
    },
  );
}

/**
 * Verifies the current session and returns the caller's role.
 *
 * Uses getClaims() rather than getSession(): getSession() reads the token out
 * of the cookie without revalidating it, so a forged cookie could otherwise
 * be trusted. getClaims() verifies the signature on every call.
 */
export async function getSessionRole(): Promise<
  { userId: string; role: "ADMIN" | "CUSTOMER" } | null
> {
  if (!isSupabaseConfigured) return null;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims?.sub) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.claims.sub)
    .maybeSingle();

  const role = profile?.role === "ADMIN" ? "ADMIN" : "CUSTOMER";

  return { userId: data.claims.sub, role };
}
