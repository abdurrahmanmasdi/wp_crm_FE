import type { Lead } from '@/types/leads-generated';

type FlatLeadRow = {
  id: string;
  full_name: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  status: string;
  priority: string;
  estimated_value: string;
  currency: string;
  country: string;
  timezone: string;
  primary_language: string;
  preferred_language: string;
  assigned_agent_id: string;
  source_id: string;
  expected_service_date: string;
  next_follow_up_at: string;
  created_at: string;
  updated_at: string;
};

/**
 * Formats an ISO-like date string into a localized date-time string.
 *
 * @param value Raw date string (or null) from lead fields.
 * @returns Localized date-time text, the original value when invalid, or empty string when absent.
 */
function formatDate(value: Date | string | null): string {
  if (!value) {
    return '';
  }

  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(parsed);
}

/**
 * Escapes a string for safe CSV serialization.
 *
 * @param value Plain string cell value.
 * @returns CSV-safe value with quotes escaped and wrapped when delimiters/newlines exist.
 */
function escapeCsvValue(value: string): string {
  if (value.includes('"') || value.includes(',') || value.includes('\n')) {
    return `"${value.replaceAll('"', '""')}"`;
  }

  return value;
}

/**
 * Flattens a lead entity into a CSV row shape with display-friendly date values.
 *
 * @param lead Lead entity from API/domain models.
 * @returns Flat row object used by CSV serialization.
 */
function toFlatLeadRow(lead: Lead): FlatLeadRow {
  const fullName = `${lead.first_name} ${lead.last_name}`.trim();

  return {
    id: lead.id,
    full_name: fullName,
    first_name: lead.first_name,
    last_name: lead.last_name,
    email: lead.email ?? '',
    phone_number: lead.phone_number,
    status: lead.status,
    priority: lead.priority,
    estimated_value: lead.estimated_value,
    currency: lead.currency,
    country: lead.country,
    timezone: lead.timezone,
    primary_language: lead.primary_language,
    preferred_language: lead.preferred_language ?? '',
    assigned_agent_id: lead.assigned_agent_id ?? '',
    source_id: lead.source_id ?? '',
    expected_service_date: formatDate(lead.expected_service_date),
    next_follow_up_at: formatDate(lead.next_follow_up_at),
    created_at: formatDate(lead.created_at),
    updated_at: formatDate(lead.updated_at),
  };
}

/**
 * Serializes flat lead rows into CSV text content.
 *
 * @param rows Flat lead rows prepared for export.
 * @returns CSV string with header row plus escaped value rows.
 */
function rowsToCsv(rows: FlatLeadRow[]): string {
  if (rows.length === 0) {
    return '';
  }

  const headers = Object.keys(rows[0]) as Array<keyof FlatLeadRow>;
  const headerLine = headers.join(',');
  const valueLines = rows.map((row) =>
    headers.map((header) => escapeCsvValue(String(row[header] ?? ''))).join(',')
  );

  return [headerLine, ...valueLines].join('\n');
}

/**
 * Triggers a browser download for the provided leads as `leads-export.csv`.
 *
 * Transformation flow:
 * 1. Map lead entities to flat export rows.
 * 2. Serialize rows into CSV text.
 * 3. Create an object URL and trigger an anchor download.
 *
 * @param leads Lead entities to export.
 * @returns `void`.
 */
export function exportLeadsToCSV(leads: Lead[]) {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  const flatRows = leads.map((lead) => toFlatLeadRow(lead));
  const csvContent = rowsToCsv(flatRows);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = 'leads-export.csv';
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
