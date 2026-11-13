import { chromium } from "playwright";
import { resetLocalLimits } from "./lib/helpers.mjs";
import { createClient } from "@supabase/supabase-js";

/**
 * Order brief verification (spec §4.J).
 *
 * Walks the real customer path: service page §  brief form §  confirmation,
 * then checks the database, the private attachment, and the admin view.
 */

const BASE = process.env.BASE_URL ?? "http://localhost:3136";
const SUPAABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321";
const SERVICE_KEY =
  process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SERVICE_KEY) {
  throw new Error("Missing SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY");
}

const STAMP = Date.now().toString(36).toUpperCase();
const CUSTOMER_EMAIL = `brief-${STAMP.toLowerCase()}@example.com`;

const results = [];
const errors = [];

function check(name, passed, detail = "") {
  results.push(passed);
  console.log(`${passed ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
}

const db = createClient(SUPAABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

// The forms share one rate limit allowance on this machine.
await resetLocalLimits();

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();

page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));

/* ------------------------------------------------------------------ */
/* The service page links to the brief form                            */
/* ------------------------------------------------------------------ */

await page.goto(`${BASE}/services`, { waitUntil: "networkidle" });

const { data: service } = await db
  .from("services")
  .select("id, slug, title")
  .eq("is_active", true)
  .limit(1)
  .maybeSingle();

const { data: pkg } = await db
  .from("service_packages")
  .select("id, name")
  .eq("service_id", service.id)
  .eq("is_active", true)
  .limit(1)
  .maybeSingle();

await page.goto(`${BASE}/services/${service.slug}`, { waitUntil: "networkidle" });

const cta = await page
  .locator(`a[href="/order/${service.slug}"]`)
  .count()
  .catch(() => 0);
check("service page links to the brief form", cta > 0, `${cta} link(s)`);

/* ------------------------------------------------------------------ */
/* The brief form                                                      */
/* ------------------------------------------------------------------ */

await page.goto(`${BASE}/order/${service.slug}?package=${pkg?.id ?? ""}`, {
  waitUntil: "networkidle",
});

check(
  "brief page renders the service",
  ((await page.textContent("body")) ?? "").includes(service.title),
);

const preselected = await page
  .locator("#package_id")
  .inputValue()
  .catch(() => "");
check(
  "package from the query string is pre-selected",
  preselected === (pkg?.id ?? ""),
  preselected,
);

// Validation has to run before anything is written.
await page.fill("#customer_name", "A");
await page.fill("#customer_email", "not-an-email");
await page.fill(
  "#project_description",
  "Too short.",
);
await page.click('button[type="submit"]');
await page.waitForTimeout(1200);

const validationText = (await page.textContent("body")) ?? "";
check(
  "invalid brief is rejected with messages",
  validationText.includes("valid email address") ||
    validationText.includes("at least 30 characters"),
);

const { count: beforeCount } = await db
  .from("service_orders")
  .select("id", { count: "exact", head: true })
  .eq("customer_email", CUSTOMER_EMAIL);
check("rejected brief writes nothing", (beforeCount ?? 0) === 0);

// React resets an uncontrolled form after its action resolves — what was
// typed has to survive the round trip.
const keptDescription = await page
  .locator("#project_description")
  .inputValue()
  .catch(() => "");
check(
  "the brief keeps what was typed after a validation error",
  keptDescription.trim() === "Too short.",
  keptDescription,
);

/* ------------------------------------------------------------------ */
/* A valid brief                                                       */
/* ------------------------------------------------------------------ */

await page.fill("#customer_name", `CRUD Customer ${STAMP}`);
await page.fill("#customer_email", CUSTOMER_EMAIL);
await page.fill(
  "#project_description",
  "We need a full brand identity for a new coffee roastery, including a logo, a packaging set, and a small style guide.",
);
await page.fill("#target_audience", "Specialty coffee drinkers in Jakarta.");
await page.fill("#design_references", "https://example.com/reference");
await page.fill("#preferred_colors", "Warm neutrals, one deep green.");
await page.fill("#requested_deliverables", "Print-ready packaging files.");
await page.fill("#budget", "15000000");
await page.fill("#deadline", "2026-12-01");

await page.setInputFiles("#reference_file", {
  name: "brief-reference.png",
  mimeType: "image/png",
  buffer: Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    "base64",
  ),
});

const [response] = await Promise.all([
  page.waitForResponse(
    (res) => res.request().method() === "POST",
    { timeout: 30000 },
  ),
  page.click('button[type="submit"]'),
]);
await response.finished();
await page.waitForLoadState("networkidle");
await page.waitForTimeout(600);

check(
  "valid brief lands on the confirmation page",
  page.url().includes(`/order/${service.slug}/submitted`),
  page.url(),
);

const orderNumber = new URL(page.url()).searchParams.get("order") ?? "";
check("confirmation page carries an order reference", /^SO-\d{4}-\d{5}$/.test(orderNumber), orderNumber);

/* ------------------------------------------------------------------ */
/* What was stored                                                     */
/* ------------------------------------------------------------------ */

const { data: order } = await db
  .from("service_orders")
  .select(
    "id, order_number, order_status, payment_status, customer_name, customer_email, service_id, package_id, project_description, target_audience, design_references, preferred_colors, requested_deliverables, budget, deadline",
  )
  .eq("customer_email", CUSTOMER_EMAIL)
  .maybeSingle();

check("brief is stored in the database", Boolean(order?.id));
check(
  "brief starts as a new inquiry, unpaid",
  order?.order_status === "NEW_INQUIRY" && order?.payment_status === "PENDING",
  `${order?.order_status}/${order?.payment_status}`,
);
check("brief keeps the deliverables the client asked for", order?.requested_deliverables === "Print-ready packaging files.");
check("brief keeps the budget", Number(order?.budget) === 15000000);
check("brief keeps the deadline", order?.deadline === "2026-12-01");
check("brief links the service", order?.service_id === service.id);
check(
  "brief links the package",
  order?.package_id === (pkg?.id ?? null),
  `stored=${order?.package_id} expected=${pkg?.id}`,
);

const { data: history } = await db
  .from("order_status_history")
  .select("new_status, note")
  .eq("order_id", order.id)
  .limit(1);
check(
  "status history records the submission",
  history?.[0]?.new_status === "NEW_INQUIRY",
  JSON.stringify(history?.[0]),
);

const { data: attachments } = await db
  .from("order_attachments")
  .select("file_name, file_path, file_type, file_size")
  .eq("order_id", order.id);
check("reference file is registered", (attachments ?? []).length === 1, JSON.stringify(attachments));

const attachmentPath = attachments?.[0]?.file_path ?? "";
const { data: storedFiles } = await db.storage
  .from("private-attachments")
  .list(`orders/${order.id}`);
check(
  "reference file is in private storage",
  (storedFiles ?? []).some((file) => file.id && file.name === attachmentPath.split("/").pop()),
);

/* ------------------------------------------------------------------ */
/* The confirmation page must not leak the brief                        */
/* ------------------------------------------------------------------ */

const confirmation = (await page.textContent("body")) ?? "";
check("confirmation shows the reference", confirmation.includes(orderNumber));
check(
  "confirmation does not expose the customer email",
  !confirmation.includes(CUSTOMER_EMAIL),
);
check(
  "confirmation does not expose the customer name",
  !confirmation.includes(`CRUD Customer ${STAMP}`),
);
check(
  "confirmation does not expose the brief",
  !confirmation.includes("specialty coffee roastery"),
);
check(
  "confirmation does not expose the budget",
  !confirmation.includes("15.000.000"),
);

/* ------------------------------------------------------------------ */
/* The studio sees it                                                   */
/* ------------------------------------------------------------------ */

await page.goto(`${BASE}/admin-login`, { waitUntil: "networkidle" });
await page.fill("#email", process.env.ADMIN_EMAIL ?? "admin@ngantuqan.studio");
await page.fill("#password", process.env.ADMIN_PASSWORD ?? "ngantuqan-admin-dev");
await page.click('button[type="submit"]');
await page.waitForURL("**/admin", { timeout: 30000 });
await page.goto(`${BASE}/admin/service-orders`, { waitUntil: "networkidle" });

const adminView = (await page.textContent("body")) ?? "";
check("the order shows up in the admin dashboard", adminView.includes(orderNumber));

await page.goto(`${BASE}/admin/service-orders/${order.id}`, { waitUntil: "networkidle" });
const adminDetail = (await page.textContent("body")) ?? "";
check(
  "the admin sees the submitted brief",
  adminDetail.includes("coffee roastery"),
);
check(
  "the admin sees the attached reference file",
  adminDetail.includes("brief-reference.png"),
);

/* ------------------------------------------------------------------ */
/* Cleanup                                                             */
/* ------------------------------------------------------------------ */

if (attachmentPath) {
  await db.storage.from("private-attachments").remove([attachmentPath]);
}
await db.from("order_attachments").delete().eq("order_id", order.id);
await db.from("order_status_history").delete().eq("order_id", order.id);
await db.from("service_orders").delete().eq("id", order.id);

await browser.close();

const passed = results.filter(Boolean).length;
console.log(`\n${passed}/${results.length} order checks passed`);

if (errors.length) {
  console.log("\nBrowser errors:");
  errors.forEach((error) => console.log("  " + error));
}

if (passed !== results.length || errors.length) {
  process.exit(1);
}
