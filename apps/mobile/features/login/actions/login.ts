import type {
  AuthSession,
  LoginCredentials,
  UserRole,
} from "@/shared/types/auth";
import { api, ApiError } from "@/shared/lib/api";
import { decodeJwtPayload } from "@/features/login/actions/mockLogin";

const LOGIN_PATH = "/auth/login";

// Autenticación contra el backend; nunca crea sesiones simuladas.
export async function login(
  credentials: LoginCredentials,
): Promise<AuthSession> {
  try {
    const res = await api.post<{
      accessToken: string;
      user?: { id: string; email: string; name?: string; role?: string };
    }>(LOGIN_PATH, credentials);

    const token = res.accessToken;
    const jwt = decodeJwtPayload(token);

    return {
      token,
      userId: res.user?.id ?? jwt.userId,
      role: (res.user?.role ?? jwt.role) as UserRole,
      email: res.user?.email ?? credentials.email,
      name: res.user?.name,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw new Error(
        error.status === 0 ? "No se pudo conectar al servidor" : error.message,
      );
    }
    throw error;
  }
}
