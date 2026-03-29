import type { Lead } from '@/types/leads';

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

function formatDate(value: string | null): string {
  if (!value) {
    return '';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(parsed);
}

function escapeCsvValue(value: string): string {
  if (value.includes('"') || value.includes(',') || value.includes('\n')) {
    return `"${value.replaceAll('"', '""')}"`;
  }

  return value;
}

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
