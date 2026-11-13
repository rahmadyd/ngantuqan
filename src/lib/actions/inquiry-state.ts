import type { InquiryInput } from "@/lib/validations/contact";

export interface ActionState {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors: Partial<Record<keyof InquiryInput, string>>;
  reference?: string;
}

export const initialState: ActionState = {
  status: "idle",
  message: "",
  fieldErrors: {},
};
