import axios from 'axios';
import Cookies from 'js-cookie';

import { accessTokenCookieAttributes } from '@/lib/auth-cookie';
import { useAuthStore } from '@/store/useAuthStore';

let isHandlingAuthFailure = false;
let isRefreshing = false;
let refreshPromise: Promise<string> | null = null;

type QueuedRequest = {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
};

type RetriableRequestConfig = {
  _retry?: boolean;
  url?: string;
  headers?: Record<string, string>;
};

let failedQueue: QueuedRequest[] = [];

function readBearerToken() {
  if (typeof window === 'undefined') {
    return null;
  }

  return Cookies.get('access_token') ?? null;
}

/**
 * Get current locale from NEXT_LOCALE cookie (set by next-intl)
 * Falls back to 'en' if not set
 */
function readCurrentLocale() {
  if (typeof window === 'undefined') {
    return 'en';
  }

  return Cookies.get('NEXT_LOCALE') ?? 'en';
}

function extractAccessToken(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const data = payload as Record<string, unknown>;

  if (typeof data.access_token === 'string' && data.access_token.length > 0) {
    return data.access_token;
  }

  if (typeof data.accessToken === 'string' && data.accessToken.length > 0) {
    return data.accessToken;
  }

  return null;
}

function persistAccessToken(token: string) {
  Cookies.set('access_token', token, {
    expires: 7,
    ...accessTokenCookieAttributes,
  });
}

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach((queuedRequest) => {
    if (error) {
      queuedRequest.reject(error);
      return;
    }

    if (!token) {
      queuedRequest.reject(new Error('Missing refreshed access token'));
      return;
    }

    queuedRequest.resolve(token);
  });

  failedQueue = [];
  refreshPromise = null;
}

function purgeAuthAndRedirect() {
  if (typeof window === 'undefined') {
    return;
  }

  if (isHandlingAuthFailure) {
    return;
  }

  isHandlingAuthFailure = true;

  const { clearAuthState } = useAuthStore.getState();
  clearAuthState();

  if (!window.location.pathname.endsWith('/auth/login')) {
    window.location.replace('/auth/login');
  }

  window.setTimeout(() => {
    isHandlingAuthFailure = false;
  }, 1000);
}

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1',
});

api.interceptors.request.use((config) => {
  const token = readBearerToken();
  const locale = readCurrentLocale();
  const { activeOrganizationId } = useAuthStore.getState();

  config.headers = config.headers ?? {};

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Always set the current locale so backend returns localized errors and data
  config.headers['Accept-Language'] = locale;

  if (activeOrganizationId) {
    config.headers['x-organization-id'] = activeOrganizationId;
  } else {
    delete config.headers['x-organization-id'];
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (!axios.isAxiosError(error) || !error.config) {
      return Promise.reject(error);
    }

    const status = error.response?.status;
    const originalRequest = error.config as typeof error.config &
      RetriableRequestConfig;
    const requestUrl = originalRequest.url ?? '';
    const isRefreshRequest = requestUrl.includes('/auth/refresh');

    if (isRefreshRequest && (status === 401 || status === 403)) {
      purgeAuthAndRedirect();
      return Promise.reject(error);
    }

    if (status !== 401) {
      return Promise.reject(error);
    }

    if (originalRequest._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing && refreshPromise) {
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (token) => {
            originalRequest._retry = true;
            originalRequest.headers = originalRequest.headers ?? {};
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          },
          reject,
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    refreshPromise = (async () => {
      try {
        const refreshResponse = await axios.post(
          `${api.defaults.baseURL}/auth/refresh`,
          {},
          {
            withCredentials: true,
            headers: {
              'Accept-Language': readCurrentLocale(),
            },
            timeout: 10000,
          }
        );
        const newToken = extractAccessToken(refreshResponse.data);

        if (!newToken) {
          throw new Error('Refresh response missing access token');
        }

        persistAccessToken(newToken);
        api.defaults.headers.common.Authorization = `Bearer ${newToken}`;
        processQueue(null, newToken);

        return newToken;
      } catch (refreshError) {
        processQueue(refreshError);
        purgeAuthAndRedirect();
        throw refreshError;
      } finally {
        isRefreshing = false;
      }
    })();

    try {
      const newToken = await refreshPromise;
      originalRequest.headers = originalRequest.headers ?? {};
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return api(originalRequest);
    } catch (error) {
      return Promise.reject(error);
    }
  }
);
