"use client";

import { useActionState, useEffect, useRef } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { submitInquiry } from "@/lib/actions/inquiries";
import {
  initialState,
  type ActionState,
} from "@/lib/actions/inquiry-state";
import {
  INQUIRY_TYPES,
  inquirySchema,
  type InquiryInput,
} from "@/lib/validations/contact";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Alert } from "@/components/ui/feedback";
import { restoreFormValues } from "@/components/forms/restore-form-values";
import { useLocale } from "@/lib/i18n/client";
import { fill } from "@/lib/i18n/format";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { cn } from "@/lib/utils";

const MESSAGE_MAX = 4000;

type FieldName = keyof InquiryInput;

/**
 * The zod schema speaks one language. The message a visitor sees has to
 * match the language of the page, so the schema's error type is mapped back
 * to a dictionary string instead of being shown verbatim.
 */
function fieldErrorMessage(
  field: FieldName,
  type: string | undefined,
  messages: Dictionary["contact"]["validation"],
): string | undefined {
  switch (field) {
    case "name":
      return type === "too_big" ? messages.nameTooLong : messages.nameRequired;
    case "email":
      return type === "invalid_string"
        ? messages.emailInvalid
        : messages.emailRequired;
    case "company":
      return messages.companyTooLong;
    case "inquiryType":
      return messages.inquiryTypeRequired;
    case "subject":
      return type === "too_big"
        ? messages.subjectTooLong
        : messages.subjectRequired;
    case "message":
      return type === "too_big"
        ? messages.messageTooLong
        : messages.messageRequired;
    default:
      return undefined;
  }
}

