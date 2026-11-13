import "server-only";

import { createHmac } from "node:crypto";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { fill } from "@/lib/i18n/format";

/**
 * Rate limiting for the public forms (spec §7, conflict C6).
 *
 * The limiter is Postgres-backed: `check_rate_limit` counts one request in a
 * single atomic statement and answers with the new count. The counter is not
 * held in memory, so it behaves the same on every serverless instance, and it
 * needs no vendor, no extra credential, and no Redis.
 *
 * The identifier is a hash of the client IP — the raw address never reaches
 * the database.
 *
 * The limiter fails open. If the database cannot be reached the request is
 * allowed through and the failure is logged: a broken limiter must not stop a
 * real customer from reaching the studio.
 */

export type RateLimitBucket =
  | "contact"
  | "order-brief"
  | "checkout"
  | "order-lookup"
  | "download";

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

const DEFAULT_MAX_REQUESTS = 5;
const DEFAULT_WINDOW_SECONDS = 600;

const ALLOWED: RateLimitResult = {
  allowed: true,
  remaining: DEFAULT_MAX_REQUESTS,
  retryAfterSeconds: 0,
};

/** The dictionary key each bucket's message lives under. */
const BUCKET_KEYS: Record<RateLimitBucket, keyof Dictionary["rateLimit"]> = {
  contact: "contact",
  "order-brief": "orderBrief",
  checkout: "checkout",
  "order-lookup": "orderLookup",
  download: "download",
};

function maxRequests() {
  const value = Number(process.env.RATE_LIMIT_MAX_REQUESTS);
  if (!Number.isFinite(value) || value < 1) return DEFAULT_MAX_REQUESTS;
  return Math.floor(value);
}

function windowSeconds() {
  const value = Number(process.env.RATE_LIMIT_WINDOW_SECONDS);
  if (!Number.isFinite(value) || value < 1) return DEFAULT_WINDOW_SECONDS;
  return Math.floor(value);
}

function secret() {
  return (
    process.env.RATE_LIMIT_SECRET ??
    process.env.ORDER_ACCESS_SECRET ??
    process.env.SUPABASE_SECRET_KEY ??
    "ngantuqan-local-development"
  );
}

/**
 * The client identity for this request.
 *
 * The hosting platform sets one of these headers, and the order puts the
 * platform-controlled header first so a client cannot spoof its own address.
 */
async function identifier() {
  const requestHeaders = await headers();

  const forwarded =
    requestHeaders.get("x-vercel-forwarded-for") ??
    requestHeaders.get("cf-connecting-ip") ??
    requestHeaders.get("x-real-ip") ??
    requestHeaders.get("x-forwarded-for") ??
    "unknown";

  const address = forwarded.split(",")[0]?.trim() || "unknown";

  return createHmac("sha256", secret()).update(address).digest("hex");
}

/** Counts one request against a bucket and reports whether it is allowed. */
export async function checkRateLimit(
  bucket: RateLimitBucket,
): Promise<RateLimitResult> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return ALLOWED;

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    // No service key — the site runs without a database, so there is nothing
    // to count against.
    return ALLOWED;
  }

  const { data, error } = await admin.rpc("check_rate_limit", {
    p_bucket: bucket,
    p_identifier: await identifier(),
    p_max_requests: maxRequests(),
    p_window_seconds: windowSeconds(),
  });

  if (error || !data?.length) {
    console.error("[rate-limit] check failed:", error?.message);
    return ALLOWED;
  }

  const row = data[0] as {
    allowed: boolean;
    remaining: number;
    retry_after_seconds: number;
  };

  return {
    allowed: Boolean(row.allowed),
    remaining: Number(row.remaining ?? 0),
    retryAfterSeconds: Number(row.retry_after_seconds ?? 0),
  };
}

/** A friendly, non-technical message for a throttled request. */
export function rateLimitMessage(
  bucket: RateLimitBucket,
  result: RateLimitResult,
  t: Dictionary,
): string {
  const minutes = Math.max(1, Math.ceil(result.retryAfterSeconds / 60));

  const body = t.rateLimit[BUCKET_KEYS[bucket]];
  const retry =
    minutes === 1 ? t.rateLimit.retryInOne : t.rateLimit.retryInMany;

  return `${body}. ${fill(retry, { minutes })}`;
}
