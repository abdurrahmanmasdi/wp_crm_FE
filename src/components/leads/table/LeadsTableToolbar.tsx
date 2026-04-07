'use client';

import { Download } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';

import { RequirePermission } from '@/components/auth/RequirePermission';
import {
  LeadFiltersBar,
  type LeadFilterRule,
} from '@/components/leads/filters';
import { Button } from '@/components/ui/button';
import { AppAction, AppResource } from '@/constants/permissions.registry';

const ImportLeadsModal = dynamic(
  () => import('../ImportLeadsModal').then((mod) => mod.ImportLeadsModal),
  {
    ssr: false,
  }
);

type LeadsTableToolbarProps = {
  organizationId: string;
  initialRules: LeadFilterRule[];
  onRulesChange: (rules: LeadFilterRule[]) => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onExportCsv: () => void | Promise<void>;
  isExporting: boolean;
  isLoading: boolean;
};

export function LeadsTableToolbar({
  organizationId,
  initialRules,
  onRulesChange,
  onExportCsv,
  isExporting,
  isLoading,
}: LeadsTableToolbarProps) {
  const t = useTranslations('Leads');

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex-1">
        <LeadFiltersBar
          className="min-w-0"
          initialRules={initialRules}
          onRulesChange={onRulesChange}
        />
      </div>

      <Button
        type="button"
        variant="secondary"
        onClick={() => void onExportCsv()}
        disabled={isExporting || isLoading}
      >
        <Download className="h-4 w-4" />
        {isExporting ? t('export.loading') : t('export.button')}
      </Button>

      <RequirePermission
        resource={AppResource.LEADS}
        action={AppAction.CREATE}
        fallback="disable"
      >
        <ImportLeadsModal
          organizationId={organizationId}
          disabled={isLoading}
        />
      </RequirePermission>
    </div>
  );
}
