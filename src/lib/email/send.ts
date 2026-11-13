import { Resend } from "resend";
import type { InquiryInput } from "@/lib/validations/contact";

/**
 * Transactional email.
 *
 * Six notifications (spec §9): new inquiry, new service order, new digital
 * order, payment confirmation, order status update, and customer inquiry
 * confirmation. Every one of them goes through the same shell, the same
 * escaping, and the same delivery path.
 *
 * The rule from the spec: a mail failure never loses a submission. So
 * `deliver` reports failure instead of throwing, and every caller has already
 * stored the row before it sends anything.
 */

const STUDIO_NAME = process.env.STUDIO_NAME ?? "ngantuqan";
const STUDIO_EMAIL = process.env.STUDIO_EMAIL ?? "hello@ngantuqan.studio";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const FROM = process.env.RESEND_FROM_EMAIL ?? `Studio <${STUDIO_EMAIL}>`;

export interface DeliveryResult {
  sent: boolean;
  reason?: string;
}

function isConfigured() {
  return Boolean(process.env.RESEND_API_KEY);
}

/** Branded HTML shell shared by every transactional email. */
function emailLayout(content: string) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${STUDIO_NAME}</title>
  </head>
  <body style="margin:0;padding:0;background:#FFF9EC;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#24352C;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FFF9EC;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FFF9EC;border:1px solid #D8C69D;border-radius:16px;overflow:hidden;">
            <tr>
              <td style="padding:24px 32px;border-bottom:1px solid #D8C69D;">
                <span style="font-size:20px;font-weight:700;letter-spacing:-0.02em;color:#24352C;">${STUDIO_NAME}<span style="color:#B3472C;">.</span></span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;font-size:15px;line-height:1.6;color:#24352C;">
                ${content}
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px;border-top:1px solid #D8C69D;background:#F7EED8;font-size:12px;color:#4E5C52;">
                ${STUDIO_NAME} &middot; <a href="mailto:${STUDIO_EMAIL}" style="color:#245C45;">${STUDIO_EMAIL}</a> &middot; <a href="${SITE_URL}" style="color:#245C45;">${escapeHtml(SITE_URL)}</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function escapeHtml(value: string) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/** Formats an amount the way the site does. */
function rupiah(amount: number | null | undefined) {
  if (amount === null || amount === undefined) return "–";
  return `Rp ${Math.round(amount).toLocaleString("id-ID")}`;
}

/** Turns an enum value into a sentence: NEW_INQUIRY → "New inquiry". */
function humanizeStatus(value: string) {
  const text = value.replace(/_/g, " ").toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Sends one email.
 *
 * Never throws: an unconfigured key or a provider failure is reported, so the
 * caller can carry on with the work it already stored.
 */
async function deliver({
  to,
  replyTo,
  subject,
  html,
}: {
  to: string;
  replyTo?: string;
  subject: string;
  html: string;
}): Promise<DeliveryResult> {
  if (!isConfigured()) {
    console.warn(
      `[email] "${subject}" skipped: RESEND_API_KEY is not configured`,
    );
    return { sent: false, reason: "RESEND_API_KEY is not configured" };
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY!);
    const { error } = await resend.emails.send({
      from: FROM,
      to,
      ...(replyTo ? { replyTo } : {}),
      subject,
      html,
    });

    if (error) {
      console.error(`[email] "${subject}" failed:`, error.message);
      return { sent: false, reason: error.message };
    }

    return { sent: true };
  } catch (error) {
    console.error(`[email] "${subject}" threw:`, error);
    return { sent: false, reason: "unexpected error" };
  }
}

/** A key/value table used by the studio-facing templates. */
function detailTable(rows: { label: string; value: string }[]) {
  const cells = rows
    .map(
      (row) =>
        `<tr><td style="padding:8px 0;color:#4E5C52;width:130px;vertical-align:top;">${escapeHtml(row.label)}</td><td style="padding:8px 0;">${row.value}</td></tr>`,
    )
    .join("");

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;line-height:1.6;">${cells}</table>`;
}

