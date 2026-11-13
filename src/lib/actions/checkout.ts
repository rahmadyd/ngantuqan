"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import {
  type CheckoutState,
  type DownloadState,
} from "@/lib/actions/checkout-state";
import {
  cartSchema,
  checkoutSchema,
  downloadRequestSchema,
  orderAccessSchema,
} from "@/lib/validations/checkout";
import {
  createOrderAccessToken,
  verifyOrderAccessToken,
} from "@/lib/orders/access";
import { checkRateLimit, rateLimitMessage } from "@/lib/rate-limit";
import {
  createPaymentLink,
  getPaymentProvider,
  preparePayment,
} from "@/lib/payments";
import type { HostedPaymentState } from "@/lib/actions/checkout-state";
import { DEFAULT_CURRENCY } from "@/lib/utils";
import { getDictionary } from "@/lib/i18n/server";

/**
 * Guest checkout (conflict C3, option c).
 *
 * There is no customer account, so the order number and the email address are
 * the security boundary. The customer proves the pair once; the server
 * checks it in the database and issues a short-lived signed token so the
 * order page can render server-side.
 *
 * Prices never come from the client. `record_purchase` reads them from the
 * products table and refuses anything that is not published.
 */

const SIGNED_URL_TTL_SECONDS = 120;

function text(formData: FormData, name: string): string | undefined {
  const value = formData.get(name);
  if (value === null) return undefined;
  if (typeof value !== "string") return undefined;
  return value;
}

function fieldErrorsFrom(issues: { path: PropertyKey[]; message: string }[]) {
  const errors: Record<string, string> = {};
  for (const issue of issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !errors[key]) errors[key] = issue.message;
  }
  return errors;
}

/* ------------------------------------------------------------------ */
/* Place the order                                                     */
/* ------------------------------------------------------------------ */

