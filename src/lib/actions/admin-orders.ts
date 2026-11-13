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
  revalidatePublic,
} from "@/lib/actions/admin-helpers";
import { adminError, type AdminActionState } from "@/lib/actions/admin-state";
import {
  digitalOrderPaymentSchema,
  serviceOrderSchema,
} from "@/lib/validations/admin";
import {
  getPaymentProviderForOrder,
  sendPaymentConfirmationEmail,
} from "@/lib/payments";

/**
 * Order management.
 *
 * Service orders move through a status pipeline; every transition is written
 * to order_status_history by a database trigger, so the audit trail cannot be
 * skipped. Digital orders are paid by hand — the confirmation runs through the
 * confirm_digital_order_payment RPC, which is admin-gated server-side.
 */

function text(formData: FormData, name: string): string | undefined {
  const value = formData.get(name);
  if (value === null) return undefined;
  if (typeof value !== "string") return undefined;
  return value;
}

/* ------------------------------------------------------------------ */
/* Service orders                                                      */
/* ------------------------------------------------------------------ */

export async function updateServiceOrder(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const session = await adminSession();
  if (!session) return notAuthorised();

  const parsed = serviceOrderSchema.safeParse({
    id: text(formData, "id"),
    order_status: text(formData, "order_status"),
    payment_status: text(formData, "payment_status"),
    quoted_price: text(formData, "quoted_price"),
    package_id: text(formData, "package_id"),
    deadline: text(formData, "deadline"),
    admin_notes: text(formData, "admin_notes"),
  });

  if (!parsed.success) {
    return invalid("Please check the highlighted fields.", fieldErrors(parsed.error));
  }

  const input = parsed.data;
  const supabase = await adminDb();

  const { data: existing, error: readError } = await supabase
    .from("service_orders")
    .select("id, order_number, order_status, customer_name, customer_email, service_id")
    .eq("id", input.id)
    .maybeSingle();

  if (readError) return adminError(readError.message);
  if (!existing) return adminError("That order no longer exists.");

  const { error } = await supabase
    .from("service_orders")
    .update({
      order_status: input.order_status,
      payment_status: input.payment_status,
      quoted_price: input.quoted_price,
      package_id: input.package_id,
      deadline: input.deadline,
      admin_notes: input.admin_notes,
    })
    .eq("id", input.id);

  if (error) return adminError(error.message);

  const statusChanged = existing.order_status !== input.order_status;

  // A status change is news for the customer — they get an email. The order
  // is already saved, so a mail failure changes nothing.
  let email: { sent: boolean; reason?: string } | null = null;

  if (statusChanged) {
    try {
      const { sendOrderStatusUpdate } = await import("@/lib/email/send");
      const { data: service } = await supabase
        .from("services")
        .select("title")
        .eq("id", existing.service_id)
        .maybeSingle();

      email = await sendOrderStatusUpdate({
        orderNumber: existing.order_number,
        customerName: existing.customer_name,
        customerEmail: existing.customer_email,
        serviceTitle: service?.title ?? "project",
        oldStatus: existing.order_status,
        newStatus: input.order_status,
        note: input.admin_notes || null,
      });
    } catch (emailError) {
      console.error("[admin] status email failed:", emailError);
      email = { sent: false, reason: "unexpected error" };
    }
  }

  await logActivity(
    supabase,
    statusChanged ? "status_change" : "update",
    "service_order",
    input.id,
    {
      order_number: existing.order_number,
      from: existing.order_status,
      to: input.order_status,
      ...(email ? { emailSent: email.sent } : {}),
    },
  );

  revalidateAdmin("/admin/service-orders", `/admin/service-orders/${input.id}`);
  revalidatePublic();

  redirect(`/admin/service-orders/${input.id}`);
}

/* ------------------------------------------------------------------ */
/* Digital orders                                                      */
/* ------------------------------------------------------------------ */

export async function updateDigitalOrderPayment(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const session = await adminSession();
  if (!session) return notAuthorised();

  const parsed = digitalOrderPaymentSchema.safeParse({
    id: text(formData, "id"),
    payment_status: text(formData, "payment_status"),
    transaction_reference: text(formData, "transaction_reference"),
  });

  if (!parsed.success) {
    return invalid("Please check the highlighted fields.", fieldErrors(parsed.error));
  }

  const input = parsed.data;
  const supabase = await adminDb();

  const { data: order, error: readError } = await supabase
    .from("digital_orders")
    .select("id, order_number, payment_status, customer_name, customer_email, total_amount, payment_provider")
    .eq("id", input.id)
    .maybeSingle();

  if (readError) return adminError(readError.message);
  if (!order) return adminError("That order no longer exists.");

  if (input.payment_status === "PAID") {
    // The provider says the payment is good — for the manual provider that
    // means the studio checked the transfer. The RPC is the only path that
    // marks an order paid, and it checks the role again on the database side.
    const provider = getPaymentProviderForOrder(order.payment_provider);
    const verification = provider.confirmByHand({
      orderNumber: order.order_number,
      reference: input.transaction_reference ?? null,
    });

    const { data, error } = await supabase.rpc("confirm_digital_order_payment", {
      p_order_number: verification.orderNumber,
      p_transaction_reference: verification.reference ?? undefined,
    });

    if (error) return adminError(error.message);
    if (!data) return adminError("The order could not be confirmed as paid.");
  } else {
    const { error } = await supabase
      .from("digital_orders")
      .update({
        payment_status: input.payment_status,
        transaction_reference: input.transaction_reference,
      })
      .eq("id", input.id);

    if (error) return adminError(error.message);
  }

  // The buyer's downloads unlock with the payment, so they are told. The
  // order is already saved - a mail failure changes nothing.
  let email: { sent: boolean; reason?: string } | null = null;

  if (input.payment_status === "PAID" && order.payment_status !== "PAID") {
    email = await sendPaymentConfirmationEmail(supabase, {
      id: order.id,
      orderNumber: order.order_number,
      customerName: order.customer_name,
      customerEmail: order.customer_email,
      total: Number(order.total_amount),
      reference: input.transaction_reference ?? null,
    });
  }

  await logActivity(
    supabase,
    "payment_update",
    "digital_order",
    input.id,
    {
      order_number: order.order_number,
      from: order.payment_status,
      to: input.payment_status,
      ...(email ? { emailSent: email.sent } : {}),
    },
  );

  revalidateAdmin("/admin/digital-orders", `/admin/digital-orders/${input.id}`);
  revalidatePublic();

  redirect(`/admin/digital-orders/${input.id}`);
}
