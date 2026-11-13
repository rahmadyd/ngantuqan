"use server";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { inquirySchema, type InquiryInput } from "@/lib/validations/contact";
import type { ActionState } from "@/lib/actions/inquiry-state";
import { checkRateLimit, rateLimitMessage } from "@/lib/rate-limit";
import { getDictionary } from "@/lib/i18n/server";

/** Generates a human-readable inquiry reference, e.g. INQ-2601-A7F3. */
function generateReference() {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const rand = Math.random().toString(16).slice(2, 6).toUpperCase();
  return `INQ-${yy}${mm}-${rand}`;
}

/**
 * Persists a contact inquiry and notifies the studio.
 *
 * The database write always happens first. If email is not configured or the
 * provider fails, the submission is still stored and the response says so —
 * a submission is never discarded because a mail server was unavailable.
 * (master_design.md §9)
 */
export async function submitInquiry(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const t = await getDictionary();

  // Throttling comes first: a bot that floods the form is stopped before it
  // can make the studio read anything.
  const limit = await checkRateLimit("contact");

  if (!limit.allowed) {
    return {
      status: "error",
      message: rateLimitMessage("contact", limit, t),
      fieldErrors: {},
    };
  }

  const parsed = inquirySchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    company: formData.get("company") ?? "",
    inquiryType: formData.get("inquiryType"),
    subject: formData.get("subject"),
    message: formData.get("message"),
  });

  if (!parsed.success) {
    const fieldErrors: ActionState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof InquiryInput;
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }

    return {
      status: "error",
      message: t.actions.checkFieldsRetry,
      fieldErrors,
    };
  }

  const input = parsed.data;
  const reference = generateReference();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    // No database configured — the form cannot persist anything, so say so
    // plainly rather than pretending the inquiry was received.
    return {
      status: "error",
      message: t.actions.contactNoDatabase,
      fieldErrors: {},
    };
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // A cookie write failure must not block the inquiry from being stored.
        }
      },
    },
  });

  const { error } = await supabase.from("inquiries").insert({
    name: input.name,
    email: input.email,
    company: input.company || null,
    inquiry_type: input.inquiryType,
    subject: input.subject,
    message: input.message,
    status: "NEW",
    is_read: false,
  });

  if (error) {
    console.error("[contact] failed to store inquiry:", error.message);
    return {
      status: "error",
      message: t.actions.contactSaveFailed,
      fieldErrors: {},
    };
  }

  // Notification is a side effect — a failure here must not undo the save.
  let emailSent = false;
  try {
    const { sendInquiryNotification } = await import("@/lib/email/send");
    const result = await sendInquiryNotification(input, reference);
    emailSent = result.sent;
  } catch (error) {
    console.error("[contact] email notification failed:", error);
  }

  return {
    status: "success",
    message: emailSent
      ? t.actions.contactReceived
      : t.actions.contactSavedNoEmail,
    fieldErrors: {},
    reference,
  };
}
