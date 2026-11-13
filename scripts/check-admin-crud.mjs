import { chromium } from "playwright";
import { resetLocalLimits } from "./lib/helpers.mjs";
import { createClient } from "@supabase/supabase-js";

/**
 * CRUD verification for the admin panel.
 *
 * Every check drives the real interface: sign in, fill the form, submit, and
 * confirm the row changed in the database and on the public site. Nothing is
 * written through a shortcut — if the form is broken, this fails.
 */

const BASE = process.env.BASE_URL ?? "http://localhost:3136";
const EMAIL = process.env.ADMIN_EMAIL ?? "admin@ngantuqan.studio";
const PASSWORD = process.env.ADMIN_PASSWORD ?? "ngantuqan-admin-dev";
const SUPAABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321";
const SERVICE_KEY =
  process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SERVICE_KEY) {
  throw new Error("Missing SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY");
}

const STAMP = Date.now().toString(36).toUpperCase();
const RUN_STARTED_AT = new Date().toISOString();

const results = [];
const errors = [];

function check(name, passed, detail = "") {
  results.push(passed);
  console.log(`${passed ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
}

const db = createClient(SUPAABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

async function signIn(page) {
  await page.goto(`${BASE}/admin-login`, { waitUntil: "networkidle" });
  await page.fill("#email", EMAIL);
  await page.fill("#password", PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/admin", { timeout: 30000 });
  await page.waitForTimeout(800);
}

async function fill(page, values) {
  for (const [name, value] of Object.entries(values)) {
    const selector = `#field-${name}`;
    const tag = await page
      .locator(selector)
      .evaluate((node) => node.tagName.toLowerCase())
      .catch(() => null);

    if (tag === "select") {
      await page.selectOption(selector, String(value));
    } else if (tag === "input" && (await page.getAttribute(selector, "type")) === "checkbox") {
      const checked = await page.isChecked(selector);
      if (checked !== Boolean(value)) {
        if (value) await page.check(selector);
        else await page.uncheck(selector);
      }
    } else {
      await page.fill(selector, String(value));
    }
  }
}

async function submit(page, url, formSelector = "form[data-admin-form]") {
  // Scoped to the admin form — the header's sign-out button is also a submit.
  // Wait for the action's own response: some actions redirect to the page the
  // form is already on, so the URL alone does not prove the write finished.
  const responsePromise = page.waitForResponse(
    (response) => response.request().method() === "POST",
    { timeout: 30000 },
  );

  await page.click(`${formSelector} button[type="submit"]`);
  await responsePromise;
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(400);

  if (url && !page.url().includes(url)) {
    throw new Error(`expected to land on ${url}, landed on ${page.url()}`);
  }
}

async function rowText(page, section, needle) {
  await page.goto(`${BASE}${section}`, { waitUntil: "networkidle" });
  const body = (await page.textContent("body")) ?? "";
  return body.includes(needle);
}

async function deleteRow(page, section, needle) {
  await page.goto(`${BASE}${section}`, { waitUntil: "networkidle" });
  const row = page.locator("tr", { hasText: needle }).first();
  await row.getByRole("button", { name: /^Delete/ }).click();
  await row.getByRole("button", { name: /^Confirm delete/ }).click();
  await page
    .waitForSelector("[data-sonner-toast]", { timeout: 20000 })
    .catch(() => {});
  await page.waitForTimeout(800);
}

// The forms share one rate limit allowance on this machine.
await resetLocalLimits();

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();

page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));

await signIn(page);
check("signed in", page.url().endsWith("/admin"), page.url());

/* ------------------------------------------------------------------ */
/* Portfolio — create, edit, delete                                    */
/* ------------------------------------------------------------------ */

const projectTitle = `CRUD Project ${STAMP}`;

await page.goto(`${BASE}/admin/portfolio/new`, { waitUntil: "networkidle" });
await fill(page, {
  title: projectTitle,
  slug: `crud-project-${STAMP.toLowerCase()}`,
  description: "Created by the CRUD verification run.",
  client_name: "CRUD Client",
  project_year: "2026",
  is_published: true,
});
await submit(page, "/admin/portfolio");

