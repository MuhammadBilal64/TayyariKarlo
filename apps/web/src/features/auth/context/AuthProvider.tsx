import type { AuthUser, LoginInput, RegisterInput } from '@tayyari/shared';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import * as authApi from '../api/authApi';
import {
  clearAccessToken,
  getAccessToken,
  setAccessToken,
} from '../lib/token-storage';
import { AuthContext, type AuthContextValue } from './auth-context';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setToken] = useState<string | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const bootstrapGeneration = useRef(0);

  const applySession = useCallback((token: string, nextUser: AuthUser) => {
    setAccessToken(token);
    setToken(token);
    setUser(nextUser);
  }, []);

  const clearSession = useCallback(() => {
    clearAccessToken();
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    const generation = ++bootstrapGeneration.current;

    async function bootstrap() {
      try {
        const existing = getAccessToken();
        if (existing) {
          try {
            const me = await authApi.getMe(existing);
            if (generation === bootstrapGeneration.current) {
              applySession(existing, me);
            }
            return;
          } catch {
            clearAccessToken();
          }
        }

        const refreshed = await authApi.refresh();
        if (generation === bootstrapGeneration.current) {
          applySession(refreshed.accessToken, refreshed.user);
        }
      } catch {
        if (generation === bootstrapGeneration.current) {
          clearSession();
        }
      } finally {
        if (generation === bootstrapGeneration.current) {
          setIsBootstrapping(false);
        }
      }
    }

    void bootstrap();
  }, [applySession, clearSession]);

  const login = useCallback(
    async (input: LoginInput) => {
      const result = await authApi.login(input);
      applySession(result.accessToken, result.user);
    },
    [applySession],
  );

  const register = useCallback(
    async (input: RegisterInput) => {
      const result = await authApi.register(input);
      applySession(result.accessToken, result.user);
    },
    [applySession],
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      accessToken,
      isBootstrapping,
      isAuthenticated: Boolean(user && accessToken),
      login,
      register,
      logout,
    }),
    [user, accessToken, isBootstrapping, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
