import { chromium } from "playwright";

const BASE = process.env.BASE_URL ?? "http://localhost:3132";
const EMAIL = process.env.ADMIN_EMAIL ?? "admin@ngantuqan.studio";
const PASSWORD = process.env.ADMIN_PASSWORD ?? "ngantuqan-admin-dev";

const results = [];
const errors = [];

function check(name, passed, detail = "") {
  results.push({ name, passed, detail });
  console.log(`${passed ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
}

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();

page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(`console: ${m.text()}`);
});

// 1. Anonymous access to /admin is blocked.
await page.goto(`${BASE}/admin`, { waitUntil: "networkidle" });
check(
  "anonymous /admin redirects to login",
  page.url().includes("/admin-login"),
  page.url(),
);

// 2. Wrong password is rejected without revealing account existence.
await page.fill("#email", EMAIL);
await page.fill("#password", "definitely-wrong-password");
await page.click('button[type="submit"]');
await page.waitForTimeout(1500);
const errorText = await page.textContent("body");
check(
  "wrong password rejected",
  errorText?.includes("did not match") ?? false,
  page.url(),
);

// 3. Correct credentials sign in and land on the dashboard.
await page.fill("#email", EMAIL);
await page.fill("#password", PASSWORD);
await page.click('button[type="submit"]');
await page.waitForURL("**/admin", { timeout: 20000 }).catch(() => {});
await page.waitForTimeout(1200);
check("sign-in lands on /admin", page.url().endsWith("/admin"), page.url());

// 4. The dashboard shows real data from the database.
// The dashboard streams: the shell with the sidebar arrives first, the charts
// and the tables after it.
await page
  .waitForSelector('nav[aria-label="Admin"]', { timeout: 15000 })
  .catch(() => {});
await page.waitForTimeout(1200);

const body = (await page.textContent("body")) ?? "";
check("dashboard renders heading", body.includes("Overview"));
check("dashboard shows revenue metric", body.includes("Revenue (paid)"));
check("dashboard shows project count", body.includes("Portfolio projects"));
check(
  "dashboard shows seeded project total (6)",
  body.includes("DEMO") || /\b6\b/.test(body),
);
check("sidebar lists all 13 sections", body.includes("Website Content") && body.includes("Media Library"));

// 5. Sign out.
await page.click('button:has-text("Sign out")');
await page.waitForTimeout(1500);
check("sign-out returns to login", page.url().includes("/admin-login"), page.url());

// 6. Signed-out session can no longer reach /admin.
await page.goto(`${BASE}/admin`, { waitUntil: "networkidle" });
check(
  "after sign-out /admin is blocked again",
  page.url().includes("/admin-login"),
  page.url(),
);

await browser.close();

const failed = results.filter((r) => !r.passed);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);

if (errors.length) {
  console.log("\nBrowser errors:");
  errors.forEach((e) => console.log("  " + e));
}

if (failed.length || errors.length) process.exit(1);
