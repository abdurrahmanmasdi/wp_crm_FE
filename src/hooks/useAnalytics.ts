import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

import { getDashboardMetrics } from '@/lib/api/analytics';
import { queryKeys } from '@/lib/query-keys';

type DashboardMetricsOptions = {
  agentId?: string;
};

function shouldRetryRequest(failureCount: number, error: unknown): boolean {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    if (status === 401 || status === 403) {
      return false;
    }
  }

  return failureCount < 3;
}

/**
 * Loads analytics dashboard metrics for a specific organization.
 *
 * React Query state managed:
 * - Query key: `queryKeys.analytics.dashboard(orgId, agentId)`
 * - Disabled when `orgId` is empty.
 *
 * @param orgId Active organization ID.
 * @param options Optional dashboard scope filters.
 * @returns Query result containing normalized dashboard metrics payload.
 */
export function useDashboardMetrics(
  orgId: string,
  options?: DashboardMetricsOptions
) {
  const normalizedAgentId = options?.agentId?.trim();

  return useQuery({
    queryKey: queryKeys.analytics.dashboard(orgId, normalizedAgentId),
    queryFn: () =>
      getDashboardMetrics(orgId, {
        agentId: normalizedAgentId,
      }),
    enabled: orgId.trim().length > 0,
    retry: shouldRetryRequest,
    staleTime: 30 * 1000,
  });
}
