import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

/**
 * The public read client.
 *
 * It carries no session and reads no cookies. The catalogue is public data —
 * the RLS policies decide what an anonymous visitor may read — and a reader
 * that does not touch the request context can be cached safely.
 *
 * It also keeps the build honest: a page that reaches for cookies during the
 * build and not at runtime (or the other way round) is a page Next.js refuses
 * to serve, and a cached read that hid the cookie access was exactly that.
 */
export function createPublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) return null;

  return createClient<Database>(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
