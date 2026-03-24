import { api } from '@/lib/api';

export type RegisterPayload = {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type LoginResponse = {
  access_token: string;
};

export type AuthUserProfile = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
};

export type AcceptInviteResponse = {
  success?: boolean;
};

export type UserOrganization = {
  id: string;
  name?: string;
};

export type UserOrganizationsResponse =
  | UserOrganization[]
  | {
      organizations?: UserOrganization[];
    };

export const authService = {
  register(payload: RegisterPayload) {
    return api.post('/auth/register', payload);
  },
  login(payload: LoginPayload) {
    return api.post<LoginResponse>('/auth/login', payload);
  },
  me() {
    return api.get<AuthUserProfile>('/users/me');
  },
  acceptInvite(inviteId: string) {
    return api.post<AcceptInviteResponse>(`/users/invites/${inviteId}/accept`);
  },
  getUserOrganizations() {
    return api.get<UserOrganizationsResponse>('/users/me/organizations');
  },
};
