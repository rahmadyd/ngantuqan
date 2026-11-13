/**
 * The payment provider contract (spec §8, conflict C7).
 *
 * The spec asks for a purchasing architecture that can support a payment
 * provider later, and it refuses to simulate a successful payment. So the
 * provider is an interface with one real implementation — the studio
 * confirming a bank transfer by hand — and a registry that picks it by name.
 *
 * Two paths may mark an order PAID, and only two:
 *   1. A provider callback that verified its own signature.
 *   2. The studio confirming the payment in the admin dashboard.
 *
 * Everything else — the checkout button, the order page, the download gate —
 * asks the provider what to do instead of deciding for itself.
 */

export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";

/** What the studio is selling, as the provider sees it. */
export interface PaymentIntent {
  orderNumber: string;
  amount: number;
  currency: string;
  customerName: string;
  customerEmail: string;
}

/** The order as the provider sees it, when it is asked for instructions. */
export interface PaymentOrder {
  orderNumber: string;
  amount: number;
  currency: string;
  customerName: string;
  customerEmail: string;
  /** The provider's own reference for this order, when it has one. */
  reference: string | null;
}

/** What the customer is told to do next. */
export interface PaymentInstructions {
  heading: string;
  body: string;
  /** Bank details, an account number, a QR string — whatever pays. */
  account: string | null;
}

/** The result of preparing a payment for a newly created order. */
export interface PaymentSession {
  provider: string;
  status: PaymentStatus;
  /** Where the customer goes to pay. Null when the studio confirms by hand. */
  checkoutUrl: string | null;
  /** The provider's reference for this payment, when it has one. */
  reference: string | null;
}

/** A payment that has been verified and may mark an order paid. */
export interface PaymentVerification {
  provider: string;
  orderNumber: string;
  status: PaymentStatus;
  reference: string | null;
}

/** The raw callback a provider sent. */
export interface PaymentCallback {
  headers: Headers;
  body: string;
}

export interface PaymentProvider {
  readonly id: string;
  readonly label: string;

  /** True when the customer is sent to the provider's own page to pay. */
  readonly hostedCheckout?: boolean;

  /** Called once, right after the order row exists. */
  prepare(intent: PaymentIntent): Promise<PaymentSession>;

  /**
   * What the customer is told to do next. Called on every order page render,
   * so it must not have side effects.
   */
  instructions(order: PaymentOrder): Promise<PaymentInstructions>;

  /**
   * The studio checked the payment by hand and says so.
   *
   * The result is what the application writes to the database — the provider
   * never writes to it itself.
   */
  confirmByHand(order: {
    orderNumber: string;
    reference: string | null;
  }): PaymentVerification;

  /**
   * Verifies a callback from the provider.
   *
   * Returns null when the callback is not genuine. An unverified callback
   * must never be able to mark an order paid.
   */
  verifyCallback(callback: PaymentCallback): Promise<PaymentVerification | null>;

  /**
   * A fresh address to pay at, for an order that was never paid.
   *
   * Only a provider with a hosted checkout has one.
   */
  paymentLink?(order: PaymentOrder): Promise<string | null>;
}
