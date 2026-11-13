/**
 * Rate limiting verification (spec §7, conflict C6).
 *
 * The limiter is Postgres-backed, so this checks two things: that the
 * database function counts and blocks correctly, and that the public forms
 * are actually throttled through the browser — including that the client IP
 * is stored as a hash and never as an address.
 *
 * Run with:  node scripts/check-rate-limit.mjs
 * Needs the dev server (npm run dev) and the local Supabase stack.
 */
import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { chromium } from "playwright";

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
const MAX_REQUESTS = Number(env.RATE_LIMIT_MAX_REQUESTS ?? 5);
const STAMP = Date.now().toString(36).toUpperCase();
const TEST_IP = `203.0.113.${1 + Math.floor(Math.random() * 250)}`;
const TEST_EMAIL = `ratelimit-${STAMP.toLowerCase()}@example.com`;

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

async function hit(bucket, identifier, max, window = 60) {
  const { data, error } = await db.rpc("check_rate_limit", {
    p_bucket: bucket,
    p_identifier: identifier,
    p_max_requests: max,
    p_window_seconds: window,
  });
  return { row: data?.[0], error };
}

/* ------------------------------------------------------------------ */
/* The database function                                               */
/* ------------------------------------------------------------------ */

const bucket = `selftest-${STAMP}`;
const identifier = `selftest-${STAMP}`;

// The address the application hashes is the one the platform reports. The
// Next.js dev server reads `x-forwarded-for`, which the browser can set; the
// Cloudflare Workers runtime reports `cf-connecting-ip`, which it cannot.
const candidateAddresses = [TEST_IP, "127.0.0.1", "::1", "::ffff:127.0.0.1"];

const secret =
  env.RATE_LIMIT_SECRET ?? env.ORDER_ACCESS_SECRET ?? env.SUPABASE_SECRET_KEY;

const expectedIdentifiers = candidateAddresses.map((address) =>
  createHmac("sha256", secret).update(address).digest("hex"),
);

// A clean slate: the counter is shared with everything else running on this
// machine, so a previous run would otherwise use up the allowance.
await db.from("rate_limits").delete().in("identifier", expectedIdentifiers);

const first = await hit(bucket, identifier, 3);
check(
  "the first request is allowed",
  first.row?.allowed === true,
  first.error?.message ?? JSON.stringify(first.row),
);
check(
  "the remaining count is reported",
  first.row?.remaining === 2,
  JSON.stringify(first.row),
);

const second = await hit(bucket, identifier, 3);
check("the counter increments", second.row?.remaining === 1);

const third = await hit(bucket, identifier, 3);
check("the last request within the limit is allowed", third.row?.allowed === true);

const fourth = await hit(bucket, identifier, 3);
check(
  "the request over the limit is refused",
  fourth.row?.allowed === false,
  JSON.stringify(fourth.row),
);
check(
  "the refused request reports no remaining allowance",
  fourth.row?.remaining === 0,
);
check(
  "the refused request reports how long to wait",
  Number(fourth.row?.retry_after_seconds ?? 0) > 0,
  `${fourth.row?.retry_after_seconds}s`,
);

const other = await hit(bucket, `${identifier}-other`, 3);
check("another visitor has its own allowance", other.row?.allowed === true);

const otherBucket = await hit(`${bucket}-two`, identifier, 3);
check(
  "each form has its own counter",
  otherBucket.row?.allowed === true && otherBucket.row?.remaining === 2,
  JSON.stringify(otherBucket.row),
);

/* ------------------------------------------------------------------ */
/* The table is not reachable from the browser                         */
/* ------------------------------------------------------------------ */

const read = await anon.from("rate_limits").select("id").limit(1);
check(
  "an anonymous visitor cannot read the counters",
  (read.data?.length ?? 0) === 0,
  read.error?.message ?? `${read.data?.length ?? 0} rows visible`,
);

const write = await anon.from("rate_limits").insert({
  bucket: "spoof",
  identifier: "spoof",
  window_start: new Date().toISOString(),
  expires_at: new Date(Date.now() + 60000).toISOString(),
});
check(
  "an anonymous visitor cannot write to the counters",
  Boolean(write.error),
  write.error?.message ?? "insert accepted",
);

const anonCall = await anon.rpc("check_rate_limit", {
  p_bucket: "spoof",
  p_identifier: "spoof",
});
check(
  "an anonymous visitor cannot count requests",
  Boolean(anonCall.error),
  anonCall.error?.message ?? "the call was accepted",
);

/* ------------------------------------------------------------------ */
/* The public forms are throttled                                      */
/* ------------------------------------------------------------------ */

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  extraHTTPHeaders: { "x-forwarded-for": TEST_IP },
});
const page = await context.newPage();

const browserErrors = [];
page.on("pageerror", (error) => browserErrors.push(error.message));

async function sendInquiry(index) {
  await page.goto(`${BASE}/contact`, { waitUntil: "networkidle" });
  await page.fill("#name", `Rate Limit ${STAMP} ${index}`);
  await page.fill("#email", TEST_EMAIL);
  await page.fill("#subject", `Rate limit check ${index}`);
  await page.fill(
    "#message",
    "This message is part of the rate limit verification run and can be deleted.",
  );

  // The Workers runtime can be slow on a cold start, so the result is waited
  // for rather than assumed.
  await Promise.all([
    page.waitForResponse(
      (res) => res.request().method() === "POST" && res.url().includes("/contact"),
      { timeout: 30000 },
    ),
    page.click('button[type="submit"]'),
  ]);

  await page
    .waitForFunction(
      () =>
        document.body.innerText.includes("Message received") ||
        document.body.innerText.includes("try again in about"),
      { timeout: 30000 },
    )
    .catch(() => {});

  return (await page.locator("main").innerText()) ?? "";
}

