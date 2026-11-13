"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { getSession } from "@/lib/supabase/guards";
import { type OrderBriefState } from "@/lib/actions/order-state";
import {
  orderBriefSchema,
  REFERENCE_FILE_MAX_BYTES,
} from "@/lib/validations/order";
import { checkRateLimit, rateLimitMessage } from "@/lib/rate-limit";
import { getDictionary } from "@/lib/i18n/server";

/**
 * Submit a project brief (spec §4.J).
 *
 * The order is written first and the notification is a side effect: if the
 * mail provider is down, the brief is still stored and the customer still
 * gets a reference. Nothing here is marked as paid — a quote is a quote, and
 * the studio confirms the price separately.
 */

const HONEYPOT_FIELD = "website";

function text(formData: FormData, name: string): string | undefined {
  const value = formData.get(name);
  if (value === null) return undefined;
  if (typeof value !== "string") return undefined;
  return value;
}

export async function submitOrderBrief(
  _prev: OrderBriefState,
  formData: FormData,
): Promise<OrderBriefState> {
  const t = await getDictionary();

  if (!isSupabaseConfigured) {
    return {
      status: "error",
      message: t.actions.orderNoDatabase,
      fieldErrors: {},
    };
  }

  // Honeypot — a hidden field a human never fills in. Answer as if it worked
  // so a bot learns nothing from the response, and store nothing.
  if ((text(formData, HONEYPOT_FIELD) ?? "").trim()) {
    return {
      status: "success",
      message: t.actions.orderBriefReceived,
      fieldErrors: {},
    };
  }

  // Throttling comes after the honeypot and before the write, so a brief that
  // is real but too frequent is refused without storing anything.
  const limit = await checkRateLimit("order-brief");

  if (!limit.allowed) {
    return {
      status: "error",
      message: rateLimitMessage("order-brief", limit, t),
      fieldErrors: {},
    };
  }

  const parsed = orderBriefSchema.safeParse({
    customer_name: text(formData, "customer_name"),
    customer_email: text(formData, "customer_email"),
    service_id: text(formData, "service_id"),
    package_id: text(formData, "package_id"),
    project_description: text(formData, "project_description"),
    target_audience: text(formData, "target_audience"),
    design_references: text(formData, "design_references"),
    preferred_colors: text(formData, "preferred_colors"),
    requested_deliverables: text(formData, "requested_deliverables"),
    budget: text(formData, "budget"),
    deadline: text(formData, "deadline"),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }

    return {
      status: "error",
      message: t.actions.checkFieldsRetry,
      fieldErrors,
    };
  }

  const input = parsed.data;
  const supabase = await createClient();

  // The service and package are resolved server-side. A package from another
  // service is rejected rather than stored.
  const { data: service } = await supabase
    .from("services")
    .select("id, slug, title")
    .eq("id", input.service_id)
    .eq("is_active", true)
    .maybeSingle();

  if (!service) {
    return {
      status: "error",
      message: t.actions.serviceUnavailable,
      fieldErrors: {},
    };
  }

  let packageId: string | null = null;
  let packageName: string | null = null;

  if (input.package_id) {
    const { data: pkg } = await supabase
      .from("service_packages")
      .select("id, name")
      .eq("id", input.package_id)
      .eq("service_id", service.id)
      .eq("is_active", true)
      .maybeSingle();

    if (!pkg) {
      return {
        status: "error",
        message: t.actions.packageUnavailable,
        fieldErrors: {},
      };
    }

    packageId = pkg.id;
    packageName = pkg.name;
  }

  const session = await getSession();

  const { data: created, error } = await supabase.rpc("record_service_order", {
    p_brief: {
      customer_id: session?.userId ?? "",
      customer_name: input.customer_name,
      customer_email: input.customer_email,
      service_id: service.id,
      package_id: packageId ?? "",
      project_description: input.project_description,
      target_audience: input.target_audience ?? "",
      design_references: input.design_references ?? "",
      preferred_colors: input.preferred_colors ?? "",
      requested_deliverables: input.requested_deliverables ?? "",
      budget: input.budget ?? "",
      deadline: input.deadline ?? "",
    },
  });

  const order = created?.[0];

  if (error || !order) {
    console.error("[order] failed to store brief:", error?.message);
    return {
      status: "error",
      message: t.actions.orderSaveFailed,
      fieldErrors: {},
    };
  }

  await storeReferenceFile(formData, order.id);

  // Notification is a side effect — a failure here must not undo the brief.
  try {
    const {
      sendOrderBriefNotification,
      sendServiceOrderConfirmation,
    } = await import("@/lib/email/send");

    await sendOrderBriefNotification({
      orderNumber: order.order_number,
      customerName: input.customer_name,
      customerEmail: input.customer_email,
      serviceTitle: service.title,
      packageName,
      budget: input.budget ? Number(input.budget) : null,
      deadline: input.deadline || null,
      projectDescription: input.project_description,
    });

    await sendServiceOrderConfirmation({
      orderNumber: order.order_number,
      customerName: input.customer_name,
      customerEmail: input.customer_email,
      serviceTitle: service.title,
      packageName,
    });
  } catch (error) {
    console.error("[order] notification failed:", error);
  }

  redirect(
    `/order/${service.slug}/submitted?order=${encodeURIComponent(order.order_number)}`,
  );
}

/**
 * Stores the optional reference file in private storage.
 *
 * The file never touches a public URL: it goes to `private-attachments` under
 * a generated path, and the original name is kept only as metadata.
 */
async function storeReferenceFile(formData: FormData, orderId: string) {
  const entry = formData.get("reference_file");
  if (!(entry instanceof File) || entry.size === 0) return;

  if (entry.size > REFERENCE_FILE_MAX_BYTES) {
    console.error("[order] reference file too large:", entry.size);
    return;
  }

  const extension = (entry.name.split(".").pop() ?? "bin")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 10);

  const path = `orders/${orderId}/${crypto.randomUUID()}.${extension}`;

  try {
    const admin = createAdminClient();
    const { error: uploadError } = await admin.storage
      .from("private-attachments")
      .upload(path, entry, {
        contentType: entry.type || "application/octet-stream",
        upsert: false,
      });

    if (uploadError) {
      console.error("[order] reference upload failed:", uploadError.message);
      return;
    }

    const supabase = await createClient();
    const { error: insertError } = await supabase.from("order_attachments").insert({
      order_id: orderId,
      file_path: path,
      file_name: entry.name,
      file_type: entry.type || null,
      file_size: entry.size,
    });

    if (insertError) {
      console.error("[order] attachment row failed:", insertError.message);
    }
  } catch (error) {
    console.error("[order] attachment handling failed:", error);
  }
}
