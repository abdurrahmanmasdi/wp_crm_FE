import axios from 'axios';
import Cookies from 'js-cookie';

import { useAuthStore } from '@/store/useAuthStore';

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
