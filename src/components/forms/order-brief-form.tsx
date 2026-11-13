"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Paperclip, X } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { submitOrderBrief } from "@/lib/actions/orders";
import {
  initialOrderBriefState,
  type OrderBriefState,
} from "@/lib/actions/order-state";
import {
  orderBriefSchema,
  type OrderBriefInput,
} from "@/lib/validations/order";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Alert } from "@/components/ui/feedback";
import { restoreFormValues } from "@/components/forms/restore-form-values";
import { useLocale } from "@/lib/i18n/client";
import { fill } from "@/lib/i18n/format";
import { formatCurrency } from "@/lib/utils";
import type { ServicePackage } from "@/types/models";

const DESCRIPTION_MAX = 4000;

export function OrderBriefForm({
  serviceId,
  serviceTitle,
  packages,
  selectedPackageId,
  defaultName,
  defaultEmail,
}: {
  serviceId: string;
  serviceTitle: string;
  packages: ServicePackage[];
  selectedPackageId: string | null;
  defaultName: string;
  defaultEmail: string;
}) {
  const [state, formAction, isPending] = useActionState<OrderBriefState, FormData>(
    submitOrderBrief,
    initialOrderBriefState,
  );
  const [fileName, setFileName] = useState<string | null>(null);
  const { t } = useLocale();

  const {
    register,
    getValues,
    formState: { errors },
  } = useForm<OrderBriefInput>({
    resolver: zodResolver(orderBriefSchema),
    mode: "onBlur",
    defaultValues: {
      customer_name: defaultName,
      customer_email: defaultEmail,
      service_id: serviceId,
      package_id: selectedPackageId ?? "",
      project_description: "",
      target_audience: "",
      design_references: "",
      preferred_colors: "",
      requested_deliverables: "",
      budget: "",
      deadline: "",
    },
  });

  // React resets an uncontrolled form once its action resolves. The brief is
  // long to type, so what was written is put back when the server asks for a
  // correction — without overwriting anything the visitor has changed since.
  const submittedValues = useRef<OrderBriefInput | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "error") {
      restoreFormValues(formRef.current, submittedValues.current);
    }
  }, [state]);

  if (state.status === "success") {
    return (
      <div className="rounded-xl border border-border bg-surface p-8 shadow-sm">
        <div className="flex items-start gap-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-success-surface">
            <CheckCircle2 aria-hidden="true" className="size-5 text-success" />
          </span>
          <div>
            <h3 className="font-display text-xl font-semibold">
              {t.order.briefReceived}
            </h3>
            <p className="prose-body mt-2">{state.message}</p>
          </div>
        </div>
      </div>
    );
  }

  const error = (key: keyof OrderBriefInput) =>
    errors[key]?.message ?? state.fieldErrors[key];

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
        <Alert variant="danger" title={t.order.couldNotSend}>
          {state.message}
        </Alert>
      ) : null}

      {/* Honeypot — hidden from people, irresistible to bots. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="website">{t.order.websiteLabel}</label>
        <input
          id="website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          defaultValue=""
        />
      </div>

      <input type="hidden" {...register("service_id")} />

      <fieldset className="space-y-6">
        <legend className="font-display text-lg font-semibold">
          {t.order.aboutYou}
        </legend>

        <div className="grid gap-6 sm:grid-cols-2">
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
              <p role="alert" className="mt-2 flex items-center gap-1.5 text-sm text-danger">
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
              <p role="alert" className="mt-2 flex items-center gap-1.5 text-sm text-danger">
                <AlertCircle aria-hidden="true" className="size-3.5" />
                {error("customer_email")}
              </p>
            ) : null}
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-6 border-t border-border pt-6">
        <legend className="font-display text-lg font-semibold">
          {t.order.theProject}
        </legend>

        <div>
          <Label htmlFor="service_id_label">{t.order.serviceLabel}</Label>
          <Input
            id="service_id_label"
            value={serviceTitle}
            readOnly
            className="mt-2 bg-surface-sunken text-muted"
          />
          <p className="mt-2 text-sm text-muted">
            {t.order.differentService}{" "}
            <Link href="/services" className="text-primary underline-offset-4 hover:underline">
              {t.services.allServices}
            </Link>
            .
          </p>
        </div>

        {packages.length > 0 ? (
          <div>
            <Label htmlFor="package_id">{t.order.form.package}</Label>
            <Select
              id="package_id"
              className="mt-2"
              aria-invalid={Boolean(error("package_id"))}
              {...register("package_id")}
            >
              <option value="">{t.order.form.packageUnsure}</option>
              {packages.map((pkg) => (
                <option key={pkg.id} value={pkg.id}>
                  {pkg.name}, {formatCurrency(pkg.price)}
                </option>
              ))}
            </Select>
            <p className="mt-2 text-sm text-muted">
              {t.order.packagePriceNote}
            </p>
          </div>
        ) : null}

        <div>
          <div className="flex items-baseline justify-between gap-4">
            <Label htmlFor="project_description">
              {t.order.form.projectDescription}{" "}
              <span aria-hidden="true">*</span>
            </Label>
            <span className="font-label text-xs tabular-nums text-muted">
              {fill(t.contact.messageMax, { count: DESCRIPTION_MAX })}
            </span>
          </div>
          <Textarea
            id="project_description"
            rows={7}
            maxLength={DESCRIPTION_MAX}
            className="mt-2 resize-y"
            placeholder={t.order.projectDescriptionHint}
            aria-required="true"
            aria-invalid={Boolean(error("project_description"))}
            {...register("project_description")}
          />
          {error("project_description") ? (
            <p role="alert" className="mt-2 flex items-center gap-1.5 text-sm text-danger">
              <AlertCircle aria-hidden="true" className="size-3.5" />
              {error("project_description")}
            </p>
          ) : null}
        </div>

        <div>
          <Label htmlFor="requested_deliverables">
            {t.order.requiredDeliverables}
          </Label>
          <Textarea
            id="requested_deliverables"
            rows={3}
            className="mt-2 resize-y"
            placeholder={t.order.form.deliverablesHint}
            aria-invalid={Boolean(error("requested_deliverables"))}
            {...register("requested_deliverables")}
          />
          {error("requested_deliverables") ? (
            <p role="alert" className="mt-2 flex items-center gap-1.5 text-sm text-danger">
              <AlertCircle aria-hidden="true" className="size-3.5" />
              {error("requested_deliverables")}
            </p>
          ) : null}
        </div>

        <div>
          <Label htmlFor="target_audience">{t.order.targetAudienceLabel}</Label>
          <Textarea
            id="target_audience"
            rows={3}
            className="mt-2 resize-y"
            placeholder={t.order.targetAudiencePlaceholder}
            aria-invalid={Boolean(error("target_audience"))}
            {...register("target_audience")}
          />
          {error("target_audience") ? (
            <p role="alert" className="mt-2 flex items-center gap-1.5 text-sm text-danger">
              <AlertCircle aria-hidden="true" className="size-3.5" />
              {error("target_audience")}
            </p>
          ) : null}
        </div>

        <div>
          <Label htmlFor="design_references">{t.order.designReferences}</Label>
          <Textarea
            id="design_references"
            rows={3}
            className="mt-2 resize-y"
            placeholder={t.order.designReferencesHint}
            aria-invalid={Boolean(error("design_references"))}
            {...register("design_references")}
          />
          {error("design_references") ? (
            <p role="alert" className="mt-2 flex items-center gap-1.5 text-sm text-danger">
              <AlertCircle aria-hidden="true" className="size-3.5" />
              {error("design_references")}
            </p>
          ) : null}
        </div>

        <div>
          <Label htmlFor="preferred_colors">{t.order.preferredColours}</Label>
          <Textarea
            id="preferred_colors"
            rows={3}
            className="mt-2 resize-y"
            placeholder={t.order.preferredColoursHint}
            aria-invalid={Boolean(error("preferred_colors"))}
            {...register("preferred_colors")}
          />
          {error("preferred_colors") ? (
            <p role="alert" className="mt-2 flex items-center gap-1.5 text-sm text-danger">
              <AlertCircle aria-hidden="true" className="size-3.5" />
              {error("preferred_colors")}
            </p>
          ) : null}
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <Label htmlFor="budget">{t.order.budget}</Label>
            <Input
              id="budget"
              type="number"
              min={0}
              step={100000}
              inputMode="numeric"
              className="mt-2"
              placeholder={t.order.optional}
              aria-invalid={Boolean(error("budget"))}
              {...register("budget")}
            />
            {error("budget") ? (
              <p role="alert" className="mt-2 flex items-center gap-1.5 text-sm text-danger">
                <AlertCircle aria-hidden="true" className="size-3.5" />
                {error("budget")}
              </p>
            ) : null}
          </div>

          <div>
            <Label htmlFor="deadline">{t.order.deadline}</Label>
            <Input
              id="deadline"
              type="date"
              className="mt-2"
              aria-invalid={Boolean(error("deadline"))}
              {...register("deadline")}
            />
            {error("deadline") ? (
              <p role="alert" className="mt-2 flex items-center gap-1.5 text-sm text-danger">
                <AlertCircle aria-hidden="true" className="size-3.5" />
                {error("deadline")}
              </p>
            ) : null}
          </div>
        </div>

        <div>
          <Label htmlFor="reference_file">{t.order.referenceFile}</Label>
          <label
            htmlFor="reference_file"
            className="mt-2 flex cursor-pointer items-center gap-3 rounded-md border border-dashed border-border-strong bg-surface px-4 py-4 text-sm text-muted transition-colors hover:border-primary"
          >
            <Paperclip aria-hidden="true" className="size-4 shrink-0" />
            {fileName ? (
              <span className="flex items-center gap-2">
                <span className="truncate font-label text-text">{fileName}</span>
                <button
                  type="button"
                  onClick={(event) => {
                    event.preventDefault();
                    setFileName(null);
                    const input = document.getElementById(
                      "reference_file",
                    ) as HTMLInputElement | null;
                    if (input) input.value = "";
                  }}
                  className="text-muted-foreground transition-colors hover:text-text"
                  aria-label={t.order.removeFile}
                >
                  <X aria-hidden="true" className="size-3.5" />
                </button>
              </span>
            ) : (
              <span>{t.order.form.attachmentsHint}</span>
            )}
          </label>
          <input
            id="reference_file"
            name="reference_file"
            type="file"
            className="sr-only"
            accept=".pdf,.png,.jpg,.jpeg,.webp,.gif,.zip"
            onChange={(event) =>
              setFileName(event.target.files?.[0]?.name ?? null)
            }
          />
          <p className="mt-2 text-sm text-muted">
            {fill(t.order.fileSizeNote, { size: "10 MB" })}
          </p>
        </div>
      </fieldset>

      <div className="flex flex-wrap items-center gap-4 border-t border-border pt-6">
        <Button type="submit" size="lg" disabled={isPending}>
          {isPending ? t.order.form.sending : t.order.form.send}
        </Button>
        <p className="font-label text-xs text-muted">
          {t.order.form.noPayment}
        </p>
      </div>
    </form>
  );
}