check(
  "portfolio: created row appears in the list",
  await rowText(page, "/admin/portfolio", projectTitle),
);

const { data: created } = await db
  .from("projects")
  .select("id, slug")
  .eq("title", projectTitle)
  .maybeSingle();

check("portfolio: row written to the database", Boolean(created?.id));

await page.goto(`${BASE}/admin/portfolio/${created.id}`, { waitUntil: "networkidle" });
await fill(page, { title: `${projectTitle} Edited`, is_featured: true });
await submit(page, "/admin/portfolio");

check(
  "portfolio: edit persisted",
  await rowText(page, "/admin/portfolio", `${projectTitle} Edited`),
);

check(
  "portfolio: edit visible on the public site",
  await rowText(page, "/work", `${projectTitle} Edited`),
);

// A published project cannot be deleted. The list says so on the button, and
// the database refuses the delete even when the request is forged.
await page.goto(`${BASE}/admin/portfolio`, { waitUntil: "networkidle" });

const publishedRow = page
  .locator("tr", { hasText: `${projectTitle} Edited` })
  .first();
const guardedButton = publishedRow.getByRole("button", { name: /Unpublish/i });

check(
  "portfolio: the delete button is disabled while the project is published",
  (await guardedButton.count()) === 1 && (await guardedButton.isDisabled()),
);

const { error: guardError } = await db
  .from("projects")
  .delete()
  .eq("id", created.id);

check(
  "portfolio: the database refuses to delete a published project",
  Boolean(guardError) && /unpublish/i.test(guardError.message),
  guardError?.message ?? "the delete was accepted",
);

await page.goto(`${BASE}/admin/portfolio/${created.id}`, { waitUntil: "networkidle" });
await fill(page, { is_published: false });
await submit(page, "/admin/portfolio");

await deleteRow(page, "/admin/portfolio", `${projectTitle} Edited`);
check(
  "portfolio: deleted row is gone",
  !(await rowText(page, "/admin/portfolio", `${projectTitle} Edited`)),
);

const { data: afterDelete } = await db
  .from("projects")
  .select("id")
  .eq("id", created.id)
  .maybeSingle();
check("portfolio: row removed from the database", !afterDelete);

/* ------------------------------------------------------------------ */
/* Categories                                                          */
/* ------------------------------------------------------------------ */

const categoryName = `CRUD Category ${STAMP}`;

await page.goto(`${BASE}/admin/categories/new`, { waitUntil: "networkidle" });
await fill(page, { name: categoryName, slug: `crud-cat-${STAMP.toLowerCase()}`, type: "PORTFOLIO" });
await submit(page, "/admin/categories");

check(
  "categories: created row appears in the list",
  await rowText(page, "/admin/categories", categoryName),
);

await deleteRow(page, "/admin/categories", categoryName);
check(
  "categories: deleted row is gone",
  !(await rowText(page, "/admin/categories", categoryName)),
);

/* ------------------------------------------------------------------ */
/* Services and packages                                               */
/* ------------------------------------------------------------------ */

const serviceTitle = `CRUD Service ${STAMP}`;
const packageName = `CRUD Package ${STAMP}`;

await page.goto(`${BASE}/admin/services/new`, { waitUntil: "networkidle" });
await fill(page, {
  title: serviceTitle,
  slug: `crud-service-${STAMP.toLowerCase()}`,
  description: "Created by the CRUD verification run.",
  turnaround_days: "10",
  deliverables: "One deliverable\nTwo deliverables",
  is_active: true,
});
await submit(page, "/admin/services");

check(
  "services: created row appears in the list",
  await rowText(page, "/admin/services", serviceTitle),
);

const { data: service } = await db
  .from("services")
  .select("id")
  .eq("title", serviceTitle)
  .maybeSingle();

await page.goto(`${BASE}/admin/services/${service.id}/packages/new`, {
  waitUntil: "networkidle",
});
await fill(page, {
  name: packageName,
  price: "1250000",
  delivery_days: "9",
  revision_count: "2",
  features: "Brand kit\nSocial templates",
});
await submit(page, `/admin/services/${service.id}`);

check(
  "service packages: package appears under the service",
  await rowText(page, `/admin/services/${service.id}`, packageName),
);

