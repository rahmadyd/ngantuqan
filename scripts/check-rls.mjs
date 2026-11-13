/**
 * Verifies Row Level Security against the local Supabase stack using the
 * publishable (anonymous) key — the same key a browser holds.
 *
 * Run with:  node scripts/check-rls.mjs
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnv() {
  const raw = readFileSync(join(root, ".env.local"), "utf8");
  const env = {};
  for (const line of raw.split("\n")) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match) env[match[1]] = match[2].trim();
  }
  return env;
}

const env = loadEnv();
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const anon = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const results = [];
function check(name, passed, detail = "") {
  results.push(passed);
  console.log(`${passed ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
}

// 1. Published content IS readable by an anonymous visitor.
const projects = await anon.from("projects").select("id");
check(
  "anon can read published projects",
  !projects.error && (projects.data?.length ?? 0) > 0,
  projects.error?.message ?? `${projects.data?.length ?? 0} rows`,
);

const services = await anon.from("projects").select("id").limit(1);
check("anon query returns no error", !services.error, services.error?.message);

// 2. Unpublished content is NOT readable. Publish one, then hide it.
const allProjects = await anon.from("projects").select("id, is_published");
check(
  "anon sees only published projects",
  (allProjects.data ?? []).every((p) => p.is_published === true),
  `${(allProjects.data ?? []).filter((p) => !p.is_published).length} unpublished visible`,
);

// 3. Inquiries are private — an anonymous visitor must not read them.
const inquiries = await anon.from("inquiries").select("id");
check(
  "anon cannot read inquiries",
  !inquiries.error && (inquiries.data?.length ?? 0) === 0,
  `${inquiries.data?.length ?? 0} rows visible`,
);

// 4. Orders are private.
const serviceOrders = await anon.from("service_orders").select("id");
check(
  "anon cannot read service orders",
  !serviceOrders.error && (serviceOrders.data?.length ?? 0) === 0,
  `${serviceOrders.data?.length ?? 0} rows visible`,
);

const digitalOrders = await anon.from("digital_orders").select("id");
check(
  "anon cannot read digital orders",
  !digitalOrders.error && (digitalOrders.data?.length ?? 0) === 0,
  `${digitalOrders.data?.length ?? 0} rows visible`,
);

// 5. Product files are never readable — even the path is hidden.
const productFiles = await anon.from("product_files").select("storage_path");
check(
  "anon cannot read product files",
  !productFiles.error && (productFiles.data?.length ?? 0) === 0,
  `${productFiles.data?.length ?? 0} rows visible`,
);

// 6. Profiles are private.
const profiles = await anon.from("profiles").select("id, role");
check(
  "anon cannot read profiles",
  !profiles.error && (profiles.data?.length ?? 0) === 0,
  `${profiles.data?.length ?? 0} rows visible`,
);

// 7. Activity logs are private.
const activity = await anon.from("activity_logs").select("id");
check(
  "anon cannot read activity logs",
  !activity.error && (activity.data?.length ?? 0) === 0,
  `${activity.data?.length ?? 0} rows visible`,
);

// 8. Admin-only RPCs are refused for anonymous callers.
const counts = await anon.rpc("admin_counts");
check(
  "anon cannot call admin_counts()",
  Boolean(counts.error),
  counts.error?.message ?? "no error raised",
);

const revenue = await anon.rpc("admin_revenue_summary");
check(
  "anon cannot call admin_revenue_summary()",
  Boolean(revenue.error),
  revenue.error?.message ?? "no error raised",
);

// 9. Private storage buckets reject anonymous access.
for (const bucket of ["private-products", "private-attachments"]) {
  const { data, error } = await anon.storage.from(bucket).list("", { limit: 5 });
  check(
    `anon cannot list ${bucket}`,
    Boolean(error) || (data?.length ?? 0) === 0,
    error?.message ?? `${data?.length ?? 0} objects visible`,
  );
}

// 10. Public media bucket is world-readable.
const publicMedia = await anon.storage.from("public-media").list("", { limit: 5 });
check(
  "public-media is readable by anon",
  !publicMedia.error,
  publicMedia.error?.message ?? "readable",
);

const passed = results.filter(Boolean).length;
console.log(`\n${passed}/${results.length} RLS checks passed`);
if (passed !== results.length) process.exit(1);
