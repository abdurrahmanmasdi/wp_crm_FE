import {
  leadSourcesControllerCreateV1,
  leadSourcesControllerFindAllV1,
  leadSourcesControllerRemoveV1,
  leadSourcesControllerUpdateV1,
} from '@/api-generated/endpoints/lead-sources';
import {
  pipelineStagesControllerCreateV1,
  pipelineStagesControllerFindAllV1,
  pipelineStagesControllerRemoveV1,
  pipelineStagesControllerUpdateV1,
} from '@/api-generated/endpoints/pipeline-stages';
import type {
  CreateLeadSourceDto,
  CreatePipelineStageDto,
  LeadSourcesControllerFindAllV1Params,
  UpdateLeadSourceDto,
  UpdatePipelineStageDto,
} from '@/api-generated/model';
import type {
  CreateLeadSourcePayload,
  CreatePipelineStagePayload,
  LeadSource,
  PipelineStage,
  UpdateLeadSourcePayload,
  UpdatePipelineStagePayload,
} from '@/types/crm-settings-generated';

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object'
    ? (value as Record<string, unknown>)
    : {};
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function asBoolean(value: unknown, fallback = false): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function asNonNegativeInteger(value: unknown): number {
  const normalized =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
        ? Number(value)
        : Number.NaN;

  if (!Number.isFinite(normalized) || normalized < 0) {
    return 0;
  }

  return Math.floor(normalized);
}

function extractList(
  response: unknown,
  listKeys: string[]
): Record<string, unknown>[] {
  if (Array.isArray(response)) {
    return response.filter(
      (item): item is Record<string, unknown> =>
        item !== null && typeof item === 'object'
    );
  }

  const record = asRecord(response);

  for (const key of listKeys) {
    if (Array.isArray(record[key])) {
      return (record[key] as unknown[]).filter(
        (item): item is Record<string, unknown> =>
          item !== null && typeof item === 'object'
      );
    }
  }

  return [];
}

function normalizePipelineStage(raw: unknown): PipelineStage | null {
  const record = asRecord(raw);
  const id = asString(record.id);
  const name = asString(record.name);

  if (!id || !name) {
    return null;
  }

  return {
    id,
    organization_id: asString(record.organization_id),
    name,
    order_index: asNonNegativeInteger(record.order_index),
    created_at: asString(record.created_at),
    updated_at: asString(record.updated_at),
  };
}

function normalizeLeadSource(raw: unknown): LeadSource | null {
  const record = asRecord(raw);
  const id = asString(record.id);
  const name = asString(record.name);

  if (!id || !name) {
    return null;
  }

  return {
    id,
    organization_id: asString(record.organization_id),
    name,
    is_active: asBoolean(record.is_active, true),
    created_at: asString(record.created_at),
    updated_at: asString(record.updated_at),
  };
}

export async function getPipelineStages(
  orgId: string
): Promise<PipelineStage[]> {
  const response = (await pipelineStagesControllerFindAllV1(orgId)) as unknown;
  const stages = extractList(response, ['data', 'items', 'stages'])
    .map(normalizePipelineStage)
    .filter((item): item is PipelineStage => item !== null)
    .sort((left, right) => left.order_index - right.order_index);

  return stages;
}

export async function createPipelineStage(
  orgId: string,
  payload: CreatePipelineStagePayload
): Promise<PipelineStage> {
  const response = (await pipelineStagesControllerCreateV1(
    orgId,
    payload as CreatePipelineStageDto
  )) as unknown;
  const normalized = normalizePipelineStage(response);

  if (!normalized) {
    throw new Error('Unexpected pipeline stage response');
  }

  return normalized;
}

export async function updatePipelineStage(
  orgId: string,
  stageId: string,
  payload: UpdatePipelineStagePayload
): Promise<PipelineStage> {
  const response = (await pipelineStagesControllerUpdateV1(
    orgId,
    stageId,
    payload as UpdatePipelineStageDto
  )) as unknown;
  const normalized = normalizePipelineStage(response);

  if (!normalized) {
    throw new Error('Unexpected pipeline stage response');
  }

  return normalized;
}

export async function deletePipelineStage(
  orgId: string,
  stageId: string
): Promise<void> {
  await pipelineStagesControllerRemoveV1(orgId, stageId);
}

export async function getLeadSources(
  orgId: string,
  options?: { activeOnly?: boolean }
): Promise<LeadSource[]> {
  const params: LeadSourcesControllerFindAllV1Params = {
    activeOnly: options?.activeOnly === true,
  };
  const response = (await leadSourcesControllerFindAllV1(
    orgId,
    params
  )) as unknown;

  return extractList(response, ['data', 'items', 'sources'])
    .map(normalizeLeadSource)
    .filter((item): item is LeadSource => item !== null);
}

export async function createLeadSource(
  orgId: string,
  payload: CreateLeadSourcePayload
): Promise<LeadSource> {
  const response = (await leadSourcesControllerCreateV1(
    orgId,
    payload as CreateLeadSourceDto
  )) as unknown;
  const normalized = normalizeLeadSource(response);

  if (!normalized) {
    throw new Error('Unexpected lead source response');
  }

  return normalized;
}

export async function updateLeadSource(
  orgId: string,
  sourceId: string,
  payload: UpdateLeadSourcePayload
): Promise<LeadSource> {
  const response = (await leadSourcesControllerUpdateV1(
    orgId,
    sourceId,
    payload as UpdateLeadSourceDto
  )) as unknown;
  const normalized = normalizeLeadSource(response);

  if (!normalized) {
    throw new Error('Unexpected lead source response');
  }

  return normalized;
}

export async function deleteLeadSource(
  orgId: string,
  sourceId: string
): Promise<void> {
  await leadSourcesControllerRemoveV1(orgId, sourceId);
}
