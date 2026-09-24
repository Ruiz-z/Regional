import { AUTH_TOKEN_KEY } from "@/shared/auth/auth-context";
import { apiFetch } from "@/shared/lib/api-client";

export interface CurrentUser {
  id: string;
  email: string;
  role: "AGRICULTOR" | "ADMIN";
  createdAt: string;
}

function requireToken(token?: string): string {
  const authToken = token ?? window.localStorage.getItem(AUTH_TOKEN_KEY);
  if (!authToken) {
    throw new Error("No hay sesión activa");
  }
  return authToken;
}

export async function getCurrentUser(token?: string): Promise<CurrentUser> {
  return apiFetch<CurrentUser>("/users/me", {}, requireToken(token));
}

// /auth/forgot-password y /auth/reset-password son públicos en el backend
// (pensados para el flujo "olvidé mi contraseña" sin sesión) — aquí solo se
// reutilizan desde una pantalla que ya exige sesión, no requieren token.
export async function requestPasswordReset(email: string): Promise<void> {
  await apiFetch("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function resetPassword(
  resetToken: string,
  newPassword: string,
): Promise<void> {
  await apiFetch("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token: resetToken, newPassword }),
  });
}
