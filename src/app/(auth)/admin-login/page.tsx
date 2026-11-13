import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/layout/logo";
import { AdminLoginForm } from "@/components/admin/admin-login-form";
import { getSessionRole, isSupabaseConfigured } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Admin Sign In",
  description: "Studio administrator sign-in.",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  // Already signed in as an admin? Skip the form.
  const session = await getSessionRole();
  if (session?.role === "ADMIN") {
    redirect("/admin");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-sunken px-5 py-16">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Logo size="lg" className="justify-center" />
          <h1 className="mt-6 font-display text-3xl font-semibold tracking-[-0.02em]">
            Studio dashboard
          </h1>
          <p className="prose-body mx-auto mt-2 text-sm">
            Sign in with an administrator account to manage content, orders,
            and products.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-6 shadow-sm md:p-8">
          <AdminLoginForm forbidden={params.error === "forbidden"} />
        </div>

        {!isSupabaseConfigured ? (
          <p className="mt-6 rounded-md border border-warning/30 bg-warning-surface px-4 py-3 text-center text-sm text-warning">
            No database is configured. Set the Supabase environment variables
            in <code className="font-label">.env.local</code> to enable sign-in.
          </p>
        ) : null}

        <p className="mt-8 text-center font-label text-xs text-muted-foreground">
          <Link
            href="/"
            className="underline-offset-4 hover:text-text hover:underline"
          >
            Back to the website
          </Link>
        </p>
      </div>
    </main>
  );
}
