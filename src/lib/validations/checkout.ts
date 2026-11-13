import { z } from "zod";

/**
 * Checkout validation (spec §4.G, §8).
 *
 * The cart arrives as a JSON string of product ids and quantities. Prices are
 * never trusted from the client — `record_purchase` reads them from the
 * products table.
 */

export const cartItemSchema = z.object({
  product_id: z.string().uuid("That product could not be found."),
  quantity: z.coerce.number().int().min(1).max(20),
});

export const cartSchema = z
  .array(cartItemSchema)
  .min(1, "Your cart is empty.")
  .max(20, "That is more items than we can process in one order.");

export const checkoutSchema = z.object({
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
  cart: z.string().min(2, "Your cart is empty."),
});

export const orderAccessSchema = z.object({
  order_number: z
    .string()
    .trim()
    .regex(/^DO-\d{4}-\d{5}$/i, "That does not look like an order number."),
  email: z
    .string()
    .trim()
    .min(1, "Please enter your email address.")
    .email("Please enter a valid email address."),
});

export const downloadRequestSchema = z.object({
  order_number: z
    .string()
    .trim()
    .regex(/^DO-\d{4}-\d{5}$/i, "That does not look like an order number."),
  email: z.string().trim().email("Please enter a valid email address."),
  token: z.string().min(10),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type OrderAccessInput = z.infer<typeof orderAccessSchema>;
