import type { AuthUser, LoginInput, RegisterInput } from '@tayyari/shared';
import { createContext } from 'react';

export type AuthContextValue = {
  user: AuthUser | null;
  accessToken: string | null;
  isBootstrapping: boolean;
  isAuthenticated: boolean;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);
