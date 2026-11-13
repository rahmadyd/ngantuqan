import { createHmac, timingSafeEqual } from "node:crypto";
import type {
  PaymentCallback,
  PaymentInstructions,
  PaymentIntent,
  PaymentOrder,
  PaymentProvider,
  PaymentSession,
  PaymentVerification,
} from "./types";

/**
 * Stripe.
 *
 * The customer pays on Stripe's own checkout page; Stripe tells us the money
 * arrived through a signed callback. Two rules shape this file:
 *
 *   1. The Stripe API is called with `fetch` and the form encoding Stripe
 *      documents, rather than through the Stripe library. The library's
 *      worker build leaves out the webhook helpers (they need Node's crypto),
 *      and the library would add about 200 KB to the Worker for two calls.
 *   2. The callback is only believed when its signature checks out. Nothing
 *      in the request body is trusted before that.
 */

const API = "https://api.stripe.com/v1";

/** A captured callback must not be replayable. */
const SIGNATURE_TOLERANCE_SECONDS = 300;

/** Currencies Stripe counts in whole units — no minor unit to divide by. */
const ZERO_DECIMAL_CURRENCIES = new Set([
  "bif",
  "clp",
  "djf",
  "gnf",
  "jpy",
  "kmf",
  "krw",
  "mga",
  "pyg",
  "rwf",
  "ugx",
  "vnd",
  "vuv",
  "xaf",
  "xof",
  "xpf",
]);

interface StripeSession {
  id: string;
  url: string | null;
  payment_status: string;
  payment_intent: string | null;
  client_reference_id?: string | null;
  metadata?: Record<string, string> | null;
}

interface StripeEvent {
  type: string;
  data: { object: StripeSession };
}

export class StripeProvider implements PaymentProvider {
  readonly id = "stripe";
  readonly label = "Card payment via Stripe";

  /** The customer is sent to Stripe's page to pay. */
  readonly hostedCheckout = true;

  constructor(
    private readonly secretKey: string,
    private readonly webhookSecret: string,
  ) {}

  /**
   * Creates the checkout session for an order and hands back the address the
   * customer pays at.
   */
  async prepare(intent: PaymentIntent): Promise<PaymentSession> {
    const session = await this.createSession(intent);

    return {
      provider: this.id,
      status: "PENDING",
      checkoutUrl: session.url,
      reference: session.id,
    };
  }

  /** A fresh payment link for an order that was never paid. */
  async paymentLink(order: PaymentOrder): Promise<string | null> {
    const session = await this.createSession({
      orderNumber: order.orderNumber,
      amount: order.amount,
      currency: order.currency,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
    });

    return session.url;
  }

  async instructions(): Promise<PaymentInstructions> {
    return {
      heading: "Pay by card",
      body: "You are paying on Stripe's checkout page. The files unlock as soon as Stripe confirms the payment, usually within a second.",
      account: null,
    };
  }

  /**
   * The studio says the money arrived.
   *
   * Stripe settles the payment itself; this is the studio overriding it for
   * the rare case where the payment was taken another way.
   */
  confirmByHand(order: {
    orderNumber: string;
    reference: string | null;
  }): PaymentVerification {
    return {
      provider: this.id,
      orderNumber: order.orderNumber,
      status: "PAID",
      reference: order.reference,
    };
  }

  /**
   * Believes a callback only when its signature checks out.
   */
  async verifyCallback({
    headers,
    body,
  }: PaymentCallback): Promise<PaymentVerification | null> {
    const signature = headers.get("stripe-signature");
    if (!signature || !this.webhookSecret) return null;

    if (!this.verifySignature(body, signature, this.webhookSecret)) return null;

    let event: StripeEvent;
    try {
      event = JSON.parse(body) as StripeEvent;
    } catch {
      return null;
    }

    const settled =
      event.type === "checkout.session.completed" ||
      event.type === "checkout.session.async_payment_succeeded";

    if (!settled) return null;

    const session = event.data.object;
    const orderNumber =
      session.metadata?.order_number ?? session.client_reference_id ?? null;

    if (!orderNumber) return null;

    return {
      provider: this.id,
      orderNumber,
      status: session.payment_status === "paid" ? "PAID" : "PENDING",
      reference: session.payment_intent ?? session.id,
    };
  }

  /* ---------------------------------------------------------------- */
  /* Stripe                                                            */
  /* ---------------------------------------------------------------- */

  private async createSession(intent: PaymentIntent): Promise<StripeSession> {
    if (!this.secretKey) {
      throw new Error(
        "Stripe is not configured. Set STRIPE_SECRET_KEY to take card payments.",
      );
    }

    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");
    const currency = intent.currency.toLowerCase();
    const amount = ZERO_DECIMAL_CURRENCIES.has(currency)
      ? Math.round(intent.amount)
      : Math.round(intent.amount * 100);

    const form = new URLSearchParams();
    form.set("mode", "payment");
    form.set("customer_email", intent.customerEmail);
    form.set("client_reference_id", intent.orderNumber);
    form.set("metadata[order_number]", intent.orderNumber);
    form.set(
      "success_url",
      `${siteUrl}/order-confirmation/${encodeURIComponent(intent.orderNumber)}`,
    );
    form.set("cancel_url", `${siteUrl}/checkout?cancelled=1`);
    form.set("line_items[0][quantity]", "1");
    form.set("line_items[0][price_data][currency]", currency);
    form.set("line_items[0][price_data][unit_amount]", String(amount));
    form.set(
      "line_items[0][price_data][product_data][name]",
      `Order ${intent.orderNumber}`,
    );

    const response = await fetch(`${API}/checkout/sessions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form,
    });

    const payload = (await response.json().catch(() => ({}))) as {
      id?: string;
      url?: string | null;
      error?: { message?: string };
    };

    if (!response.ok || !payload.id) {
      throw new Error(
        payload.error?.message ?? "Stripe could not create the checkout.",
      );
    }

    return {
      id: payload.id,
      url: payload.url ?? null,
      payment_status: "unpaid",
      payment_intent: null,
      client_reference_id: intent.orderNumber,
      metadata: { order_number: intent.orderNumber },
    };
  }

  /**
   * Stripe's signature: HMAC-SHA256 over "timestamp.body", compared with the
   * `v1=` parts of the header, and only trusted for five minutes.
   */
  private verifySignature(
    body: string,
    header: string,
    secret: string,
  ): boolean {
    const parts = header.split(",");
    const timestamp = parts.find((part) => part.startsWith("t="))?.slice(2);
    const signatures = parts
      .filter((part) => part.startsWith("v1="))
      .map((part) => part.slice(3));

    if (!timestamp || signatures.length === 0) return false;

    const age = Math.abs(Date.now() / 1000 - Number(timestamp));
    if (!Number.isFinite(age) || age > SIGNATURE_TOLERANCE_SECONDS) return false;

    const expected = createHmac("sha256", secret)
      .update(`${timestamp}.${body}`)
      .digest("hex");

    const expectedBytes = Buffer.from(expected, "utf8");

    return signatures.some((signature) => {
      const given = Buffer.from(signature, "utf8");
      return (
        given.length === expectedBytes.length &&
        timingSafeEqual(given, expectedBytes)
      );
    });
  }
}
