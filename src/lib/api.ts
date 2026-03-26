import axios from 'axios';
import Cookies from 'js-cookie';

import { useAuthStore } from '@/store/useAuthStore';

function readBearerToken() {
  if (typeof window === 'undefined') {
    return null;
  }

  return Cookies.get('access_token') ?? null;
}

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1',
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
