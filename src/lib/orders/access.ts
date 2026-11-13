import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Order access tokens (conflict C3).
 *
 * Guest checkout means there is no account to log into, so the customer
 * proves ownership of an order with the order number and the email address
 * they used. Once the server has checked that pair, it issues a short-lived
 * signed token so the order page can be rendered server-side without putting
 * the email address in the URL.
 *
 * The token is an HMAC over the order number, the email, and an expiry. It
 * proves nothing on its own: the order still has to exist and the email still
 * has to match, and both checks happen in the database.
 */

const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

function secret() {
  const value =
    process.env.ORDER_ACCESS_SECRET ?? process.env.SUPABASE_SECRET_KEY;

  if (!value) {
    throw new Error(
      "ORDER_ACCESS_SECRET is not configured, so order access tokens cannot be signed.",
    );
  }

  return value;
}

function base64url(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export interface OrderAccessPayload {
  orderNumber: string;
  email: string;
  expiresAt: number;
}

/** Issues a token for an order the caller has just proven they own. */
export function createOrderAccessToken(
  orderNumber: string,
  email: string,
): string {
  const payload: OrderAccessPayload = {
    orderNumber,
    email,
    expiresAt: Date.now() + TOKEN_TTL_SECONDS * 1000,
  };

  const encoded = base64url(JSON.stringify(payload));
  return `${encoded}.${sign(encoded)}`;
}

/**
 * Verifies a token.
 *
 * Returns the payload when the signature is intact and the token has not
 * expired, and null for anything else — a tampered token is simply not a
 * token.
 */
export function verifyOrderAccessToken(
  token: string | null | undefined,
  expectedOrderNumber?: string,
): OrderAccessPayload | null {
  if (!token) return null;

  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;

  const expected = sign(encoded);

  const given = Buffer.from(signature);
  const wanted = Buffer.from(expected);

  if (given.length !== wanted.length || !timingSafeEqual(given, wanted)) {
    return null;
  }

  let payload: OrderAccessPayload;
  try {
    payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
  } catch {
    return null;
  }

  if (typeof payload?.email !== "string" || typeof payload?.orderNumber !== "string") {
    return null;
  }

  if (payload.expiresAt < Date.now()) return null;

  if (expectedOrderNumber && payload.orderNumber !== expectedOrderNumber) {
    return null;
  }

  return payload;
}
