"use client";

import { useActionState } from "react";
import { Download } from "lucide-react";
import { requestDownload } from "@/lib/actions/checkout";
import {
  initialDownloadState,
  type DownloadState,
} from "@/lib/actions/checkout-state";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/feedback";
import { useLocale } from "@/lib/i18n/client";
import { fill } from "@/lib/i18n/format";

/**
 * Mints a signed download URL on click.
 *
 * Signed URLs expire after two minutes, so they are never baked into the
 * page — the button asks the server for a fresh one, and the server checks
 * the order number, the email, and the access token before it mints one.
 */
export function DownloadButton({
  orderNumber,
  email,
  token,
  fileName,
}: {
  orderNumber: string;
  email: string;
  token: string;
  fileName: string;
}) {
  const [state, formAction, isPending] = useActionState<
    DownloadState,
    FormData
  >(requestDownload, initialDownloadState);
  const { t } = useLocale();

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="order_number" value={orderNumber} />
      <input type="hidden" name="email" value={email} />
      <input type="hidden" name="token" value={token} />

      <Button type="submit" size="sm" disabled={isPending}>
        <Download aria-hidden="true" />
        {isPending ? "Preparing…" : `${t.shop.download} ${fileName}`}
      </Button>

      {state.status === "error" && state.message ? (
        <Alert variant="danger">{state.message}</Alert>
      ) : null}

      {state.status === "success" && state.files.length > 0 ? (
        <ul className="space-y-2">
          {state.files.map((file) => (
            <li key={file.url}>
              <a
                href={file.url}
                download={file.fileName}
                className="font-label text-xs text-primary underline-offset-4 hover:underline"
              >
                {fill(t.shop.readyToSave, { file: file.fileName })}
              </a>
            </li>
          ))}
        </ul>
      ) : null}
    </form>
  );
}
