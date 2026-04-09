import type {
  CreateLeadSourceDto,
  CreatePipelineStageDto,
  UpdateLeadSourceDto,
  UpdatePipelineStageDto,
} from '@/api-generated/model';

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

export type CreatePipelineStagePayload = CreatePipelineStageDto;

export type UpdatePipelineStagePayload = UpdatePipelineStageDto;

export type CreateLeadSourcePayload = Omit<CreateLeadSourceDto, 'is_active'> & {
  is_active: boolean;
};

export type UpdateLeadSourcePayload = UpdateLeadSourceDto;
