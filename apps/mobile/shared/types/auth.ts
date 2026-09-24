export type UserRole = "AGRICULTOR" | "ADMIN";

export interface AuthSession {
  token: string;
  userId: string;
  role: UserRole;
  email: string;
  name?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}
