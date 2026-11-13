export interface OrderBriefState {
  status: "idle" | "error" | "success";
  message: string;
  fieldErrors: Record<string, string>;
}

export const initialOrderBriefState: OrderBriefState = {
  status: "idle",
  message: "",
  fieldErrors: {},
};
