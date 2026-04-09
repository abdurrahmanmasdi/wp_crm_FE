import {
  bankAccountsControllerCreateV1,
  bankAccountsControllerFindAllV1,
  bankAccountsControllerRemoveV1,
  bankAccountsControllerUpdateV1,
} from '@/api-generated/endpoints/bank-accounts';
import {
  organizationsControllerApproveRequestV1,
  organizationsControllerCreateV1,
  organizationsControllerGetMembersV1,
  organizationsControllerGetOrganizationV1,
  organizationsControllerGetPendingRequestsV1,
  organizationsControllerInviteV1,
  organizationsControllerJoinV1,
  organizationsControllerRejectRequestV1,
  organizationsControllerUpdateOrganizationV1,
} from '@/api-generated/endpoints/organizations';
import {
  socialLinksControllerCreateV1,
  socialLinksControllerFindAllV1,
  socialLinksControllerRemoveV1,
  socialLinksControllerUpdateV1,
} from '@/api-generated/endpoints/social-links';
import {
  usersControllerCancelJoinRequestV1,
  usersControllerGetUserOrganizationsV1,
} from '@/api-generated/endpoints/users';
import type {
  CreateBankAccountDto,
  CreateOrganizationDto,
  CreateSocialLinkDto,
  UpdateBankAccountDto,
  UpdateOrganizationDto,
  UpdateSocialLinkDto,
} from '@/api-generated/model';
import type {
  BankAccount,
  CancelRequestResponse,
  CreateOrganizationPayload,
  InviteTeamMemberPayload,
  JoinOrganizationPayload,
  MyMembershipsResponse,
  Organization,
  OrganizationAccessRequest,
  OrganizationAccessRequestActionResponse,
  OrganizationAccessRequestsResponse,
  OrganizationMember,
  OrganizationMembership,
} from '@/types/organizations-generated';

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object'
    ? (value as Record<string, unknown>)
    : {};
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function asNullableString(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  return typeof value === 'string' ? value : null;
}

function asBoolean(value: unknown, fallback = false): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function normalizeBankAccount(raw: unknown): BankAccount {
  const record = asRecord(raw);

  return {
    id: asString(record.id),
    bank_name: asString(record.bank_name),
    iban: asString(record.iban),
    account_holder_name: asString(record.account_holder_name),
    currency: asString(record.currency),
    is_default: asBoolean(record.is_default),
    created_at: asString(record.created_at),
    updated_at: asString(record.updated_at),
    organization_id: asString(record.organization_id),
  };
}

function normalizeSocialLink(raw: unknown) {
  const record = asRecord(raw);

  return {
    id: asString(record.id),
    platform: asString(record.platform),
    url: asString(record.url),
    created_at: asString(record.created_at),
    updated_at: asString(record.updated_at),
    organization_id: asString(record.organization_id),
  };
}

function normalizeBrandColors(
  raw: unknown
): { primary?: string; secondary?: string } | null {
  const record = asRecord(raw);
  const primary = asString(record.primary);
  const secondary = asString(record.secondary);

  if (!primary && !secondary) {
    return null;
  }

  return {
    ...(primary ? { primary } : {}),
    ...(secondary ? { secondary } : {}),
  };
}

function normalizeOrganization(raw: unknown): Organization {
  const record = asRecord(raw);
  const socialLinksRaw = Array.isArray(record.social_links)
    ? record.social_links
    : [];
  const bankAccountsRaw = Array.isArray(record.bank_accounts)
    ? record.bank_accounts
    : [];

  return {
    id: asString(record.id),
    name: asString(record.name) || undefined,
    slug: asString(record.slug) || undefined,
    tax_number: asNullableString(record.tax_number),
    tax_office: asNullableString(record.tax_office),
    industry_category: asNullableString(record.industry_category),
    address: asNullableString(record.address),
    logo_url: asNullableString(record.logo_url),
    brand_colors: normalizeBrandColors(record.brand_colors),
    default_currency: asNullableString(record.default_currency),
    website_url: asNullableString(record.website_url),
    public_email: asNullableString(record.public_email),
    public_phone: asNullableString(record.public_phone),
    social_links: socialLinksRaw.map(normalizeSocialLink),
    bank_accounts: bankAccountsRaw.map(normalizeBankAccount),
    terms_and_conditions: asNullableString(record.terms_and_conditions),
    privacy_policy: asNullableString(record.privacy_policy),
    created_at: asString(record.created_at),
    updated_at: asString(record.updated_at),
  };
}

function normalizeMembership(raw: unknown): OrganizationMembership {
  const record = asRecord(raw);
  const organizationRaw = record.organization;

  return {
    membership_id: asString(record.membership_id) || undefined,
    organizationId: asString(record.organizationId) || undefined,
    organization_id: asString(record.organization_id) || undefined,
    status: asString(record.status) || undefined,
    organization:
      organizationRaw && typeof organizationRaw === 'object'
        ? normalizeOrganization(organizationRaw)
        : undefined,
  };
}

function normalizeAccessRequest(raw: unknown): OrganizationAccessRequest {
  const record = asRecord(raw);
  const userRecord = asRecord(record.user);

  return {
    ...normalizeMembership(raw),
    id: asString(record.id) || undefined,
    email: asString(record.email) || undefined,
    requestedAt: asString(record.requestedAt) || undefined,
    createdAt: asString(record.createdAt) || undefined,
    user:
      Object.keys(userRecord).length > 0
        ? {
            firstName: asString(userRecord.firstName) || undefined,
            first_name: asString(userRecord.first_name) || undefined,
            lastName: asString(userRecord.lastName) || undefined,
            last_name: asString(userRecord.last_name) || undefined,
            email: asString(userRecord.email) || undefined,
          }
        : undefined,
  };
}

