import { LogOut } from "lucide-react";
import { Toaster } from "sonner";
import { Logo } from "@/components/layout/logo";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminMobileNav } from "@/components/admin/admin-mobile-nav";
import { signOut } from "@/lib/actions/auth";
import { requireAdmin } from "@/lib/supabase/guards";
import { createClient } from "@/lib/supabase/server";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Layer 2 of authorization — the real gate. The proxy only redirects;
  // this throws if the session is missing or the role is wrong.
  const session = await requireAdmin();

  const supabase = await createClient();

  const [{ count: unread }, { count: pendingOrders }] = await Promise.all([
    supabase
      .from("inquiries")
      .select("id", { count: "exact", head: true })
      .eq("is_read", false),
    supabase
      .from("service_orders")
      .select("id", { count: "exact", head: true })
      .eq("order_status", "NEW_INQUIRY"),
  ]);

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", session.userId)
    .maybeSingle();

  const counts = {
    inquiries: unread ?? 0,
    serviceOrders: pendingOrders ?? 0,
  };

  return (
    <div className="flex min-h-screen bg-surface-sunken">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-border bg-surface lg:block">
        <div className="flex h-16 items-center border-b border-border px-5">
          <Logo size="sm" />
        </div>
        <AdminSidebar counts={counts} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-2 border-b border-border bg-surface px-4 md:gap-4 md:px-8">
          <div className="flex items-center gap-2 lg:hidden">
            <AdminMobileNav counts={counts} />
            <Logo size="sm" />
          </div>

          <div className="hidden lg:block" />

          <div className="flex items-center gap-2 md:gap-4">
            <div className="hidden text-right sm:block">
              <p className="font-label text-sm font-medium text-text">
                {profile?.full_name ?? "Administrator"}
              </p>
              <p className="font-label text-xs text-muted-foreground">
                {profile?.email ?? "Administrator"}
              </p>
            </div>

            <form action={signOut}>
              <button
                type="submit"
                aria-label="Sign out"
                className="inline-flex size-9 items-center justify-center gap-2 rounded-md border border-border bg-surface px-2 font-label text-xs font-medium text-muted transition-colors hover:border-border-strong hover:text-text sm:w-auto sm:px-3"
              >
                <LogOut aria-hidden="true" className="size-3.5" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </form>
          </div>
        </header>

        <main id="main" className="flex-1 p-4 md:p-8">
          {children}
        </main>
      </div>

      <Toaster position="bottom-right" richColors />
    </div>
  );
}
