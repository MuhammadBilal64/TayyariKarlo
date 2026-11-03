import type { AuthUser, LoginInput, RegisterInput } from '@tayyari/shared';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { ApiError, setTokenRefresher } from '../../../shared/api/client';
import * as authApi from '../api/authApi';
import {
  clearAccessToken,
  getAccessToken,
  setAccessToken,
} from '../lib/token-storage';
import { AuthContext, type AuthContextValue } from './auth-context';

/** Refresh a few minutes before typical 15m access JWT expiry. */
const PROACTIVE_REFRESH_MS = 12 * 60_000;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setToken] = useState<string | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const bootstrapGeneration = useRef(0);
  const refreshPromiseRef = useRef<Promise<string | null> | null>(null);

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

  const refreshSession = useCallback(async (): Promise<string | null> => {
    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current;
    }

    const run = (async () => {
      try {
        const refreshed = await authApi.refresh({ timeoutMs: 60_000 });
        applySession(refreshed.accessToken, refreshed.user);
        return refreshed.accessToken;
      } catch (err) {
        // Only drop the session when the refresh cookie is actually rejected.
        // Transient network/cold-start failures must not force logout.
        const unauthorized =
          err instanceof ApiError &&
          (err.statusCode === 401 || err.statusCode === 403);
        if (unauthorized) {
          clearSession();
        }
        return null;
      } finally {
        refreshPromiseRef.current = null;
      }
    })();

    refreshPromiseRef.current = run;
    return run;
  }, [applySession, clearSession]);

  useEffect(() => {
    setTokenRefresher(() => refreshSession());
    return () => setTokenRefresher(null);
  }, [refreshSession]);

  useEffect(() => {
    if (!accessToken) return;
    const id = window.setInterval(() => {
      void refreshSession();
    }, PROACTIVE_REFRESH_MS);
    return () => window.clearInterval(id);
  }, [accessToken, refreshSession]);

  useEffect(() => {
    const generation = ++bootstrapGeneration.current;

    async function bootstrap() {
      try {
        const existing = getAccessToken();
        if (existing) {
          try {
            const me = await authApi.getMe(existing);
            // Prefer storage token: 401 retry may have refreshed mid-request.
            const token = getAccessToken() ?? existing;
            if (generation === bootstrapGeneration.current) {
              applySession(token, me);
            }
            return;
          } catch {
            clearAccessToken();
          }
        }

        // Prefer a short refresh for logged-out users; allow longer if
        // a cookie exists and the free API is cold-starting.
        const refreshed = await authApi.refresh({ timeoutMs: 15_000 });
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
