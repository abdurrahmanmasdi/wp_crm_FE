'use client';

import { Copy, Eye, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type LeadRowActionsProps = {
  canEditLeads: boolean;
  canDeleteLeads: boolean;
  isDeleting: boolean;
  onView: () => void;
  onEdit: () => void;
  onCopyPhone: () => void;
  onDelete: () => void;
};

export function LeadRowActions({
  canEditLeads,
  canDeleteLeads,
  isDeleting,
  onView,
  onEdit,
  onCopyPhone,
  onDelete,
}: LeadRowActionsProps) {
  const t = useTranslations('Leads');

  return (
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
      <DropdownMenuContent align="end" className="bg-card border-white/10">
        <DropdownMenuItem
          className="cursor-pointer hover:bg-white/5 focus:bg-white/5"
          onClick={onView}
        >
          <Eye className="mr-2 h-4 w-4" />
          {t('viewDetails')}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {canEditLeads ? (
          <DropdownMenuItem
            className="cursor-pointer hover:bg-white/5 focus:bg-white/5"
            onClick={onEdit}
          >
            <Pencil className="mr-2 h-4 w-4" />
            {t('editAction')}
          </DropdownMenuItem>
        ) : null}

        <DropdownMenuItem
          className="cursor-pointer hover:bg-white/5 focus:bg-white/5"
          onClick={onCopyPhone}
        >
          <Copy className="mr-2 h-4 w-4" />
          {t('copyPhoneAction')}
        </DropdownMenuItem>

        {canDeleteLeads ? <DropdownMenuSeparator /> : null}

        {canDeleteLeads ? (
          <DropdownMenuItem
            className="text-destructive cursor-pointer hover:bg-white/5 focus:bg-white/5"
            disabled={isDeleting}
            onClick={onDelete}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {isDeleting ? t('deleting') : t('deleteLead')}
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
