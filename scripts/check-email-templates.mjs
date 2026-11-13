/**
 * Email template verification (spec §9).
 *
 * The Resend SDK is pointed at a stubbed fetch, so every template is rendered
 * for real and the outgoing payload is inspected: recipient, subject, branded
 * layout, and escaping of everything the customer typed.
 */

const sent = [];

globalThis.fetch = async (url, init) => {
  const body = typeof init?.body === "string" ? JSON.parse(init.body) : init?.body;
  sent.push({ url: String(url), body });
  return new Response(JSON.stringify({ id: "mock-message-id" }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

process.env.RESEND_API_KEY = "re_mock_key";
process.env.STUDIO_EMAIL = "hello@ngantuqan.studio";
process.env.STUDIO_NAME = "ngantuqan";
process.env.NEXT_PUBLIC_SITE_URL = "http://localhost:3000";

const {
  sendDigitalOrderNotification,
  sendOrderBriefNotification,
  sendOrderStatusUpdate,
  sendPaymentConfirmation,
  sendServiceOrderConfirmation,
  sendInquiryNotification,
  sendInquiryConfirmation,
  sendInquiryReply,
} = await import("../src/lib/email/send.ts");

const results = [];

function check(name, passed, detail = "") {
  results.push(passed);
  console.log(`${passed ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
}

async function render(fn, input, second) {
  sent.length = 0;
  const result = await fn(input, second);
  return { result, message: sent[0] };
}

/* ------------------------------------------------------------------ */
/* Every template shares the branded shell                              */
/* ------------------------------------------------------------------ */

const cases = [
  {
    name: "inquiry notification (studio)",
    html: await render(sendInquiryNotification, {
      name: "Rani",
      email: "rani@example.com",
      company: "Kopi Senja",
      inquiryType: "DESIGN_SERVICE",
      subject: "Brand identity",
      message: "We need a rebrand for our roastery.",
    }, "INQ-2611-A7F3"),
    to: "hello@ngantuqan.studio",
    contains: ["Kopi Senja", "Brand identity", "ngantuqan"],
  },
  {
    name: "inquiry confirmation (customer)",
    html: await render(sendInquiryConfirmation, {
      name: "Rani",
      email: "rani@example.com",
      company: "",
      inquiryType: "GENERAL",
      subject: "Brand identity",
      message: "We need a rebrand for our roastery.",
    }, "INQ-2611-A7F3"),
    to: "rani@example.com",
    contains: ["Rani", "INQ-2611-A7F3"],
  },
  {
    name: "service order notification (studio)",
    html: await render(sendOrderBriefNotification, {
      orderNumber: "SO-2611-00001",
      customerName: "Rani",
      customerEmail: "rani@example.com",
      serviceTitle: "Brand Identity",
      packageName: "Full Identity",
      budget: 15000000,
      deadline: "2026-12-01",
      projectDescription: "A rebrand for our roastery.",
    }),
    to: "hello@ngantuqan.studio",
    contains: ["SO-2611-00001", "Full Identity", "15.000.000"],
  },
  {
    name: "service order confirmation (customer)",
    html: await render(sendServiceOrderConfirmation, {
      orderNumber: "SO-2611-00001",
      customerName: "Rani",
      customerEmail: "rani@example.com",
      serviceTitle: "Brand Identity",
      packageName: "Full Identity",
    }),
    to: "rani@example.com",
    contains: ["SO-2611-00001", "Full Identity", "two working days"],
  },
  {
    name: "digital order notification (studio)",
    html: await render(sendDigitalOrderNotification, {
      orderNumber: "DO-2611-00001",
      customerName: "Rani",
      customerEmail: "rani@example.com",
      items: [{ title: "Pitch Deck Template", quantity: 2, unitPrice: 275000 }],
      total: 550000,
    }),
    to: "hello@ngantuqan.studio",
    contains: ["DO-2611-00001", "Pitch Deck Template", "550.000"],
  },
  {
    name: "payment confirmation (customer)",
    html: await render(sendPaymentConfirmation, {
      orderNumber: "DO-2611-00001",
      customerName: "Rani",
      customerEmail: "rani@example.com",
      items: [{ title: "Pitch Deck Template", quantity: 1, unitPrice: 275000 }],
      total: 275000,
      transactionReference: "TRX-9988",
    }),
    to: "rani@example.com",
    contains: [
      "DO-2611-00001",
      "TRX-9988",
      "order-confirmation/DO-2611-00001",
    ],
  },
  {
    name: "order status update (customer)",
    html: await render(sendOrderStatusUpdate, {
      orderNumber: "SO-2611-00001",
      customerName: "Rani",
      customerEmail: "rani@example.com",
      serviceTitle: "Brand Identity",
      oldStatus: "CONTACTED",
      newStatus: "QUOTED",
      note: "Here is the fixed scope we discussed.",
    }),
    to: "rani@example.com",
    contains: ["SO-2611-00001", "Quoted", "Here is the fixed scope"],
  },
  {
    name: "inquiry reply (admin)",
    html: await render(sendInquiryReply, {
      to: "rani@example.com",
      name: "Rani",
      subject: "Brand identity",
      reply: "Here is the fixed scope we discussed.",
    }),
    to: "rani@example.com",
    contains: ["Here is the fixed scope"],
  },
];

for (const testCase of cases) {
  const { result, message } = testCase.html;

  check(
    `${testCase.name}: sends one message`,
    sent.length === 1 && Boolean(message),
    `${sent.length} message(s)`,
  );

  check(
    `${testCase.name}: goes to the right recipient`,
    message?.body?.to === testCase.to,
    String(message?.body?.to),
  );

  check(
    `${testCase.name}: has a subject`,
    Boolean(message?.body?.subject),
    String(message?.body?.subject),
  );

  const html = String(message?.body?.html ?? "");
  check(
    `${testCase.name}: uses the branded layout`,
    html.includes("ngantuqan") && html.includes("hello@ngantuqan.studio"),
  );

  const missing = testCase.contains.filter((needle) => !html.includes(needle));
  check(
    `${testCase.name}: carries the expected content`,
    missing.length === 0,
    missing.length ? `missing: ${missing.join(", ")}` : "",
  );

  check(
    `${testCase.name}: reports delivery`,
    result.sent === true,
    result.reason ?? "",
  );
}

/* ------------------------------------------------------------------ */
/* Everything the customer typed is escaped                             */
/* ------------------------------------------------------------------ */

const hostile = `<script>alert('x')</script>`;

const { message: hostileMessage } = await render(sendInquiryNotification, {
  name: hostile,
  email: "rani@example.com",
  company: "",
  inquiryType: "GENERAL",
  subject: hostile,
  message: hostile,
});

const hostileHtml = String(hostileMessage?.body?.html ?? "");
check(
  "user input is escaped, not injected",
  !hostileHtml.includes("<script>alert") && hostileHtml.includes("&lt;script&gt;"),
);

/* ------------------------------------------------------------------ */
/* A missing API key is reported, not thrown                            */
/* ------------------------------------------------------------------ */

delete process.env.RESEND_API_KEY;

const { result: unconfigured } = await render(
  sendInquiryNotification,
  {
    name: "Rani",
    email: "rani@example.com",
    company: "",
    inquiryType: "GENERAL",
    subject: "Brand identity",
    message: "We need a rebrand for our roastery.",
  },
  "INQ-2611-A7F3",
);

check(
  "an unconfigured key is reported instead of thrown",
  unconfigured.sent === false && Boolean(unconfigured.reason),
  unconfigured.reason ?? "",
);

const passed = results.filter(Boolean).length;
console.log(`\n${passed}/${results.length} email checks passed`);

if (passed !== results.length) {
  process.exit(1);
}
