import axios from 'axios';

import { useAuthStore } from '@/store/useAuthStore';

const tokenCookieNames = ['auth-token', 'access_token', 'token', 'jwt'];
const tokenStorageKeys = ['auth-token', 'access_token', 'token', 'jwt'];

function readCookieValue(name: string) {
  if (typeof document === 'undefined') {
    return null;
  }

  const cookie = document.cookie
    .split('; ')
    .find((entry) => entry.startsWith(`${name}=`));

  if (!cookie) {
    return null;
  }

  return decodeURIComponent(cookie.split('=').slice(1).join('='));
}

function readBearerToken() {
  for (const name of tokenCookieNames) {
    const cookieValue = readCookieValue(name);

    if (cookieValue) {
      return cookieValue;
    }
  }

  if (typeof window === 'undefined') {
    return null;
  }

  for (const key of tokenStorageKeys) {
    const storageValue = window.localStorage.getItem(key);

    if (storageValue) {
      return storageValue;
    }
  }

  return null;
}

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

api.interceptors.request.use((config) => {
  const token = readBearerToken();
  const { activeOrganizationId } = useAuthStore.getState();

  config.headers = config.headers ?? {};

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (activeOrganizationId) {
    config.headers['x-organization-id'] = activeOrganizationId;
  } else {
    delete config.headers['x-organization-id'];
  }

  return config;
});
