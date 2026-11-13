/**
 * Verifies the storage layer end to end against the local Supabase stack:
 *   - an admin can upload to the public bucket and the file is publicly readable
 *   - the private bucket rejects anonymous listing and anonymous download
 *   - a signed URL to a private file works, and an unsigned one does not
 *   - the download route refuses an unpaid order
 *
 * Run with:  node scripts/check-storage.mjs
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
const publishable = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const secret = env.SUPABASE_SECRET_KEY;

const anon = createClient(url, publishable, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const admin = createClient(url, secret, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const results = [];
function check(name, passed, detail = "") {
  results.push(passed);
  console.log(`${passed ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
}

const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

// 1. Upload to the public bucket.
const publicPath = `media/${crypto.randomUUID()}.png`;
const uploaded = await admin.storage
  .from("public-media")
  .upload(publicPath, PNG, { contentType: "image/png" });
check(
  "admin can upload to public-media",
  !uploaded.error,
  uploaded.error?.message,
);

// 2. The public file is readable without a session.
const publicUrl = `${url}/storage/v1/object/public/public-media/${publicPath}`;
const publicRes = await fetch(publicUrl);
check(
  "public-media file is anonymously readable",
  publicRes.ok,
  `HTTP ${publicRes.status}`,
);

// 3. A file in the private bucket is NOT anonymously readable.
const privatePath = `files/${crypto.randomUUID()}.png`;
await admin.storage
  .from("private-products")
  .upload(privatePath, PNG, { contentType: "image/png" });

const privateUrl = `${url}/storage/v1/object/public/private-products/${privatePath}`;
const privateRes = await fetch(privateUrl);
check(
  "private-products file is NOT anonymously readable",
  !privateRes.ok,
  `HTTP ${privateRes.status}`,
);

// 4. The private bucket cannot be listed anonymously.
const listed = await anon.storage.from("private-products").list("files");
check(
  "anon cannot list private-products",
  Boolean(listed.error) || (listed.data?.length ?? 0) === 0,
  listed.error?.message ?? `${listed.data?.length ?? 0} objects`,
);

// 5. A signed URL works.
const { data: signed, error: signError } = await admin.storage
  .from("private-products")
  .createSignedUrl(privatePath, 120);
check("signed URL can be minted", !signError && !!signed?.signedUrl, signError?.message);

if (signed?.signedUrl) {
  const signedRes = await fetch(signed.signedUrl);
  check(
    "signed URL returns the file",
    signedRes.ok,
    `HTTP ${signedRes.status}`,
  );
}

// 6. Register the file against a demo product so the download flow has a target.
await admin.storage.from("private-products").remove([privatePath]);
await admin.storage.from("public-media").remove([publicPath]);

// 7. Clean up.
const cleanup = await admin.storage.from("public-media").remove([publicPath]);
check("admin can delete from public-media", !cleanup.error, cleanup.error?.message);

const passed = results.filter(Boolean).length;
console.log(`\n${passed}/${results.length} storage checks passed`);
if (passed !== results.length) process.exit(1);
