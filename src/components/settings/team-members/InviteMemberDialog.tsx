'use client';

import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Copy } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Role } from '@/types/access-control-generated';
import { getLocalizedRoleName } from '@/lib/utils/translations';
import { getErrorMessage } from '@/lib/error-utils';
import { useInvitations, type GeneratedInvite } from '@/hooks/useInvitations';

const getDefaultRoleId = (roles: Role[]) => roles[0]?.id ?? '';

type InviteMemberDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roles: Role[];
  isLoadingRoles: boolean;
};

type InviteMemberFormValues = {
  email: string;
  roleId: string;
};

export function InviteMemberDialog({
  open,
  onOpenChange,
  roles,
  isLoadingRoles,
}: InviteMemberDialogProps) {
  const t = useTranslations('Settings.Invites');
  const tCommon = useTranslations('Common');
  const locale = useLocale();
  const { generateInviteMutation } = useInvitations();

  const [generatedInvite, setGeneratedInvite] =
    useState<GeneratedInvite | null>(null);

  const schema = useMemo(
    () =>
      z.object({
        email: z.string().trim().email(t('emailValidation')),
        roleId: z.string().min(1, t('roleRequired')),
      }),
    [t]
  );

  const {
    register,
    control,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm<InviteMemberFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: '',
      roleId: getDefaultRoleId(roles),
    },
  });

  const resetDialogState = () => {
    setGeneratedInvite(null);
    reset({
      email: '',
      roleId: getDefaultRoleId(roles),
    });
  };

  const handleDialogOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      resetDialogState();
    }

    onOpenChange(nextOpen);
  };

  useEffect(() => {
    if (!open || roles.length === 0) {
      return;
    }

    reset((currentValues) => ({
      email: currentValues.email,
      roleId: currentValues.roleId || getDefaultRoleId(roles),
    }));
  }, [open, roles, reset]);

  const resolvedInviteUrl = useMemo(() => {
    if (!generatedInvite) {
      return '';
    }

    if (generatedInvite.inviteUrl) {
      return generatedInvite.inviteUrl;
    }

    if (!generatedInvite.token || typeof window === 'undefined') {
      return '';
    }

    return `${window.location.origin}/${locale}/auth/register?inviteId=${generatedInvite.token}`;
  }, [generatedInvite, locale]);

  const handleCopy = async (value: string) => {
    if (!value) {
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
      toast.success(t('copied'));
    } catch {
      toast.error(t('copyFailed'));
    }
  };

  const onSubmit = async (values: InviteMemberFormValues) => {
    try {
      const result = await generateInviteMutation.mutateAsync({
        email: values.email.trim(),
        roleId: values.roleId,
      });

      setGeneratedInvite(result);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const isSubmitting = generateInviteMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('dialogTitle')}</DialogTitle>
          <DialogDescription>{t('dialogDescription')}</DialogDescription>
        </DialogHeader>

        {generatedInvite ? (
          <div className="space-y-4 pt-2">
            <div className="space-y-1">
              <p className="text-foreground text-sm font-semibold">
                {t('successTitle')}
              </p>
              <p className="text-muted-foreground text-sm">
                {t('successDescription')}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="invite-url">
                {t('inviteUrlLabel')}
              </label>
              <div className="flex gap-2">
                <Input id="invite-url" value={resolvedInviteUrl} readOnly />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleCopy(resolvedInviteUrl)}
                  disabled={!resolvedInviteUrl}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  {t('copyInviteLink')}
                </Button>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setGeneratedInvite(null)}
              >
                {t('inviteAnother')}
              </Button>
              <Button
                type="button"
                onClick={() => handleDialogOpenChange(false)}
              >
                {tCommon('cancel')}
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="invite-email">
                {t('emailLabel')}
              </label>
              <Input
                id="invite-email"
                type="email"
                placeholder={t('emailPlaceholder')}
                disabled={isSubmitting}
                {...register('email')}
              />
              {errors.email?.message ? (
                <p className="text-destructive text-xs">
                  {errors.email.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="invite-role-id">
                {t('roleLabel')}
              </label>
              <Controller
                name="roleId"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={
                      isSubmitting || isLoadingRoles || roles.length === 0
                    }
                  >
                    <SelectTrigger id="invite-role-id">
                      <SelectValue placeholder={t('rolePlaceholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {getLocalizedRoleName(role, locale)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.roleId?.message ? (
                <p className="text-destructive text-xs">
                  {errors.roleId.message}
                </p>
              ) : null}
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleDialogOpenChange(false)}
                disabled={isSubmitting}
              >
                {tCommon('cancel')}
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || isLoadingRoles || roles.length === 0}
              >
                {isSubmitting ? t('sendingInvite') : t('sendInvite')}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
