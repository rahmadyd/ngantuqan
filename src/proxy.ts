import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database.types";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

/**
 * Paths guarded by the admin gate.
 *
 * Matched exactly or by segment, so "/admin-login" is NOT treated as part of
 * "/admin" — otherwise the login page would redirect to itself forever.
 */
function isAdminPath(pathname: string) {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

/**
 * Proxy — the network boundary for the app.
 *
 * Responsibilities (Next.js 16 renamed middleware.ts to proxy.ts; the Edge
 * runtime is not supported here, so this runs on Node):
 *
 *  1. Refresh and verify the Supabase session on every matched request, so
 *     Server Components receive a valid token and the browser gets an updated
 *     cookie.
 *  2. Route unauthenticated or non-admin requests away from /admin.
 *
 * This is layer 1 of the authorization model. The real checks live in
 * src/lib/supabase/guards.ts (layer 2) and the RLS policies (layer 3).
 *
 * See docs/02-technical-architecture.md §2.2 and §2.3
 */
export async function proxy(request: NextRequest) {
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  // getClaims() verifies the token signature. Do not replace this with
  // getSession(), which trusts the cookie without revalidating it.
  const { data: claimsData } = await supabase.auth.getClaims();
  const claims = claimsData?.claims ?? null;

  const isAdminRoute = isAdminPath(request.nextUrl.pathname);

  if (isAdminRoute) {
    const isAdmin = claims ? await isAdministrator(supabase, claims.sub) : false;

    if (!isAdmin) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin-login";
      url.search = claims ? "?error=forbidden" : "";
      return NextResponse.redirect(url);
    }
  }

  return response;
}

async function isAdministrator(
  supabase: ReturnType<typeof createServerClient<Database>>,
  userId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  return data?.role === "ADMIN";
}

export const config = {
  matcher: [
    /*
     * Everything except static assets and image optimisation output.
     */
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|robots.txt|sitemap.xml|images/).*)",
  ],
};
