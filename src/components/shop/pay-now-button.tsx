"use client";

import { useActionState, useEffect } from "react";
import { CreditCard } from "lucide-react";
import { startHostedPayment } from "@/lib/actions/checkout";
import {
  initialHostedPaymentState,
  type HostedPaymentState,
} from "@/lib/actions/checkout-state";
import { Button } from "@/components/ui/button";

/**
 * "Pay now" for an order that was never paid.
 *
 * The customer is sent to the provider's own checkout page. The address is
 * created by the server — the browser never sees an API key.
 */
export function PayNowButton({
  orderNumber,
  email,
  provider,
}: {
  orderNumber: string;
  email: string;
  provider: string;
}) {
  const [state, formAction, pending] = useActionState<HostedPaymentState, FormData>(
    startHostedPayment,
    initialHostedPaymentState,
  );

  useEffect(() => {
    if (state.url) {
      window.location.href = state.url;
    }
  }, [state.url]);

  return (
    <form action={formAction} className="mt-4">
      <input type="hidden" name="order_number" value={orderNumber} />
      <input type="hidden" name="email" value={email} />
      <input type="hidden" name="provider" value={provider} />

      <Button type="submit" size="lg" disabled={pending}>
        <CreditCard aria-hidden="true" />
        {pending ? "Opening…" : "Pay now"}
      </Button>

      {state.message ? (
        <p className="mt-2 text-sm text-danger">{state.message}</p>
      ) : null}
    </form>
  );
}
