/**
 * Payment provider verification (spec §8, conflict C7).
 *
 * The provider is an interface with one real implementation — the studio
 * confirming a bank transfer by hand — so this checks that:
 *   1. the checkout records which provider handled the order,
 *   2. the order page shows the studio's instructions,
 *   3. a forged callback cannot mark an order paid,
 *   4. the provider confirmation writes the order and an audit row,
 *   5. the studio's own confirmation still works and is audited.
 *
 * Run with:  node scripts/check-payments.mjs
 * Needs the dev server (npm run dev) and the local Supabase stack.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { chromium } from "playwright";
import { resetLocalLimits } from "./lib/helpers.mjs";

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

const BASE = process.env.BASE_URL ?? "http://localhost:3136";
const STAMP = Date.now().toString(36).toUpperCase();
const TEST_IP = `203.0.113.${120 + Math.floor(Math.random() * 120)}`;

const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false },
});

const anon = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  { auth: { persistSession: false } },
);

const results = [];
function check(name, passed, detail = "") {
  results.push(passed);
  console.log(`${passed ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
}

// The forms share one rate limit allowance on this machine.
await resetLocalLimits();

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  extraHTTPHeaders: { "x-forwarded-for": TEST_IP },
});
const page = await context.newPage();

const browserErrors = [];
page.on("pageerror", (error) => browserErrors.push(error.message));

/* ------------------------------------------------------------------ */
/* Checkout                                                            */
/* ------------------------------------------------------------------ */

const { data: product } = await db
  .from("products")
  .select("id, title, slug, price, discount_price")
  .eq("is_published", true)
  .limit(1)
  .maybeSingle();

await page.goto(`${BASE}/shop/${product.slug}`, { waitUntil: "networkidle" });
await page.getByRole("button", { name: /add to cart/i }).first().click();
await page.waitForTimeout(400);

await page.goto(`${BASE}/checkout`, { waitUntil: "networkidle" });
await page.fill("#customer_name", `Payment Buyer ${STAMP}`);
await page.fill("#customer_email", `payments-${STAMP.toLowerCase()}@example.com`);

await Promise.all([
  page.waitForResponse((res) => res.request().method() === "POST", {
    timeout: 30000,
  }),
  page.click('button[type="submit"]'),
]);

