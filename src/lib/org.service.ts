import { api } from '@/lib/api';
import { MembershipStatus } from '@/types/enums';

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
  membership_id?: string;
  organizationId?: string;
  organization_id?: string;
  status?: MembershipStatus;
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

export type OrganizationAccessRequest = OrganizationMembership & {
  email?: string;
  requestedAt?: string;
  createdAt?: string;
  user?: {
    firstName?: string;
    first_name?: string;
    lastName?: string;
    last_name?: string;
    email?: string;
  };
};

export type OrganizationAccessRequestsResponse =
  | OrganizationAccessRequest[]
  | {
      requests?: OrganizationAccessRequest[];
      memberships?: OrganizationAccessRequest[];
      organizations?: OrganizationAccessRequest[];
    };

export type OrganizationAccessRequestActionResponse = {
  success?: boolean;
};

export type CancelRequestResponse = {
  success?: boolean;
};

export type OrganizationMember = {
  membershipId: string;
  organizationId: string;
  status: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  role: {
    id: string;
    name: string;
  };
};

export const orgService = {
  /**
   * Fetch the current organization's pending access requests.
   */
  getPendingRequests(orgId: string): Promise<{
    data: OrganizationAccessRequestsResponse;
  }> {
    return api.get<OrganizationAccessRequestsResponse>(
      `/organizations/${orgId}/requests`
    );
  },

  /**
   * Approve a pending access request for the current organization.
   */
  approveRequest(
    orgId: string,
    membershipId: string
  ): Promise<{ data: OrganizationAccessRequestActionResponse }> {
    return api.post<OrganizationAccessRequestActionResponse>(
      `/organizations/${orgId}/requests/${membershipId}/approve`
    );
  },

  /**
   * Reject a pending access request for the current organization.
   */
  rejectRequest(
    orgId: string,
    membershipId: string
  ): Promise<{ data: OrganizationAccessRequestActionResponse }> {
    return api.post<OrganizationAccessRequestActionResponse>(
      `/organizations/${orgId}/requests/${membershipId}/reject`
    );
  },

  cancelRequest(
    membershipId: string
  ): Promise<{ data: CancelRequestResponse }> {
    return api.delete<CancelRequestResponse>(
      `/users/me/requests/${membershipId}/cancel`
    );
  },

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

  /**
   * Fetch all active members of an organization
   * Returns a list of members with their roles and user information
   */
  getOrganizationMembers(
    orgId: string
  ): Promise<{ data: OrganizationMember[] }> {
    return api.get<OrganizationMember[]>(`/organizations/${orgId}/members`);
  },
};