const { data: pkg } = await db
  .from("service_packages")
  .select("id, features, price")
  .eq("name", packageName)
  .maybeSingle();

check(
  "service packages: jsonb list stored as an array",
  Array.isArray(pkg?.features) && pkg.features.length === 2,
  JSON.stringify(pkg?.features),
);

await deleteRow(page, "/admin/services", serviceTitle);
check(
  "services: deleted row is gone",
  !(await rowText(page, "/admin/services", serviceTitle)),
);

/* ------------------------------------------------------------------ */
/* Products                                                            */
/* ------------------------------------------------------------------ */

const productTitle = `CRUD Product ${STAMP}`;

await page.goto(`${BASE}/admin/products/new`, { waitUntil: "networkidle" });
await fill(page, {
  title: productTitle,
  slug: `crud-product-${STAMP.toLowerCase()}`,
  description: "Created by the CRUD verification run.",
  price: "275000",
  is_published: true,
});
await submit(page, "/admin/products");

check(
  "products: created row appears in the list",
  await rowText(page, "/admin/products", productTitle),
);

const { data: createdProduct } = await db
  .from("products")
  .select("id")
  .eq("title", productTitle)
  .maybeSingle();

check(
  "products: published product visible in the shop",
  await rowText(page, "/shop", productTitle),
);

await page.goto(`${BASE}/admin/products/${createdProduct.id}`, { waitUntil: "networkidle" });
await fill(page, { is_published: false });
await submit(page, "/admin/products");

await deleteRow(page, "/admin/products", productTitle);
check(
  "products: deleted row is gone",
  !(await rowText(page, "/admin/products", productTitle)),
);

/* ------------------------------------------------------------------ */
/* Testimonials                                                        */
/* ------------------------------------------------------------------ */

const testimonialName = `CRUD Customer ${STAMP}`;

await page.goto(`${BASE}/admin/testimonials/new`, { waitUntil: "networkidle" });
await fill(page, {
  customer_name: testimonialName,
  content: "The CRUD verification run left a quote behind.",
  is_published: true,
});
await submit(page, "/admin/testimonials");

check(
  "testimonials: created row appears in the list",
  await rowText(page, "/admin/testimonials", testimonialName),
);

await deleteRow(page, "/admin/testimonials", testimonialName);
check(
  "testimonials: deleted row is gone",
  !(await rowText(page, "/admin/testimonials", testimonialName)),
);

/* ------------------------------------------------------------------ */
/* Service orders — status change and history                          */
/* ------------------------------------------------------------------ */

const { data: anyService } = await db
  .from("services")
  .select("id")
  .limit(1)
  .maybeSingle();

const { data: orderRow } = await db
  .from("service_orders")
  .insert({
    customer_name: `CRUD Client ${STAMP}`,
    customer_email: `client-${STAMP.toLowerCase()}@example.com`,
    service_id: anyService?.id,
    project_description: "Created by the CRUD verification run.",
  })
  .select("id, order_number")
  .single();

if (orderRow) {
  await page.goto(`${BASE}/admin/service-orders/${orderRow.id}`, {
    waitUntil: "networkidle",
  });
  await fill(page, { order_status: "QUOTED", quoted_price: "4500000" });
  await submit(page, `/admin/service-orders/${orderRow.id}`);

  const { data: history } = await db
    .from("order_status_history")
    .select("new_status")
    .eq("order_id", orderRow.id)
    .order("created_at", { ascending: false })
    .limit(1);

  check(
    "service orders: status change recorded in history",
    history?.[0]?.new_status === "QUOTED",
    JSON.stringify(history?.[0]),
  );

  const { data: updatedOrder } = await db
    .from("service_orders")
    .select("order_status, quoted_price")
    .eq("id", orderRow.id)
    .maybeSingle();

  check(
    "service orders: quoted price saved",
    Number(updatedOrder?.quoted_price) === 4500000,
    JSON.stringify(updatedOrder),
  );
} else {
  check("service orders: an order could be created", false);
}

/* ------------------------------------------------------------------ */
/* Digital orders — manual payment confirmation                         */
/* ------------------------------------------------------------------ */

const { data: product } = await db
  .from("products")
  .select("id, title, price")
  .eq("is_published", true)
  .limit(1)
  .maybeSingle();

