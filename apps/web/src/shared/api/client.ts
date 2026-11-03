const API_URL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, '') ??
  'http://localhost:3000/api/v1';

export class ApiError extends Error {
  readonly statusCode: number;
  readonly messages: string[];

  constructor(statusCode: number, message: string | string[]) {
    const messages = Array.isArray(message) ? message : [message];
    super(messages.join(', '));
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.messages = messages;
  }
}

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
  accessToken?: string | null;
  /** Defaults to 60s when `signal` is not provided (Render free cold starts). */
  timeoutMs?: number;
  /** Internal: avoid infinite 401 refresh loops. */
  _authRetried?: boolean;
};

/** Free Render can take 30–60s to wake; keep auth/API usable after idle. */
const DEFAULT_TIMEOUT_MS = 60_000;

type TokenRefresher = () => Promise<string | null>;

let tokenRefresher: TokenRefresher | null = null;
let refreshInFlight: Promise<string | null> | null = null;

/** AuthProvider registers a cookie-based access-token refresher. */
export function setTokenRefresher(refresher: TokenRefresher | null) {
  tokenRefresher = refresher;
}

async function refreshAccessTokenOnce(): Promise<string | null> {
  if (!tokenRefresher) return null;
  if (!refreshInFlight) {
    refreshInFlight = tokenRefresher().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const {
    body,
    accessToken,
    headers,
    signal,
    timeoutMs,
    _authRetried,
    ...init
  } = options;
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: 'include',
    signal: signal ?? AbortSignal.timeout(timeoutMs ?? DEFAULT_TIMEOUT_MS),
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (
    response.status === 401 &&
    accessToken &&
    !_authRetried &&
    !path.startsWith('/auth/')
  ) {
    const nextToken = await refreshAccessTokenOnce();
    if (nextToken) {
      return apiRequest<T>(path, {
        ...options,
        accessToken: nextToken,
        _authRetried: true,
      });
    }
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const data: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const payload = data as { message?: string | string[] } | null;
    throw new ApiError(
      response.status,
      payload?.message ?? `Request failed with status ${response.status}`,
    );
  }

  return data as T;
}
