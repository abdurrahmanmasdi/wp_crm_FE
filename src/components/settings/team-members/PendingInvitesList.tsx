'use client';

import { useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Copy, Link2, MailPlus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useInvitations, type PendingInvite } from '@/hooks/useInvitations';
import { getErrorMessage } from '@/lib/error-utils';

type PendingInvitesListProps = {
  onOpenInviteDialog: () => void;
};

function getStatusBadgeClass(status: string) {
  switch (status.toUpperCase()) {
    case 'ACTIVE':
      return 'bg-green-500/10 text-green-400 border-green-500/20';
    case 'PENDING':
      return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
    case 'EXPIRED':
      return 'bg-red-500/10 text-red-400 border-red-500/20';
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
}

export function PendingInvitesList({
  onOpenInviteDialog,
}: PendingInvitesListProps) {
  const t = useTranslations('Settings.Invites');
  const locale = useLocale();
  const { pendingInvitesQuery } = useInvitations();

  const invites = useMemo(
    () => pendingInvitesQuery.data ?? [],
    [pendingInvitesQuery.data]
  );

  const resolveInviteUrl = (invite: PendingInvite): string => {
    if (invite.inviteUrl) {
      return invite.inviteUrl;
    }

    if (!invite.token || typeof window === 'undefined') {
      return '';
    }

    return `${window.location.origin}/${locale}/auth/register?inviteId=${invite.token}`;
  };

  const handleCopy = async (invite: PendingInvite) => {
    const url = resolveInviteUrl(invite);

    if (!url) {
      toast.error(t('copyFailed'));
      return;
    }

    try {
      await navigator.clipboard.writeText(url);
      toast.success(t('copied'));
    } catch {
      toast.error(t('copyFailed'));
    }
  };

  if (pendingInvitesQuery.isLoading) {
    return (
      <section className="bg-card rounded-2xl border border-white/5 p-6 shadow-2xl shadow-black/20">
        <p className="text-muted-foreground text-sm">{t('loadingInvites')}</p>
      </section>
    );
  }

  if (pendingInvitesQuery.error) {
    return (
      <section className="bg-card rounded-2xl border border-white/5 p-6 shadow-2xl shadow-black/20">
        <div className="bg-background rounded-xl border border-dashed border-white/10 p-6 text-center">
          <p className="text-destructive text-sm font-semibold">
            {t('failedToLoadInvites')}
          </p>
          <p className="text-muted-foreground mt-2 text-xs">
            {getErrorMessage(pendingInvitesQuery.error)}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-card rounded-2xl border border-white/5 p-6 shadow-2xl shadow-black/20">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-primary text-[11px] font-bold tracking-[0.2em] uppercase">
            {t('pendingTitle')}
          </p>
          <h3 className="text-foreground mt-1 text-lg font-semibold">
            {t('pendingSubtitle')}
          </h3>
        </div>
        <Button type="button" onClick={onOpenInviteDialog}>
          <MailPlus className="mr-2 h-4 w-4" />
          {t('openInviteDialog')}
        </Button>
      </div>

      {invites.length === 0 ? (
        <div className="bg-background rounded-xl border border-dashed border-white/10 p-8 text-center">
          <div className="text-muted-foreground mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-white/10">
            <Link2 className="h-4 w-4" />
          </div>
          <p className="text-foreground text-sm font-semibold">
            {t('emptyTitle')}
          </p>
          <p className="text-muted-foreground mt-1 text-sm">
            {t('emptyDescription')}
          </p>
        </div>
      ) : (
        <div className="bg-background overflow-x-auto rounded-lg border border-white/5">
          <Table>
            <TableHeader>
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-muted-foreground">
                  {t('tableHeaders.email')}
                </TableHead>
                <TableHead className="text-muted-foreground">
                  {t('tableHeaders.role')}
                </TableHead>
                <TableHead className="text-muted-foreground">
                  {t('tableHeaders.status')}
                </TableHead>
                <TableHead className="text-muted-foreground text-right">
                  {t('tableHeaders.actions')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invites.map((invite) => (
                <TableRow
                  key={invite.id}
                  className="border-white/5 hover:bg-white/5"
                >
                  <TableCell className="text-foreground font-medium">
                    {invite.email || t('unknownEmail')}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {invite.roleName || t('unknownRole')}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusBadgeClass(invite.status)}>
                      {invite.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="border-white/10"
                      onClick={() => handleCopy(invite)}
                    >
                      <Copy className="mr-2 h-3.5 w-3.5" />
                      {t('copyInviteLink')}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </section>
  );
}
