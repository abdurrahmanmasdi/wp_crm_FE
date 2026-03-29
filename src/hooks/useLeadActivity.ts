import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

type LeadNoteRecord = {
  id: string;
  content: string;
  created_at: string;
  author_name: string;
};

type LeadAttachmentRecord = {
  id: string;
  file_name: string;
  file_url: string;
  uploaded_by: string;
  created_at: string;
};

/**
 * Payload used to create a new lead note.
 */
export type CreateLeadNotePayload = {
  content: string;
};

/**
 * Payload used to create a new lead attachment record.
 */
export type CreateLeadAttachmentPayload = {
  file_name: string;
  file_url: string;
};

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

function normalizeLeadNote(item: unknown): LeadNoteRecord | null {
  const record =
    item && typeof item === 'object' ? (item as Record<string, unknown>) : null;

  if (!record) {
    return null;
  }

  const id = asString(record.id);
  const content =
    asString(record.content) ??
    asString(record.note) ??
    asString(record.text) ??
    asString(record.body);

  if (!id || !content) {
    return null;
  }

  const authorRecord =
    record.author && typeof record.author === 'object'
      ? (record.author as Record<string, unknown>)
      : null;

  const authorName =
    (asString(record.author_name) ??
      asString(record.created_by_name) ??
      asString(authorRecord?.name) ??
      [asString(authorRecord?.first_name), asString(authorRecord?.last_name)]
        .filter((value): value is string => Boolean(value))
        .join(' ')) ||
    'Unknown';

  return {
    id,
    content,
    created_at:
      asString(record.created_at) ??
      asString(record.createdAt) ??
      new Date().toISOString(),
    author_name: authorName,
  };
}

function normalizeLeadAttachment(item: unknown): LeadAttachmentRecord | null {
  const record =
    item && typeof item === 'object' ? (item as Record<string, unknown>) : null;

  if (!record) {
    return null;
  }

  const id = asString(record.id);
  const fileName =
    asString(record.file_name) ??
    asString(record.name) ??
    asString(record.title);
  const fileUrl = asString(record.file_url) ?? asString(record.url);

  if (!id || !fileName || !fileUrl) {
    return null;
  }

  const uploaderRecord =
    record.uploaded_by && typeof record.uploaded_by === 'object'
      ? (record.uploaded_by as Record<string, unknown>)
      : record.uploader && typeof record.uploader === 'object'
        ? (record.uploader as Record<string, unknown>)
        : null;

  const uploadedBy =
    (asString(record.uploaded_by) ??
      asString(record.uploaded_by_name) ??
      asString(record.created_by_name) ??
      asString(uploaderRecord?.name) ??
      [
        asString(uploaderRecord?.first_name),
        asString(uploaderRecord?.last_name),
      ]
        .filter((value): value is string => Boolean(value))
        .join(' ')) ||
    'Unknown';

  return {
    id,
    file_name: fileName,
    file_url: fileUrl,
    uploaded_by: uploadedBy,
    created_at:
      asString(record.created_at) ??
      asString(record.createdAt) ??
      new Date().toISOString(),
  };
}

function normalizeListResponse<T>(
  data: unknown,
  itemNormalizer: (item: unknown) => T | null
): T[] {
  const rootRecord =
    data && typeof data === 'object' ? (data as Record<string, unknown>) : {};
  const rawList = Array.isArray(data)
    ? data
    : Array.isArray(rootRecord.data)
      ? rootRecord.data
      : Array.isArray(rootRecord.items)
        ? rootRecord.items
        : Array.isArray(rootRecord.notes)
          ? rootRecord.notes
          : Array.isArray(rootRecord.attachments)
            ? rootRecord.attachments
            : [];

  return rawList
    .map((item) => itemNormalizer(item))
    .filter((item): item is T => item !== null)
    .sort((left, right) => {
      const leftDate = new Date(
        (left as { created_at?: string }).created_at ?? 0
      ).getTime();
      const rightDate = new Date(
        (right as { created_at?: string }).created_at ?? 0
      ).getTime();
      return rightDate - leftDate;
    });
}

