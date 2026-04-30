import { api } from '@/lib/api';

// ── Response shapes ──────────────────────────────────────────────────────────

export interface UploadKnowledgePdfResponse {
  /** Human-readable message from the AI engine */
  message: string;
  /** Document identifier assigned by the vector store */
  documentId?: string;
  /** Total number of text chunks indexed */
  chunks?: number;
}

export interface KnowledgeDocument {
  id: string;
  filename: string;
  uploadedAt: string;
  chunks?: number;
}

// ── API functions ────────────────────────────────────────────────────────────

/**
 * Uploads a PDF file to the AI Knowledge Base (vector DB).
 *
 * Sends a multipart/form-data POST to `/api/v1/knowledge/upload`.
 * **Do NOT set Content-Type manually** — the browser attaches the correct
 * multipart boundary automatically when a FormData body is provided.
 *
 * Authentication is handled by the shared `api` axios instance
 * (Bearer token + x-organization-id headers are injected via interceptors).
 */
export async function uploadKnowledgePdf(
  file: File
): Promise<UploadKnowledgePdfResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post<UploadKnowledgePdfResponse>(
    '/api/v1/knowledge/upload',
    formData
    // Content-Type is intentionally omitted — axios + FormData sets it
    // automatically with the correct multipart boundary.
  );

  return response.data;
}

/**
 * Fetches all previously uploaded knowledge documents for the active org.
 */
export async function getKnowledgeDocuments(): Promise<KnowledgeDocument[]> {
  const response = await api.get<{ data: KnowledgeDocument[] }>(
    '/api/v1/knowledge/documents'
  );

  const payload = response.data;
  if (Array.isArray(payload)) return payload as unknown as KnowledgeDocument[];
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

/**
 * Deletes a knowledge document from the vector store by its ID.
 */
export async function deleteKnowledgeDocument(documentId: string): Promise<void> {
  await api.delete(`/api/v1/knowledge/documents/${documentId}`);
}
