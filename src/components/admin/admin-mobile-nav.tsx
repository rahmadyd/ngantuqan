"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Star, X } from "lucide-react";
import {
  ADMIN_NAV,
  isActiveNavItem,
  navBadge,
  type AdminCounts,
} from "@/components/admin/admin-sidebar";
import { cn } from "@/lib/utils";

/**
 * The admin navigation on a phone.
 *
 * The sidebar is hidden below the large breakpoint, so without this the
 * dashboard had no way to reach another section. The drawer closes on
 * Escape, on a tap outside, and after a navigation.
 */
export function AdminMobileNav({ counts }: { counts?: AdminCounts }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open the admin menu"
        aria-expanded={open}
        className="inline-flex size-9 items-center justify-center rounded-md text-text transition-colors hover:bg-surface-sunken lg:hidden"
      >
        <Menu aria-hidden="true" className="size-5" />
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close the menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-text/40"
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-label="Admin menu"
            className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-surface shadow-xl"
          >
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-4">
              <span className="font-display text-base font-semibold">
                Admin
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close the menu"
                className="inline-flex size-9 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface-sunken hover:text-text"
              >
                <X aria-hidden="true" className="size-5" />
              </button>
            </div>

            <nav aria-label="Admin sections" className="flex-1 overflow-y-auto p-3">
              <ul className="space-y-0.5">
                {ADMIN_NAV.map((item) => {
                  const active = isActiveNavItem(item.href, pathname);
                  const badge = navBadge(item.href, counts);

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setOpen(false)}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "flex items-center gap-3 rounded-md px-3 py-2.5 font-label text-sm font-medium transition-colors",
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
            </nav>

            <div className="border-t border-border p-3">
              <Link
                href="/"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-md px-3 py-2.5 font-label text-sm text-muted transition-colors hover:bg-surface-sunken hover:text-text"
              >
                <Star aria-hidden="true" className="size-4" />
                View website
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