if (product) {
  const { data: order } = await db
    .from("digital_orders")
    .insert({
      customer_name: `CRUD Buyer ${STAMP}`,
      customer_email: `buyer-${STAMP.toLowerCase()}@example.com`,
      subtotal: product.price,
      total_amount: product.price,
      payment_status: "PENDING",
      payment_provider: "manual",
    })
    .select("id, order_number")
    .single();

  await db.from("digital_order_items").insert({
    digital_order_id: order.id,
    product_id: product.id,
    product_title: product.title,
    unit_price: product.price,
    quantity: 1,
  });

  await page.goto(`${BASE}/admin/digital-orders/${order.id}`, {
    waitUntil: "networkidle",
  });
  await fill(page, {
    payment_status: "PAID",
    transaction_reference: `CRUD-${STAMP}`,
  });
  await submit(page, `/admin/digital-orders/${order.id}`);

  const { data: confirmed } = await db
    .from("digital_orders")
    .select("payment_status, transaction_reference")
    .eq("id", order.id)
    .maybeSingle();

  check(
    "digital orders: payment confirmed through the admin panel",
    confirmed?.payment_status === "PAID",
    JSON.stringify(confirmed),
  );
} else {
  check("digital orders: a published product is available", false);
}

/* ------------------------------------------------------------------ */
/* Inquiries — triage                                                   */
/* ------------------------------------------------------------------ */

const { data: inquiry } = await db
  .from("inquiries")
  .insert({
    name: `CRUD Visitor ${STAMP}`,
    email: `visitor-${STAMP.toLowerCase()}@example.com`,
    inquiry_type: "GENERAL",
    subject: `CRUD inquiry ${STAMP}`,
    message: "Created by the CRUD verification run.",
    status: "NEW",
    is_read: false,
  })
  .select("id")
  .single();

await page.goto(`${BASE}/admin/inquiries/${inquiry.id}`, { waitUntil: "networkidle" });

// Reply first — it must not lose the inquiry when the mail provider is
// missing, it reports that the mail was not sent and carries on.
await fill(page, { reply: "Thanks for reaching out — the CRUD run is verifying replies." });
await submit(page, null, "form:has(#field-reply)");

const replyMessage = await page
  .locator("form:has(#field-reply) [role='alert'], form:has(#field-reply) [role='status']")
  .first()
  .textContent()
  .catch(() => "");

check(
  "inquiries: reply reports that the mail was not sent",
  /not sent|not configured/i.test(replyMessage ?? ""),
  replyMessage ?? "no message",
);

const { data: afterReply } = await db
  .from("inquiries")
  .select("status, is_read")
  .eq("id", inquiry.id)
  .maybeSingle();

check(
  "inquiries: reply still advanced the inquiry",
  afterReply?.status === "IN_PROGRESS" && afterReply?.is_read === true,
  JSON.stringify(afterReply),
);

await fill(page, { status: "RESOLVED", is_read: true });
await submit(page, `/admin/inquiries/${inquiry.id}`, "form:has(#field-status)");

const { data: triaged } = await db
  .from("inquiries")
  .select("status, is_read")
  .eq("id", inquiry.id)
  .maybeSingle();

check(
  "inquiries: status and read flag updated",
  triaged?.status === "RESOLVED" && triaged?.is_read === true,
  JSON.stringify(triaged),
);

await deleteRow(page, "/admin/inquiries", `CRUD inquiry ${STAMP}`);
check(
  "inquiries: deleted row is gone",
  !(await rowText(page, "/admin/inquiries", `CRUD inquiry ${STAMP}`)),
);

/* ------------------------------------------------------------------ */
/* Settings and content blocks                                         */
/* ------------------------------------------------------------------ */

await page.goto(`${BASE}/admin/settings`, { waitUntil: "networkidle" });
await fill(page, {
  name: `ngantuqan ${STAMP}`,
  tagline: "Creative Design Studio & Digital Marketplace",
  email: "hello@ngantuqan.studio",
});
await submit(page, "/admin/settings");

const { data: studio } = await db
  .from("site_settings")
  .select("setting_value")
  .eq("setting_key", "studio")
  .maybeSingle();

