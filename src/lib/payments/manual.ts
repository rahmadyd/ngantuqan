import { createAdminClient } from "@/lib/supabase/admin";
import type {
  PaymentInstructions,
  PaymentProvider,
  PaymentSession,
  PaymentVerification,
} from "./types";

/**
 * The manual provider — the studio confirms the payment by hand.
 *
 * The customer is told how to pay, the studio matches the transfer to the
 * order, and the studio marks it paid in the admin dashboard. The
 * instructions live in the database (Admin → Website Content) so they can be
 * changed without a deploy.
 *
 * There is no callback channel: the money arrives by transfer, not by an HTTP
 * request, so `verifyCallback` never verifies anything and the callback route
 * refuses every request for this provider.
 */
export class ManualProvider implements PaymentProvider {
  readonly id = "manual";
  readonly label = "Bank transfer, confirmed by the studio";

  async prepare(): Promise<PaymentSession> {
    return {
      provider: this.id,
      status: "PENDING",
      checkoutUrl: null,
      reference: null,
    };
  }

  async instructions(): Promise<PaymentInstructions> {
    const admin = createAdminClient();

    const { data } = await admin
      .from("site_settings")
      .select("setting_value")
      .eq("setting_key", "payments.details")
      .maybeSingle();

    const block = (data?.setting_value ?? {}) as {
      heading?: string;
      body?: string;
      account?: string | null;
    };

    return {
      heading: block.heading ?? "Pay by bank transfer",
      body:
        block.body ??
        "We send the full payment details with your order confirmation. Reply to that email if you need them sooner, and quote your order number.",
      account: block.account ?? null,
    };
  }

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

  async verifyCallback(): Promise<PaymentVerification | null> {
    return null;
  }
}
