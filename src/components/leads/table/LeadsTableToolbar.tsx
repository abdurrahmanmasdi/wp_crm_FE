'use client';

import type { Table } from '@tanstack/react-table';
import { Download, Search } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';

import { RequirePermission } from '@/components/auth/RequirePermission';
import {
  LeadFiltersBar,
  type LeadFilterRule,
} from '@/components/leads/filters';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AppAction, AppResource } from '@/constants/permissions.registry';
import type { LeadWithRelations } from '@/types/leads';

const ImportLeadsModal = dynamic(
  () => import('../ImportLeadsModal').then((mod) => mod.ImportLeadsModal),
  {
    ssr: false,
  }
);

type LeadsTableToolbarProps = {
  table: Table<LeadWithRelations>;
  organizationId: string;
  initialRules: LeadFilterRule[];
  onRulesChange: (rules: LeadFilterRule[]) => void;
  onExportCsv: () => void | Promise<void>;
  isExporting: boolean;
  isLoading: boolean;
};

export function LeadsTableToolbar({
  table,
  organizationId,
  initialRules,
  onRulesChange,
  onExportCsv,
  isExporting,
  isLoading,
}: LeadsTableToolbarProps) {
  const t = useTranslations('Leads');
  const globalFilter =
    typeof table.getState().globalFilter === 'string'
      ? table.getState().globalFilter
      : '';

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-[220px] flex-1">
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <Input
          value={globalFilter}
          onChange={(event) => table.setGlobalFilter(event.target.value)}
          placeholder={t('form.searchPlaceholder')}
          className="pl-9"
        />
      </div>

      <LeadFiltersBar
        className="min-w-0 flex-1"
        initialRules={initialRules}
        onRulesChange={onRulesChange}
      />

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