function normalizeMember(raw: unknown): OrganizationMember {
  const record = asRecord(raw);
  const userRecord = asRecord(record.user);
  const roleRecord = asRecord(record.role);

  return {
    membershipId: asString(record.membershipId),
    organizationId: asString(record.organizationId),
    status: asString(record.status),
    user: {
      id: asString(userRecord.id),
      firstName: asString(userRecord.firstName),
      lastName: asString(userRecord.lastName),
      email: asString(userRecord.email),
      avatarUrl: asString(userRecord.avatarUrl) || undefined,
      avatar_url: asString(userRecord.avatar_url) || undefined,
    },
    role: {
      id: asString(roleRecord.id),
      name: asString(roleRecord.name),
      slug: asString(roleRecord.slug) || undefined,
    },
  };
}

export async function getPendingRequests(
  orgId: string
): Promise<OrganizationAccessRequestsResponse> {
  const response = (await organizationsControllerGetPendingRequestsV1(
    orgId
  )) as unknown;

  if (Array.isArray(response)) {
    return response.map(normalizeAccessRequest);
  }

  const record = asRecord(response);

  return {
    requests: Array.isArray(record.requests)
      ? record.requests.map(normalizeAccessRequest)
      : undefined,
    memberships: Array.isArray(record.memberships)
      ? record.memberships.map(normalizeAccessRequest)
      : undefined,
    organizations: Array.isArray(record.organizations)
      ? record.organizations.map(normalizeAccessRequest)
      : undefined,
  };
}

export async function approveRequest(
  orgId: string,
  membershipId: string,
  roleId: string
): Promise<OrganizationAccessRequestActionResponse> {
  await organizationsControllerApproveRequestV1(orgId, membershipId, {
    roleId,
  });

  return { success: true };
}

export async function rejectRequest(
  orgId: string,
  membershipId: string
): Promise<OrganizationAccessRequestActionResponse> {
  await organizationsControllerRejectRequestV1(orgId, membershipId);

  return { success: true };
}

export async function cancelRequest(
  membershipId: string
): Promise<CancelRequestResponse> {
  await usersControllerCancelJoinRequestV1(membershipId);

  return { success: true };
}

export async function joinOrganization(payload: JoinOrganizationPayload) {
  return organizationsControllerJoinV1(payload);
}

export async function createOrganization(
  payload: CreateOrganizationPayload
): Promise<Organization> {
  const response = await organizationsControllerCreateV1(
    payload as CreateOrganizationDto
  );

  return normalizeOrganization(response);
}

export async function getOrganization(orgId: string): Promise<Organization> {
  const response = (await organizationsControllerGetOrganizationV1(
    orgId
  )) as unknown;

  return normalizeOrganization(response);
}

export async function updateOrganization(
  orgId: string,
  payload: Record<string, unknown>
): Promise<Organization> {
  const response = (await organizationsControllerUpdateOrganizationV1(
    orgId,
    payload as UpdateOrganizationDto
  )) as unknown;

  if (response && typeof response === 'object') {
    return normalizeOrganization(response);
  }

  return normalizeOrganization({ id: orgId, ...payload });
}

export async function inviteTeamMember(
  orgId: string,
  payload: InviteTeamMemberPayload
) {
  return organizationsControllerInviteV1(orgId, {
    email: payload.email,
    roleId: payload.role,
  });
}

export async function getMyMemberships(): Promise<MyMembershipsResponse> {
  const response = await usersControllerGetUserOrganizationsV1();

  return response.map(normalizeMembership);
}

export async function getOrganizationMembers(
  orgId: string
): Promise<OrganizationMember[]> {
  const response = await organizationsControllerGetMembersV1(orgId);

  return response.map(normalizeMember);
}

export async function getBankAccounts(): Promise<BankAccount[]> {
  const response = (await bankAccountsControllerFindAllV1()) as unknown;

  if (!Array.isArray(response)) {
    return [];
  }

  return response.map(normalizeBankAccount);
}

export async function createBankAccount(
  payload: CreateBankAccountDto
): Promise<BankAccount> {
  const response = (await bankAccountsControllerCreateV1(payload)) as unknown;

  if (response && typeof response === 'object') {
    return normalizeBankAccount(response);
  }

  return normalizeBankAccount({ ...payload });
}

export async function updateBankAccount(
  id: string,
  payload: UpdateBankAccountDto
): Promise<BankAccount> {
  const response = (await bankAccountsControllerUpdateV1(
    id,
    payload
  )) as unknown;

  if (response && typeof response === 'object') {
    return normalizeBankAccount(response);
  }

  return normalizeBankAccount({ id, ...payload });
}

export async function deleteBankAccount(id: string): Promise<void> {
  await bankAccountsControllerRemoveV1(id);
}

export async function getSocialLinks() {
  const response = (await socialLinksControllerFindAllV1()) as unknown;

  if (!Array.isArray(response)) {
    return [];
  }

  return response.map(normalizeSocialLink);
}

export async function createSocialLink(payload: CreateSocialLinkDto) {
  const response = (await socialLinksControllerCreateV1(payload)) as unknown;

  if (response && typeof response === 'object') {
    return normalizeSocialLink(response);
  }

  return normalizeSocialLink({ ...payload });
}

export async function updateSocialLink(
  id: string,
  payload: UpdateSocialLinkDto
) {
  const response = (await socialLinksControllerUpdateV1(
    id,
    payload
  )) as unknown;

  if (response && typeof response === 'object') {
    return normalizeSocialLink(response);
  }

  return normalizeSocialLink({ id, ...payload });
}

export async function deleteSocialLink(id: string): Promise<void> {
  await socialLinksControllerRemoveV1(id);
}
