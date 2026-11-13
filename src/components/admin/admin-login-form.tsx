"use client";

import { useActionState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { signIn } from "@/lib/actions/auth";
import {
  initialLoginState,
  type LoginState,
} from "@/lib/actions/auth-state";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Alert } from "@/components/ui/feedback";

const schema = z.object({
  email: z.string().trim().min(1, "Please enter your email address."),
  password: z.string().min(1, "Please enter your password."),
});

type LoginInput = z.infer<typeof schema>;

export function AdminLoginForm({ forbidden }: { forbidden?: boolean }) {
  const [state, formAction, isPending] = useActionState<LoginState, FormData>(
    signIn,
    initialLoginState,
  );

  const {
    register,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(schema),
    mode: "onBlur",
    defaultValues: { email: "", password: "" },
  });

  return (
    <form action={formAction} className="space-y-5" noValidate>
      {forbidden ? (
        <Alert variant="warning" title="Administrator access required">
          That account is signed in, but it does not have the administrator
          role.
        </Alert>
      ) : null}

      {state.status === "error" && state.message ? (
        <Alert variant="danger">{state.message}</Alert>
      ) : null}

      <div>
        <Label htmlFor="email">Email address</Label>
        <Input
          id="email"
          type="email"
          autoComplete="username"
          className="mt-2"
          aria-required="true"
          aria-invalid={Boolean(errors.email || state.fieldErrors.email)}
          {...register("email")}
        />
        {errors.email || state.fieldErrors.email ? (
          <p role="alert" className="mt-2 text-sm text-danger">
            {errors.email?.message ?? state.fieldErrors.email}
          </p>
        ) : null}
      </div>

      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          className="mt-2"
          aria-required="true"
          aria-invalid={Boolean(errors.password || state.fieldErrors.password)}
          {...register("password")}
        />
        {errors.password || state.fieldErrors.password ? (
          <p role="alert" className="mt-2 text-sm text-danger">
            {errors.password?.message ?? state.fieldErrors.password}
          </p>
        ) : null}
      </div>

      <Button type="submit" size="lg" disabled={isPending} className="w-full">
        {isPending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
