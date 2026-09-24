import type { AuthSession, LoginCredentials, UserRole } from '@/shared/types/auth';
import { api, ApiError } from '@/shared/lib/api';
import { env } from '@/shared/lib/env';
import { decodeJwtPayload, mockLogin } from '@/features/login/actions/mockLogin';

const LOGIN_PATH = '/auth/login';

// Spec 001 RF-1/RF-2. Llama a POST /auth/login (BE-008); si el backend
// no está configurado (sin EXPO_PUBLIC_API_URL) usa el mock de
// features/login/actions/mockLogin.ts. Ver nota en shared/lib/env.ts.
export async function login(credentials: LoginCredentials): Promise<AuthSession> {
  if (env.isMock) {
    const res = await mockLogin(credentials);
    return {
      token: res.accessToken,
      userId: res.user.id,
      role: res.user.role as UserRole,
      email: res.user.email,
      name: res.user.name,
    };
  }

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
      throw new Error(error.status === 0 ? 'No se pudo conectar al servidor' : error.message);
    }
    throw error;
  }
}