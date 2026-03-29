import { api } from '@/lib/api';
import type {
  CreateLeadSourcePayload,
  CreatePipelineStagePayload,
  LeadSource,
  PipelineStage,
  UpdateLeadSourcePayload,
  UpdatePipelineStagePayload,
} from '@/types/crm-settings';

export const crmSettingsService = {
  getPipelineStages(orgId: string): Promise<{ data: PipelineStage[] }> {
    return api.get<PipelineStage[]>(`/organizations/${orgId}/pipeline-stages`);
  },

  createPipelineStage(
    orgId: string,
    payload: CreatePipelineStagePayload
  ): Promise<{ data: PipelineStage }> {
    return api.post<PipelineStage>(
      `/organizations/${orgId}/pipeline-stages`,
      payload
    );
  },

  updatePipelineStage(
    orgId: string,
    stageId: string,
    payload: UpdatePipelineStagePayload
  ): Promise<{ data: PipelineStage }> {
    return api.patch<PipelineStage>(
      `/organizations/${orgId}/pipeline-stages/${stageId}`,
      payload
    );
  },

  deletePipelineStage(orgId: string, stageId: string): Promise<void> {
    return api.delete(`/organizations/${orgId}/pipeline-stages/${stageId}`);
  },

  getLeadSources(
    orgId: string,
    options?: {
      activeOnly?: boolean;
    }
  ): Promise<{ data: LeadSource[] }> {
    return api.get<LeadSource[]>(`/organizations/${orgId}/lead-sources`, {
      params: options?.activeOnly ? { activeOnly: true } : undefined,
    });
  },

  createLeadSource(
    orgId: string,
    payload: CreateLeadSourcePayload
  ): Promise<{ data: LeadSource }> {
    return api.post<LeadSource>(
      `/organizations/${orgId}/lead-sources`,
      payload
    );
  },

  updateLeadSource(
    orgId: string,
    sourceId: string,
    payload: UpdateLeadSourcePayload
  ): Promise<{ data: LeadSource }> {
    return api.patch<LeadSource>(
      `/organizations/${orgId}/lead-sources/${sourceId}`,
      payload
    );
  },

  deleteLeadSource(orgId: string, sourceId: string): Promise<void> {
    return api.delete(`/organizations/${orgId}/lead-sources/${sourceId}`);
  },
};
