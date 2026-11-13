/**
 * Exercises the contact-form validation schema against valid and invalid
 * payloads. Run with:  node --experimental-strip-types scripts/check-contact-validation.mjs
 */
import { inquirySchema } from "../src/lib/validations/contact.ts";

const cases = [
  {
    name: "valid submission",
    input: {
      name: "Test User",
      email: "test@example.com",
      company: "Acme",
      inquiryType: "DESIGN_SERVICE",
      subject: "Need a rebrand",
      message: "We need a full brand identity for our new cafe opening this spring.",
    },
    expectValid: true,
  },
  {
    name: "invalid email",
    input: {
      name: "Test User",
      email: "not-an-email",
      company: "",
      inquiryType: "GENERAL",
      subject: "Hi",
      message: "This message is definitely long enough to pass validation.",
    },
    expectValid: false,
  },
  {
    name: "name too short",
    input: {
      name: "A",
      email: "test@example.com",
      company: "",
      inquiryType: "GENERAL",
      subject: "Hi there",
      message: "This message is definitely long enough to pass validation.",
    },
    expectValid: false,
  },
  {
    name: "message too short",
    input: {
      name: "Test User",
      email: "test@example.com",
      company: "",
      inquiryType: "GENERAL",
      subject: "Hi there",
      message: "too short",
    },
    expectValid: false,
  },
  {
    name: "invalid inquiry type",
    input: {
      name: "Test User",
      email: "test@example.com",
      company: "",
      inquiryType: "NOT_A_TYPE",
      subject: "Hi there",
      message: "This message is definitely long enough to pass validation.",
    },
    expectValid: false,
  },
  {
    name: "empty subject",
    input: {
      name: "Test User",
      email: "test@example.com",
      company: "",
      inquiryType: "GENERAL",
      subject: "",
      message: "This message is definitely long enough to pass validation.",
    },
    expectValid: false,
  },
  {
    name: "company is optional",
    input: {
      name: "Test User",
      email: "test@example.com",
      company: "",
      inquiryType: "PARTNERSHIP",
      subject: "Partnership idea",
      message: "This message is definitely long enough to pass validation.",
    },
    expectValid: true,
  },
];

let failures = 0;

for (const testCase of cases) {
  const result = inquirySchema.safeParse(testCase.input);
  const passed = result.success === testCase.expectValid;

  if (!passed) failures += 1;

  const detail = result.success
    ? "accepted"
    : result.error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join("; ");

  console.log(
    `${passed ? "PASS" : "FAIL"}  ${testCase.name.padEnd(24)} ${detail}`,
  );
}

console.log(
  `\n${cases.length - failures}/${cases.length} validation cases passed`,
);

if (failures > 0) process.exit(1);
