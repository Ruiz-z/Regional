"use client";

import * as React from "react";

import { useRouter } from "next/navigation";

import {
  DEFAULT_LOGIN_ERROR,
  loginUser,
} from "@/features/auth/lib/api";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { useAuth } from "@/shared/auth/auth-context";

export function LoginForm() {
  const router = useRouter();
  const { setToken } = useAuth();

  const [email, setEmail] = React.useState<string>(
    "ana.torres@smartriego.mx",
  );
  const [password, setPassword] = React.useState<string>("");
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const { token } = await loginUser({ email, password });
      setToken(token);
      router.push("/dashboard");
    } catch (err) {
      setError(
        err instanceof Error && err.message
          ? err.message
          : DEFAULT_LOGIN_ERROR,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      className="flex flex-col gap-[18px]"
      onSubmit={handleSubmit}
      noValidate
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Correo</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Contraseña</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </div>

      <div className="flex justify-end">
        <a
          href="#"
          className="text-[13px] font-semibold text-accent no-underline"
        >
          ¿Olvidaste tu contraseña?
        </a>
      </div>

      {error ? (
        <p
          role="alert"
          className="rounded-md border border-status-danger-soft bg-status-danger-soft px-3 py-2 text-sm font-semibold text-status-danger"
        >
          {error}
        </p>
      ) : null}

      <Button
        type="submit"
        className="w-full justify-center text-base"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Ingresando…" : "Iniciar sesión"}
      </Button>
    </form>
  );
}