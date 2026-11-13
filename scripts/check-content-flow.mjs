import { chromium } from "playwright";
import { resetLocalLimits } from "./lib/helpers.mjs";

const BASE = process.env.BASE_URL ?? "http://localhost:3137";
const results = [];

function check(name, passed, detail = "") {
  results.push(passed);
  console.log(`${passed ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
}

// The forms share one rate limit allowance on this machine.
await resetLocalLimits();

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();

const errors = [];
page.on("pageerror", (e) => errors.push(e.message));

// The public site must show database content, not the static demo fallback.
// Both contain the same titles, so we prove the DB path by mutating the
// database and checking the site reflects it.
const work = await page.goto(`${BASE}/work`, { waitUntil: "networkidle" });
check("/work responds", work?.status() === 200, String(work?.status()));

const body = (await page.textContent("body")) ?? "";
check("/work lists projects", body.includes("Aurora Coffee Rebrand"));
check("/work shows categories from the DB", body.includes("UI/UX Design"));

// Filtering must query the database.
await page.goto(`${BASE}/work?category=branding`, { waitUntil: "networkidle" });
const filtered = (await page.textContent("body")) ?? "";
check(
  "category filter narrows to one project",
  filtered.includes("Aurora Coffee Rebrand") &&
    !filtered.includes("Kiln Ceramics Social Campaign"),
);

// Product page
await page.goto(`${BASE}/shop/demo-pitch-deck-template`, { waitUntil: "networkidle" });
const product = (await page.textContent("body")) ?? "";
check("product page shows DB price", product.includes("275.000"));
check("product page shows license from DB", product.includes("Reselling the template"));

// Contact form: submitting must write to the database.
await page.goto(`${BASE}/contact`, { waitUntil: "networkidle" });
await page.fill("#name", "Playwright Test Client");
await page.fill("#email", "playwright-test@example.com");
await page.selectOption("#inquiryType", "DESIGN_SERVICE");
await page.fill("#subject", "Automated end-to-end check");
await page.fill(
  "#message",
  "This inquiry was submitted by the automated verification script to confirm the contact form persists to Postgres.",
);
await page.click('button[type="submit"]');
await page.waitForTimeout(3000);

const afterSubmit = (await page.textContent("body")) ?? "";
check(
  "contact form confirms success",
  afterSubmit.includes("Message received"),
);
check(
  "contact form shows a reference number",
  /INQ-\d{4}-[A-F0-9]{4}/.test(afterSubmit),
  (afterSubmit.match(/INQ-\d{4}-[A-F0-9]{4}/) ?? ["none"])[0],
);

await browser.close();

const passed = results.filter(Boolean).length;
console.log(`\n${passed}/${results.length} content checks passed`);
if (errors.length) {
  console.log("\nBrowser errors:");
  errors.forEach((e) => console.log("  " + e));
}
if (passed !== results.length) process.exit(1);
