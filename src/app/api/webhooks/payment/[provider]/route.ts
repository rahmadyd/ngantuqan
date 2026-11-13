import { NextResponse, type NextRequest } from "next/server";
import {
  applyProviderVerification,
  getPaymentProvider,
  isKnownPaymentProvider,
} from "@/lib/payments";

/**
 * The payment callback (spec §8, conflict C7).
 *
 * A provider calls this URL when money moves. The provider verifies its own
 * signature first — `verifyCallback` returns null for anything it did not
 * sign — and only then may the order be marked paid.
 *
 * The order is written by `confirm_digital_order_payment_from_provider`,
 * which only the service role can call, and it writes its own audit row.
 * Nothing here trusts the request body.
 */

type Params = Promise<{ provider: string }>;

export async function POST(
  request: NextRequest,
  { params }: { params: Params },
) {
  const { provider: providerId } = await params;

  if (!isKnownPaymentProvider(providerId)) {
    return NextResponse.json(
      { error: "Unknown payment provider" },
      { status: 404 },
    );
  }

  const provider = getPaymentProvider(providerId);
  const body = await request.text();

  let verification;
  try {
    verification = await provider.verifyCallback({
      headers: request.headers,
      body,
    });
  } catch (error) {
    console.error("[payment-callback] verification failed:", error);
    return NextResponse.json({ error: "Invalid callback" }, { status: 400 });
  }

  if (!verification) {
    return NextResponse.json({ error: "Invalid callback" }, { status: 400 });
  }

  // Only a paid payment changes the order. A failure or a refund is
  // acknowledged and left for the studio to look at.
  if (verification.status !== "PAID") {
    return NextResponse.json({
      received: true,
      status: verification.status,
    });
  }

  const result = await applyProviderVerification(verification);

  if (!result.ok) {
    console.error(
      `[payment-callback] could not apply the payment for ${verification.orderNumber}:`,
      result.message,
    );
    return NextResponse.json(
      { error: "The payment could not be applied" },
      { status: 500 },
    );
  }

  return NextResponse.json({ received: true });
}
