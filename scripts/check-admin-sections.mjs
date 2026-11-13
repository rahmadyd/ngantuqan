import { chromium } from "playwright";

const BASE = process.env.BASE_URL ?? "http://localhost:3136";
const EMAIL = process.env.ADMIN_EMAIL ?? "admin@ngantuqan.studio";
const PASSWORD = process.env.ADMIN_PASSWORD ?? "ngantuqan-admin-dev";

const results = [];
const errors = [];

function check(name, passed, detail = "") {
  results.push(passed);
  console.log(`${passed ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
}

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();

const failedRequests = [];
page.on("response", (res) => {
  if (res.status() >= 400) failedRequests.push(`${res.status()} ${res.url()}`);
});
page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));

// Sign in.
await page.goto(`${BASE}/admin-login`, { waitUntil: "networkidle" });
await page.fill("#email", EMAIL);
await page.fill("#password", PASSWORD);
await page.click('button[type="submit"]');
await page.waitForURL("**/admin", { timeout: 20000 }).catch(() => {});
await page.waitForTimeout(1500);
check("signed in", page.url().endsWith("/admin"), page.url());

// Visit every admin section and confirm it renders with no failed requests.
const sections = [
  "/admin",
  "/admin/portfolio",
  "/admin/services",
  "/admin/service-orders",
  "/admin/products",
  "/admin/digital-orders",
  "/admin/customers",
  "/admin/inquiries",
  "/admin/testimonials",
  "/admin/categories",
  "/admin/content",
  "/admin/media",
  "/admin/settings",
];

const expectedHeadings = {
  "/admin": "Overview",
  "/admin/portfolio": "Portfolio",
  "/admin/services": "Services",
  "/admin/service-orders": "Service Orders",
  "/admin/products": "Digital Products",
  "/admin/digital-orders": "Digital Orders",
  "/admin/customers": "Customers",
  "/admin/inquiries": "Inquiries",
  "/admin/testimonials": "Testimonials",
  "/admin/categories": "Categories",
  "/admin/content": "Website Content",
  "/admin/media": "Media Library",
  "/admin/settings": "Settings",
};

for (const section of sections) {
  await page.goto(`${BASE}${section}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(300);
  const heading = await page
    .locator("h1")
    .first()
    .textContent()
    .catch(() => null);
  check(
    `${section} renders "${expectedHeadings[section]}"`,
    heading?.trim() === expectedHeadings[section],
    `got "${heading?.trim() ?? "none"}"`,
  );
}

// The admin tables must show real seeded data.
await page.goto(`${BASE}/admin/portfolio`, { waitUntil: "networkidle" });
const portfolioText = (await page.textContent("body")) ?? "";
check(
  "portfolio table shows seeded project",
  portfolioText.includes("Aurora Coffee Rebrand"),
);
check(
  "portfolio table shows publication status",
  portfolioText.includes("PUBLISHED"),
);

await page.goto(`${BASE}/admin/services`, { waitUntil: "networkidle" });
const servicesText = (await page.textContent("body")) ?? "";
check(
  "services table shows package pricing",
  servicesText.includes("Rp") && servicesText.includes("Full Identity"),
);

await page.goto(`${BASE}/admin/categories`, { waitUntil: "networkidle" });
const catText = (await page.textContent("body")) ?? "";
check(
  "categories table shows all three types",
  catText.includes("PORTFOLIO") &&
    catText.includes("PRODUCT") &&
    catText.includes("SERVICE"),
);

await browser.close();

const passed = results.filter(Boolean).length;
console.log(`\n${passed}/${results.length} admin checks passed`);

if (failedRequests.length) {
  console.log("\nFailed requests:");
  [...new Set(failedRequests)].forEach((f) => console.log("  " + f));
}
if (errors.length) {
  console.log("\nBrowser errors:");
  errors.forEach((e) => console.log("  " + e));
}

if (passed !== results.length || failedRequests.length || errors.length) {
  process.exit(1);
}
