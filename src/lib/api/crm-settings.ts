import {
  leadSourcesControllerCreateV1,
  leadSourcesControllerFindAllV1,
  leadSourcesControllerRemoveV1,
  leadSourcesControllerUpdateV1,
} from '@/api-generated/endpoints/lead-sources';
import type {
  CreateLeadSourceDto,
  LeadSourcesControllerFindAllV1Params,
  UpdateLeadSourceDto,
} from '@/api-generated/model';
import type {
  CreateLeadSourcePayload,
  LeadSource,
  UpdateLeadSourcePayload,
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
