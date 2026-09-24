"use client";

import * as React from "react";

import Link from "next/link";

import { useAuth } from "@/shared/auth/auth-context";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  getCurrentUser,
  requestPasswordReset,
  resetPassword,
  type CurrentUser,
} from "@/features/profile/lib/api";

const ROLE_LABEL: Record<CurrentUser["role"], string> = {
  AGRICULTOR: "Agricultor",
  ADMIN: "Administrador",
};

export function ProfileView() {
  const { token } = useAuth();
  const [user, setUser] = React.useState<CurrentUser | null>(null);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  const [resetSent, setResetSent] = React.useState(false);
  const [resetToken, setResetToken] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [formError, setFormError] = React.useState<string | null>(null);
  const [formNotice, setFormNotice] = React.useState<string | null>(null);
  const [requesting, setRequesting] = React.useState(false);
  const [confirming, setConfirming] = React.useState(false);

  React.useEffect(() => {
    if (!token) return;
    let alive = true;
    getCurrentUser(token)
      .then((result) => {
        if (alive) setUser(result);
      })
      .catch((err: unknown) => {
        if (alive) {
          setLoadError(
            err instanceof Error ? err.message : "Error inesperado.",
          );
        }
      });
    return () => {
      alive = false;
    };
  }, [token]);

  const handleRequestReset = async () => {
    if (!user) return;
    setFormError(null);
    setFormNotice(null);
    setRequesting(true);
    try {
      await requestPasswordReset(user.email);
      setResetSent(true);
      setFormNotice(
        "Si el correo existe, te enviamos un enlace con el código para restablecer la contraseña.",
      );
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Error inesperado.");
    } finally {
      setRequesting(false);
    }
  };

  const handleConfirmReset = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(null);
    setFormNotice(null);
    setConfirming(true);
    try {
      await resetPassword(resetToken, newPassword);
      setFormNotice(
        "Contraseña actualizada. Iniciá sesión de nuevo con la nueva contraseña.",
      );
      setResetSent(false);
      setResetToken("");
      setNewPassword("");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Error inesperado.");
    } finally {
      setConfirming(false);
    }
  };

  return (
    <>
      <header className="flex-none border-b border-border px-8 pb-5 pt-6">
        <Link
          href="/dashboard"
          className="text-[14px] font-semibold text-accent no-underline"
        >
          ← Volver al dashboard
        </Link>
        <h1 className="mt-1.5 font-display text-2xl font-bold text-ink">
          Perfil
        </h1>
        <p className="mt-0.5 text-[14px] text-ink-muted">
          Datos de cuenta y cambio de contraseña.
        </p>
      </header>

      <div className="flex flex-1 flex-col gap-6 px-8 pb-12 pt-6">
        {loadError ? (
          <p className="text-sm font-semibold text-ink-muted">{loadError}</p>
        ) : !user ? (
          <p className="text-sm font-semibold text-ink-muted">
            Cargando perfil…
          </p>
        ) : (
          <Card className="max-w-lg">
            <CardHeader>
              <CardTitle>Cuenta</CardTitle>
              <CardDescription>
                Información asociada a tu sesión actual.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div>
                <p className="text-xs font-semibold uppercase text-ink-muted">
                  Correo
                </p>
                <p className="text-[15px] text-ink">{user.email}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-ink-muted">
                  Rol
                </p>
                <p className="text-[15px] text-ink">
                  {ROLE_LABEL[user.role]}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-ink-muted">
                  Cuenta creada
                </p>
                <p className="text-[15px] text-ink">
                  {new Date(user.createdAt).toLocaleDateString("es-MX", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle>Cambiar contraseña</CardTitle>
            <CardDescription>
              Te enviamos un código a tu correo para confirmar el cambio.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {formNotice && (
              <p className="text-sm font-semibold text-primary">
                {formNotice}
              </p>
            )}
            {formError && (
              <p className="text-sm font-semibold text-danger">{formError}</p>
            )}

            {!resetSent ? (
              <Button
                type="button"
                variant="secondary"
                disabled={!user || requesting}
                onClick={() => void handleRequestReset()}
              >
                {requesting ? "Enviando…" : "Enviar código de restablecimiento"}
              </Button>
            ) : (
              <form
                className="flex flex-col gap-3"
                onSubmit={(event) => void handleConfirmReset(event)}
              >
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="reset-token">Código recibido</Label>
                  <Input
                    id="reset-token"
                    value={resetToken}
                    onChange={(event) => setResetToken(event.target.value)}
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="new-password">Nueva contraseña</Label>
                  <Input
                    id="new-password"
                    type="password"
                    minLength={8}
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={confirming}>
                    {confirming ? "Guardando…" : "Confirmar cambio"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setResetSent(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
