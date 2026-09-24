import { apiFetch, ApiError } from "@/shared/lib/api-client";

export type UserRole = "AGRICULTOR" | "ADMIN";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
}

export const DEFAULT_LOGIN_ERROR =
  "Correo o contraseña incorrectos. Verificá tus credenciales.";

const AUTH_MOCK_ENABLED =
  process.env.NEXT_PUBLIC_AUTH_MOCK === "true";

function base64UrlEncode(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(
    /=+$/,
    "",
  );
}

function mockToken(email: string): string {
  const role: UserRole = email.toLowerCase().includes("admin")
    ? "ADMIN"
    : "AGRICULTOR";
  const header = base64UrlEncode(JSON.stringify({ alg: "none", typ: "JWT" }));
  const now = Math.floor(Date.now() / 1000);
  const payload = base64UrlEncode(
    JSON.stringify({
      userId: "00000000-0000-0000-0000-000000000000",
      role,
      email,
      exp: now + 60 * 60 * 24,
    }),
  );
  return `${header}.${payload}.mock`;
}

export async function loginUser(
  payload: LoginPayload,
): Promise<LoginResponse> {
  if (AUTH_MOCK_ENABLED) {
    return { token: mockToken(payload.email) };
  }

  try {
    return await apiFetch<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      throw new ApiError(401, DEFAULT_LOGIN_ERROR);
    }
    throw error;
  }
}