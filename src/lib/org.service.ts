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
  tax_number?: string | null;
  tax_office?: string | null;
  industry_category?: string | null;
  address?: string | null;
  logo_url?: string | null;
  brand_colors?: { primary?: string; secondary?: string } | null;
  default_currency?: string | null;
  website_url?: string | null;
  public_email?: string | null;
  public_phone?: string | null;
  social_links?: SocialLink[];
  bank_accounts?: BankAccount[];
};

export type BankAccount = {
  id: string;
  bank_name: string;
  iban: string;
  account_holder_name: string;
  currency: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  organization_id: string;
};

export type CreateBankAccountDto = Omit<
  BankAccount,
  'id' | 'created_at' | 'updated_at' | 'organization_id'
>;
export type UpdateBankAccountDto = Partial<CreateBankAccountDto>;

export type SocialLink = {
  id: string;
  platform: string;
  url: string;
  created_at: string;
  updated_at: string;
  organization_id: string;
};

export type CreateSocialLinkDto = Omit<
  SocialLink,
  'id' | 'created_at' | 'updated_at' | 'organization_id'
>;
export type UpdateSocialLinkDto = Partial<CreateSocialLinkDto>;

export type OrganizationMembership = {
  membership_id?: string;
  organizationId?: string;
  organization_id?: string;
  status?: MembershipStatus;
  organization?: Organization;
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
    avatarUrl?: string;
    avatar_url?: string;
  };
  role: {
    id: string;
    name: string;
    slug?: string;
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
   * Requires a roleId to assign to the approved member.
   */
  approveRequest(
    orgId: string,
    membershipId: string,
    roleId: string
  ): Promise<{ data: OrganizationAccessRequestActionResponse }> {
    return api.post<OrganizationAccessRequestActionResponse>(
      `/organizations/${orgId}/requests/${membershipId}/approve`,
      { roleId }
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
  getOrganization(orgId: string) {
    return api.get<Organization>(`/organizations/${orgId}`);
  },
  updateOrganization(orgId: string, payload: Record<string, unknown>) {
    return api.patch<Organization>(`/organizations/${orgId}`, payload);
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

  // Bank Accounts
  getBankAccounts() {
    return api.get<BankAccount[]>('/bank-accounts');
  },
  createBankAccount(payload: CreateBankAccountDto) {
    return api.post<BankAccount>('/bank-accounts', payload);
  },
  updateBankAccount(id: string, payload: UpdateBankAccountDto) {
    return api.patch<BankAccount>(`/bank-accounts/${id}`, payload);
  },
  deleteBankAccount(id: string) {
    return api.delete<void>(`/bank-accounts/${id}`);
  },

  // Social Links
  getSocialLinks() {
    return api.get<SocialLink[]>('/social-links');
  },
  createSocialLink(payload: CreateSocialLinkDto) {
    return api.post<SocialLink>('/social-links', payload);
  },
  updateSocialLink(id: string, payload: UpdateSocialLinkDto) {
    return api.patch<SocialLink>(`/social-links/${id}`, payload);
  },
  deleteSocialLink(id: string) {
    return api.delete<void>(`/social-links/${id}`);
  },
};
