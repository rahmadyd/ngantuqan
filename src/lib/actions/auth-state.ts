export interface LoginState {
  status: "idle" | "error";
  message: string;
  fieldErrors: Partial<Record<"email" | "password", string>>;
}

export const initialLoginState: LoginState = {
  status: "idle",
  message: "",
  fieldErrors: {},
};