// The Workers runtime can be slow on a cold start, so the redirect is waited
// for rather than assumed.
await page.waitForURL(/\/order-confirmation\//, { timeout: 30000 });
await page.waitForLoadState("networkidle");
await page.waitForTimeout(600);

const orderNumber = new URL(page.url()).pathname.split("/").pop() ?? "";

const { data: order } = await db
  .from("digital_orders")
  .select("id, order_number, payment_status, payment_provider, total_amount")
  .eq("order_number", orderNumber)
  .maybeSingle();

check("the order is created", Boolean(order?.id), orderNumber);
check(
  "the order starts pending and unpaid",
  order?.payment_status === "PENDING",
  String(order?.payment_status),
);
check(
  "the order records the provider that handled it",
  order?.payment_provider === "manual",
  String(order?.payment_provider),
);
check(
  "the price comes from the database",
  Number(order?.total_amount) === Number(product.discount_price ?? product.price),
  `${order?.total_amount} vs ${product.discount_price ?? product.price}`,
);

const confirmation = (await page.locator("main").innerText()) ?? "";
check(
  "the order page shows the studio's payment instructions",
  confirmation.includes("Pay by bank transfer") ||
    confirmation.includes("bank transfer"),
  confirmation.replace(/\s+/g, " ").slice(0, 160),
);
check(
  "the order page does not offer a download before payment",
  !confirmation.includes("Your downloads"),
);

/* ------------------------------------------------------------------ */
/* A forged callback cannot pay an order                               */
/* ------------------------------------------------------------------ */

const forged = await context.request.post(`${BASE}/api/webhooks/payment/manual`, {
  data: {
    order_number: orderNumber,
    status: "PAID",
    amount: order?.total_amount,
  },
});
check(
  "the callback route refuses an unsigned callback",
  forged.status() === 400,
  `HTTP ${forged.status()}`,
);

const unknownProvider = await context.request.post(
  `${BASE}/api/webhooks/payment/not-a-provider`,
  { data: { order_number: orderNumber, status: "PAID" } },
);
check(
  "the callback route refuses an unknown provider",
  unknownProvider.status() === 404,
  `HTTP ${unknownProvider.status()}`,
);

const { data: afterForgery } = await db
  .from("digital_orders")
  .select("payment_status")
  .eq("id", order.id)
  .maybeSingle();

check(
  "the forged callback left the order unpaid",
  afterForgery?.payment_status === "PENDING",
  String(afterForgery?.payment_status),
);

// The browser holds the publishable key, so it must not be able to reach the
// function the provider path uses.
const browserRpc = await anon.rpc("confirm_digital_order_payment_from_provider", {
  p_order_number: orderNumber,
  p_provider: "manual",
});
check(
  "an anonymous visitor cannot confirm a payment",
  Boolean(browserRpc.error),
  browserRpc.error?.message ?? "the call was accepted",
);

/* ------------------------------------------------------------------ */
/* The provider path writes the order and an audit row                  */
/* ------------------------------------------------------------------ */

const providerConfirmation = await db.rpc(
  "confirm_digital_order_payment_from_provider",
  {
    p_order_number: orderNumber,
    p_transaction_reference: `PROVIDER-${STAMP}`,
    p_provider: "manual",
  },
);
check(
  "the service role can apply a verified payment",
  providerConfirmation.data === true,
  providerConfirmation.error?.message ?? String(providerConfirmation.data),
);

const { data: paidOrder } = await db
  .from("digital_orders")
  .select("payment_status, transaction_reference")
  .eq("id", order.id)
  .maybeSingle();

check(
  "the order becomes paid",
  paidOrder?.payment_status === "PAID",
  String(paidOrder?.payment_status),
);
check(
  "the provider reference is stored",
  paidOrder?.transaction_reference === `PROVIDER-${STAMP}`,
  String(paidOrder?.transaction_reference),
);

const { data: logs } = await db
  .from("activity_logs")
  .select("action, admin_id, metadata")
  .eq("entity_type", "digital_order")
  .eq("entity_id", order.id);

const providerLog = (logs ?? []).find(
  (row) => row.action === "payment_confirmed",
);
check(
  "the payment is audited",
  Boolean(providerLog),
  JSON.stringify(logs),
);
check(
  "the audit row names the provider",
  providerLog?.metadata?.provider === "manual" &&
    providerLog?.metadata?.source === "provider_callback",
  JSON.stringify(providerLog?.metadata),
);
check(
  "the audit row has no admin, because nobody clicked",
  providerLog?.admin_id === null,
  String(providerLog?.admin_id),
);

/* ------------------------------------------------------------------ */
/* The studio confirms a payment by hand                               */
/* ------------------------------------------------------------------ */

await page.goto(`${BASE}/admin-login`, { waitUntil: "networkidle" });
await page.fill("#email", process.env.ADMIN_EMAIL ?? "admin@ngantuqan.studio");
await page.fill("#password", process.env.ADMIN_PASSWORD ?? "ngantuqan-admin-dev");
await page.click('button[type="submit"]');
await page.waitForURL("**/admin", { timeout: 30000 });

// A second order to confirm by hand, so the provider path and the admin path
// are checked separately.
const { data: byHand } = await db
  .from("digital_orders")
  .insert({
    customer_name: `By Hand ${STAMP}`,
    customer_email: `byhand-${STAMP.toLowerCase()}@example.com`,
    subtotal: 1000,
    total_amount: 1000,
    payment_status: "PENDING",
    payment_provider: "manual",
  })
  .select("id, order_number")
  .single();

await page.goto(`${BASE}/admin/digital-orders/${byHand.id}`, {
  waitUntil: "networkidle",
});
await page.selectOption("#field-payment_status", "PAID");
await page.fill("#field-transaction_reference", `BANK-${STAMP}`);
await page.click('form[data-admin-form] button[type="submit"]');
await page.waitForTimeout(2500);

const { data: confirmed } = await db
  .from("digital_orders")
  .select("payment_status, transaction_reference")
  .eq("id", byHand.id)
  .maybeSingle();

check(
  "the studio can confirm a payment by hand",
  confirmed?.payment_status === "PAID",
  JSON.stringify(confirmed),
);
check(
  "the transfer reference is stored",
  confirmed?.transaction_reference === `BANK-${STAMP}`,
  String(confirmed?.transaction_reference),
);

const { data: adminLogs } = await db
  .from("activity_logs")
  .select("action, admin_id")
  .eq("entity_type", "digital_order")
  .eq("entity_id", byHand.id);

check(
  "the studio's confirmation is audited with their account",
  (adminLogs ?? []).some((row) => row.action === "payment_update" && row.admin_id),
  JSON.stringify(adminLogs),
);

/* ------------------------------------------------------------------ */
/* Cleanup                                                             */
/* ------------------------------------------------------------------ */

await db.from("activity_logs").delete().eq("entity_type", "digital_order").in("entity_id", [order.id, byHand.id]);
await db.from("digital_order_items").delete().eq("digital_order_id", order.id);
await db.from("digital_orders").delete().eq("id", order.id);
await db.from("digital_orders").delete().eq("id", byHand.id);

await browser.close();

const passed = results.filter(Boolean).length;
console.log(`\n${passed}/${results.length} payment checks passed`);

if (browserErrors.length) {
  console.log("\nBrowser errors:");
  browserErrors.forEach((error) => console.log("  " + error));
}

if (passed !== results.length || browserErrors.length) {
  process.exit(1);
}
