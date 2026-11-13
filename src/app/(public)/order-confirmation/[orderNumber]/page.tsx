import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { CheckCircle2, Clock, CreditCard, Download, FileText } from "lucide-react";
import { Container, Eyebrow } from "@/components/layout/primitives";
import { StatusPill } from "@/components/admin/status-pill";
import { OrderAccessForm } from "@/components/shop/order-access-form";
import { DownloadButton } from "@/components/shop/download-button";
import { PayNowButton } from "@/components/shop/pay-now-button";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyOrderAccessToken } from "@/lib/orders/access";
import { getDictionary } from "@/lib/i18n/server";
import {
  getPaymentProviderForOrder,
  paymentInstructions,
} from "@/lib/payments";
import { formatCurrency, formatDate, DEFAULT_CURRENCY } from "@/lib/utils";
import type { Database } from "@/types/database.types";

type Params = Promise<{ orderNumber: string }>;
type SearchParams = Promise<{ token?: string }>;

type OrderItem = Database["public"]["Tables"]["digital_order_items"]["Row"];

export const metadata: Metadata = {
  title: "Your order",
  // Transactional and private — never indexed, never cached.
  robots: { index: false, follow: false },
};

export default async function OrderConfirmationPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  // Never prerendered — the page is per order and per token.
  await connection();

  const t = await getDictionary();

  const { orderNumber } = await params;
  const { token } = await searchParams;

  const access = verifyOrderAccessToken(token, orderNumber);

  if (!access) {
    return (
      <section className="py-14 md:py-20">
        <Container>
          <div className="mx-auto max-w-xl">
            <Eyebrow>Your order</Eyebrow>
            <h1 className="mt-4 font-display text-[clamp(2rem,4.5vw,3rem)] leading-[1.05] font-semibold tracking-[-0.03em] text-balance">
              {t.orderAccess.title}
            </h1>
            <p className="prose-body-strong mt-4">
              {t.orderAccess.body}
            </p>

            <div className="mt-8">
              <OrderAccessForm orderNumber={orderNumber} />
            </div>
          </div>
        </Container>
      </section>
    );
  }

  const admin = createAdminClient();

  const { data: order } = await admin
    .from("digital_orders")
    .select("*")
    .eq("order_number", orderNumber)
    .maybeSingle();

  // The token proves the email was checked once; the order still has to be
  // there, and its email still has to be the one on the token.
  if (!order || order.customer_email.toLowerCase() !== access.email.toLowerCase()) {
    return (
      <section className="py-14 md:py-20">
        <Container>
          <div className="mx-auto max-w-xl">
            <Eyebrow>Your order</Eyebrow>
            <h1 className="mt-4 font-display text-[clamp(2rem,4.5vw,3rem)] leading-[1.05] font-semibold tracking-[-0.03em] text-balance">
              We could not find that order
            </h1>
            <p className="prose-body-strong mt-4">
              The access link has expired, or the order number does not match.
              Enter both again and we will take you straight to it.
            </p>

            <div className="mt-8">
              <OrderAccessForm orderNumber={orderNumber} email={access.email} />
            </div>
          </div>
        </Container>
      </section>
    );
  }

  // `digital_order_items` has no `created_at` column, so the list is ordered
  // by the product title instead.
  const { data: items, error: itemsError } = await admin
    .from("digital_order_items")
    .select("*")
    .eq("digital_order_id", order.id)
    .order("product_title", { ascending: true });

  if (itemsError) {
    console.error("[order-confirmation] items query failed:", itemsError.message);
  }

  // The provider decides what the customer is told to do next. For the manual
  // provider that is the studio's bank transfer instructions, which live in
  // the database so the studio can change them without a deploy.
  const provider = getPaymentProviderForOrder(order.payment_provider);

