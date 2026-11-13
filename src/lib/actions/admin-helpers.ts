import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ZodError } from "zod";
import type { Database, Json } from "@/types/database.types";
import { assertAdmin } from "@/lib/supabase/guards";
import { createClient } from "@/lib/supabase/server";
import { clearContentCache } from "@/lib/cache";
import { adminError, type AdminActionState } from "@/lib/actions/admin-state";

/**
 * Shared plumbing for every admin Server Action.
 *
 * Each action authenticates, validates, mutates, writes an activity log row,
 * and revalidates the affected routes. Nothing here trusts the client beyond
 * the shape of the form data — the row being changed is always re-read from
 * the database by id.
 */

export type AdminDatabase = SupabaseClient<Database>;

/** Returns the caller's session, or null when they are not an admin. */
export async function adminSession() {
  try {
    return await assertAdmin();
  } catch {
    return null;
  }
}

/** A user-scoped Supabase client, so RLS and auth.uid() apply to every write. */
export async function adminDb(): Promise<AdminDatabase> {
  return createClient();
}

/** Turns a Zod failure into a per-field error map for the form. */
export function fieldErrors(error: ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !errors[key]) errors[key] = issue.message;
  }
  return errors;
}

/** A validation failure in the shape the forms expect. */
export function invalid(message: string, errors: Record<string, string> = {}) {
  return { status: "error", message, fieldErrors: errors } satisfies AdminActionState;
}

/**
 * Writes an audit row. The RPC is admin-gated and records auth.uid() as the
 * actor, so the log cannot be forged from the client.
 */
export async function logActivity(
  supabase: AdminDatabase,
  action: string,
  entityType: string,
  entityId?: string | null,
  metadata: Record<string, Json> = {},
) {
  const { error } = await supabase.rpc("log_activity", {
    p_action: action,
    p_entity_type: entityType,
    p_entity_id: entityId ?? undefined,
    p_metadata: metadata,
  });

  if (error) {
    // The audit trail is best-effort: a failure must not roll back the change
    // the administrator actually asked for.
    console.error("[admin] failed to write activity log:", error.message);
  }
}

/** Admin routes that show the data we just changed. */
export function revalidateAdmin(...paths: string[]) {
  for (const path of paths) revalidatePath(path);
}

/** Public routes that mirror the catalogue. */
export function revalidatePublic() {
  // The published content is cached in memory for a minute — an admin write
  // drops it, so the studio sees its own edit straight away.
  clearContentCache();

  for (const path of ["/", "/work", "/services", "/shop", "/about"]) {
    revalidatePath(path);
  }
}

/** Standard "not allowed" result. */
export const notAuthorised = () => adminError("You are not authorised to do that.");
