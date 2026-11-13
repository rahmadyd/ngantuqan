/**
 * Field configuration shared by the admin forms.
 *
 * Keeping the shape of a field as data — rather than hand-writing a form per
 * entity — means every admin screen validates the same way and reports
 * errors the same way.
 */
export interface FieldOption {
  value: string;
  label: string;
}

export type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "select"
  | "checkbox"
  | "lines"
  | "media";

/** One asset from the media library, offered by the picker. */
export interface MediaAsset {
  id: string;
  bucket: string;
  path: string;
  fileName: string;
  altText: string | null;
  /** The address a browser can load, for the preview. */
  url: string | null;
}

export interface FieldConfig {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  help?: string;
  placeholder?: string;
  options?: FieldOption[];
  rows?: number;
  min?: number;
  step?: number;
  value?: string | number | boolean | null;
  /** The assets the picker offers, for a "media" field. */
  media?: MediaAsset[];
  /** The Indonesian wording of this field, keyed by locale then field name. */
  translations?: Record<string, Record<string, string>>;
  /** True when the field's wording is translated for the Indonesian site. */
  translatable?: boolean;
}

/**
 * Normalises stored translations for the admin form.
 *
 * Text values stay as text, while array values are joined by newlines so the
 * form can present them in the same textarea used for the English wording.
 */
export function normaliseFieldTranslations(
  value: unknown,
): Record<string, Record<string, string>> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  const normalised: Record<string, Record<string, string>> = {};

  for (const [locale, fields] of Object.entries(value)) {
    if (!fields || typeof fields !== "object" || Array.isArray(fields)) continue;

    const localeFields: Record<string, string> = {};

    for (const [field, fieldValue] of Object.entries(fields)) {
      if (Array.isArray(fieldValue)) {
        localeFields[field] = fieldValue.map(String).join("\n");
      } else if (typeof fieldValue === "string") {
        localeFields[field] = fieldValue;
      }
    }

    normalised[locale] = localeFields;
  }

  return normalised;
}
