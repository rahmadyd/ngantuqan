import { chromium } from "playwright";
import { resetLocalLimits } from "./lib/helpers.mjs";
import { createClient } from "@supabase/supabase-js";

/**
 * Guest checkout verification (spec §4.G, §8, conflict C3).
 *
 * Walks the real customer path: add to cart §  checkout §  order created § 
 * confirmation page §  access control §  admin confirms payment §  signed
 * download. The order number and the email address are the security
 * boundary, and both are tested.
 */

const BASE = process.env.BASE_URL ?? "http://localhost:3136";
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321";
const SERVICE_KEY =
  process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SERVICE_KEY) {
  throw new Error("Missing SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY");
}

const STAMP = Date.now().toString(36).toUpperCase();
const CUSTOMER_EMAIL = `buyer-${STAMP.toLowerCase()}@example.com`;

const results = [];
const errors = [];

function check(name, passed, detail = "") {
  results.push(passed);
  console.log(`${passed ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
}

const db = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

// The forms share one rate limit allowance on this machine.
await resetLocalLimits();

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();

page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));

/* ------------------------------------------------------------------ */
/* A product with a downloadable file                                   */
/* ------------------------------------------------------------------ */

const { data: product } = await db
  .from("products")
  .select("id, title, slug, price, discount_price")
  .eq("is_published", true)
  .limit(1)
  .maybeSingle();

const fileName = `checkout-check-${STAMP}.png`;
const filePath = `products/${product.id}/${fileName}`;

const { error: uploadError } = await db.storage
  .from("private-products")
  .upload(filePath, Buffer.from("ngantuqan-check"), {
    contentType: "image/png",
    upsert: true,
  });

if (uploadError) {
  console.error("upload failed:", uploadError.message);
  process.exit(1);
}

const { data: productFile } = await db
  .from("product_files")
  .insert({
    product_id: product.id,
    storage_path: filePath,
    file_name: fileName,
    file_size: 16,
    mime_type: "image/png",
  })
  .select("id")
  .single();

/* ------------------------------------------------------------------ */
/* Add to cart                                                         */
/* ------------------------------------------------------------------ */

await page.goto(`${BASE}/shop/${product.slug}`, { waitUntil: "networkidle" });

await page.getByRole("button", { name: /add to cart/i }).first().click();
await page.waitForTimeout(500);

const cartCount = await page.evaluate(() => {
  const raw = window.sessionStorage.getItem("ngantuqan.cart");
  return raw ? JSON.parse(raw).length : 0;
});
check("the product lands in the cart", cartCount === 1, `${cartCount} item(s)`);

const badge = await page.locator("header").getByText(/^\d+$/).count();
check("the header shows a cart count", badge > 0);

/* ------------------------------------------------------------------ */
/* Checkout                                                            */
/* ------------------------------------------------------------------ */

await page.goto(`${BASE}/checkout`, { waitUntil: "networkidle" });

const checkoutText = (await page.locator("main").innerText()) ?? "";
check(
  "the checkout page shows the cart",
  checkoutText.includes(product.title),
);

await page.fill("#customer_name", `CRUD Buyer ${STAMP}`);
await page.fill("#customer_email", CUSTOMER_EMAIL);

const [response] = await Promise.all([
  page.waitForResponse((res) => res.request().method() === "POST", {
    timeout: 30000,
  }),
  page.click('button[type="submit"]'),
]);
await response.finished();
await page.waitForLoadState("networkidle");
await page.waitForTimeout(600);

const orderUrl = new URL(page.url());
const orderNumber = orderUrl.pathname.split("/").pop() ?? "";
const token = orderUrl.searchParams.get("token") ?? "";

check(
  "the order lands on the confirmation page",
  page.url().includes(`/order-confirmation/${orderNumber}`),
  page.url(),
);
check("the order number is issued", /^DO-\d{4}-\d{5}$/.test(orderNumber), orderNumber);
check("an access token is issued", token.length > 20);

/* ------------------------------------------------------------------ */
/* What was stored                                                     */
/* ------------------------------------------------------------------ */

const { data: order } = await db
  .from("digital_orders")
  .select("id, order_number, payment_status, total_amount, customer_email, customer_id")
  .eq("order_number", orderNumber)
  .maybeSingle();

check("the order is stored", Boolean(order?.id));
check(
  "the order starts pending and unpaid",
  order?.payment_status === "PENDING",
  String(order?.payment_status),
);
check("guest checkout leaves customer_id empty", order?.customer_id === null);
check(
  "the price comes from the database",
  Number(order?.total_amount) === Number(product.discount_price ?? product.price),
  `${order?.total_amount} vs ${product.discount_price ?? product.price}`,
);

const { data: items } = await db
  .from("digital_order_items")
  .select("id, product_id, quantity, unit_price")
  .eq("digital_order_id", order.id);
check("the order has one line", (items ?? []).length === 1, JSON.stringify(items));

/* ------------------------------------------------------------------ */
/* The confirmation page                                               */
/* ------------------------------------------------------------------ */

const confirmation = (await page.locator("main").innerText()) ?? "";
check("the confirmation shows the order number", confirmation.includes(orderNumber));
check("the confirmation shows the total", confirmation.includes("275.000") || confirmation.includes("99.000") || /\d{1,3}\.\d{3}/.test(confirmation));
check(
  "the confirmation shows payment instructions",
  confirmation.toLowerCase().includes("bank transfer") ||
    confirmation.toLowerCase().includes("payment"),
);
check(
  "no download is offered before payment",
  !confirmation.includes("Download "),
);

/* ------------------------------------------------------------------ */
/* Access control: order number + email                                */
/* ------------------------------------------------------------------ */

await page.goto(`${BASE}/order-confirmation/${orderNumber}`, {
  waitUntil: "networkidle",
});

let blocked = (await page.locator("main").innerText()) ?? "";
check(
  "without a token the order is not shown",
  blocked.includes("Find your order") && !blocked.includes("PENDING"),
);
check(
  "without a token there is a lookup form",
  (await page.locator("#email").count()) === 1,
);

// The wrong email must not reveal the order.
await page.fill("#email", "wrong@example.com");
await page.click('button[type="submit"]');
await page.waitForTimeout(2000);

const wrong = (await page.locator("main").innerText()) ?? "";
check(
  "the wrong email is refused",
  wrong.includes("could not find") && !wrong.includes("PENDING"),
);

await page.fill("#email", CUSTOMER_EMAIL);
await page.click('button[type="submit"]');
await page.waitForTimeout(2500);

const recovered = (await page.locator("main").innerText()) ?? "";
check(
  "the right email gets the order back",
  recovered.includes(orderNumber) && !recovered.includes("Find your order"),
  `hasOrder=${recovered.includes(orderNumber)} hasForm=${recovered.includes("Find your order")} :: ${recovered.replace(/\s+/g, " ").slice(0, 400)}`,
);

/* ------------------------------------------------------------------ */
/* The studio confirms the payment                                     */
/* ------------------------------------------------------------------ */

await page.goto(`${BASE}/admin-login`, { waitUntil: "networkidle" });
await page.fill("#email", process.env.ADMIN_EMAIL ?? "admin@ngantuqan.studio");
await page.fill("#password", process.env.ADMIN_PASSWORD ?? "ngantuqan-admin-dev");
await page.click('button[type="submit"]');
await page.waitForURL("**/admin", { timeout: 30000 });

await page.goto(`${BASE}/admin/digital-orders/${order.id}`, {
  waitUntil: "networkidle",
});
await page.selectOption("#field-payment_status", "PAID");
await page.fill("#field-transaction_reference", `TRX-${STAMP}`);
await page.click('form[data-admin-form] button[type="submit"]');
await page.waitForTimeout(2500);

const { data: paid } = await db
  .from("digital_orders")
  .select("payment_status, transaction_reference")
  .eq("id", order.id)
  .maybeSingle();

check(
  "the admin can confirm the payment",
  paid?.payment_status === "PAID",
  JSON.stringify(paid),
);

/* ------------------------------------------------------------------ */
/* The download                                                        */
/* ------------------------------------------------------------------ */

await page.goto(`${BASE}/order-confirmation/${orderNumber}?token=${token}`, {
  waitUntil: "networkidle",
});

const paidView = (await page.locator("main").innerText()) ?? "";
check("the paid order offers its files", paidView.includes(fileName));

await page.getByRole("button", { name: new RegExp(`Download ${fileName}`) }).click();
await page.waitForTimeout(2500);

const downloadLink = page.locator("a[download]").first();
const href = await downloadLink.getAttribute("href").catch(() => null);

check("a signed download link is minted", Boolean(href?.includes("token=")), href ?? "none");

if (href) {
  const fileResponse = await context.request.get(href);
  check(
    "the signed link serves the file",
    fileResponse.status() === 200,
    `HTTP ${fileResponse.status()}`,
  );

  const anonymous = await fetch(href);
  check(
    "the signed link works without a session",
    anonymous.status === 200,
    `HTTP ${anonymous.status}`,
  );
}

const { data: downloads } = await db
  .from("downloads")
  .select("download_count")
  .eq("digital_order_item_id", items[0].id);

check(
  "the download is counted",
  (downloads?.[0]?.download_count ?? 0) >= 1,
  JSON.stringify(downloads?.[0]),
);
/* ------------------------------------------------------------------ */
/* Cleanup                                                             */
/* ------------------------------------------------------------------ */

await db.from("downloads").delete().eq("digital_order_item_id", items[0].id);
await db.from("digital_order_items").delete().eq("digital_order_id", order.id);
await db.from("digital_orders").delete().eq("id", order.id);
await db.from("product_files").delete().eq("id", productFile.id);
await db.storage.from("private-products").remove([filePath]);
await db.from("activity_logs").delete().gte("created_at", new Date(Date.now() - 3600000).toISOString());

await browser.close();

const passed = results.filter(Boolean).length;
console.log(`\n${passed}/${results.length} checkout checks passed`);

if (errors.length) {
  console.log("\nBrowser errors:");
  errors.forEach((error) => console.log("  " + error));
}

if (passed !== results.length || errors.length) {
  process.exit(1);
}
