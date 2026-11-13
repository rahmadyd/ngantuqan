"use client";

import { useActionState, useEffect, useRef } from "react";
import { AlertCircle, Search } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { verifyOrderAccess } from "@/lib/actions/checkout";
import {
  initialCheckoutState,
  type CheckoutState,
} from "@/lib/actions/checkout-state";
import { orderAccessSchema, type OrderAccessInput } from "@/lib/validations/checkout";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Alert } from "@/components/ui/feedback";
import { restoreFormValues } from "@/components/forms/restore-form-values";
import { useLocale } from "@/lib/i18n/client";

/**
 * Order lookup.
 *
 * The customer comes back with their order number and the email they used.
 * The server checks the pair against the database and then redirects to the
 * order page with a signed access token.
 */
export function OrderAccessForm({
  orderNumber = "",
  email = "",
}: {
  orderNumber?: string;
  email?: string;
}) {
  const [state, formAction, isPending] = useActionState<CheckoutState, FormData>(
    verifyOrderAccess,
    initialCheckoutState,
  );
  const { t } = useLocale();

  const {
    register,
    getValues,
    formState: { errors },
  } = useForm<OrderAccessInput>({
    resolver: zodResolver(orderAccessSchema),
    mode: "onBlur",
    defaultValues: { order_number: orderNumber, email },
  });

  const submittedValues = useRef<OrderAccessInput | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "error") {
      restoreFormValues(formRef.current, submittedValues.current);
    }
  }, [state]);

  const error = (key: keyof OrderAccessInput) =>
    errors[key]?.message ?? state.fieldErrors[key];

  return (
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
        {t.orderAccess.title}
      </h2>
      <p className="mt-1 text-sm text-muted">{t.orderAccess.body}</p>

      {state.status === "error" && state.message ? (
        <Alert variant="danger" title="We could not find that order">
          {state.message}
        </Alert>
      ) : null}

      <div className="mt-5 space-y-5">
        <div>
          <Label htmlFor="order_number">
            {t.orderAccess.orderNumber} <span aria-hidden="true">*</span>
          </Label>
          <Input
            id="order_number"
            className="mt-2 font-label"
            placeholder="DO-2611-00001"
            autoComplete="off"
            aria-required="true"
            aria-invalid={Boolean(error("order_number"))}
            {...register("order_number")}
          />
          {error("order_number") ? (
            <p
              role="alert"
              className="mt-2 flex items-center gap-1.5 text-sm text-danger"
            >
              <AlertCircle aria-hidden="true" className="size-3.5" />
              {error("order_number")}
            </p>
          ) : null}
        </div>

        <div>
          <Label htmlFor="email">
            {t.contact.emailAddress} <span aria-hidden="true">*</span>
          </Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            className="mt-2"
            aria-required="true"
            aria-invalid={Boolean(error("email"))}
            {...register("email")}
          />
          {error("email") ? (
            <p
              role="alert"
              className="mt-2 flex items-center gap-1.5 text-sm text-danger"
            >
              <AlertCircle aria-hidden="true" className="size-3.5" />
              {error("email")}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-6">
        <Button type="submit" disabled={isPending}>
          <Search aria-hidden="true" />
          {isPending ? t.orderAccess.finding : t.orderAccess.submit}
        </Button>
      </div>
    </form>
  );
}
