import { api } from '@/lib/api';
import type { LeadStatus } from '@/types/leads-generated';

/**
 * Stage distribution item used for pipeline bar chart visualizations.
 */
export type DashboardLeadsByStage = {
  stageId: string;
  stageName: string;
  count: number;
};

/**
 * Source distribution item used for lead source pie chart visualizations.
 */
export type DashboardLeadsBySource = {
  sourceId: string;
  sourceName: string;
  count: number;
};

/**
 * High-level pipeline metrics returned by dashboard analytics.
 */
export type DashboardPipelineOverview = {
  totalLeads: number;
  totalPipelineValue: number;
  currency: string;
  leadsByStage: DashboardLeadsByStage[];
  leadsBySource: DashboardLeadsBySource[];
};

/**
 * Recent lead item displayed in dashboard activity feed.
 */
export type DashboardRecentLead = {
  id: string;
  first_name: string;
  last_name: string;
  status: LeadStatus;
  created_at: string;
};

/**
 * Dashboard analytics response shape consumed by dashboard UI widgets.
 */
export type DashboardMetricsResponse = {
  pipelineOverview: DashboardPipelineOverview;
  recentLeads: DashboardRecentLead[];
};

export type DashboardMetricsParams = {
  agentId?: string;
};

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

function asNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = Number(value);
    if (Number.isFinite(normalized)) {
      return normalized;
    }
  }

  return 0;
}

function normalizeLeadStatus(value: unknown): LeadStatus {
  const normalized = asString(value)?.toUpperCase();

  switch (normalized) {
    case 'OPEN':
    case 'WON':
    case 'LOST':
    case 'UNQUALIFIED':
      return normalized;
    default:
      return 'OPEN';
  }
}

function normalizeStageDistribution(
  item: unknown
): DashboardLeadsByStage | null {
  const record =
    item && typeof item === 'object' ? (item as Record<string, unknown>) : null;

  if (!record) {
    return null;
  }

  const stageName =
    asString(record.stage_name) ??
    asString(record.stageName) ??
    asString(record.name) ??
    'Unknown stage';

  return {
    stageId:
      asString(record.stage_id) ??
      asString(record.stageId) ??
      asString(record.id) ??
      stageName,
    stageName,
    count: asNumber(record.count ?? record.total ?? record.value),
  };
}

function normalizeSourceDistribution(
  item: unknown
): DashboardLeadsBySource | null {
  const record =
    item && typeof item === 'object' ? (item as Record<string, unknown>) : null;

  if (!record) {
    return null;
  }

  const sourceName =
    asString(record.source_name) ??
    asString(record.sourceName) ??
    asString(record.name) ??
    'Unknown source';

  return {
    sourceId:
      asString(record.source_id) ??
      asString(record.sourceId) ??
      asString(record.id) ??
      sourceName,
    sourceName,
    count: asNumber(record.count ?? record.total ?? record.value),
  };
}

function normalizeRecentLead(
  item: unknown,
  index: number
): DashboardRecentLead {
  const record =
    item && typeof item === 'object' ? (item as Record<string, unknown>) : {};

  return {
    id: asString(record.id) ?? `recent-lead-${index}`,
    first_name:
      asString(record.first_name) ??
      asString(record.firstName) ??
      asString(record.name) ??
      'Unknown',
    last_name: asString(record.last_name) ?? asString(record.lastName) ?? '',
    status: normalizeLeadStatus(record.status),
    created_at:
      asString(record.created_at) ??
      asString(record.createdAt) ??
      new Date().toISOString(),
  };
}

function normalizeMetricsResponse(data: unknown): DashboardMetricsResponse {
  const root =
    data && typeof data === 'object' ? (data as Record<string, unknown>) : {};

  const pipelineRecord =
    (root.pipeline_overview as Record<string, unknown> | undefined) ??
    (root.pipelineOverview as Record<string, unknown> | undefined) ??
    (root.overview as Record<string, unknown> | undefined) ??
    {};

  const stageItemsRaw =
    (pipelineRecord.leads_by_stage as unknown[]) ??
    (pipelineRecord.leadsByStage as unknown[]) ??
    (root.leads_by_stage as unknown[]) ??
    (root.leadsByStage as unknown[]) ??
    [];

  const sourceItemsRaw =
    (pipelineRecord.leads_by_source as unknown[]) ??
    (pipelineRecord.leadsBySource as unknown[]) ??
    (root.leads_by_source as unknown[]) ??
    (root.leadsBySource as unknown[]) ??
    [];

  const recentLeadsRaw =
    (root.recent_leads as unknown[]) ??
    (root.recentLeads as unknown[]) ??
    (root.latest_leads as unknown[]) ??
    (root.latestLeads as unknown[]) ??
    [];

  return {
    pipelineOverview: {
      totalLeads: asNumber(
        pipelineRecord.total_leads ??
          pipelineRecord.totalLeads ??
          root.total_leads
      ),
      totalPipelineValue: asNumber(
        pipelineRecord.total_pipeline_value ??
          pipelineRecord.totalPipelineValue ??
          root.total_pipeline_value
      ),
      currency:
        asString(pipelineRecord.currency) ?? asString(root.currency) ?? 'USD',
      leadsByStage: Array.isArray(stageItemsRaw)
        ? stageItemsRaw
            .map((item) => normalizeStageDistribution(item))
            .filter((item): item is DashboardLeadsByStage => item !== null)
        : [],
      leadsBySource: Array.isArray(sourceItemsRaw)
        ? sourceItemsRaw
            .map((item) => normalizeSourceDistribution(item))
            .filter((item): item is DashboardLeadsBySource => item !== null)
        : [],
    },
    recentLeads: Array.isArray(recentLeadsRaw)
      ? recentLeadsRaw.map((item, index) => normalizeRecentLead(item, index))
      : [],
  };
}

/**
 * Fetches dashboard analytics metrics for an organization.
 *
 * Endpoint: `GET /organizations/:orgId/analytics/dashboard`
 *
 * @param orgId Organization UUID used in route parameters.
 * @returns A promise resolving to normalized dashboard metrics for KPI, charts, and recent activity widgets.
 */
export async function getDashboardMetrics(
  orgId: string,
  params?: DashboardMetricsParams
): Promise<DashboardMetricsResponse> {
  const normalizedAgentId = params?.agentId?.trim();
  const { data } = await api.get(
    `/organizations/${orgId}/analytics/dashboard`,
    {
      params: normalizedAgentId ? { agent_id: normalizedAgentId } : undefined,
    }
  );
  return normalizeMetricsResponse(data);
}
