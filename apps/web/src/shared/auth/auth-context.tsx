"use client";

import * as React from "react";

import { decodeSession, isTokenExpired } from "@/shared/auth/session";

export const AUTH_TOKEN_KEY = "smartriego-token";

interface AuthContextValue {
  token: string | null;
  session: ReturnType<typeof decodeSession> | null;
  isAuthenticated: boolean;
  isReady: boolean;
  setToken: (token: string) => void;
  clearToken: () => void;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [token, setTokenState] = React.useState<string | null>(null);
  const [isReady, setIsReady] = React.useState<boolean>(false);

  React.useEffect(() => {
    const stored = window.localStorage.getItem(AUTH_TOKEN_KEY);
    const decoded = stored ? decodeSession(stored) : null;
    const valid =
      decoded !== null && !isTokenExpired(decoded);
    setTokenState(valid ? stored : null);
    if (stored && !valid) {
      window.localStorage.removeItem(AUTH_TOKEN_KEY);
    }
    setIsReady(true);
  }, []);

  const setToken = React.useCallback((next: string) => {
    window.localStorage.setItem(AUTH_TOKEN_KEY, next);
    setTokenState(next);
  }, []);

  const clearToken = React.useCallback(() => {
    window.localStorage.removeItem(AUTH_TOKEN_KEY);
    setTokenState(null);
  }, []);

  const value = React.useMemo(
    () => ({
      token,
      session: token ? decodeSession(token) : null,
      isAuthenticated: token !== null,
      isReady,
      setToken,
      clearToken,
    }),
    [token, isReady, setToken, clearToken],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = React.useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}