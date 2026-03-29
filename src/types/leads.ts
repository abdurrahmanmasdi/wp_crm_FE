export type LeadGender = 'MALE' | 'FEMALE' | 'OTHER' | 'UNKNOWN';

export type LeadStatus = 'OPEN' | 'WON' | 'LOST' | 'UNQUALIFIED';

export type LeadPriority = 'HOT' | 'WARM' | 'COLD';

export type LeadCurrency = 'USD' | 'TRY' | 'EUR' | 'GBP';

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
  expected_service_date: string | null;
  next_follow_up_at: string | null;
  created_at: string;
  updated_at: string;
};

export type LeadsQueryFilters = {
  page?: number;
  limit?: number;
  status?: LeadStatus;
  priority?: LeadPriority;
  filters?: string;
};

export type LeadsMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type CreateLeadPayload = {
  first_name: string;
  last_name: string;
  phone_number: string;
  country: string;
  timezone: string;
  primary_language: string;
  native_name?: string | null;
  gender: LeadGender;
  email?: string | null;
  preferred_language?: string | null;
  social_links?: LeadSocialLinks;
  status: LeadStatus;
  priority: LeadPriority;
  estimated_value: string;
  currency: LeadCurrency;
  expected_service_date?: string | null;
  next_follow_up_at?: string | null;
  pipeline_stage_id?: string | null;
  assigned_agent_id?: string | null;
  source_id?: string | null;
};

export type UpdateLeadPayload = Partial<CreateLeadPayload>;

export type LeadsListResponse = {
  data: Lead[];
  meta: LeadsMeta;
};