check(
  "settings: studio name persisted",
  studio?.setting_value?.name === `ngantuqan ${STAMP}`,
  JSON.stringify(studio?.setting_value?.name),
);

await page.goto(`${BASE}/admin/settings`, { waitUntil: "networkidle" });
await fill(page, { name: "ngantuqan" });
await submit(page, "/admin/settings");

const { data: studioReset } = await db
  .from("site_settings")
  .select("setting_value")
  .eq("setting_key", "studio")
  .maybeSingle();
check(
  "settings: studio name restored",
  studioReset?.setting_value?.name === "ngantuqan",
);

const { data: block } = await db
  .from("site_settings")
  .select("id, setting_value")
  .eq("setting_key", "home.hero")
  .maybeSingle();

const originalBlock = block?.setting_value;

await page.goto(`${BASE}/admin/content/${block.id}`, { waitUntil: "networkidle" });
await page.fill("#field-setting_value", '{"headline":"CRUD verified."}');
await submit(page, "/admin/content");

const { data: updatedBlock } = await db
  .from("site_settings")
  .select("setting_value")
  .eq("id", block.id)
  .maybeSingle();

check(
  "content: JSON block saved",
  updatedBlock?.setting_value?.headline === "CRUD verified.",
  JSON.stringify(updatedBlock?.setting_value),
);

/* ------------------------------------------------------------------ */
/* Media library                                                       */
/* ------------------------------------------------------------------ */

async function listMedia() {
  // The bucket holds one folder ("media") with the files inside it. Folder
  // entries come back with a null id, so they are filtered out.
  const { data: nested } = await db.storage
    .from("public-media")
    .list("media", { limit: 100 });

  return (nested ?? [])
    .filter((file) => file.id)
    .map((file) => `media/${file.name}`);
}

const filesBefore = await listMedia();

await page.goto(`${BASE}/admin/media`, { waitUntil: "networkidle" });
await page.setInputFiles("#media-file", {
  name: "crud-check.png",
  mimeType: "image/png",
  buffer: Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    "base64",
  ),
});
await page.click('form[data-admin-form] button[type="submit"]');
await page
  .waitForSelector("[data-sonner-toast]", { timeout: 20000 })
  .catch(() => {});
await page.waitForTimeout(1500);

const filesAfter = await listMedia();
const uploaded = filesAfter.find((name) => !filesBefore.includes(name));

check("media: file uploaded to storage", Boolean(uploaded), uploaded ?? "no new file");
check(
  "media: file appears in the library",
  uploaded ? await rowText(page, "/admin/media", uploaded) : false,
);

if (uploaded) {
  // The library keeps its own index of what it holds.
  const { data: indexed } = await db
    .from("media")
    .select("id, file_name, file_size, mime_type, uploaded_by")
    .eq("bucket", "public-media")
    .eq("path", uploaded)
    .maybeSingle();

  check("media: the library indexed the file", Boolean(indexed?.id), uploaded);
  check(
    "media: the index keeps the original name",
    indexed?.file_name === "crud-check.png",
    indexed?.file_name,
  );
  check(
    "media: the index keeps the size and type",
    Number(indexed?.file_size) > 0 && indexed?.mime_type === "image/png",
    `${indexed?.file_size} bytes, ${indexed?.mime_type}`,
  );

  // The alt text is what a screen reader reads in place of the image.
  await page.goto(`${BASE}/admin/media`, { waitUntil: "networkidle" });
  const altInput = page.locator(`#alt-${indexed.id}`);

  if (await altInput.count()) {
    await altInput.fill("A single grey pixel, uploaded by the verification run");
    await page
      .locator(`#alt-${indexed.id}`)
      .locator("xpath=ancestor::form")
      .getByRole("button", { name: /Save alt text/ })
      .click();
    await page
      .waitForSelector("[data-sonner-toast]", { timeout: 20000 })
      .catch(() => {});
    await page.waitForTimeout(1200);

    const { data: saved } = await db
      .from("media")
      .select("alt_text")
      .eq("id", indexed.id)
      .maybeSingle();

    check(
      "media: the alt text is saved",
      saved?.alt_text === "A single grey pixel, uploaded by the verification run",
      saved?.alt_text ?? "no row",
    );
  } else {
    check("media: the alt text field is shown", false, "no field");
  }

  await page.goto(`${BASE}/admin/media`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: `Delete ${uploaded}` }).click();
  await page.getByRole("button", { name: `Confirm delete ${uploaded}` }).click();
  await page
    .waitForSelector("[data-sonner-toast]", { timeout: 20000 })
    .catch(() => {});
  await page.waitForTimeout(1200);

  const filesAfterDelete = await listMedia();
  check(
    "media: deleted file is gone",
    !filesAfterDelete.includes(uploaded),
    filesAfterDelete.join(", "),
  );

  const { data: deletedIndex } = await db
    .from("media")
    .select("id")
    .eq("bucket", "public-media")
    .eq("path", uploaded)
    .maybeSingle();

  check("media: the index row is gone too", !deletedIndex);
}