async function fetchLeadNotes(
  orgId: string,
  leadId: string
): Promise<LeadNoteRecord[]> {
  const { data } = await api.get(
    `/organizations/${orgId}/leads/${leadId}/notes`
  );

  return normalizeListResponse(data, normalizeLeadNote);
}

async function createLeadNote(
  orgId: string,
  leadId: string,
  payload: CreateLeadNotePayload
): Promise<LeadNoteRecord> {
  const { data } = await api.post(
    `/organizations/${orgId}/leads/${leadId}/notes`,
    payload
  );

  const normalized = normalizeLeadNote(data);

  if (!normalized) {
    throw new Error('Unexpected lead note response');
  }

  return normalized;
}

async function fetchLeadAttachments(
  orgId: string,
  leadId: string
): Promise<LeadAttachmentRecord[]> {
  const { data } = await api.get(
    `/organizations/${orgId}/leads/${leadId}/attachments`
  );

  return normalizeListResponse(data, normalizeLeadAttachment);
}

async function createLeadAttachment(
  orgId: string,
  leadId: string,
  payload: CreateLeadAttachmentPayload
): Promise<LeadAttachmentRecord> {
  const { data } = await api.post(
    `/organizations/${orgId}/leads/${leadId}/attachments`,
    payload
  );

  const normalized = normalizeLeadAttachment(data);

  if (!normalized) {
    throw new Error('Unexpected lead attachment response');
  }

  return normalized;
}

/**
 * Loads lead notes for a specific lead in an organization.
 *
 * React Query state managed:
 * - Query key: `queryKeys.leads.notes(orgId, leadId)`
 *
 * @param orgId Organization ID that owns the lead.
 * @param leadId Lead ID whose notes are requested.
 * @returns Query result for normalized lead notes ordered by newest first.
 */
export function useLeadNotesQuery(orgId: string | null, leadId: string | null) {
  return useQuery({
    queryKey: queryKeys.leads.notes(orgId, leadId),
    queryFn: () => fetchLeadNotes(orgId!, leadId!),
    enabled: Boolean(orgId && leadId),
  });
}

/**
 * Creates lead notes and refreshes the notes query cache.
 *
 * Side effects:
 * - Invalidates `queryKeys.leads.notes(orgId, leadId)` after successful creation.
 *
 * @returns Mutation object for creating lead notes.
 */
export function useCreateLeadNoteMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      orgId,
      leadId,
      payload,
    }: {
      orgId: string;
      leadId: string;
      payload: CreateLeadNotePayload;
    }) => createLeadNote(orgId, leadId, payload),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.leads.notes(variables.orgId, variables.leadId),
      });
    },
  });
}

/**
 * Loads lead attachments for a specific lead in an organization.
 *
 * React Query state managed:
 * - Query key: `queryKeys.leads.attachments(orgId, leadId)`
 *
 * @param orgId Organization ID that owns the lead.
 * @param leadId Lead ID whose attachments are requested.
 * @returns Query result for normalized lead attachments ordered by newest first.
 */
export function useLeadAttachmentsQuery(
  orgId: string | null,
  leadId: string | null
) {
  return useQuery({
    queryKey: queryKeys.leads.attachments(orgId, leadId),
    queryFn: () => fetchLeadAttachments(orgId!, leadId!),
    enabled: Boolean(orgId && leadId),
  });
}

/**
 * Creates lead attachments and refreshes the attachments query cache.
 *
 * Side effects:
 * - Invalidates `queryKeys.leads.attachments(orgId, leadId)` after successful creation.
 *
 * @returns Mutation object for creating lead attachment records.
 */
export function useCreateLeadAttachmentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      orgId,
      leadId,
      payload,
    }: {
      orgId: string;
      leadId: string;
      payload: CreateLeadAttachmentPayload;
    }) => createLeadAttachment(orgId, leadId, payload),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.leads.attachments(
          variables.orgId,
          variables.leadId
        ),
      });
    },
  });
}
