import type { UserRole } from "@/features/auth/lib/api";

export interface AuthSession {
  userId: string;
  role: UserRole;
  email?: string;
  name?: string;
  exp?: number;
}

function isUserRole(value: unknown): value is UserRole {
  return value === "AGRICULTOR" || value === "ADMIN";
}

function parseBase64Url(value: string): string | null {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(
    normalized.length + ((4 - (normalized.length % 4)) % 4),
    "=",
  );
  try {
    const binary = atob(padded);
    return decodeURIComponent(
      binary
        .split("")
        .map((char) =>
          `%${char.charCodeAt(0).toString(16).padStart(2, "0")}`,
        )
        .join(""),
    );
  } catch {
    return null;
  }
}

export function decodeSession(token: string): AuthSession | null {
  const segments = token.split(".");
  if (segments.length < 2) {
    return null;
  }
  const payload = parseBase64Url(segments[1]);
  if (!payload) {
    return null;
  }
  try {
    const data = JSON.parse(payload);
    if (typeof data.userId !== "string" || !isUserRole(data.role)) {
      return null;
    }
    return {
      userId: data.userId,
      role: data.role,
      email: typeof data.email === "string" ? data.email : undefined,
      name: typeof data.name === "string" ? data.name : undefined,
      exp: typeof data.exp === "number" ? data.exp : undefined,
    };
  } catch {
    return null;
  }
}

export function isTokenExpired(session: AuthSession): boolean {
  if (session.exp === undefined) {
    return false;
  }
  return session.exp * 1000 <= Date.now();
}