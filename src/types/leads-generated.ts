import type {
  CreateLeadDto,
  CreateLeadDtoCurrency,
  CreateLeadDtoGender,
  CreateLeadDtoPriority,
  CreateLeadDtoStatus,
  LeadsControllerFindAllV1Params,
  UpdateLeadDto,
} from '@/api-generated/model';

export type LeadGender = CreateLeadDtoGender;

export type LeadStatus = CreateLeadDtoStatus;

export type LeadPriority = CreateLeadDtoPriority;

export type LeadSortBy =
  | 'first_name'
  | 'status'
  | 'priority'
  | 'estimated_value'
  | 'created_at';

export type LeadSortDir = 'asc' | 'desc';

export type LeadCurrency = CreateLeadDtoCurrency;

export type LeadSocialLinks = Record<string, string> | null;

export type Lead = {
  id: string;
  organization_id: string;
  pipeline_stage_id: string | null;
  assigned_agent_id: string | null;
  source_id: string | null;
  first_name: string;
  last_name: string;
  native_name: string | null;
  gender: LeadGender;
  email: string | null;
  phone_number: string;
  country: string;
  timezone: string;
  primary_language: string;
  preferred_language: string | null;
  social_links: LeadSocialLinks;
  status: LeadStatus;
  priority: LeadPriority;
  estimated_value: string;
  currency: LeadCurrency;
  expected_service_date: Date | null;
  next_follow_up_at: Date | null;
  created_at: Date;
  updated_at: Date;
};

export type LeadWithRelations = Lead;

export type LeadsQueryFilters = LeadsControllerFindAllV1Params;
//     & {
//   search?: string;
//   sortBy?: LeadSortBy;
//   sortDir?: LeadSortDir;
// };

export type LeadsMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

// Orval currently generates several nullable string lead fields as object|null.
// Keep frontend-safe payload aliases until the OpenAPI schema is corrected.
export type CreateLeadPayload = Omit<
  CreateLeadDto,
  | 'native_name'
  | 'email'
  | 'preferred_language'
  | 'social_links'
  | 'estimated_value'
  | 'expected_service_date'
  | 'next_follow_up_at'
  | 'pipeline_stage_id'
  | 'assigned_agent_id'
  | 'source_id'
> & {
  native_name?: string | null;
  email?: string | null;
  preferred_language?: string | null;
  social_links?: LeadSocialLinks;
  estimated_value?: string | null;
  expected_service_date?: string | null;
  next_follow_up_at?: string | null;
  pipeline_stage_id?: string | null;
  assigned_agent_id?: string | null;
  source_id?: string | null;
};

export type UpdateLeadPayload = Omit<
  UpdateLeadDto,
  | 'native_name'
  | 'email'
  | 'preferred_language'
  | 'social_links'
  | 'estimated_value'
  | 'expected_service_date'
  | 'next_follow_up_at'
  | 'pipeline_stage_id'
  | 'assigned_agent_id'
  | 'source_id'
> & {
  native_name?: string | null;
  email?: string | null;
  preferred_language?: string | null;
  social_links?: LeadSocialLinks;
  estimated_value?: string | null;
  expected_service_date?: string | null;
  next_follow_up_at?: string | null;
  pipeline_stage_id?: string | null;
  assigned_agent_id?: string | null;
  source_id?: string | null;
};

export type LeadsListResponse = {
  data: Lead[];
  meta: LeadsMeta;
};
