"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  FolderOpen,
  Inbox,
  MessageSquareQuote,
  Package,
  Receipt,
  Settings,
  ShoppingCart,
  Star,
  Tags,
  Image as ImageIcon,
  LayoutDashboard,
  Users,
  Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const ADMIN_NAV = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/portfolio", label: "Portfolio", icon: FolderOpen },
  { href: "/admin/services", label: "Services", icon: Wrench },
  { href: "/admin/service-orders", label: "Service Orders", icon: Receipt },
  { href: "/admin/products", label: "Digital Products", icon: Package },
  { href: "/admin/digital-orders", label: "Digital Orders", icon: ShoppingCart },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/inquiries", label: "Inquiries", icon: Inbox },
  { href: "/admin/testimonials", label: "Testimonials", icon: MessageSquareQuote },
  { href: "/admin/categories", label: "Categories", icon: Tags },
  { href: "/admin/content", label: "Website Content", icon: BarChart3 },
  { href: "/admin/media", label: "Media Library", icon: ImageIcon },
  { href: "/admin/settings", label: "Settings", icon: Settings },
] as const;

export interface AdminCounts {
  inquiries?: number;
  serviceOrders?: number;
}

/** True when a nav item is the section being looked at. */
export function isActiveNavItem(href: string, pathname: string) {
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
}

/** The unread badge for a nav item, when it has one. */
export function navBadge(
  href: string,
  counts?: AdminCounts,
): number | undefined {
  if (href === "/admin/inquiries") return counts?.inquiries;
  if (href === "/admin/service-orders") return counts?.serviceOrders;
  return undefined;
}

export function AdminSidebar({ counts }: { counts?: AdminCounts }) {
  // The active section is read from the client router, not from a request
  // header: the layout is not re-rendered when the route changes.
  const pathname = usePathname();
  const router = useRouter();

  return (
    <nav aria-label="Admin" className="flex h-full flex-col">
      <ul className="flex flex-1 flex-col gap-0.5 p-3">
        {ADMIN_NAV.map((item) => {
          const active = isActiveNavItem(item.href, pathname);
          const badge = navBadge(item.href, counts);

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                // Prefetching on sight rendered every section in the
                // background — thirteen page renders, each with its own
                // queries, before the studio had even looked at the first
                // one. The section is prepared when the pointer moves towards
                // it instead.
                prefetch={false}
                onMouseEnter={() => router.prefetch(item.href)}
                onFocus={() => router.prefetch(item.href)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 font-label text-sm font-medium transition-colors duration-150",
                  active
                    ? "bg-primary text-on-primary"
                    : "text-muted hover:bg-surface-sunken hover:text-text",
                )}
              >
                <item.icon aria-hidden="true" className="size-4 shrink-0" />
                <span className="truncate">{item.label}</span>
                {badge ? (
                  <span
                    className={cn(
                      "ml-auto rounded-full px-1.5 py-0.5 font-label text-[11px] font-semibold tabular-nums",
                      active
                        ? "bg-on-primary/20 text-on-primary"
                        : "bg-pink/15 text-pink-ink",
                    )}
                  >
                    {badge}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="border-t border-border p-3">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-md px-3 py-2.5 font-label text-sm text-muted transition-colors hover:bg-surface-sunken hover:text-text"
        >
          <Star aria-hidden="true" className="size-4" />
          View website
        </Link>
      </div>
    </nav>
  );
}