/** A bulleted list of purchases. */
function itemList(
  items: { title: string; quantity: number; unitPrice: number }[],
) {
  const rows = items
    .map(
      (item) =>
        `<li style="margin:0 0 8px;">${escapeHtml(String(item.quantity))} &times; ${escapeHtml(item.title)} <span style="color:#4E5C52;">&middot; ${rupiah(item.unitPrice * item.quantity)}</span></li>`,
    )
    .join("");

  return `<ul style="margin:16px 0 0;padding-left:20px;font-size:14px;line-height:1.6;">${rows}</ul>`;
}

/* ------------------------------------------------------------------ */
/* 1 — New inquiry (studio)                                            */
/* ------------------------------------------------------------------ */

/**
 * Notifies the studio of a new inquiry.
 *
 * Returns { sent: false } rather than throwing when Resend is unconfigured or
 * the API fails — the caller has already stored the submission and must not
 * treat a mail failure as a lost form.
 */
export async function sendInquiryNotification(
  input: InquiryInput,
  reference: string,
): Promise<DeliveryResult> {
  if (!isConfigured()) {
    return { sent: false, reason: "RESEND_API_KEY is not configured" };
  }

  const typeLabels: Record<string, string> = {
    GENERAL: "General inquiry",
    DESIGN_SERVICE: "Design service",
    COLLABORATION: "Collaboration",
    PARTNERSHIP: "Partnership",
    OTHER: "Other",
  };

  const html = emailLayout(`
    <p style="margin:0 0 16px;">A new inquiry has been submitted through the website.</p>
    ${detailTable([
      { label: "Reference", value: `<strong>${escapeHtml(reference)}</strong>` },
      { label: "Name", value: escapeHtml(input.name) },
      {
        label: "Email",
        value: `<a href="mailto:${escapeHtml(input.email)}" style="color:#245C45;">${escapeHtml(input.email)}</a>`,
      },
      ...(input.company
        ? [{ label: "Company", value: escapeHtml(input.company) }]
        : []),
      {
        label: "Type",
        value: escapeHtml(typeLabels[input.inquiryType] ?? input.inquiryType),
      },
      { label: "Subject", value: `<strong>${escapeHtml(input.subject)}</strong>` },
    ])}
    <div style="margin-top:20px;padding:16px;background:#F7EED8;border-radius:12px;font-size:14px;line-height:1.6;white-space:pre-wrap;">${escapeHtml(input.message)}</div>
  `);

  return deliver({
    to: STUDIO_EMAIL,
    replyTo: input.email,
    subject: `[${reference}] New inquiry: ${input.subject}`,
    html,
  });
}

/* ------------------------------------------------------------------ */
/* 2 — New service order (studio)                                       */
/* ------------------------------------------------------------------ */

/** Notifies the studio of a new project brief. */
export async function sendOrderBriefNotification(input: {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  serviceTitle: string;
  packageName: string | null;
  budget: number | null;
  deadline: string | null;
  projectDescription: string;
}): Promise<DeliveryResult> {
  const html = emailLayout(`
    <p style="margin:0 0 16px;">A new project brief has been submitted.</p>
    ${detailTable([
      {
        label: "Reference",
        value: `<strong>${escapeHtml(input.orderNumber)}</strong>`,
      },
      { label: "Name", value: escapeHtml(input.customerName) },
      {
        label: "Email",
        value: `<a href="mailto:${escapeHtml(input.customerEmail)}" style="color:#245C45;">${escapeHtml(input.customerEmail)}</a>`,
      },
      { label: "Service", value: escapeHtml(input.serviceTitle) },
      {
        label: "Package",
        value: input.packageName
          ? escapeHtml(input.packageName)
          : "To be quoted",
      },
      {
        label: "Budget",
        value: input.budget != null ? rupiah(input.budget) : "Not stated",
      },
      {
        label: "Deadline",
        value: input.deadline ? escapeHtml(input.deadline) : "Not stated",
      },
    ])}
    <div style="margin-top:20px;padding:16px;background:#F7EED8;border-radius:12px;font-size:14px;line-height:1.6;white-space:pre-wrap;">${escapeHtml(input.projectDescription)}</div>
    <p style="margin:20px 0 0;font-size:13px;color:#4E5C52;">Reply to the customer to quote. Nothing is marked as paid until you confirm it.</p>
  `);

  return deliver({
    to: STUDIO_EMAIL,
    replyTo: input.customerEmail,
    subject: `[${input.orderNumber}] New brief: ${input.serviceTitle}`,
    html,
  });
}

