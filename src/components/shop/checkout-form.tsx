"use client";

import { useActionState, useEffect, useRef } from "react";
import Link from "next/link";
import { AlertCircle, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { submitCheckout } from "@/lib/actions/checkout";
import {
  initialCheckoutState,
  type CheckoutState,
} from "@/lib/actions/checkout-state";
import { checkoutSchema, type CheckoutInput } from "@/lib/validations/checkout";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Alert } from "@/components/ui/feedback";
import { EmptyState } from "@/components/ui/feedback";
import { restoreFormValues } from "@/components/forms/restore-form-values";
import { useCart } from "@/hooks/use-cart";
import { useLocale } from "@/lib/i18n/client";
import { fill } from "@/lib/i18n/format";
import { formatCurrency } from "@/lib/utils";

/**
 * The checkout island.
 *
 * The cart lives in sessionStorage, so the whole review is a client island
 * and the server only receives product ids and quantities. Prices are
 * re-read from the database when the order is placed.
 */
export function CheckoutForm() {
  const { t } = useLocale();
  const { items, removeItem, setQuantity, total, count } = useCart();

  const [state, formAction, isPending] = useActionState<CheckoutState, FormData>(
    submitCheckout,
    initialCheckoutState,
  );

  const {
    register,
    getValues,
    setValue,
    formState: { errors },
  } = useForm<CheckoutInput>({
    resolver: zodResolver(checkoutSchema),
    mode: "onBlur",
    defaultValues: { customer_name: "", customer_email: "", cart: "[]" },
  });

  const submittedValues = useRef<CheckoutInput | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "error") {
      restoreFormValues(formRef.current, submittedValues.current);
    }
  }, [state]);

  // The cart can change after the page was rendered (the product page adds to
  // it in another tab), so the submitted cart follows the store.
  const cart = JSON.stringify(
    items.map((item) => ({
      product_id: item.productId,
      quantity: item.quantity,
    })),
  );

  useEffect(() => {
    setValue("cart", cart);
  }, [cart, setValue]);

  if (count === 0) {
    return (
      <EmptyState
        icon={ShoppingBag}
        title={t.checkout.emptyTitle}
        description={t.checkout.emptyBody}
        action={
          <Link
            href="/shop"
            className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-5 font-label text-sm font-medium text-on-primary"
          >
            {t.checkout.browseShop}
          </Link>
        }
      />
    );
  }

  const error = (key: keyof CheckoutInput) =>
    errors[key]?.message ?? state.fieldErrors[key];

  return (
    <div className="grid gap-8 lg:grid-cols-12">
      <div className="lg:col-span-7">
        <div className="rounded-xl border border-border bg-surface shadow-sm">
          <h2 className="border-b border-border px-6 py-4 font-display text-lg font-semibold">
            {t.checkout.orderSummary}
          </h2>

          <ul className="divide-y divide-border">
            {items.map((item) => (
              <li key={item.productId} className="flex items-start gap-4 px-6 py-4">
                <div className="min-w-0 flex-1">
                  <p className="font-label text-sm font-medium text-text">
                    {item.title}
                  </p>
                  <p className="mt-1 font-label text-xs tabular-nums text-muted-foreground">
                    {formatCurrency(item.price)}
                  </p>

                  <div className="mt-3 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setQuantity(item.productId, item.quantity - 1)
                      }
                      aria-label={fill(t.checkout.removeOne, {
                        title: item.title,
                      })}
                      className="inline-flex size-8 items-center justify-center rounded-md border border-border text-muted transition-colors hover:border-border-strong hover:text-text"
                    >
                      <Minus aria-hidden="true" className="size-3.5" />
                    </button>

                    <span className="w-8 text-center font-label text-sm tabular-nums">
                      {item.quantity}
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        setQuantity(item.productId, item.quantity + 1)
                      }
                      aria-label={fill(t.checkout.addOne, {
                        title: item.title,
                      })}
                      className="inline-flex size-8 items-center justify-center rounded-md border border-border text-muted transition-colors hover:border-border-strong hover:text-text"
                    >
                      <Plus aria-hidden="true" className="size-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => removeItem(item.productId)}
                      aria-label={fill(t.checkout.removeItem, {
                        title: item.title,
                      })}
                      className="ml-2 inline-flex size-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-danger-surface hover:text-danger"
                    >
                      <Trash2 aria-hidden="true" className="size-3.5" />
                    </button>
                  </div>
                </div>

                <p className="font-label text-sm font-medium tabular-nums text-text">
                  {formatCurrency(item.price * item.quantity)}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="lg:col-span-5">
        <form
          ref={formRef}
          action={formAction}
          className="rounded-xl border border-border bg-surface p-6 shadow-sm"
          noValidate
          onSubmit={() => {
            submittedValues.current = getValues();
          }}
        >
          <h2 className="font-display text-lg font-semibold">
            {t.checkout.yourDetails}
          </h2>
          <p className="mt-1 text-sm text-muted">{t.checkout.detailsLede}</p>

          {state.status === "error" && state.message ? (
            <Alert variant="danger" title={t.checkout.couldNotPlace}>
              {state.message}
            </Alert>
          ) : null}

          <input type="hidden" {...register("cart")} />

          <div className="mt-5 space-y-5">
            <div>
              <Label htmlFor="customer_name">
                {t.contact.fullName} <span aria-hidden="true">*</span>
              </Label>
              <Input
                id="customer_name"
                autoComplete="name"
                className="mt-2"
                aria-required="true"
                aria-invalid={Boolean(error("customer_name"))}
                {...register("customer_name")}
              />
              {error("customer_name") ? (
                <p
                  role="alert"
                  className="mt-2 flex items-center gap-1.5 text-sm text-danger"
                >
                  <AlertCircle aria-hidden="true" className="size-3.5" />
                  {error("customer_name")}
                </p>
              ) : null}
            </div>

            <div>
              <Label htmlFor="customer_email">
                {t.contact.emailAddress} <span aria-hidden="true">*</span>
              </Label>
              <Input
                id="customer_email"
                type="email"
                autoComplete="email"
                className="mt-2"
                aria-required="true"
                aria-invalid={Boolean(error("customer_email"))}
                {...register("customer_email")}
              />
              {error("customer_email") ? (
                <p
                  role="alert"
                  className="mt-2 flex items-center gap-1.5 text-sm text-danger"
                >
                  <AlertCircle aria-hidden="true" className="size-3.5" />
                  {error("customer_email")}
                </p>
              ) : null}
            </div>
          </div>

          <dl className="mt-6 space-y-2 border-t border-border pt-5">
            <div className="flex items-center justify-between gap-4">
              <dt className="font-label text-sm text-muted">
                {fill(count === 1 ? t.cart.count : t.cart.countPlural, { count })}
              </dt>
              <dd className="font-label text-sm tabular-nums text-text">
                {formatCurrency(total)}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="font-display text-base font-semibold">
                {t.checkout.total}
              </dt>
              <dd className="font-display text-xl font-semibold tabular-nums">
                {formatCurrency(total)}
              </dd>
            </div>
          </dl>

          <p className="mt-2 text-xs text-muted-foreground">
            {t.checkout.transferNote}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <Button type="submit" size="lg" disabled={isPending}>
              {isPending ? t.checkout.placing : t.checkout.submit}
            </Button>
            <Link
              href="/shop"
              className="font-label text-sm text-muted-foreground underline-offset-4 hover:text-text hover:underline"
            >
              {t.shop.backToShop}
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
