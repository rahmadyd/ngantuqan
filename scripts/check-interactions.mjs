import { chromium } from "playwright";

const BASE = process.env.BASE_URL ?? "http://localhost:3127";
const errors = [];

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await context.newPage();

page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(`console: ${m.text()}`);
});

// Mobile menu
await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
await page.getByRole("button", { name: "Open menu" }).click();
await page.waitForTimeout(400);

const dialogVisible = await page.getByRole("dialog", { name: "Site menu" }).isVisible();
console.log(`mobile menu opens: ${dialogVisible}`);

const bodyLocked = await page.evaluate(
  () => document.body.style.overflow === "hidden",
);
console.log(`body scroll locked while open: ${bodyLocked}`);

const navLinks = await page.getByRole("navigation", { name: "Mobile" }).getByRole("link").count();
console.log(`mobile nav links: ${navLinks}`);

await page.keyboard.press("Escape");
await page.waitForTimeout(400);
const closedByEscape = !(await page.getByRole("dialog", { name: "Site menu" }).isVisible().catch(() => false));
console.log(`closes on Escape: ${closedByEscape}`);

const bodyRestored = await page.evaluate(() => document.body.style.overflow !== "hidden");
console.log(`body scroll restored: ${bodyRestored}`);

// Keyboard focus visibility
await page.goto(`${BASE}/work`, { waitUntil: "networkidle" });
await page.keyboard.press("Tab");
const focusTag = await page.evaluate(() => document.activeElement?.tagName);
console.log(`first Tab focuses: ${focusTag}`);

// Filter interaction
await page.getByRole("button", { name: "Branding", exact: true }).click();
await page.waitForTimeout(900);
console.log(`URL after category filter: ${page.url()}`);
const cardCount = await page.locator("article").count();
console.log(`cards after filter: ${cardCount}`);

// Search interaction
await page.getByLabel("Search projects by title").fill("aurora");
await page.waitForTimeout(1200);
console.log(`URL after search: ${page.url()}`);
const searchCards = await page.locator("article").count();
console.log(`cards after search: ${searchCards}`);

// Cart interaction
await page.goto(`${BASE}/shop/demo-pitch-deck-template`, { waitUntil: "networkidle" });
await page.getByRole("button", { name: "Add to cart" }).click();
await page.waitForTimeout(400);
const cartLabel = await page.getByRole("button", { name: /Added to cart|Add to cart/ }).textContent();
console.log(`cart button feedback: ${cartLabel?.trim()}`);

await browser.close();

if (errors.length) {
  console.log("\nERRORS:");
  errors.forEach((e) => console.log("  " + e));
  process.exit(1);
}
console.log("\nNo console errors during interaction.");
