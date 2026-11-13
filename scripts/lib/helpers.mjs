/**
 * Shared helpers for the verification scripts.
 */
import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

export function loadEnv() {
  const raw = readFileSync(join(root, ".env.local"), "utf8");
  const env = {};
  for (const rawLine of raw.split(/\r?\n/)) {
    const line = rawLine.trim();
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match) env[match[1]] = match[2].trim();
  }
  return env;
}

export function serviceDb(env = loadEnv()) {
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
    auth: { persistSession: false },
  });
}

/**
 * Clears the rate limit counters for this machine.
 *
 * Every local request comes from the same address, so the public forms share
 * one allowance during a verification run. The counters are cleared first, so
 * one check cannot starve the next.
 */
export async function resetLocalLimits(env = loadEnv()) {
  const db = serviceDb(env);

  const secret =
    env.RATE_LIMIT_SECRET ?? env.ORDER_ACCESS_SECRET ?? env.SUPABASE_SECRET_KEY;

  const addresses = ["127.0.0.1", "::1", "::ffff:127.0.0.1"];

  const identifiers = addresses.map((address) =>
    createHmac("sha256", secret).update(address).digest("hex"),
  );

  await db.from("rate_limits").delete().in("identifier", identifiers);
}
