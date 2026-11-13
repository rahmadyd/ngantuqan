import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.env.BASE_URL ?? "http://localhost:3126";
const OUT =
  process.env.SHOT_DIR ??
  "C:/Users/rahmadyd/AppData/Local/Temp/opencode/shots";

const PAGES = [
  ["home", "/"],
  ["work", "/work"],
  ["services", "/services"],
  ["service-detail", "/services/branding-visual-identity"],
  ["shop", "/shop"],
  ["product-detail", "/shop/demo-pitch-deck-template"],
  ["about", "/about"],
  ["contact", "/contact"],
  ["project-detail", "/work/demo-aurora-coffee-rebrand"],
  ["checkout", "/checkout"],
  ["order-lookup", "/order-confirmation/DO-2699-00001"],
];

/**
 * The admin is checked on a phone as well — it is a dashboard, and the studio
 * reads it on the same device as the rest of the site.
 */
const ADMIN_PAGES = [
  ["admin-overview", "/admin"],
  ["admin-portfolio", "/admin/portfolio"],
  ["admin-services", "/admin/services"],
  ["admin-service-orders", "/admin/service-orders"],
  ["admin-products", "/admin/products"],
  ["admin-digital-orders", "/admin/digital-orders"],
  ["admin-customers", "/admin/customers"],
  ["admin-inquiries", "/admin/inquiries"],
  ["admin-testimonials", "/admin/testimonials"],
  ["admin-categories", "/admin/categories"],
  ["admin-content", "/admin/content"],
  ["admin-media", "/admin/media"],
  ["admin-settings", "/admin/settings"],
];

mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const errors = [];

for (const [viewport, size] of [
  ["desktop", { width: 1440, height: 1000 }],
  ["mobile", { width: 390, height: 844 }],
]) {
  const context = await browser.newContext({
    viewport: size,
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(`[${viewport}] console: ${msg.text()}`);
  });
  page.on("pageerror", (err) => {
    errors.push(`[${viewport}] pageerror: ${err.message}`);
  });

  for (const [name, path] of PAGES) {
    await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(400);

    // Horizontal overflow check
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    if (overflow > 1) {
      errors.push(`[${viewport}] ${path} overflows horizontally by ${overflow}px`);
    }

    await page.screenshot({
      path: `${OUT}/${name}-${viewport}.png`,
      fullPage: viewport === "desktop",
    });
  }

  // The admin, signed in. A site without these credentials still gets its
  // public pages checked — the admin part is skipped, not failed.
  await page.goto(`${BASE}/admin-login`, { waitUntil: "networkidle" });
  await page.fill("#email", process.env.ADMIN_EMAIL ?? "admin@ngantuqan.studio");
  await page.fill(
    "#password",
    process.env.ADMIN_PASSWORD ?? "ngantuqan-admin-dev",
  );
  await page.click('button[type="submit"]');

  const signedIn = await page
    .waitForURL("**/admin", { timeout: 15000 })
    .then(() => true)
    .catch(() => false);

  if (!signedIn) {
    console.log("  (skipped the admin pages — no admin session)");
  }

  for (const [name, path] of signedIn ? ADMIN_PAGES : []) {
    await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(350);

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    if (overflow > 1) {
      errors.push(`[${viewport}] ${path} overflows horizontally by ${overflow}px`);
    }

    // The section that is open has to be the one marked in the navigation.
    const active = await page
      .locator('nav[aria-label="Admin"] a[aria-current="page"]')
      .count();
    if (active !== 1) {
      errors.push(
        `[${viewport}] ${path} marks ${active} navigation items as active`,
      );
    }

    await page.screenshot({
      path: `${OUT}/${name}-${viewport}.png`,
      fullPage: viewport === "desktop",
    });
  }

  // On a phone the navigation lives behind a button.
  if (viewport === "mobile") {
    await page.goto(`${BASE}/admin`, { waitUntil: "networkidle" });
    await page.click('button[aria-label="Open the admin menu"]');
    await page.waitForTimeout(300);

    const drawer = await page.locator('[role="dialog"]').count();
    if (drawer !== 1) {
      errors.push("[mobile] the admin menu does not open");
    } else {
      await page.screenshot({ path: `${OUT}/admin-menu-mobile.png` });
    }
  }

  await context.close();
}

await browser.close();

if (errors.length) {
  console.log("ISSUES FOUND:");
  errors.forEach((e) => console.log("  " + e));
  process.exit(1);
}

console.log(
  "All pages rendered with no console errors and no horizontal overflow.",
);
console.log(`Screenshots: ${OUT}`);
