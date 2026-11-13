import { chromium } from "playwright";

const BASE = process.env.BASE_URL ?? "http://localhost:3134";
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();

const failed = [];
page.on("response", (res) => {
  if (res.status() >= 400) failed.push(`${res.status()} ${res.url()}`);
});

for (const path of ["/", "/work", "/services", "/shop", "/about", "/contact", "/admin-login"]) {
  await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(300);
}

await browser.close();

console.log(`Failed requests: ${failed.length}`);
[...new Set(failed)].forEach((f) => console.log("  " + f));