export async function submitCheckout(
  _prev: CheckoutState,
  formData: FormData,
): Promise<CheckoutState> {
  const t = await getDictionary();

  if (!isSupabaseConfigured) {
    return {
      status: "error",
      message: t.actions.checkoutNoDatabase,
      fieldErrors: {},
    };
  }

  const limit = await checkRateLimit("checkout");

  if (!limit.allowed) {
    return {
      status: "error",
      message: rateLimitMessage("checkout", limit, t),
      fieldErrors: {},
    };
  }

  const parsed = checkoutSchema.safeParse({
    customer_name: text(formData, "customer_name"),
    customer_email: text(formData, "customer_email"),
    cart: text(formData, "cart"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: t.actions.checkFields,
      fieldErrors: fieldErrorsFrom(parsed.error.issues),
    };
  }

  const input = parsed.data;

  let cart: unknown;
  try {
    cart = JSON.parse(input.cart);
  } catch {
    return {
      status: "error",
      message: t.actions.cartUnreadable,
      fieldErrors: {},
    };
  }

  const items = cartSchema.safeParse(cart);
  if (!items.success) {
    return {
      status: "error",
      message: items.error.issues[0]?.message ?? t.actions.cartUnreadable,
      fieldErrors: {},
    };
  }

  const supabase = await createClient();
  const provider = getPaymentProvider();

  const { data, error } = await supabase.rpc("record_purchase", {
    p_customer_name: input.customer_name,
    p_customer_email: input.customer_email,
    p_items: items.data.map((item) => ({
      product_id: item.product_id,
      quantity: item.quantity,
    })),
    p_payment_provider: provider.id,
  });

  const orderNumber = data?.[0]?.order_number;
  const total = Number(data?.[0]?.total ?? 0);

  if (error || !orderNumber) {
    console.error("[checkout] failed to record purchase:", error?.message);
    return {
      status: "error",
      message: t.actions.orderNotPlaced,
      fieldErrors: {},
    };
  }

  // The studio is told, and the customer is told their files are waiting.
  try {
    const { sendDigitalOrderNotification } = await import("@/lib/email/send");

    const { data: products } = await supabase
      .from("products")
      .select("id, title, price, discount_price")
      .in(
        "id",
        items.data.map((item) => item.product_id),
      );

    const lines = items.data.map((item) => {
      const product = (products ?? []).find(
        (entry) => entry.id === item.product_id,
      );
      const unitPrice = Number(
        product?.discount_price ?? product?.price ?? 0,
      );

      return {
        title: product?.title ?? "Digital product",
        quantity: item.quantity,
        unitPrice,
      };
    });

    await sendDigitalOrderNotification({
      orderNumber,
      customerName: input.customer_name,
      customerEmail: input.customer_email,
      items: lines,
      total,
    });
  } catch (emailError) {
    console.error("[checkout] notification failed:", emailError);
  }

  const token = createOrderAccessToken(orderNumber, input.customer_email);

  // The provider prepares the payment. A hosted provider sends the customer
  // to its own page; the manual provider has nowhere to send them, and the
  // order page carries the studio's payment instructions instead.
  let checkoutUrl: string | null = null;

  try {
    const session = await preparePayment(
      {
        orderNumber,
        amount: total,
        currency: DEFAULT_CURRENCY,
        customerName: input.customer_name,
        customerEmail: input.customer_email,
      },
      provider.id,
    );

    checkoutUrl = session.checkoutUrl;
  } catch (paymentError) {
    // The order exists, so the customer can still pay it by hand. A provider
    // that fails here is logged rather than swallowed.
    console.error("[checkout] the payment could not be prepared:", paymentError);
  }

  // The redirect is outside the try: it throws a Next.js control error that
  // must not be caught.
  if (checkoutUrl) {
    redirect(checkoutUrl);
  }

  redirect(
    `/order-confirmation/${encodeURIComponent(orderNumber)}?token=${encodeURIComponent(token)}`,
  );
}

/* ------------------------------------------------------------------ */
/* Pay again                                                           */
/* ------------------------------------------------------------------ */

/**
 * Gives the customer another way to pay an order that was never paid.
 *
 * The customer comes back from the provider's page having closed the tab;
 * this creates a fresh checkout address for them.
 */
export async function startHostedPayment(
  _prev: HostedPaymentState,
  formData: FormData,
): Promise<HostedPaymentState> {
  const t = await getDictionary();
  const orderNumber = text(formData, "order_number");
  const email = text(formData, "email");
  const provider = text(formData, "provider");

  if (!orderNumber || !email) {
    return {
      status: "error",
      message: t.actions.orderNotFound,
    };
  }

  const url = await createPaymentLink(orderNumber, email, provider);

  if (!url) {
    return {
      status: "error",
      message: t.actions.orderCannotBePaid,
    };
  }

  return { status: "idle", message: "", url };
}

/* ------------------------------------------------------------------ */
/* Come back to an order                                               */
/* ------------------------------------------------------------------ */

export async function verifyOrderAccess(
  _prev: CheckoutState,
  formData: FormData,
): Promise<CheckoutState> {
  const t = await getDictionary();

  // The order number is guessable, so the lookup is throttled before it
  // reaches the database.
  const limit = await checkRateLimit("order-lookup");

  if (!limit.allowed) {
    return {
      status: "error",
      message: rateLimitMessage("order-lookup", limit, t),
      fieldErrors: {},
    };
  }

  const parsed = orderAccessSchema.safeParse({
    order_number: text(formData, "order_number"),
    email: text(formData, "email"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: t.actions.checkFields,
      fieldErrors: fieldErrorsFrom(parsed.error.issues),
    };
  }

  const input = parsed.data;
  const admin = createAdminClient();
  // The pair is checked in the database, not in the browser.
  const { data: order } = await admin
    .from("digital_orders")
    .select("id, order_number, customer_email")
    .eq("order_number", input.order_number)
    .ilike("customer_email", input.email)
    .maybeSingle();

  if (!order) {
    return {
      status: "error",
      message: t.actions.orderPairNotFound,
      fieldErrors: {},
    };
  }

  const token = createOrderAccessToken(order.order_number, input.email);

  redirect(
    `/order-confirmation/${encodeURIComponent(order.order_number)}?token=${encodeURIComponent(token)}`,
  );
}

/* ------------------------------------------------------------------ */
/* Download a purchased file                                           */
/* ------------------------------------------------------------------ */

export async function requestDownload(
  _prev: DownloadState,
  formData: FormData,
): Promise<DownloadState> {
  const t = await getDictionary();

  // Every request counts — minting a signed URL is the thing worth limiting.
  const limit = await checkRateLimit("download");

  if (!limit.allowed) {
    return {
      status: "error",
      message: rateLimitMessage("download", limit, t),
      files: [],
    };
  }

  const parsed = downloadRequestSchema.safeParse({
    order_number: text(formData, "order_number"),
    email: text(formData, "email"),
    token: text(formData, "token"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: t.actions.requestUnreadable,
      files: [],
    };
  }

  const input = parsed.data;

  // The token says the order number and the email were checked once. It is
  // re-checked here — against the same pair the database is about to verify.
  const payload = verifyOrderAccessToken(input.token, input.order_number);

  if (!payload || payload.email.toLowerCase() !== input.email.toLowerCase()) {
    return {
      status: "error",
      message: t.actions.accessExpired,
      files: [],
    };
  }

  const admin = createAdminClient();

  // The function checks the order number and the email again, refuses an
  // unpaid order, counts the download, and returns the file paths.
  const { data, error } = await admin.rpc("record_order_download", {
    p_order_number: input.order_number,
    p_email: input.email,
  });

  if (error) {
    return {
      status: "error",
      message: error.message.includes("Payment not confirmed")
        ? t.actions.notPaid
        : t.actions.downloadUnavailable,
      files: [],
    };
  }

  const files = (data ?? []) as { storage_path: string; file_name: string }[];

  const signed = await Promise.all(
    files.map(async (file) => {
      const { data: url } = await admin.storage
        .from("private-products")
        .createSignedUrl(file.storage_path, SIGNED_URL_TTL_SECONDS);

      return {
        fileName: file.file_name,
        url: url?.signedUrl ?? "",
      };
    }),
  );

  return {
    status: "success",
    message: "",
    files: signed.filter((file) => Boolean(file.url)),
  };
}
