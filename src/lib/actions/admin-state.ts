export interface AdminActionState {
  status: "idle" | "error" | "success";
  message: string;
  fieldErrors: Record<string, string>;
}

export const initialAdminState: AdminActionState = {
  status: "idle",
  message: "",
  fieldErrors: {},
};

/** A failed action with no specific field to blame. */
export function adminError(message: string): AdminActionState {
  return { status: "error", message, fieldErrors: {} };
}
