import type { LoginCredentials } from '@/shared/types/auth';

// Mock de POST /auth/login (Spec 001 RF-1/RF-2) mientras el backend
// (BE-008) no está desplegado. Cuando EXPO_PUBLIC_API_URL esté definida,
// features/login/actions/login.ts pega al endpoint real y este mock cae.
// Contrato esperado del real: 200 → { accessToken, user: { id, email, name, role } },
// 401 → error genérico "Credenciales inválidas" (RF-2).

export const MOCK_LOGIN_PATH = '/auth/login';

export interface MockLoginResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    role: 'AGRICULTOR' | 'ADMIN';
    name: string;
  };
}

const DEMO_USER = {
  email: 'ana.torres@smartriego.mx',
  password: 'demo1234',
  id: 'u_demo_ana',
  role: 'AGRICULTOR' as const,
  name: 'Ana Torres',
};

function base64UrlDecode(input: string): string {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
  return decodeURIComponent(
    atob(padded)
      .split('')
      .map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
      .join(''),
  );
}

export function decodeJwtPayload(token: string): { userId: string; role: string } {
  const payload = token.split('.')[1];
  if (!payload) {
    throw new Error('JWT inválido');
  }
  const parsed = JSON.parse(base64UrlDecode(payload)) as Record<string, unknown>;
  return {
    userId: String(parsed.userId ?? parsed.sub ?? ''),
    role: String(parsed.role ?? 'AGRICULTOR'),
  };
}

function utf8ToBase64(input: string): string {
  return btoa(
    encodeURIComponent(input).replace(/%([0-9A-F]{2})/g, (_, hex: string) => String.fromCharCode(parseInt(hex, 16))),
  );
}

function signMockJwt(user: MockLoginResponse['user']): string {
  const header = utf8ToBase64(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const payload = utf8ToBase64(
    JSON.stringify({ userId: user.id, role: user.role, sub: user.id, iat: Date.now(), exp: Date.now() + 86_400_000 }),
  )
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  return `${header}.${payload}.mock-signature`;
}

export async function mockLogin(credentials: LoginCredentials): Promise<MockLoginResponse> {
  await new Promise((resolve) => setTimeout(resolve, 350));

  const validEmail = credentials.email.trim().toLowerCase() === DEMO_USER.email;
  const validPassword = credentials.password === DEMO_USER.password;

  // RF-2: mismo error genérico para email inexistente y password incorrecto.
  if (!validEmail || !validPassword) {
    throw new Error('Credenciales inválidas');
  }

  return {
    accessToken: signMockJwt({ id: DEMO_USER.id, email: DEMO_USER.email, role: DEMO_USER.role, name: DEMO_USER.name }),
    user: { id: DEMO_USER.id, email: DEMO_USER.email, role: DEMO_USER.role, name: DEMO_USER.name },
  };
}