/**
 * The Stripe callback path (spec §8, conflict C7).
 *
 * The payment itself needs a Stripe account — this checks the part that must
 * never be wrong: a callback is only believed when its signature checks out,
 * and a believed callback marks the order paid and writes the audit row.
 *
 * The payload is signed with the same secret the app reads from
 * STRIPE_WEBHOOK_SECRET, so the whole path is exercised without a Stripe
 * account: the signature is real, the event is ours.
 *
 * Run with:  node scripts/check-stripe.mjs
 */
import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnv() {
  const raw = readFileSync(join(root, ".env.local"), "utf8");
  const env = {};
  for (const rawLine of raw.split(/\r?\n/)) {
    const line = rawLine.trim();
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match) env[match[1]] = match[2].trim();
  }
  return env;
}

const env = loadEnv();

const BASE = process.env.BASE_URL ?? "http://127.0.0.1:8787";
const WEBHOOK_SECRET = env.STRIPE_WEBHOOK_SECRET ?? "";
const STAMP = Date.now().toString(36).toUpperCase();

const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false },
});

const results = [];
function check(name, passed, detail = "") {
  results.push(passed);
  console.log(`${passed ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
}

/** Stripe's signature: HMAC-SHA256 over "timestamp.body". */
function sign(body, secret, timestamp = Math.floor(Date.now() / 1000)) {
  const signature = createHmac("sha256", secret)
    .update(`${timestamp}.${body}`)
    .digest("hex");

  return `t=${timestamp},v1=${signature}`;
}

function stripeEvent(orderNumber, paid = true) {
  return JSON.stringify({
    id: `evt_${STAMP}`,
    type: "checkout.session.completed",
    data: {
      object: {
        id: `cs_test_${STAMP}`,
        object: "checkout.session",
        payment_status: paid ? "paid" : "unpaid",
        payment_intent: `pi_test_${STAMP}`,
        client_reference_id: orderNumber,
        metadata: { order_number: orderNumber },
      },
    },
  });
}

/* ------------------------------------------------------------------ */
/* An order waiting for its payment                                    */
/* ------------------------------------------------------------------ */

const { data: order } = await db
  .from("digital_orders")
  .insert({
    customer_name: `Stripe ${STAMP}`,
    customer_email: `stripe-${STAMP.toLowerCase()}@example.com`,
    subtotal: 99000,
    total_amount: 99000,
    payment_status: "PENDING",
    payment_provider: "stripe",
  })
  .select("id, order_number, payment_status")
  .single();

check("stripe: the order is waiting for its payment", Boolean(order?.id), order?.order_number);

/* ------------------------------------------------------------------ */
/* A forged callback is refused                                        */
/* ------------------------------------------------------------------ */

const forged = await fetch(`${BASE}/api/webhooks/payment/stripe`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "stripe-signature": `t=${Math.floor(Date.now() / 1000)},v1=deadbeef`,
  },
  body: stripeEvent(order.order_number),
});

check("stripe: a forged callback is refused", forged.status === 400, `HTTP ${forged.status}`);

const { data: afterForgery } = await db
  .from("digital_orders")
  .select("payment_status")
  .eq("id", order.id)
  .maybeSingle();

check(
  "stripe: the forged callback left the order unpaid",
  afterForgery?.payment_status === "PENDING",
  String(afterForgery?.payment_status),
);

/* ------------------------------------------------------------------ */
/* A signed callback is believed                                       */
/* ------------------------------------------------------------------ */

const body = stripeEvent(order.order_number);

const signed = await fetch(`${BASE}/api/webhooks/payment/stripe`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "stripe-signature": sign(body, WEBHOOK_SECRET),
  },
  body,
});

check("stripe: a signed callback is accepted", signed.status === 200, `HTTP ${signed.status}`);

const { data: afterCallback } = await db
  .from("digital_orders")
  .select("payment_status, transaction_reference")
  .eq("id", order.id)
  .maybeSingle();

check(
  "stripe: the order becomes paid",
  afterCallback?.payment_status === "PAID",
  String(afterCallback?.payment_status),
);
check(
  "stripe: the payment reference is stored",
  afterCallback?.transaction_reference === `pi_test_${STAMP}`,
  String(afterCallback?.transaction_reference),
);

const { data: logs } = await db
  .from("activity_logs")
  .select("action, entity_type, metadata")
  .eq("entity_type", "digital_order")
  .eq("entity_id", order.id);

check(
  "stripe: the payment is audited",
  (logs ?? []).some((row) => row.action === "payment_confirmed"),
  JSON.stringify(logs),
);

/* ------------------------------------------------------------------ */
/* A callback that is too old is refused                                */
/* ------------------------------------------------------------------ */

const stale = await fetch(`${BASE}/api/webhooks/payment/stripe`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "stripe-signature": sign(
      stripeEvent(order.order_number),
      WEBHOOK_SECRET,
      Math.floor(Date.now() / 1000) - 3600,
    ),
  },
  body: stripeEvent(order.order_number),
});

check("stripe: an old callback is refused", stale.status === 400, `HTTP ${stale.status}`);

/* ------------------------------------------------------------------ */
/* Cleanup                                                             */
/* ------------------------------------------------------------------ */

await db.from("activity_logs").delete().eq("entity_type", "digital_order").eq("entity_id", order.id);
await db.from("digital_orders").delete().eq("id", order.id);

const passed = results.filter(Boolean).length;
console.log(`\n${passed}/${results.length} stripe checks passed`);

if (passed !== results.length) {
  process.exit(1);
}
