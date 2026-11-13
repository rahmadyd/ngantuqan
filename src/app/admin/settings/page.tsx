import type { Metadata } from "next";
import Link from "next/link";
import { AdminPage } from "@/components/admin/admin-page";
import { EntityForm } from "@/components/admin/entity-form";
import {
  normaliseFieldTranslations,
  type FieldConfig,
} from "@/components/admin/field-config";
import { saveStudioSettings } from "@/lib/actions/admin-content";
import { requireAdmin } from "@/lib/supabase/guards";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Settings | Admin",
  robots: { index: false, follow: false },
};

export default async function AdminSettingsPage() {
  await requireAdmin();
  const supabase = await createClient();

  const [{ data: settings }, { data: profile }] = await Promise.all([
    supabase
      .from("site_settings")
      .select("setting_key, setting_value, is_public, updated_at")
      .order("setting_key", { ascending: true }),
    supabase
      .from("profiles")
      .select("email, full_name, role")
      .eq("id", (await supabase.auth.getClaims()).data?.claims?.sub ?? "")
      .maybeSingle(),
  ]);

  const studio = (
    settings?.find((row) => row.setting_key === "studio")?.setting_value ?? {}
  ) as Record<string, unknown>;

  const translations = normaliseFieldTranslations(studio.translations);

  const fields: FieldConfig[] = [
    {
      name: "name",
      label: "Studio name",
      type: "text",
      required: true,
      value: String(studio.name ?? ""),
    },
    {
      name: "tagline",
      label: "Tagline",
      type: "text",
      required: true,
      value: String(studio.tagline ?? ""),
      translatable: true,
      translations,
    },
    {
      name: "email",
      label: "Contact email",
      type: "text",
      required: true,
      help: "Shown in the footer and used as the reply-to address.",
      value: String(studio.email ?? ""),
    },
    {
      name: "logoUrl",
      label: "Logo path",
      type: "text",
      help: "Leave empty to use the typographic wordmark.",
      value: String(studio.logoUrl ?? ""),
    },
    {
      name: "footerNote",
      label: "Footer note",
      type: "textarea",
      rows: 3,
      value: String(studio.footerNote ?? ""),
      translatable: true,
      translations,
    },
  ];

  return (
    <AdminPage
      title="Settings"
      description="Studio identity, contact details, and the account you are signed in with."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-border bg-surface p-6 shadow-sm">
          <h2 className="font-display text-lg font-semibold">Studio identity</h2>
          <p className="mt-1 mb-5 text-xs text-muted-foreground">
            These values appear in the header, the footer, and the metadata of
            every page.
          </p>
          <EntityForm
            action={saveStudioSettings}
            fields={fields}
            submitLabel="Save settings"
            cancelHref="/admin/settings"
          />
        </section>

        <section className="rounded-lg border border-border bg-surface p-6 shadow-sm">
          <h2 className="font-display text-lg font-semibold">Your account</h2>
          <dl className="mt-5 space-y-4">
            <div>
              <dt className="eyebrow">Name</dt>
              <dd className="mt-1 font-label text-sm text-text">
                {profile?.full_name ?? "–"}
              </dd>
            </div>
            <div>
              <dt className="eyebrow">Email</dt>
              <dd className="mt-1 font-label text-sm text-text">
                {profile?.email ?? "–"}
              </dd>
            </div>
            <div>
              <dt className="eyebrow">Role</dt>
              <dd className="mt-1 font-label text-sm text-text">
                {profile?.role ?? "–"}
              </dd>
            </div>
          </dl>
        </section>
      </div>

      <section className="rounded-lg border border-border bg-surface shadow-sm">
        <h2 className="border-b border-border px-6 py-4 font-display text-lg font-semibold">
          All settings
        </h2>
        <ul className="divide-y divide-border">
          {(settings ?? []).map((row) => (
            <li
              key={row.setting_key}
              className="flex flex-wrap items-center justify-between gap-3 px-6 py-3"
            >
              <code className="rounded-sm bg-surface-sunken px-1.5 py-0.5 font-label text-xs">
                {row.setting_key}
              </code>
              <span className="font-label text-xs text-muted-foreground">
                {row.is_public ? "Public" : "Admin only"} · updated{" "}
                {formatDate(row.updated_at)}
              </span>
            </li>
          ))}
        </ul>
        <p className="px-6 py-4 text-xs text-muted-foreground">
          Copy blocks are edited in{" "}
          <Link
            href="/admin/content"
            className="text-primary underline-offset-4 hover:underline"
          >
            Website Content
          </Link>
          .
        </p>
      </section>
    </AdminPage>
  );
}
