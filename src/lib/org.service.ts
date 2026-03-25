import { api } from '@/lib/api';

export type JoinOrganizationPayload = {
  slug: string;
};

export type CreateOrganizationPayload = {
  name: string;
  slug: string;
};

export type InviteTeamMemberPayload = {
  email: string;
  role: string;
};

export type Organization = {
  id: string;
  name?: string;
  slug?: string;
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
  createOrganization(payload: CreateOrganizationPayload) {
    return api.post<Organization>('/organizations', payload);
  },
  inviteTeamMember(orgId: string, payload: InviteTeamMemberPayload) {
    return api.post(`/organizations/${orgId}/invite`, payload);
  },
  getMyMemberships() {
    return api.get<MyMembershipsResponse>('/users/me/organizations');
  },
};
