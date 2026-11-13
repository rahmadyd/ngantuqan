import { redirect } from "next/navigation";
import { getSessionRole, isSupabaseConfigured } from "@/lib/supabase/server";

/**
 * Server-side authorization guards.
 *
 * These are the real authorization boundary for the admin area. Hiding a nav
 * link is not a control — every admin page, layout, Server Action, and route
 * handler calls one of these.
 *
 * See docs/02-technical-architecture.md §2.3
 */

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

/** Redirects to the login page unless the caller is an admin. */
export async function requireAdmin() {
  if (!isSupabaseConfigured) {
    throw new AuthError(
      "Supabase is not configured. The admin dashboard requires a database connection.",
    );
  }

  const session = await getSessionRole();

  if (!session) {
    redirect("/admin-login");
  }

  if (session.role !== "ADMIN") {
    redirect("/admin-login?error=forbidden");
  }

  return session;
}

/** Redirects to the login page unless the caller is signed in. */
export async function requireCustomer() {
  if (!isSupabaseConfigured) {
    throw new AuthError(
      "Supabase is not configured. This action requires a database connection.",
    );
  }

  const session = await getSessionRole();

  if (!session) {
    redirect("/admin-login");
  }

  return session;
}

/** Returns the session without redirecting. */
export async function getSession() {
  if (!isSupabaseConfigured) return null;
  return getSessionRole();
}

/**
 * Guards a Server Action. Throws rather than redirecting so the action
 * returns a clean error to the caller instead of a navigation.
 */
export async function assertAdmin() {
  if (!isSupabaseConfigured) {
    throw new AuthError("Supabase is not configured.");
  }

  const session = await getSessionRole();

  if (!session || session.role !== "ADMIN") {
    throw new AuthError("Not authorized.");
  }

  return session;
}
