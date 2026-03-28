'use client';

import { useTranslations } from 'next-intl';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface RoleChangeConfirmationDialogProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function RoleChangeConfirmationDialog({
  open,
  onCancel,
  onConfirm,
}: RoleChangeConfirmationDialogProps) {
  const tAlerts = useTranslations('Settings.Alerts');
  const tCommon = useTranslations('Common');

  return (
    <AlertDialog open={open} onOpenChange={onCancel}>
      <AlertDialogContent className="bg-card border-white/10">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-foreground">
            {tAlerts('changeRoleTitle')}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground">
            {tAlerts('changeRoleDescription')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="text-muted-foreground border-white/10 hover:bg-white/5">
            {tCommon('cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {tAlerts('confirmAction')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
