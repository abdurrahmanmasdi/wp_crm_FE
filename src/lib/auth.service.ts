import { api } from '@/lib/api';

export type RegisterPayload = {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  inviteToken?: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type ForgotPasswordPayload = {
  email: string;
};

export type ResetPasswordPayload = {
  token: string;
  newPassword: string;
};

export type LoginResponse = {
  access_token: string;
  user: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    created_at: Date;
    permissions: string[];
  };
};

export type AuthUserProfile = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  created_at?: Date;
  permissions?: string[];
};

export type AcceptInviteResponse = {
  success?: boolean;
};

export type PermissionsResponse = {
  permissions: string[];
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
  forgotPassword(payload: ForgotPasswordPayload) {
    return api.post('/auth/forgot-password', payload);
  },
  resetPassword(payload: ResetPasswordPayload) {
    return api.post('/auth/reset-password', payload);
  },
  me() {
    return api.get<AuthUserProfile>('/users/me');
  },
  getPermissions(organizationId: string) {
    return api.get<PermissionsResponse>('/users/me/permissions', {
      headers: { 'x-organization-id': organizationId },
    });
  },
  acceptInvite(inviteId: string) {
    return api.post<AcceptInviteResponse>(`/users/invites/${inviteId}/accept`);
  },
  getUserOrganizations() {
    return api.get<UserOrganizationsResponse>('/users/me/organizations');
  },
};