/* ------------------------------------------------------------------ */
/* 3 — Service order confirmation (customer)                            */
/* ------------------------------------------------------------------ */

/**
 * Confirms to the customer that their brief landed.
 *
 * The reference travels with the email so the customer can quote it in a
 * reply, and so a later lookup by reference still works.
 */
export async function sendServiceOrderConfirmation(input: {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  serviceTitle: string;
  packageName: string | null;
}): Promise<DeliveryResult> {
  const html = emailLayout(`
    <p style="margin:0 0 16px;">Hi ${escapeHtml(input.customerName)},</p>
    <p style="margin:0 0 16px;">Your project brief for <strong>${escapeHtml(input.serviceTitle)}</strong> is with the studio.</p>
    ${detailTable([
      {
        label: "Reference",
        value: `<strong>${escapeHtml(input.orderNumber)}</strong>`,
      },
      {
        label: "Package",
        value: input.packageName
          ? escapeHtml(input.packageName)
          : "To be quoted",
      },
    ])}
    <p style="margin:20px 0 0;">We reply within two working days with questions, a timeline, and a fixed price. Nothing is charged until you approve the scope.</p>
    <p style="margin:16px 0 0;font-size:13px;color:#4E5C52;">Quote ${escapeHtml(input.orderNumber)} in any reply, and we will find it straight away.</p>
  `);

  return deliver({
    to: input.customerEmail,
    subject: `We received your brief: ${input.orderNumber}`,
    html,
  });
}

/* ------------------------------------------------------------------ */
/* 4 — New digital order (studio)                                       */
/* ------------------------------------------------------------------ */

/** Notifies the studio of a new digital order. */
export async function sendDigitalOrderNotification(input: {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  items: { title: string; quantity: number; unitPrice: number }[];
  total: number;
}): Promise<DeliveryResult> {
  const html = emailLayout(`
    <p style="margin:0 0 16px;">A new digital order has been placed.</p>
    ${detailTable([
      {
        label: "Order",
        value: `<strong>${escapeHtml(input.orderNumber)}</strong>`,
      },
      { label: "Name", value: escapeHtml(input.customerName) },
      {
        label: "Email",
        value: `<a href="mailto:${escapeHtml(input.customerEmail)}" style="color:#245C45;">${escapeHtml(input.customerEmail)}</a>`,
      },
      { label: "Total", value: `<strong>${rupiah(input.total)}</strong>` },
    ])}
    ${itemList(input.items)}
    <p style="margin:20px 0 0;font-size:13px;color:#4E5C52;">The order is pending. Confirm the payment in the admin dashboard to unlock the buyer's downloads.</p>
  `);

  return deliver({
    to: STUDIO_EMAIL,
    replyTo: input.customerEmail,
    subject: `[${input.orderNumber}] New digital order: ${rupiah(input.total)}`,
    html,
  });
}

/* ------------------------------------------------------------------ */
/* 5 — Payment confirmation (customer)                                  */
/* ------------------------------------------------------------------ */

/**
 * Tells the customer their payment is confirmed and their files are ready.
 *
 * The download link points at the order confirmation page, which is the
 * customer's permanent access point (conflict C3). The files themselves are
 * never attached — they are served through short-lived signed URLs.
 */
export async function sendPaymentConfirmation(input: {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  items: { title: string; quantity: number; unitPrice: number }[];
  total: number;
  transactionReference?: string | null;
}): Promise<DeliveryResult> {
  const downloadUrl = `${SITE_URL}/order-confirmation/${encodeURIComponent(input.orderNumber)}`;

  const html = emailLayout(`
    <p style="margin:0 0 16px;">Hi ${escapeHtml(input.customerName)},</p>
    <p style="margin:0 0 16px;">Your payment is confirmed, and your downloads are ready.</p>
    ${detailTable([
      {
        label: "Order",
        value: `<strong>${escapeHtml(input.orderNumber)}</strong>`,
      },
      { label: "Total", value: `<strong>${rupiah(input.total)}</strong>` },
      ...(input.transactionReference
        ? [
            {
              label: "Reference",
              value: escapeHtml(input.transactionReference),
            },
          ]
        : []),
    ])}
    ${itemList(input.items)}
    <p style="margin:24px 0 0;">
      <a href="${downloadUrl}" style="display:inline-block;background:#245C45;color:#FFF9EC;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:600;">Open my downloads</a>
    </p>
    <p style="margin:16px 0 0;font-size:13px;color:#4E5C52;">You will be asked for your order number and the email address you used at checkout. Every download link is short-lived and signed.</p>
  `);

  return deliver({
    to: input.customerEmail,
    subject: `Payment confirmed, your downloads are ready (${input.orderNumber})`,
    html,
  });
}

