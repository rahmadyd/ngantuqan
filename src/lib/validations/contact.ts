import { z } from "zod";

export const INQUIRY_TYPES = [
  { value: "GENERAL", label: "General inquiry" },
  { value: "DESIGN_SERVICE", label: "Design service" },
  { value: "COLLABORATION", label: "Collaboration" },
  { value: "PARTNERSHIP", label: "Partnership" },
  { value: "OTHER", label: "Other" },
] as const;

export const inquirySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Please enter your full name.")
    .max(120, "That name is too long."),
  email: z
    .string()
    .trim()
    .min(1, "Please enter your email address.")
    .email("Please enter a valid email address."),
  company: z
    .string()
    .trim()
    .max(160, "That company name is too long.")
    .optional()
    .or(z.literal("")),
  inquiryType: z.enum(
    ["GENERAL", "DESIGN_SERVICE", "COLLABORATION", "PARTNERSHIP", "OTHER"],
    { message: "Please choose an inquiry type." },
  ),
  subject: z
    .string()
    .trim()
    .min(3, "Please add a short subject.")
    .max(160, "That subject is too long."),
  message: z
    .string()
    .trim()
    .min(20, "Please tell us a little more. At least 20 characters.")
    .max(4000, "That message is too long."),
});

export type InquiryInput = z.infer<typeof inquirySchema>;
