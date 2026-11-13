import { z } from "zod";

/**
 * The project brief form (spec §4.J).
 *
 * The client sends field values only. The service and package are resolved
 * server-side from the ids in the form, and the server checks that the
 * package actually belongs to the service before it stores anything.
 *
 * Every field stays a string here — the same schema validates the browser
 * form and the server action, and the action converts to the column types.
 */

const optionalText = (max: number, message: string) =>
  z.string().trim().max(max, message).optional().or(z.literal(""));

export const orderBriefSchema = z.object({
  customer_name: z
    .string()
    .trim()
    .min(2, "Please enter your name.")
    .max(120, "That name is too long."),
  customer_email: z
    .string()
    .trim()
    .min(1, "Please enter your email address.")
    .email("Please enter a valid email address."),
  service_id: z.string().uuid("That service could not be found."),
  package_id: z
    .union([z.literal(""), z.string().uuid()])
    .optional()
    .or(z.literal("")),
  project_description: z
    .string()
    .trim()
    .min(30, "Tell us a little more about the project. At least 30 characters.")
    .max(4000, "That description is too long."),
  target_audience: optionalText(
    1000,
    "That audience description is too long.",
  ),
  design_references: optionalText(2000, "Those references are too long."),
  preferred_colors: optionalText(1000, "That colour note is too long."),
  requested_deliverables: optionalText(
    2000,
    "That deliverables note is too long.",
  ),
  budget: z
    .union([
      z.literal(""),
      z.string().regex(/^\d+$/, "A budget must be a whole number."),
    ])
    .optional()
    .or(z.literal("")),
  deadline: z
    .union([
      z.literal(""),
      z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use the format YYYY-MM-DD."),
    ])
    .optional()
    .or(z.literal("")),
});

export type OrderBriefInput = z.infer<typeof orderBriefSchema>;

/** Reference files the client may attach to a brief. */
export const REFERENCE_FILE_MAX_BYTES = 10 * 1024 * 1024;