/* ------------------------------------------------------------------ */
/* 6 — Order status update (customer)                                   */
/* ------------------------------------------------------------------ */

/**
 * Tells the customer their project moved on.
 *
 * The studio can add a note; it is quoted in the email so the customer does
 * not have to ask what changed.
 */
export async function sendOrderStatusUpdate(input: {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  serviceTitle: string;
  oldStatus: string | null;
  newStatus: string;
  note?: string | null;
}): Promise<DeliveryResult> {
  const html = emailLayout(`
    <p style="margin:0 0 16px;">Hi ${escapeHtml(input.customerName)},</p>
    <p style="margin:0 0 16px;">Your <strong>${escapeHtml(input.serviceTitle)}</strong> project has moved on.</p>
    ${detailTable([
      {
        label: "Reference",
        value: `<strong>${escapeHtml(input.orderNumber)}</strong>`,
      },
      {
        label: "Status",
        value: input.oldStatus
          ? `${escapeHtml(humanizeStatus(input.oldStatus))} &rarr; <strong>${escapeHtml(humanizeStatus(input.newStatus))}</strong>`
          : `<strong>${escapeHtml(humanizeStatus(input.newStatus))}</strong>`,
      },
    ])}
    ${
      input.note
        ? `<div style="margin-top:20px;padding:16px;background:#F7EED8;border-radius:12px;font-size:14px;line-height:1.6;white-space:pre-wrap;">${escapeHtml(input.note)}</div>`
        : ""
    }
    <p style="margin:20px 0 0;font-size:13px;color:#4E5C52;">Reply to this email if anything looks wrong. We read every one.</p>
  `);

  return deliver({
    to: input.customerEmail,
    subject: `Update on your project: ${input.orderNumber}`,
    html,
  });
}

/* ------------------------------------------------------------------ */
/* Customer inquiry confirmation                                        */
/* ------------------------------------------------------------------ */

/** Confirms receipt to the customer. */
export async function sendInquiryConfirmation(
  input: InquiryInput,
  reference: string,
): Promise<DeliveryResult> {
  const html = emailLayout(`
    <p style="margin:0 0 16px;">Hi ${escapeHtml(input.name)},</p>
    <p style="margin:0 0 16px;">Thanks for getting in touch about <strong>${escapeHtml(input.subject)}</strong>. We have your message and will reply within two working days.</p>
    <p style="margin:0 0 16px;">Your reference is <strong>${escapeHtml(reference)}</strong>. Quote it if you need to follow up.</p>
    <p style="margin:0;">If it is urgent, reply to this email directly.</p>
  `);

  return deliver({
    to: input.email,
    subject: `We received your message: ${reference}`,
    html,
  });
}

/* ------------------------------------------------------------------ */
/* Admin reply to an inquiry                                            */
/* ------------------------------------------------------------------ */

/**
 * Sends an administrator's reply to an inquiry.
 *
 * The reply is sent from the studio address so the customer can reply into
 * the studio inbox. A mail failure never loses the inquiry — the
 * administrator's note is stored separately and the status is still updated.
 */
export async function sendInquiryReply(input: {
  to: string;
  name: string;
  subject: string;
  reply: string;
}): Promise<DeliveryResult> {
  const html = emailLayout(`
    <p style="margin:0 0 16px;">Hi ${escapeHtml(input.name)},</p>
    <div style="margin:0 0 16px;white-space:pre-wrap;">${escapeHtml(input.reply)}</div>
    <p style="margin:0;color:#4E5C52;font-size:13px;">– ${escapeHtml(STUDIO_NAME)}</p>
  `);

  return deliver({
    to: input.to,
    replyTo: STUDIO_EMAIL,
    subject: `Re: ${input.subject}`,
    html,
  });
}