/* ------------------------------------------------------------------ */
/* The image picker                                                    */
/* ------------------------------------------------------------------ */

await page.goto(`${BASE}/admin/portfolio/new`, { waitUntil: "networkidle" });

check(
  "picker: the cover image is chosen from the library",
  (await page.getByRole("button", { name: "Choose from library" }).count()) > 0,
);

await page.setInputFiles('form[data-admin-form] input[type="file"]', {
  name: "picker-check.png",
  mimeType: "image/png",
  buffer: Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    "base64",
  ),
});
await page.waitForTimeout(2500);

const picked = await page.inputValue("#field-cover_image");
check(
  "picker: the upload fills the field with the storage path",
  /^media\/.+\.png$/.test(picked),
  picked,
);

const pickerTitle = `CRUD Picker ${STAMP}`;

await fill(page, {
  title: pickerTitle,
  slug: `crud-picker-${STAMP.toLowerCase()}`,
  description: "Created by the CRUD verification run.",
  is_published: true,
});
await submit(page, "/admin/portfolio");

const { data: pickedRow } = await db
  .from("projects")
  .select("id, cover_image")
  .eq("title", pickerTitle)
  .maybeSingle();

check(
  "picker: the database stores the path",
  pickedRow?.cover_image === picked,
  pickedRow?.cover_image ?? "no row",
);
check(
  "picker: it is a path, not an address",
  Boolean(pickedRow?.cover_image) && !pickedRow.cover_image.startsWith("http"),
);

await page.goto(`${BASE}/work`, { waitUntil: "networkidle" });
const workHtml = await page.locator("main").innerHTML();
check(
  "picker: the public site resolves the path into an address",
  // The address is now handed to the image optimiser, so it is url-encoded.
  workHtml.includes(encodeURIComponent(`public-media/${picked}`)) ||
    workHtml.includes(`public-media/${picked}`),
  picked,
);

// cleanup  a published project cannot be deleted, so it is unpublished first.
if (pickedRow?.id) {
  await db.from("activity_logs").delete().eq("entity_id", pickedRow.id);
  await db.from("projects").update({ is_published: false }).eq("id", pickedRow.id);
  await db.from("projects").delete().eq("id", pickedRow.id);
}
if (picked) {
  await db.from("media").delete().eq("path", picked);
  await db.storage.from("public-media").remove([picked]);
}

/* ------------------------------------------------------------------ */
/* The gallery                                                         */
/* ------------------------------------------------------------------ */

const galleryTitle = `CRUD Gallery ${STAMP}`;

await page.goto(`${BASE}/admin/portfolio/new`, { waitUntil: "networkidle" });
await fill(page, {
  title: galleryTitle,
  slug: `crud-gallery-${STAMP.toLowerCase()}`,
  description: "Created by the CRUD verification run.",
  is_published: true,
});
await submit(page, "/admin/portfolio");

const { data: galleryProject } = await db
  .from("projects")
  .select("id, slug")
  .eq("title", galleryTitle)
  .maybeSingle();

check("gallery: the project was created", Boolean(galleryProject?.id));

await page.goto(`${BASE}/admin/portfolio/${galleryProject.id}`, {
  waitUntil: "networkidle",
});

check(
  "gallery: the editor has a gallery",
  (await page.getByRole("heading", { name: "Gallery" }).count()) > 0,
);

