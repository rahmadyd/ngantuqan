import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionRole } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";

/**
 * Mints a short-lived signed URL for a purchased product file.
 *
 * The flow is deliberately strict:
 *   1. The caller must be signed in (a customer) or an admin.
 *   2. The order item must belong to an order with payment_status = 'PAID'.
 *   3. The download is recorded.
 *   4. A signed URL with a 120-second TTL is minted from the private bucket.
 *
 * Nothing here ever returns a permanent object path or a public URL for a
 * private file. The signed URL is the only way a product file can be read.
 */

const SIGNED_URL_TTL_SECONDS = 120;

const paramsSchema = z.object({
  itemId: z.string().uuid(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> },
) {
  const { itemId } = await params;

  const parsed = paramsSchema.safeParse({ itemId });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid order item" }, { status: 400 });
  }

  const session = await getSessionRole();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Minting a signed URL is the thing worth counting.
  const limit = await checkRateLimit("download");
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many download requests. Please try again shortly." },
      { status: 429 },
    );
  }

  // The RPC enforces payment status and ownership, and records the download.
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("record_download", {
    p_order_item_id: parsed.data.itemId,
  });

  if (error) {
    const status = error.message.includes("Payment not confirmed") ? 402 : 403;
    return NextResponse.json({ error: error.message }, { status });
  }

  if (!data || data.length === 0) {
    return NextResponse.json(
      { error: "No downloadable files for this item" },
      { status: 404 },
    );
  }

  const signed = await Promise.all(
    (data as { storage_path: string; file_name: string }[]).map(async (file) => {
      const { data: url, error: signError } = await admin.storage
        .from("private-products")
        .createSignedUrl(file.storage_path, SIGNED_URL_TTL_SECONDS);

      return {
        fileName: file.file_name,
        url: signError ? null : url?.signedUrl ?? null,
        expiresIn: SIGNED_URL_TTL_SECONDS,
      };
    }),
  );

  return NextResponse.json({ files: signed });
}
