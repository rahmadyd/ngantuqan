"use server";

import { redirect } from "next/navigation";
import {
  adminDb,
  adminSession,
  fieldErrors,
  invalid,
  logActivity,
  notAuthorised,
  revalidateAdmin,
} from "@/lib/actions/admin-helpers";
import { adminError, type AdminActionState } from "@/lib/actions/admin-state";
import { inquiryReplySchema, inquiryUpdateSchema } from "@/lib/validations/admin";

/**
 * Inquiry workflow: read/unread, triage status, reply, and spam removal.
 *
 * A reply that fails to send never loses the inquiry — the status change is
 * still applied and the failure is reported back to the administrator.
 */

function text(formData: FormData, name: string): string | undefined {
  const value = formData.get(name);
  if (value === null) return undefined;
  if (typeof value !== "string") return undefined;
  return value;
}

export async function updateInquiry(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const session = await adminSession();
  if (!session) return notAuthorised();

  const parsed = inquiryUpdateSchema.safeParse({
    id: text(formData, "id"),
    status: text(formData, "status"),
    is_read: text(formData, "is_read"),
  });

  if (!parsed.success) {
    return invalid("Please check the highlighted fields.", fieldErrors(parsed.error));
  }

  const input = parsed.data;
  const supabase = await adminDb();

  const { data, error } = await supabase
    .from("inquiries")
    .update({ status: input.status, is_read: input.is_read })
    .eq("id", input.id)
    .select("id, subject")
    .maybeSingle();

  if (error) return adminError(error.message);
  if (!data) return adminError("That inquiry no longer exists.");

  await logActivity(supabase, "update", "inquiry", input.id, {
    subject: data.subject,
    status: input.status,
  });

  revalidateAdmin("/admin/inquiries", `/admin/inquiries/${input.id}`);

  redirect(`/admin/inquiries/${input.id}`);
}

export async function replyToInquiry(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const session = await adminSession();
  if (!session) return notAuthorised();

  const parsed = inquiryReplySchema.safeParse({
    id: text(formData, "id"),
    reply: text(formData, "reply"),
  });

  if (!parsed.success) {
    return invalid("Please check the highlighted fields.", fieldErrors(parsed.error));
  }

  const input = parsed.data;
  const supabase = await adminDb();

  const { data: inquiry, error: readError } = await supabase
    .from("inquiries")
    .select("id, name, email, subject")
    .eq("id", input.id)
    .maybeSingle();

  if (readError) return adminError(readError.message);
  if (!inquiry) return adminError("That inquiry no longer exists.");

  const { sendInquiryReply } = await import("@/lib/email/send");
  const result = await sendInquiryReply({
    to: inquiry.email,
    name: inquiry.name,
    subject: inquiry.subject,
    reply: input.reply,
  });

  // The status moves on regardless of the mail result — the reply text is
  // kept by the mail provider, and the administrator is told what happened.
  await supabase
    .from("inquiries")
    .update({ status: "IN_PROGRESS", is_read: true })
    .eq("id", input.id);

  await logActivity(supabase, "reply", "inquiry", input.id, {
    subject: inquiry.subject,
    sent: result.sent,
  });

  revalidateAdmin("/admin/inquiries", `/admin/inquiries/${input.id}`);

  if (!result.sent) {
    return {
      status: "error",
      message: `The inquiry was updated, but the email was not sent (${
        result.reason ?? "mail provider unavailable"
      }). Copy your reply into an email client.`,
      fieldErrors: {},
    };
  }

  redirect(`/admin/inquiries/${input.id}`);
}

export async function deleteInquiry(id: string): Promise<{ ok: boolean; message: string }> {
  const session = await adminSession();
  if (!session) return { ok: false, message: "Not authorised." };

  const supabase = await adminDb();
  const { data, error } = await supabase
    .from("inquiries")
    .delete()
    .eq("id", id)
    .select("id, subject")
    .maybeSingle();

  if (error) return { ok: false, message: error.message };
  if (!data) return { ok: false, message: "That inquiry no longer exists." };

  await logActivity(supabase, "delete", "inquiry", id, { subject: data.subject });

  revalidateAdmin("/admin/inquiries");

  return { ok: true, message: "Inquiry deleted." };
}
