import type {
  CreateBankAccountDto as GeneratedCreateBankAccountDto,
  CreateOrganizationDto,
  CreateSocialLinkDto as GeneratedCreateSocialLinkDto,
  JoinOrganizationDto,
  UpdateBankAccountDto as GeneratedUpdateBankAccountDto,
  UpdateOrganizationDto,
  UpdateSocialLinkDto as GeneratedUpdateSocialLinkDto,
} from '@/api-generated/model';
import type { MembershipStatus } from '@/types/enums';

export type JoinOrganizationPayload = JoinOrganizationDto;
export type CreateOrganizationPayload = Pick<CreateOrganizationDto, 'name'>;
export type UpdateOrganizationPayload = UpdateOrganizationDto;

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
  terms_and_conditions?: string | null;
  privacy_policy?: string | null;
  created_at: string;
  updated_at: string;
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

export type CreateBankAccountDto = GeneratedCreateBankAccountDto;
export type UpdateBankAccountDto = GeneratedUpdateBankAccountDto;

export type SocialLink = {
  id: string;
  platform: string;
  url: string;
  created_at: string;
  updated_at: string;
  organization_id: string;
};

export type CreateSocialLinkDto = GeneratedCreateSocialLinkDto;
export type UpdateSocialLinkDto = GeneratedUpdateSocialLinkDto;

export type OrganizationMembership = {
  membership_id?: string;
  organizationId?: string;
  organization_id?: string;
  status?: MembershipStatus | string;
  organization?: Organization;
};

export type MyMembershipsResponse =
  | OrganizationMembership[]
  | {
      memberships?: OrganizationMembership[];
      organizations?: OrganizationMembership[];
    };

export type OrganizationAccessRequest = OrganizationMembership & {
  id?: string;
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
