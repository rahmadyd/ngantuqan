import { chromium } from "playwright";

const BASE = process.env.BASE_URL ?? "http://localhost:3135";
const EMAIL = process.env.ADMIN_EMAIL ?? "admin@ngantuqan.studio";
const PASSWORD = process.env.ADMIN_PASSWORD ?? "ngantuqan-admin-dev";

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();

const failed = [];
page.on("response", (res) => {
  if (res.status() >= 400) failed.push(`${res.status()} ${res.url()}`);
});

await page.goto(`${BASE}/admin-login`, { waitUntil: "networkidle" });
await page.fill("#email", EMAIL);
await page.fill("#password", PASSWORD);
await page.click('button[type="submit"]');
await page.waitForURL("**/admin", { timeout: 20000 }).catch(() => {});
await page.waitForTimeout(2500);

await browser.close();

console.log(`Failed requests on /admin: ${failed.length}`);
[...new Set(failed)].forEach((f) => console.log("  " + f));
