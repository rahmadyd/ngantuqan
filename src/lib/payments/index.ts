import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database.types";
import { ManualProvider } from "./manual";
import { StripeProvider } from "./stripe";
import type {
  PaymentIntent,
  PaymentInstructions,
  PaymentOrder,
  PaymentProvider,
  PaymentSession,
  PaymentVerification,
} from "./types";

/**
 * The payment provider registry (spec §8, conflict C7).
 *
 * `PAYMENT_PROVIDER` picks the provider the checkout uses. The registry holds
 * the studio confirming a bank transfer by hand, and Stripe when its keys are
 * configured. Adding another provider means adding one file here, not
 * touching the checkout, the order page, or the download gate.
 *
 * The types live in `./types` and are imported from there directly, so a
 * client component can use them without pulling this server-only module in.
 */

/**
 * The providers, read fresh.
 *
 * Stripe is only offered when its key is set, so the site works without a
 * Stripe account — the manual provider is always there.
 */
function registry(): Record<string, PaymentProvider> {
  const manual = new ManualProvider();
  const providers: Record<string, PaymentProvider> = { [manual.id]: manual };

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const stripeWebhook = process.env.STRIPE_WEBHOOK_SECRET;

  // Stripe is offered as soon as either key is set: the webhook secret is
  // enough to receive a callback, the secret key is what takes a payment.
  if (stripeKey || stripeWebhook) {
    const stripe = new StripeProvider(stripeKey ?? "", stripeWebhook ?? "");
    providers[stripe.id] = stripe;
  }

  return providers;
}

/** The provider the application is configured to use. */
export function getPaymentProvider(id?: string | null): PaymentProvider {
  const providers = registry();

  const key = (id ?? process.env.PAYMENT_PROVIDER ?? "manual")
    .trim()
    .toLowerCase();

  const provider = providers[key];

  if (!provider) {
    throw new Error(
      `Unknown payment provider "${key}". Known providers: ${Object.keys(providers).join(", ")}.`,
    );
  }

  return provider;
}

/** Every provider the application knows about. */
export function listPaymentProviders(): PaymentProvider[] {
  return Object.values(registry());
}

export function isKnownPaymentProvider(id: string | null | undefined): boolean {
  if (!id) return false;
  return Boolean(registry()[id.trim().toLowerCase()]);
}

/**
 * The provider that handled an order.
 *
 * An order can name a provider that is no longer configured — the studio may
 * have switched — so an unknown name falls back to the configured provider
 * rather than breaking the order page.
 */
export function getPaymentProviderForOrder(
  id: string | null | undefined,
): PaymentProvider {
  if (isKnownPaymentProvider(id)) return getPaymentProvider(id);

  if (id) {
    console.error(`[payments] the order names an unknown provider: ${id}`);
  }

  return getPaymentProvider();
}

/** Prepares the payment for an order that was just created. */
export async function preparePayment(
  intent: PaymentIntent,
  providerId?: string | null,
): Promise<PaymentSession> {
  return getPaymentProvider(providerId).prepare(intent);
}

/** What the customer is told to do next. */
export async function paymentInstructions(
  order: PaymentOrder,
  providerId?: string | null,
): Promise<PaymentInstructions> {
  return getPaymentProviderForOrder(providerId).instructions(order);
}

/**
 * A fresh address to pay at, for an order that was never paid.
 *
 * The customer comes back from the provider's page having closed the tab;
 * this gives them another way in.
 */
export async function createPaymentLink(
  orderNumber: string,
  email: string,
  providerId?: string | null,
): Promise<string | null> {
  const provider = getPaymentProviderForOrder(providerId);

  if (!provider.paymentLink) return null;

  const admin = createAdminClient();

  const { data: order } = await admin
    .from("digital_orders")
    .select("order_number, customer_name, customer_email, total_amount, transaction_reference")
    .eq("order_number", orderNumber)
    .ilike("customer_email", email)
    .maybeSingle();

  if (!order) return null;

  return provider.paymentLink({
    orderNumber: order.order_number,
    amount: Number(order.total_amount),
    currency: "IDR",
    customerName: order.customer_name,
    customerEmail: order.customer_email,
    reference: order.transaction_reference,
  });
}

export interface PaymentApplication {
  ok: boolean;
  message: string;
}

/**
 * Marks an order paid from a verified provider callback.
 *
 * The callback has already been verified by the provider — that is what
 * `verifyCallback` is for — so this is the only place a callback is allowed
 * to change the order. The write goes through a function that the service
 * role alone can call, and it writes its own audit row.
 */
export async function applyProviderVerification(
  verification: PaymentVerification,
): Promise<PaymentApplication> {
  const admin = createAdminClient();

  const { data, error } = await admin.rpc(
    "confirm_digital_order_payment_from_provider",
    {
      p_order_number: verification.orderNumber,
      p_transaction_reference: verification.reference ?? undefined,
      p_provider: verification.provider,
    },
  );

  if (error) {
    return { ok: false, message: error.message };
  }

  if (!data) {
    return {
      ok: false,
      message: "That order could not be confirmed as paid.",
    };
  }

  const { data: order } = await admin
    .from("digital_orders")
    .select("id, order_number, customer_name, customer_email, total_amount")
    .eq("order_number", verification.orderNumber)
    .maybeSingle();

  if (order) {
    await sendPaymentConfirmationEmail(admin, {
      id: order.id,
      orderNumber: order.order_number,
      customerName: order.customer_name,
      customerEmail: order.customer_email,
      total: Number(order.total_amount),
      reference: verification.reference,
    });
  }

  return { ok: true, message: "" };
}

/**
 * Tells the buyer their files are ready.
 *
 * The payment has already gone through, so a mail failure changes nothing —
 * the buyer can always come back with the order number and their email.
 */
export async function sendPaymentConfirmationEmail(
  client: SupabaseClient<Database>,
  order: {
    id: string;
    orderNumber: string;
    customerName: string;
    customerEmail: string;
    total: number;
    reference: string | null;
  },
): Promise<{ sent: boolean; reason?: string }> {
  try {
    const { sendPaymentConfirmation } = await import("@/lib/email/send");

    const { data: items } = await client
      .from("digital_order_items")
      .select("product_title, quantity, unit_price")
      .eq("digital_order_id", order.id);

    return await sendPaymentConfirmation({
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      total: order.total,
      transactionReference: order.reference,
      items: (items ?? []).map((item) => ({
        title: item.product_title,
        quantity: item.quantity,
        unitPrice: Number(item.unit_price),
      })),
    });
  } catch (error) {
    console.error("[payments] the confirmation email failed:", error);
    return { sent: false, reason: "unexpected error" };
  }
}
