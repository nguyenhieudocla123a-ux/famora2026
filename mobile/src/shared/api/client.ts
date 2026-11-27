import axios, { AxiosAdapter, AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL, REQUEST_TIMEOUT_MS } from './config';
import { tokenStore } from './tokenStore';

/** What /api/auth/login and /api/auth/refresh return. */
export interface TokenPair {
  accessToken: string;
  tokenType: string;
  expiresAt: string;
  refreshToken: string;
  refreshExpiresAt: string;
}

/** Endpoints that must never trigger a token refresh themselves. */
const AUTH_PATHS = ['/api/auth/login', '/api/auth/register', '/api/auth/refresh'];

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean };

export interface ApiClient {
  http: AxiosInstance;
  /** Called once when the session can no longer be renewed (refresh token missing, expired or revoked). */
  onSessionExpired: (handler: () => void) => void;
  /** Stores a new pair: access token in memory, refresh token in the secure store. */
  saveTokens: (pair: TokenPair) => Promise<void>;
}

/**
 * Axios with the session built in:
 * 1. every request carries "Authorization: Bearer access-token";
 * 2. a 401 triggers ONE refresh, even if ten requests failed at once; they all wait for it, then retry once;
 * 3. if the refresh fails, the tokens are cleared and the app is told to show the sign-in screen.
 */
export function createApiClient(options: { baseURL?: string; adapter?: AxiosAdapter } = {}): ApiClient {
  const config = { baseURL: options.baseURL ?? API_BASE_URL, timeout: REQUEST_TIMEOUT_MS, adapter: options.adapter };
  const http = axios.create(config);
  const bare = axios.create(config); // no interceptors: used for the refresh call itself
  let expiredHandler: () => void = () => {};
  let refreshing: Promise<string> | null = null;

  const saveTokens = async (pair: TokenPair) => {
    tokenStore.setAccess(pair.accessToken);
    await tokenStore.setRefresh(pair.refreshToken);
  };

  const refreshAccess = (): Promise<string> => {
    if (!refreshing) {
      refreshing = (async () => {
        const refreshToken = await tokenStore.getRefresh();
        if (!refreshToken) {
          throw new Error('NO_REFRESH_TOKEN');
        }
        const res = await bare.post<TokenPair>('/api/auth/refresh', { refreshToken });
        await saveTokens(res.data);
        return res.data.accessToken;
      })().finally(() => {
        refreshing = null;
      });
    }
    return refreshing;
  };

  http.interceptors.request.use(req => {
    const token = tokenStore.getAccess();
    if (token && !req.headers.Authorization) {
      req.headers.Authorization = `Bearer ${token}`;
    }
    return req;
  });

  http.interceptors.response.use(undefined, async (error: AxiosError) => {
    const req = error.config as RetriableConfig | undefined;
    const isAuthCall = AUTH_PATHS.some(p => req?.url?.startsWith(p));
    if (error.response?.status !== 401 || !req || req._retried || isAuthCall) {
      throw error;
    }
    req._retried = true;
    try {
      const fresh = await refreshAccess();
      req.headers.Authorization = `Bearer ${fresh}`;
      return http(req);
    } catch {
      await tokenStore.clear();
      expiredHandler();
      throw error;
    }
  });

  return {
    http,
    onSessionExpired: handler => {
      expiredHandler = handler;
    },
    saveTokens,
  };
}

/** The app's one client. */
export const apiClient = createApiClient();
