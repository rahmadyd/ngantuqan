"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { Database } from "@/types/database.types";
import type { LoginState } from "@/lib/actions/auth-state";

const loginSchema = z.object({
  email: z.string().trim().min(1, "Please enter your email address."),
  password: z.string().min(1, "Please enter your password."),
});

async function createCookieClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error("Supabase is not configured.");
  }

  const cookieStore = await cookies();

  return createServerClient<Database>(url, key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
        });
      },
    },
  });
}

/**
 * Signs an administrator in with email and password.
 *
 * The password is never logged, and the error message never reveals whether
 * an address exists.
 */
export async function signIn(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    const fieldErrors: LoginState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as "email" | "password";
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }

    return {
      status: "error",
      message: "Please check the highlighted fields.",
      fieldErrors,
    };
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    return {
      status: "error",
      message:
        "The admin dashboard is not connected to a database yet. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local.",
      fieldErrors: {},
    };
  }

  const supabase = await createCookieClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return {
      status: "error",
      message: "That email and password combination did not match.",
      fieldErrors: {},
    };
  }

  // Verify the account actually holds the ADMIN role before letting it in.
  const { data: claimsData } = await supabase.auth.getClaims();
  const { data: profile } = claimsData?.claims?.sub
    ? await supabase
        .from("profiles")
        .select("role")
        .eq("id", claimsData.claims.sub)
        .maybeSingle()
    : { data: null };

  if (profile?.role !== "ADMIN") {
    await supabase.auth.signOut();
    return {
      status: "error",
      message:
        "That account does not have administrator access. Ask the studio owner to promote it.",
      fieldErrors: {},
    };
  }

  redirect("/admin");
}

/** Signs the current administrator out. */
export async function signOut() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (url && key) {
    const supabase = await createCookieClient();
    await supabase.auth.signOut();
  }

  redirect("/admin-login");
}
