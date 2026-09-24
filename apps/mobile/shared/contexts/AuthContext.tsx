import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';

import type { AuthSession, LoginCredentials } from '@/shared/types/auth';
import { login } from '@/features/login/actions/login';

const SESSION_KEY = 'smartriego.session';

interface AuthContextValue {
  session: AuthSession | null;
  isLoading: boolean;
  signIn: (credentials: LoginCredentials) => Promise<AuthSession>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    SecureStore.getItemAsync(SESSION_KEY)
      .then((raw) => {
        if (raw) {
          setSession(JSON.parse(raw) as AuthSession);
        }
      })
      .catch(() => {
        // Sin sesión previa o storage inválido: se trata como deslogueado.
      })
      .finally(() => setIsLoading(false));
  }, []);

  const signIn = async (credentials: LoginCredentials): Promise<AuthSession> => {
    const next = await login(credentials);
    await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(next));
    setSession(next);
    return next;
  };

  const signOut = async (): Promise<void> => {
    await SecureStore.deleteItemAsync(SESSION_KEY);
    setSession(null);
  };

  const value = useMemo(
    () => ({ session, isLoading, signIn, signOut }),
    [session, isLoading, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}