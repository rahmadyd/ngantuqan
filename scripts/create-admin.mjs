/**
 * Creates or updates the admin account and promotes it to ADMIN.
 *
 * Run with:  node scripts/create-admin.mjs
 *
 * It talks to whatever project the keys in .env.local point at — the local
 * Supabase stack, or a hosted project once the hosted keys are in place
 * (see docs/09-deployment.md). It needs the secret key, because it creates
 * the user through the admin API and promotes the profile directly.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnv() {
  try {
    const raw = readFileSync(join(root, ".env.local"), "utf8");
    const env = {};
    for (const line of raw.split("\n")) {
      const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (match) env[match[1]] = match[2].trim();
    }
    return env;
  } catch {
    return {};
  }
}

const env = loadEnv();
const url = env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321";
const serviceKey =
  env.SUPABASE_SECRET_KEY ??
  env.SUPABASE_SERVICE_ROLE_KEY ??
  "";

const email = process.env.ADMIN_EMAIL ?? env.ADMIN_EMAIL ?? "admin@ngantuqan.studio";
const password = process.env.ADMIN_PASSWORD ?? "ngantuqan-admin-dev";

if (!serviceKey) {
  console.error(
    "SUPABASE_SECRET_KEY not found in .env.local — cannot create the admin user.",
  );
  process.exit(1);
}

const headers = {
  apikey: serviceKey,
  Authorization: `Bearer ${serviceKey}`,
  "Content-Type": "application/json",
};

console.log(`Supabase: ${url}`);
console.log(`Admin:    ${email}`);

// 1. Create the user (ignore a conflict if it already exists).
const createRes = await fetch(`${url}/auth/v1/admin/users`, {
  method: "POST",
  headers,
  body: JSON.stringify({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: "Studio Admin" },
  }),
});

const created = await createRes.json();
let userId = created?.id;

if (!createRes.ok) {
  // Already exists — look it up.
  const listRes = await fetch(
    `${url}/auth/v1/admin/users?per_page=200`,
    { headers },
  );
  const list = await listRes.json();
  const found = (list.users ?? []).find(
    (u) => u.email?.toLowerCase() === email.toLowerCase(),
  );

  if (!found) {
    console.error("Failed to create or find the admin user:", created);
    process.exit(1);
  }

  userId = found.id;
  console.log("User already exists — reusing it.");

  // Ensure the password matches what we document.
  const updateRes = await fetch(`${url}/auth/v1/admin/users/${userId}`, {
    method: "PUT",
    headers,
    body: JSON.stringify({ password, email_confirm: true }),
  });
  if (!updateRes.ok) {
    console.error("Failed to reset the admin password.");
    process.exit(1);
  }
} else {
  console.log("User created.");
}

// 2. Promote to ADMIN.
const { createClient } = await import("@supabase/supabase-js");
const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { error } = await supabase
  .from("profiles")
  .update({ role: "ADMIN" })
  .eq("id", userId);

if (error) {
  console.error("Failed to promote the profile to ADMIN:", error.message);
  process.exit(1);
}

console.log(`Profile ${userId} promoted to ADMIN.`);
console.log("");
console.log("  URL:      http://localhost:3000/admin-login");
console.log(`  Email:    ${email}`);
console.log(`  Password: ${password}`);
console.log("");
console.log("For a HOSTED project, run this in the SQL editor:");
console.log(
  `  UPDATE public.profiles SET role = 'ADMIN' WHERE email = '${email}';`,
);
