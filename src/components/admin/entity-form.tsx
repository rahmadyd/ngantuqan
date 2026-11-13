"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Alert } from "@/components/ui/feedback";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { MediaField } from "@/components/admin/media-field";
import { initialAdminState, type AdminActionState } from "@/lib/actions/admin-state";
import type { FieldConfig } from "@/components/admin/field-config";

/**
 * The admin form.
 *
 * One component renders every catalogue form: the field list is data, the
 * server action owns validation, and `useActionState` brings the messages
 * back. Nothing is written to the database from the client.
 */
export function EntityForm({
  action,
  fields,
  submitLabel = "Save changes",
  hidden = {},
  cancelHref,
}: {
  action: (state: AdminActionState, formData: FormData) => Promise<AdminActionState>;
  fields: FieldConfig[];
  submitLabel?: string;
  hidden?: Record<string, string | undefined>;
  cancelHref?: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialAdminState);

  return (
    <form action={formAction} data-admin-form className="space-y-6">
      {Object.entries(hidden).map(([name, value]) =>
        value === undefined ? null : (
          <input key={name} type="hidden" name={name} value={value} />
        ),
      )}

      {state.message ? (
        <Alert variant={state.status === "error" ? "danger" : "success"}>
          {state.message}
        </Alert>
      ) : null}

      <div className="grid gap-5 md:grid-cols-2">
        {fields.map((field) => (
          <Field
            key={field.name}
            field={field}
            error={state.fieldErrors[field.name]}
          />
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-border pt-5">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : submitLabel}
        </Button>
        {cancelHref ? (
          <ButtonLink href={cancelHref} variant="ghost">
            Cancel
          </ButtonLink>
        ) : null}
      </div>
    </form>
  );
}

function Field({
  field,
  error,
}: {
  field: FieldConfig;
  error?: string;
}) {
  const id = `field-${field.name}`;
  const describedBy = error ? `${id}-error` : field.help ? `${id}-help` : undefined;

  if (field.type === "media") {
    return (
      <MediaField
        id={id}
        name={field.name}
        label={field.label}
        help={field.help}
        value={String(field.value ?? "")}
        assets={field.media ?? []}
        error={error}
      />
    );
  }

  if (field.type === "checkbox") {
    return (
      <div className="md:col-span-2">
        <div className="flex items-start gap-3">
          <input
            id={id}
            name={field.name}
            type="checkbox"
            defaultChecked={Boolean(field.value)}
            aria-describedby={describedBy}
            aria-invalid={error ? true : undefined}
            className="mt-1 size-4 rounded border-border text-primary focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary"
          />
          <div>
            <Label htmlFor={id}>{field.label}</Label>
            {field.help ? (
              <p id={`${id}-help`} className="mt-1 text-xs text-muted-foreground">
                {field.help}
              </p>
            ) : null}
            {error ? <FieldError id={`${id}-error`} message={error} /> : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={field.type === "textarea" || field.type === "lines" ? "md:col-span-2" : ""}>
      <Label htmlFor={id}>
        {field.label}
        {field.required ? (
          <span aria-hidden="true" className="ml-1 text-danger">
            *
          </span>
        ) : null}
      </Label>

      <div className="mt-1.5">
        {field.type === "textarea" || field.type === "lines" ? (
          <Textarea
            id={id}
            name={field.name}
            rows={field.rows ?? 4}
            placeholder={field.placeholder}
            defaultValue={String(field.value ?? "")}
            required={field.required}
            aria-describedby={describedBy}
            aria-invalid={error ? true : undefined}
          />
        ) : field.type === "select" ? (
          <Select
            id={id}
            name={field.name}
            defaultValue={String(field.value ?? "")}
            required={field.required}
            aria-describedby={describedBy}
            aria-invalid={error ? true : undefined}
          >
            {(field.options ?? []).map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        ) : field.type === "number" ? (
          <Input
            id={id}
            name={field.name}
            type="number"
            min={field.min}
            step={field.step}
            placeholder={field.placeholder}
            defaultValue={field.value === null || field.value === undefined ? "" : String(field.value)}
            required={field.required}
            aria-describedby={describedBy}
            aria-invalid={error ? true : undefined}
          />
        ) : (
          <Input
            id={id}
            name={field.name}
            type="text"
            placeholder={field.placeholder}
            defaultValue={field.value === null || field.value === undefined ? "" : String(field.value)}
            required={field.required}
            aria-describedby={describedBy}
            aria-invalid={error ? true : undefined}
          />
        )}
      </div>

      {field.help ? (
        <p id={`${id}-help`} className="mt-1.5 text-xs text-muted-foreground">
          {field.help}
        </p>
      ) : null}
      {error ? <FieldError id={`${id}-error`} message={error} /> : null}

      {field.translatable &&
      (field.type === "text" ||
        field.type === "textarea" ||
        field.type === "lines") ? (
        <TranslationField field={field} />
      ) : null}
    </div>
  );
}

function TranslationField({ field }: { field: FieldConfig }) {
  const id = `field-${field.name}-id`;
  const describedBy = field.help ? `${id}-help` : undefined;
  const defaultValue = field.translations?.id?.[field.name] ?? "";

  return (
    <div className="mt-3 border-l-2 border-border pl-3">
      <Label htmlFor={id} className="text-xs text-muted-foreground">
        {field.label} (Indonesian)
      </Label>

      <div className="mt-1.5">
        {field.type === "text" ? (
          <Input
            id={id}
            name={`tr_id_${field.name}`}
            type="text"
            defaultValue={defaultValue}
            aria-describedby={describedBy}
          />
        ) : (
          <Textarea
            id={id}
            name={`tr_id_${field.name}`}
            rows={field.rows ?? 4}
            defaultValue={defaultValue}
            aria-describedby={describedBy}
          />
        )}
      </div>

      {field.help ? (
        <p id={`${id}-help`} className="mt-1.5 text-xs text-muted-foreground">
          {field.help}
        </p>
      ) : null}
    </div>
  );
}

function FieldError({ id, message }: { id: string; message: string }) {
  return (
    <p id={id} className="mt-1.5 text-xs font-medium text-danger">
      {message}
    </p>
  );
}
