export interface CheckoutState {
  status: "idle" | "error" | "success";
  message: string;
  fieldErrors: Record<string, string>;
}

export const initialCheckoutState: CheckoutState = {
  status: "idle",
  message: "",
  fieldErrors: {},
};

export interface DownloadState {
  status: "idle" | "error" | "success";
  message: string;
  files: { fileName: string; url: string }[];
}

export const initialDownloadState: DownloadState = {
  status: "idle",
  message: "",
  files: [],
};

/** The state of "pay again" — the address to pay at comes back with it. */
export interface HostedPaymentState {
  status: "idle" | "error";
  message: string;
  url?: string;
}

export const initialHostedPaymentState: HostedPaymentState = {
  status: "idle",
  message: "",
};
