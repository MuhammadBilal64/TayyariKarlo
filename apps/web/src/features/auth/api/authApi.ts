import type {
  AuthTokensResponse,
  AuthUser,
  LoginInput,
  RegisterInput,
} from '@tayyari/shared';
import { apiRequest } from '../../../shared/api/client';

export function register(input: RegisterInput) {
  return apiRequest<AuthTokensResponse>('/auth/register', {
    method: 'POST',
    body: input,
  });
}

export function login(input: LoginInput) {
  return apiRequest<AuthTokensResponse>('/auth/login', {
    method: 'POST',
    body: input,
  });
}

export function refresh() {
  return apiRequest<AuthTokensResponse>('/auth/refresh', {
    method: 'POST',
  });
}

export function logout() {
  return apiRequest<{ success: true }>('/auth/logout', {
    method: 'POST',
  });
}

export function getMe(accessToken: string) {
  return apiRequest<AuthUser>('/users/me', {
    method: 'GET',
    accessToken,
  });
}
