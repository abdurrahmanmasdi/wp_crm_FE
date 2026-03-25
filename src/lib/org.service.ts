import { api } from '@/lib/api';

export type JoinOrganizationPayload = {
  slug: string;
};

export type OrganizationMembership = {
  id?: string;
  status?: 'active' | 'pending_approval' | string;
  organizationId?: string;
  organization?: {
    id?: string;
  };
};

export type MyMembershipsResponse =
  | OrganizationMembership[]
  | {
      memberships?: OrganizationMembership[];
      organizations?: OrganizationMembership[];
    };

export const orgService = {
  joinOrganization(payload: JoinOrganizationPayload) {
    return api.post('/organizations/join', payload);
  },
  getMyMemberships() {
    return api.get<MyMembershipsResponse>('/users/me/organizations');
  },
};