export function ContactForm() {
  const { t } = useLocale();

  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    submitInquiry,
    initialState,
  );

  const {
    register,
    getValues,
    formState: { errors },
  } = useForm<InquiryInput>({
    resolver: zodResolver(inquirySchema),
    mode: "onBlur",
    defaultValues: {
      name: "",
      email: "",
      company: "",
      inquiryType: "GENERAL",
      subject: "",
      message: "",
    },
  });

  // React resets an uncontrolled form once its action resolves, so what was
  // typed is put back when the server asks for a correction, without
  // overwriting anything the visitor has changed since.
  const submittedValues = useRef<InquiryInput | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "error") {
      restoreFormValues(formRef.current, submittedValues.current);
    }
  }, [state]);

  if (state.status === "success") {
    const [referenceBefore, referenceAfter] =
      t.contact.reference.split("{reference}");

    return (
      <div className="rounded-xl border border-border bg-surface p-8 shadow-sm">
        <div className="flex items-start gap-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-success-surface">
            <CheckCircle2 aria-hidden="true" className="size-5 text-success" />
          </span>
          <div>
            <h3 className="font-display text-xl font-semibold">
              {t.contact.receivedTitle}
            </h3>
            <p className="prose-body mt-2">{state.message}</p>
            {state.reference ? (
              <p className="mt-4 font-label text-sm text-muted">
                {referenceBefore}
                <span className="font-semibold text-text">
                  {state.reference}
                </span>
                {referenceAfter}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      className="space-y-6"
      noValidate
      onSubmit={() => {
        submittedValues.current = getValues();
      }}
    >
      {state.status === "error" && state.message ? (
        <Alert variant="danger" title={t.contact.couldNotSend}>
          {state.message}
        </Alert>
      ) : null}

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <Label htmlFor="name">
            {t.contact.fullName} <span aria-hidden="true">*</span>
          </Label>
          <Input
            id="name"
            autoComplete="name"
            className="mt-2"
            aria-required="true"
            aria-invalid={Boolean(errors.name || state.fieldErrors.name)}
            aria-describedby={errors.name ? "name-error" : undefined}
            {...register("name")}
          />
          {errors.name || state.fieldErrors.name ? (
            <p
              id="name-error"
              role="alert"
              className="mt-2 flex items-center gap-1.5 text-sm text-danger"
            >
              <AlertCircle aria-hidden="true" className="size-3.5" />
              {fieldErrorMessage("name", errors.name?.type, t.contact.validation) ??
                state.fieldErrors.name}
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
            aria-invalid={Boolean(errors.email || state.fieldErrors.email)}
            aria-describedby={errors.email ? "email-error" : undefined}
            {...register("email")}
          />
          {errors.email || state.fieldErrors.email ? (
            <p
              id="email-error"
              role="alert"
              className="mt-2 flex items-center gap-1.5 text-sm text-danger"
            >
              <AlertCircle aria-hidden="true" className="size-3.5" />
              {fieldErrorMessage("email", errors.email?.type, t.contact.validation) ??
                state.fieldErrors.email}
            </p>
          ) : null}
        </div>
      </div>

      <div>
        <Label htmlFor="company">{t.contact.companyBrand}</Label>
        <Input
          id="company"
          autoComplete="organization"
          className="mt-2"
          aria-describedby="company-hint"
          {...register("company")}
        />
        <p id="company-hint" className="mt-2 text-sm text-muted-foreground">
          {t.order.form.companyHint}
        </p>
      </div>

      <div>
        <Label htmlFor="inquiryType">
          {t.contact.inquiryType} <span aria-hidden="true">*</span>
        </Label>
        <Select
          id="inquiryType"
          className="mt-2"
          aria-required="true"
          aria-invalid={Boolean(errors.inquiryType)}
          {...register("inquiryType")}
        >
          {INQUIRY_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {t.contact.inquiryTypeLabels[type.value]}
            </option>
          ))}
        </Select>
        {errors.inquiryType ? (
          <p role="alert" className="mt-2 text-sm text-danger">
            {fieldErrorMessage(
              "inquiryType",
              errors.inquiryType?.type,
              t.contact.validation,
            )}
          </p>
        ) : null}
      </div>

      <div>
        <Label htmlFor="subject">
          {t.contact.subject} <span aria-hidden="true">*</span>
        </Label>
        <Input
          id="subject"
          className="mt-2"
          aria-required="true"
          aria-invalid={Boolean(errors.subject || state.fieldErrors.subject)}
          aria-describedby={errors.subject ? "subject-error" : undefined}
          {...register("subject")}
        />
        {errors.subject || state.fieldErrors.subject ? (
          <p
            id="subject-error"
            role="alert"
            className="mt-2 flex items-center gap-1.5 text-sm text-danger"
          >
            <AlertCircle aria-hidden="true" className="size-3.5" />
            {fieldErrorMessage(
              "subject",
              errors.subject?.type,
              t.contact.validation,
            ) ?? state.fieldErrors.subject}
          </p>
        ) : null}
      </div>

      <div>
        <div className="flex items-baseline justify-between gap-4">
          <Label htmlFor="message">
            {t.contact.message} <span aria-hidden="true">*</span>
          </Label>
          <span className="font-label text-xs text-muted-foreground tabular-nums">
            {fill(t.contact.messageMax, { count: MESSAGE_MAX })}
          </span>
        </div>
        <Textarea
          id="message"
          rows={7}
          maxLength={MESSAGE_MAX}
          className="mt-2 resize-y"
          aria-required="true"
          aria-invalid={Boolean(errors.message || state.fieldErrors.message)}
          aria-describedby={errors.message ? "message-error" : "message-hint"}
          {...register("message")}
        />
        {errors.message || state.fieldErrors.message ? (
          <p
            id="message-error"
            role="alert"
            className="mt-2 flex items-center gap-1.5 text-sm text-danger"
          >
            <AlertCircle aria-hidden="true" className="size-3.5" />
            {fieldErrorMessage(
              "message",
              errors.message?.type,
              t.contact.validation,
            ) ?? state.fieldErrors.message}
          </p>
        ) : (
          <p id="message-hint" className="mt-2 text-sm text-muted-foreground">
            {t.contact.messageHint}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-4 border-t border-border pt-6">
        <Button type="submit" size="lg" disabled={isPending}>
          {isPending ? t.contact.sending : t.contact.send}
        </Button>
        <p
          className={cn(
            "font-label text-xs text-muted-foreground",
            isPending && "opacity-60",
          )}
        >
          {t.contact.replyWithin}
        </p>
      </div>
    </form>
  );
}