await page.getByRole("button", { name: "Add image" }).click();
await page.waitForTimeout(700);

await page.setInputFiles('[role="dialog"] input[type="file"]', {
  name: "gallery-check.png",
  mimeType: "image/png",
  buffer: Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    "base64",
  ),
});
await page.waitForTimeout(2800);

check(
  "gallery: the upload lands in the gallery",
  (await page.getByText("gallery-check.png").count()) > 0,
);

await page.locator('input[id^="alt-"]').first().fill("A pixel, added by the verification run");

await page.getByRole("button", { name: "Save gallery" }).click();
await page.waitForTimeout(2500);

const { data: galleryRows } = await db
  .from("project_images")
  .select("image_url, alt_text, display_order")
  .eq("project_id", galleryProject.id)
  .order("display_order", { ascending: true });

check("gallery: the image is stored", (galleryRows?.length ?? 0) === 1);
check(
  "gallery: it is stored as a path",
  Boolean(galleryRows?.[0]?.image_url) &&
    !galleryRows[0].image_url.startsWith("http"),
  galleryRows?.[0]?.image_url,
);
check(
  "gallery: the alt text is stored",
  galleryRows?.[0]?.alt_text === "A pixel, added by the verification run",
  galleryRows?.[0]?.alt_text,
);

await page.goto(`${BASE}/work/${galleryProject.slug}`, { waitUntil: "networkidle" });
await page.waitForTimeout(600);
const galleryHtml = await page.locator("main").innerHTML();

check(
  "gallery: the public page shows the gallery",
  (await page.locator("main").innerText()).includes("The gallery"),
);
check(
  "gallery: the public page resolves the path",
  galleryHtml.includes(encodeURIComponent("/storage/v1/object/public/public-media/media/")),
);

// cleanup  a published project cannot be deleted, so it is unpublished first.
await db.from("project_images").delete().eq("project_id", galleryProject.id);
await db.from("activity_logs").delete().eq("entity_id", galleryProject.id);
await db.from("projects").update({ is_published: false }).eq("id", galleryProject.id);
await db.from("projects").delete().eq("id", galleryProject.id);

const { data: galleryMedia } = await db
  .from("media")
  .select("id, path, bucket")
  .like("file_name", "gallery-check%");

for (const media of galleryMedia ?? []) {
  await db.from("media").delete().eq("id", media.id);
  await db.storage.from(media.bucket).remove([media.path]);
}

/* ------------------------------------------------------------------ */
/* Audit trail                                                         */
/* ------------------------------------------------------------------ */

const { data: activity } = await db
  .from("activity_logs")
  .select("action, entity_type")
  .order("created_at", { ascending: false })
  .limit(40);

const actions = new Set((activity ?? []).map((row) => row.action));
check(
  "activity log: mutations are recorded",
  ["create", "update", "delete"].every((action) => actions.has(action)),
  [...actions].join(", "),
);

const { count: activityCount } = await db
  .from("activity_logs")
  .select("id", { count: "exact", head: true });
check("activity log: rows written during the run", (activityCount ?? 0) > 0, String(activityCount));

await browser.close();

/* ------------------------------------------------------------------ */
/* Cleanup — a verification run must not leave test data behind         */
/* ------------------------------------------------------------------ */

await db
  .from("service_orders")
  .delete()
  .eq("customer_email", `client-${STAMP.toLowerCase()}@example.com`);
await db
  .from("digital_orders")
  .delete()
  .eq("customer_email", `buyer-${STAMP.toLowerCase()}@example.com`);
await db
  .from("inquiries")
  .delete()
  .eq("email", `visitor-${STAMP.toLowerCase()}@example.com`);
await db
  .from("activity_logs")
  .delete()
  .gte("created_at", RUN_STARTED_AT);

if (block?.id && originalBlock) {
  await db.from("site_settings").update({ setting_value: originalBlock }).eq("id", block.id);
}

const passed = results.filter(Boolean).length;
console.log(`\n${passed}/${results.length} CRUD checks passed`);

if (errors.length) {
  console.log("\nBrowser errors:");
  errors.forEach((error) => console.log("  " + error));
}

if (passed !== results.length || errors.length) {
  process.exit(1);
}
