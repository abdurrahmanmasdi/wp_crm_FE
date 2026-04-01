'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ArrowLeft } from 'lucide-react';

import { DashboardKPIs } from '@/components/dashboard/DashboardKPIs';
import { RecentActivityFeed } from '@/components/dashboard/RecentActivityFeed';
import {
  LeadsBySourceChart,
  LeadsByStageChart,
} from '@/components/dashboard/charts/index';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useDashboardMetrics } from '@/hooks/useAnalytics';
import { getErrorMessage } from '@/lib/error-utils';
import { orgService } from '@/lib/org.service';
import { queryKeys } from '@/lib/query-keys';
import { useAuthStore } from '@/store/useAuthStore';

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="border-muted h-32 animate-pulse rounded-xl border-2 border-dashed"
          />
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="border-muted h-90 animate-pulse rounded-xl border-2 border-dashed" />
        <div className="border-muted h-90 animate-pulse rounded-xl border-2 border-dashed" />
      </section>

      <div className="border-muted h-80 animate-pulse rounded-xl border-2 border-dashed" />
    </div>
  );
}

function getInitials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export default function MemberProfilePage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const t = useTranslations('dashboard');
  const activeOrganizationId = useAuthStore(
    (state) => state.activeOrganizationId
  );
  const id = params.id;

  const membersQuery = useQuery({
    queryKey: queryKeys.organizations.members(activeOrganizationId),
    queryFn: () => orgService.getOrganizationMembers(activeOrganizationId!),
    enabled: Boolean(activeOrganizationId),
  });

  const member = useMemo(() => {
    const members = membersQuery.data?.data ?? [];

    return members.find(
      (item) => item.user.id === id || item.membershipId === id
    );
  }, [id, membersQuery.data?.data]);

  const metricsQuery = useDashboardMetrics(activeOrganizationId ?? '', {
    agentId: id,
  });

  const hasOrganization = Boolean(activeOrganizationId);

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <Button
          type="button"
          variant="ghost"
          className="w-fit"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        <div className="bg-card flex flex-wrap items-center gap-4 rounded-2xl border border-white/5 p-6 shadow-2xl shadow-black/20">
          <Avatar className="h-16 w-16 border border-white/10">
            <AvatarImage
              src={member?.user.avatarUrl ?? member?.user.avatar_url}
              alt={member?.user.email}
            />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {member
                ? getInitials(member.user.firstName, member.user.lastName)
                : '--'}
            </AvatarFallback>
          </Avatar>

          <div className="space-y-1">
            <p className="text-foreground text-lg font-semibold">
              {member
                ? `${member.user.firstName} ${member.user.lastName}`
                : 'Unknown member'}
            </p>
            <p className="text-muted-foreground text-sm">
              {member?.user.email ?? ''}
            </p>
            <Badge className="border-primary/20 bg-primary/10 text-primary w-fit border">
              {member?.role.name ?? 'Unknown role'}
            </Badge>
          </div>
        </div>
      </section>

      {!hasOrganization ? (
        <section className="bg-card rounded-2xl border border-white/5 p-6 text-center shadow-2xl shadow-black/20">
          <p className="text-muted-foreground text-sm">
            {t('empty_no_organization')}
          </p>
        </section>
      ) : metricsQuery.isLoading || membersQuery.isLoading ? (
        <DashboardSkeleton />
      ) : metricsQuery.isError || !metricsQuery.data ? (
        <section className="bg-card rounded-2xl border border-white/5 p-6 shadow-2xl shadow-black/20">
          <p className="text-destructive text-sm font-semibold">
            {t('error_load_failed')}
          </p>
          <p className="text-muted-foreground mt-2 text-sm">
            {getErrorMessage(metricsQuery.error ?? membersQuery.error)}
          </p>
        </section>
      ) : (
        <>
          <DashboardKPIs
            pipelineOverview={metricsQuery.data.pipelineOverview}
          />

          <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <LeadsByStageChart
              data={metricsQuery.data.pipelineOverview.leadsByStage}
            />
            <LeadsBySourceChart
              data={metricsQuery.data.pipelineOverview.leadsBySource}
            />
          </section>

          <RecentActivityFeed leads={metricsQuery.data.recentLeads} />
        </>
      )}
    </div>
  );
}