const payment = await paymentInstructions(
    {
      orderNumber: order.order_number,
      amount: Number(order.total_amount),
      currency: DEFAULT_CURRENCY,
      customerName: order.customer_name,
      customerEmail: order.customer_email,
      reference: order.transaction_reference,
    },
    order.payment_provider,
  );

  const orderItems = (items ?? []) as OrderItem[];
  const isPaid = order.payment_status === "PAID";

  // An empty `in` filter matches nothing, so the query is only run when
  // there is something to match.
  const productIds = orderItems
    .map((item) => item.product_id)
    .filter((id): id is string => Boolean(id));

  const { data: files, error: filesError } =
    isPaid && productIds.length > 0
      ? await admin
          .from("product_files")
          .select("id, product_id, file_name, file_size")
          .in("product_id", productIds)
      : { data: [], error: null };

  if (filesError) {
    console.error("[order-confirmation] files query failed:", filesError.message);
  }

  return (
    <section className="py-14 md:py-20">
      <Container>
        <div className="mx-auto max-w-3xl">
          <span
            className={`flex size-12 items-center justify-center rounded-full ${
              isPaid ? "bg-success-surface" : "bg-warning-surface"
            }`}
          >
            {isPaid ? (
              <CheckCircle2 aria-hidden="true" className="size-6 text-success" />
            ) : (
              <Clock aria-hidden="true" className="size-6 text-warning" />
            )}
          </span>

          <Eyebrow>{isPaid ? "Payment confirmed" : "Order received"}</Eyebrow>
          <h1 className="mt-4 font-display text-[clamp(2.25rem,5vw,3.5rem)] leading-[1.05] font-semibold tracking-[-0.03em] text-balance">
            {isPaid ? t.orderConfirmation.ready : t.orderConfirmation.waiting}
          </h1>
          <p className="prose-body-strong mt-5">
            {isPaid
              ? t.orderConfirmation.readyLede
              : t.orderConfirmation.waitingLede}
          </p>

          <dl className="mt-8 divide-y divide-border rounded-xl border border-border bg-surface px-6 shadow-sm">
            <div className="flex items-center justify-between gap-4 py-4">
              <dt className="eyebrow">{t.orderConfirmation.orderNumber}</dt>
              <dd className="font-label font-semibold text-text">
                {order.order_number}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4 py-4">
              <dt className="eyebrow">Placed</dt>
              <dd className="font-label text-sm text-text">
                {formatDate(order.created_at)}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4 py-4">
              <dt className="eyebrow">Payment</dt>
              <dd>
                <StatusPill value={order.payment_status} />
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4 py-4">
              <dt className="eyebrow">{t.checkout.total}</dt>
              <dd className="font-display text-lg font-semibold tabular-nums">
                {formatCurrency(order.total_amount)}
              </dd>
            </div>
          </dl>

          <section className="mt-8 rounded-xl border border-border bg-surface p-6 shadow-sm">
            <h2 className="font-display text-lg font-semibold">What you bought</h2>
            <ul className="mt-4 divide-y divide-border">
              {orderItems.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-4 py-3 first:pt-0"
                >
                  <span className="text-sm text-text">
                    {item.quantity} § {item.product_title}
                  </span>
                  <span className="font-label text-sm tabular-nums text-muted">
                    {formatCurrency(
                      Number(item.unit_price) * item.quantity,
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {isPaid ? (
            <section className="mt-8 rounded-xl border border-border bg-surface p-6 shadow-sm">
              <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
                <Download aria-hidden="true" className="size-4 text-primary" />
                Your downloads
              </h2>
              <p className="mt-1 text-sm text-muted">
                Each file is served through a short-lived signed link.
              </p>

              <ul className="mt-5 space-y-4">
                {(files ?? []).map((file) => (
                  <li key={file.id} className="rounded-md border border-border p-4">
                    <p className="font-label text-sm font-medium text-text">
                      {file.file_name}
                    </p>
                    {file.file_size ? (
                      <p className="mt-0.5 font-label text-xs text-muted-foreground">
                        {Math.round(file.file_size / 1024)} KB
                      </p>
                    ) : null}
                    <div className="mt-3">
                      <DownloadButton
                        orderNumber={order.order_number}
                        email={order.customer_email}
                        token={token ?? ""}
                        fileName={file.file_name}
                      />
                    </div>
                  </li>
                ))}
              </ul>

              {(files ?? []).length === 0 ? (
                <p className="mt-4 text-sm text-muted">
                  The files for this order are still being uploaded. We will
                  email you when they are ready.
                </p>
              ) : null}
            </section>
          ) : (
            <section className="mt-8 rounded-xl border border-border bg-surface p-6 shadow-sm">
              <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
                <CreditCard aria-hidden="true" className="size-4 text-primary" />
                {payment.heading}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                {payment.body}
              </p>
              {payment.account ? (
                <p className="mt-3 rounded-md bg-surface-sunken px-4 py-3 font-label text-sm text-text">
                  {payment.account}
                </p>
              ) : null}
              {payment.account ? (
                <p className="mt-4 flex items-start gap-2 font-label text-xs text-muted-foreground">
                  <FileText aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
                  Quote{" "}
                  <span className="font-semibold text-text">
                    {order.order_number}
                  </span>{" "}
                  with your transfer so we can match it to your order.
                </p>
              ) : null}

              {/* A hosted provider pays on its own page — so the customer can
                  go back to it if the tab was closed. */}
              {provider.hostedCheckout ? (
                <PayNowButton
                  orderNumber={order.order_number}
                  email={order.customer_email}
                  provider={order.payment_provider}
                />
              ) : null}
            </section>
          )}

          <div className="mt-10 flex flex-wrap gap-4 border-t border-border pt-8">
            <Link
              href="/shop"
              className="font-label text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              {t.shop.backToShop}
            </Link>
            <Link
              href="/contact"
              className="font-label text-sm font-medium text-muted-foreground underline-offset-4 hover:text-text hover:underline"
            >
              {t.nav.contact}
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
