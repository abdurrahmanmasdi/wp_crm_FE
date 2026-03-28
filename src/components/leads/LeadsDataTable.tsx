'use client';

import { MoreHorizontal, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { RequirePermission } from '@/components/auth/RequirePermission';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AppAction, AppResource } from '@/constants/permissions.registry';
import { getErrorMessage } from '@/lib/error-utils';
import type { Lead } from '@/types/leads';

type LeadsDataTableProps = {
  leads: Lead[];
  isLoading: boolean;
  error: unknown;
  onDeleteLead: (lead: Lead) => void;
  deletingLeadId: string | null;
};

function getPriorityBadgeClass(priority: string): string {
  switch (priority) {
    case 'HOT':
      return 'bg-red-500/10 text-red-400 border-red-500/20';
    case 'WARM':
      return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
    case 'COLD':
      return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
}

function getStatusBadgeClass(status: string): string {
  switch (status) {
    case 'OPEN':
      return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    case 'WON':
      return 'bg-green-500/10 text-green-400 border-green-500/20';
    case 'LOST':
      return 'bg-red-500/10 text-red-400 border-red-500/20';
    case 'UNQUALIFIED':
      return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
}

function formatEstimatedValue(
  estimatedValue: string,
  currency: string,
  fallback: string
): string {
  const parsedValue = Number(estimatedValue);

  if (!Number.isFinite(parsedValue)) {
    return fallback;
  }

  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(parsedValue);
  } catch {
    return `${estimatedValue} ${currency}`;
  }
}

function formatCreatedAt(dateValue: string | null, fallback: string): string {
  if (!dateValue) {
    return fallback;
  }

  const parsedDate = new Date(dateValue);
  if (Number.isNaN(parsedDate.getTime())) {
    return fallback;
  }

  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  }).format(parsedDate);
}

export function LeadsDataTable({
  leads,
  isLoading,
  error,
  onDeleteLead,
  deletingLeadId,
}: LeadsDataTableProps) {
  const t = useTranslations('Leads');

  if (isLoading) {
    return (
      <section className="bg-card rounded-2xl border border-white/5 p-6 shadow-2xl shadow-black/20">
        <p className="text-muted-foreground text-sm">{t('loading')}</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="bg-card rounded-2xl border border-white/5 p-6 shadow-2xl shadow-black/20">
        <div className="bg-background rounded-xl border border-dashed border-white/10 p-6 text-center">
          <p className="text-destructive text-sm font-semibold">
            {t('loadErrorTitle')}
          </p>
          <p className="text-muted-foreground mt-2 text-xs">
            {getErrorMessage(error)}
          </p>
        </div>
      </section>
    );
  }

  if (leads.length === 0) {
    return (
      <section className="bg-card rounded-2xl border border-white/5 p-6 shadow-2xl shadow-black/20">
        <div className="bg-background rounded-xl border border-dashed border-white/10 p-8 text-center">
          <p className="text-foreground text-sm font-semibold">
            {t('emptyTitle')}
          </p>
          <p className="text-muted-foreground mt-1 text-sm">
            {t('emptyDescription')}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-card rounded-2xl border border-white/5 p-6 shadow-2xl shadow-black/20">
      <div className="bg-background overflow-x-auto rounded-lg border border-white/5">
        <Table>
          <TableHeader>
            <TableRow className="border-white/5 hover:bg-transparent">
              <TableHead className="text-muted-foreground">
                {t('tableHeaders.lead')}
              </TableHead>
              <TableHead className="text-muted-foreground">
                {t('tableHeaders.source')}
              </TableHead>
              <TableHead className="text-muted-foreground">
                {t('tableHeaders.priority')}
              </TableHead>
              <TableHead className="text-muted-foreground">
                {t('tableHeaders.status')}
              </TableHead>
              <TableHead className="text-muted-foreground">
                {t('tableHeaders.estimatedValue')}
              </TableHead>
              <TableHead className="text-muted-foreground">
                {t('tableHeaders.createdAt')}
              </TableHead>
              <TableHead className="text-muted-foreground text-right">
                {t('tableHeaders.actions')}
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {leads.map((lead) => {
              const leadName = `${lead.first_name} ${lead.last_name}`.trim();
              const estimatedValue = formatEstimatedValue(
                lead.estimated_value,
                lead.currency,
                t('notSet')
              );
              const createdAt = formatCreatedAt(lead.created_at, t('notSet'));
              const isDeleting = deletingLeadId === lead.id;

              return (
                <TableRow
                  key={lead.id}
                  className="border-white/5 hover:bg-white/5"
                >
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <p className="text-foreground font-medium">
                        {leadName || t('unknownLeadName')}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {lead.email || t('notSet')}
                      </p>
                    </div>
                  </TableCell>

                  <TableCell className="text-muted-foreground">
                    {lead.source_id || t('notSet')}
                  </TableCell>

                  <TableCell>
                    <Badge className={getPriorityBadgeClass(lead.priority)}>
                      {t(`priority.${lead.priority}` as never)}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    <Badge className={getStatusBadgeClass(lead.status)}>
                      {t(`status.${lead.status}` as never)}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-foreground">
                    {estimatedValue}
                  </TableCell>

                  <TableCell className="text-muted-foreground">
                    {createdAt}
                  </TableCell>

                  <TableCell className="text-right">
                    <RequirePermission
                      resource={AppResource.LEADS}
                      action={AppAction.DELETE_ALL}
                      fallback="hide"
                    >
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-foreground hover:bg-white/5"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">{t('actions')}</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="bg-card border-white/10"
                        >
                          <DropdownMenuItem
                            className="text-destructive cursor-pointer hover:bg-white/5 focus:bg-white/5"
                            disabled={isDeleting}
                            onClick={() => onDeleteLead(lead)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {isDeleting ? t('deleting') : t('deleteLead')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </RequirePermission>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
