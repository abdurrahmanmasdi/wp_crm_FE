export type PipelineStage = {
  id: string;
  organization_id: string;
  name: string;
  order_index: number;
  created_at: string;
  updated_at: string;
};

export type LeadSource = {
  id: string;
  organization_id: string;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type CreatePipelineStagePayload = {
  name: string;
  order_index: number;
};

export type UpdatePipelineStagePayload = Partial<CreatePipelineStagePayload>;

export type CreateLeadSourcePayload = {
  name: string;
  is_active: boolean;
};

export type UpdateLeadSourcePayload = Partial<CreateLeadSourcePayload>;