for (let attempt = 1; attempt <= MAX_REQUESTS; attempt += 1) {
  const text = await sendInquiry(attempt);
  if (text.includes("Message received")) {
    if (attempt === 1) {
      check("the contact form accepts a message", true);
    }
  } else {
    check(`contact submission ${attempt} is accepted`, false, text.slice(0, 200));
  }
}
const afterAllowed = await db
  .from("inquiries")
  .select("id")
  .eq("email", TEST_EMAIL);

check(
  "every message within the limit is stored",
  (afterAllowed.data?.length ?? 0) === MAX_REQUESTS,
  `${afterAllowed.data?.length ?? 0} stored`,
);

const overLimit = await sendInquiry(MAX_REQUESTS + 1);

check(
  "the message over the limit is refused",
  overLimit.includes("try again in about"),
  overLimit.replace(/\s+/g, " ").slice(0, 220),
);
check(
  "the refusal is friendly, not technical",
  !/rate.?limit|429|too many requests/i.test(overLimit),
  overLimit.replace(/\s+/g, " ").slice(0, 220),
);

const afterBlocked = await db
  .from("inquiries")
  .select("id")
  .eq("email", TEST_EMAIL);

check(
  "the refused message is not stored",
  (afterBlocked.data?.length ?? 0) === MAX_REQUESTS,
  `${afterBlocked.data?.length ?? 0} stored`,
);

/* ------------------------------------------------------------------ */
/* The order lookup is throttled                                       */
/* ------------------------------------------------------------------ */

async function lookUpOrder() {
  await page.goto(`${BASE}/order-confirmation/DO-2699-99999`, {
    waitUntil: "networkidle",
  });
  await page.fill("#order_number", "DO-2699-99999");
  await page.fill("#email", "nobody@example.com");

  await Promise.all([
    page.waitForResponse(
      (res) =>
        res.request().method() === "POST" &&
        res.url().includes("/order-confirmation"),
      { timeout: 30000 },
    ),
    page.click('button[type="submit"]'),
  ]);

  await page
    .waitForFunction(
      () =>
        document.body.innerText.includes("could not find an order") ||
        document.body.innerText.includes("try again in about"),
      { timeout: 30000 },
    )
    .catch(() => {});

  return (await page.locator("main").innerText()) ?? "";
}

let lookupBlocked = "";

for (let attempt = 1; attempt <= MAX_REQUESTS; attempt += 1) {
  const text = await lookUpOrder();
  if (!text.includes("could not find an order")) {
    check(`order lookup ${attempt} reaches the database`, false, text.slice(0, 200));
  }
}

lookupBlocked = await lookUpOrder();
check(
  "the order lookup is refused after too many attempts",
  lookupBlocked.includes("try again in about"),
  lookupBlocked.replace(/\s+/g, " ").slice(0, 220),
);

/* ------------------------------------------------------------------ */
/* The address is stored as a hash                                     */
/* ------------------------------------------------------------------ */

const { data: rows } = await db
  .from("rate_limits")
  .select("bucket, identifier, request_count")
  .in("identifier", expectedIdentifiers);

check(
  "the client address is stored as a hash",
  (rows?.length ?? 0) > 0,
  `${rows?.length ?? 0} rows for the test address`,
);

const contactRow = rows?.find((row) => row.bucket === "contact");
check(
  "the contact form has its own bucket",
  Boolean(contactRow),
  JSON.stringify(rows?.map((row) => row.bucket)),
);
check(
  "the counter is above the limit after the run",
  Number(contactRow?.request_count ?? 0) > MAX_REQUESTS,
  String(contactRow?.request_count),
);
check(
  "the lookup has its own bucket",
  Boolean(rows?.find((row) => row.bucket === "order-lookup")),
  JSON.stringify(rows?.map((row) => row.bucket)),
);
check(
  "one address is one identifier across every bucket",
  new Set((rows ?? []).map((row) => row.identifier)).size === 1,
  JSON.stringify([...new Set((rows ?? []).map((row) => row.identifier))]),
);

const { data: anyRow } = await db.from("rate_limits").select("identifier").limit(500);
check(
  "no raw address is stored anywhere in the table",
  !(anyRow ?? []).some((row) => String(row.identifier).includes(TEST_IP)),
);

/* ------------------------------------------------------------------ */
/* Cleanup                                                             */
/* ------------------------------------------------------------------ */

await db.from("inquiries").delete().eq("email", TEST_EMAIL);
await db
  .from("rate_limits")
  .delete()
  .in("identifier", expectedIdentifiers);
await db
  .from("rate_limits")
  .delete()
  .eq("identifier", `${identifier}`)
  .eq("bucket", bucket);
await db.from("rate_limits").delete().eq("bucket", `${bucket}-two`);

await browser.close();

const passed = results.filter(Boolean).length;
console.log(`\n${passed}/${results.length} rate limit checks passed`);

if (browserErrors.length) {
  console.log("\nBrowser errors:");
  browserErrors.forEach((error) => console.log("  " + error));
}

if (passed !== results.length || browserErrors.length) {
  process.exit(1);
}
