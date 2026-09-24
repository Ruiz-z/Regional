const API_URL: string =
  process.env.NEXT_PUBLIC_API_URL ?? "/api";

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

interface ApiErrorBody {
  message?: string | string[];
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
  token?: string,
): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });

  const text = await response.text();
  let body: ApiErrorBody | T | null = null;
  if (text) {
    try {
      body = JSON.parse(text) as ApiErrorBody | T;
    } catch {
      body = null;
    }
  }

  if (!response.ok) {
    const errBody = body as ApiErrorBody | null;
    const message = Array.isArray(errBody?.message)
      ? errBody?.message.join(", ")
      : errBody?.message;
    throw new ApiError(
      response.status,
      message ?? "Error inesperado. Intentá de nuevo.",
    );
  }

  if (body === null) {
    return undefined as T;
  }
  return body as T;
}