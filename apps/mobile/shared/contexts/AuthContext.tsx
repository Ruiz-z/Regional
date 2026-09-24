import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import * as SecureStore from "expo-secure-store";

import { setAuthToken } from "@/shared/lib/api";
import type { AuthSession, LoginCredentials } from "@/shared/types/auth";
import { decodeJwtPayload } from "@/features/login/actions/mockLogin";
import { login } from "@/features/login/actions/login";

const SESSION_KEY = "smartriego.session";

interface AuthContextValue {
  session: AuthSession | null;
  isLoading: boolean;
  signIn: (credentials: LoginCredentials) => Promise<AuthSession>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}): React.JSX.Element {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    SecureStore.getItemAsync(SESSION_KEY)
      .then((raw) => {
        if (raw) {
          const restored = JSON.parse(raw) as AuthSession;
          if (
            restored.role === "AGRICULTOR" &&
            (decodeJwtPayload(restored.token).exp ?? 0) * 1000 > Date.now()
          ) {
            setAuthToken(restored.token);
            setSession(restored);
          }
        }
      })
      .catch(() => {
        // Sin sesión previa o storage inválido: se trata como deslogueado.
      })
      .finally(() => setIsLoading(false));
  }, []);

  const signIn = useCallback(
    async (credentials: LoginCredentials): Promise<AuthSession> => {
      const next = await login(credentials);
      if (next.role !== "AGRICULTOR")
        throw new Error(
          "La app móvil es exclusiva para Agricultores. Usa el panel web.",
        );
      await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(next));
      setAuthToken(next.token);
      setSession(next);
      return next;
    },
    [],
  );

  const signOut = useCallback(async (): Promise<void> => {
    await SecureStore.deleteItemAsync(SESSION_KEY);
    setAuthToken(null);
    setSession(null);
  }, []);

  useEffect(() => {
    if (!session) return;
    const expires = (decodeJwtPayload(session.token).exp ?? 0) * 1000;
    const timer = setTimeout(
      () => {
        setAuthToken(null);
        setSession(null);
        void SecureStore.deleteItemAsync(SESSION_KEY).catch(() => undefined);
      },
      Math.max(0, expires - Date.now()),
    );
    return () => clearTimeout(timer);
  }, [session]);

  const value = useMemo(
    () => ({ session, isLoading, signIn, signOut }),
    [session, isLoading, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
