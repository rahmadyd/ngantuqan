import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EditorShell } from "@/components/admin/editor-shell";
import { EntityForm } from "@/components/admin/entity-form";
import type { FieldConfig } from "@/components/admin/field-config";
import { StatusPill } from "@/components/admin/status-pill";
import { replyToInquiry, updateInquiry } from "@/lib/actions/admin-inquiries";
import { requireAdmin } from "@/lib/supabase/guards";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import { INQUIRY_STATUSES } from "@/lib/validations/admin";

type Params = Promise<{ id: string }>;

export async function generateMetadata(): Promise<Metadata> {
    return { title: "Inquiry | Admin", robots: { index: false, follow: false } };
}

export default async function AdminInquiryPage({ params }: { params: Params }) {
  const { id } = await params;
  await requireAdmin();

  const supabase = await createClient();

  const { data: inquiry } = await supabase
    .from("inquiries")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!inquiry) notFound();

  const statusFields: FieldConfig[] = [
    {
      name: "status",
      label: "Status",
      type: "select",
      required: true,
      options: INQUIRY_STATUSES.map((status) => ({
        value: status,
        label: status.replace(/_/g, " ").toLowerCase(),
      })),
      value: inquiry.status,
    },
    {
      name: "is_read",
      label: "Read",
      type: "checkbox",
      help: "Unread inquiries are flagged in the sidebar.",
      value: inquiry.is_read,
    },
  ];

  const replyFields: FieldConfig[] = [
    {
      name: "reply",
      label: "Reply",
      type: "textarea",
      rows: 6,
      required: true,
      help: "Sent to the customer from the studio address.",
      value: "",
    },
  ];

  return (
    <EditorShell
      title={inquiry.subject}
      description={`From ${inquiry.name} on ${formatDate(inquiry.created_at)}.`}
      backHref="/admin/inquiries"
      backLabel="Back to inquiries"
    >
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-3">
          <section className="rounded-lg border border-border bg-surface-sunken p-5">
            <div className="flex flex-wrap items-center gap-3">
              <StatusPill value={inquiry.status} />
              {!inquiry.is_read ? (
                <StatusPill value="UNREAD" tone="primary" />
              ) : null}
            </div>

            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="eyebrow">Name</dt>
                <dd className="mt-0.5">{inquiry.name}</dd>
              </div>
              <div>
                <dt className="eyebrow">Email</dt>
                <dd className="mt-0.5">
                  <a
                    href={`mailto:${inquiry.email}`}
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    {inquiry.email}
                  </a>
                </dd>
              </div>
              {inquiry.company ? (
                <div>
                  <dt className="eyebrow">Company</dt>
                  <dd className="mt-0.5">{inquiry.company}</dd>
                </div>
              ) : null}
            </dl>

            <div className="mt-4 border-t border-border pt-4">
              <p className="eyebrow">Message</p>
              <p className="mt-1.5 text-sm whitespace-pre-wrap text-text">
                {inquiry.message}
              </p>
            </div>
          </section>

          <section className="rounded-lg border border-border bg-surface p-5">
            <h2 className="font-display text-base font-semibold">Reply</h2>
            <p className="mt-1 mb-4 text-xs text-muted-foreground">
              If email is not configured the reply is not sent, and the page
              says so rather than pretending it was.
            </p>
            <EntityForm
              action={replyToInquiry}
              fields={replyFields}
              submitLabel="Send reply"
              hidden={{ id: inquiry.id }}
              cancelHref={`/admin/inquiries/${inquiry.id}`}
            />
          </section>
        </div>

        <aside className="lg:col-span-2">
          <section className="rounded-lg border border-border bg-surface p-5">
            <h2 className="font-display text-base font-semibold">Triage</h2>
            <div className="mt-4">
              <EntityForm
                action={updateInquiry}
                fields={statusFields}
                submitLabel="Update inquiry"
                hidden={{ id: inquiry.id }}
                cancelHref="/admin/inquiries"
              />
            </div>
          </section>
        </aside>
      </div>
    </EditorShell>
  );
}
