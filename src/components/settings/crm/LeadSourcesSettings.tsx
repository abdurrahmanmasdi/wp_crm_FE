'use client';

import { useState } from 'react';
import { Pencil } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AppAction, AppResource } from '@/constants/permissions.registry';
import {
  useCreateLeadSourceMutation,
  useDeleteLeadSourceMutation,
  useLeadSourcesQuery,
  useUpdateLeadSourceMutation,
} from '@/hooks/useCrmSettings';
import { usePermissions } from '@/hooks/usePermissions';
import { getErrorMessage } from '@/lib/error-utils';
import type { LeadSource } from '@/types/crm-settings-generated';

export function LeadSourcesSettings() {
  const t = useTranslations('Settings.CRM');
  const { hasPermission } = usePermissions();
  const leadSourcesQuery = useLeadSourcesQuery();
  const createMutation = useCreateLeadSourceMutation();
  const updateMutation = useUpdateLeadSourceMutation();
  const deleteMutation = useDeleteLeadSourceMutation();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createActive, setCreateActive] = useState(true);

  const [editingSourceId, setEditingSourceId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingStatusSourceId, setEditingStatusSourceId] = useState<
    string | null
  >(null);

  const canManageSources = hasPermission(
    AppResource.ORGANIZATION,
    AppAction.MANAGE
  );

  const updatingSourceId =
    updateMutation.isPending && updateMutation.variables
      ? updateMutation.variables.sourceId
      : null;

  const handleOpenCreate = () => {
    setCreateName('');
    setCreateActive(true);
    setIsCreateOpen(true);
  };

  const handleCreateSource = async () => {
    const name = createName.trim();

    if (!name) {
      toast.error(t('leadSources.validation.nameRequired'));
      return;
    }

    try {
      await createMutation.mutateAsync({
        name,
        is_active: createActive,
      });
      toast.success(t('leadSources.toasts.created'));
      setIsCreateOpen(false);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleStartNameEdit = (source: LeadSource) => {
    if (!canManageSources) {
      return;
    }

    setEditingSourceId(source.id);
    setEditingName(source.name);
  };

  const handleSaveName = async (source: LeadSource) => {
    const nextName = editingName.trim();

    if (!nextName) {
      toast.error(t('leadSources.validation.nameRequired'));
      setEditingSourceId(null);
      setEditingName('');
      return;
    }

    setEditingSourceId(null);
    setEditingName('');

    if (nextName === source.name) {
      return;
    }

    try {
      await updateMutation.mutateAsync({
        sourceId: source.id,
        payload: {
          name: nextName,
        },
      });
      toast.success(t('leadSources.toasts.updated'));
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleStartStatusEdit = (source: LeadSource) => {
    if (!canManageSources) {
      return;
    }

    setEditingStatusSourceId(source.id);
  };

  const handleStatusChange = async (source: LeadSource, isActive: boolean) => {
    await handleToggleSourceActive(source, isActive);
    setEditingStatusSourceId(null);
  };

  const handleDeleteSource = async (source: LeadSource) => {
    if (
      !window.confirm(t('leadSources.deleteConfirm', { name: source.name }))
    ) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(source.id);
      toast.success(t('leadSources.toasts.deleted'));
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleToggleSourceActive = async (
    source: LeadSource,
    isActive: boolean
  ) => {
    if (source.is_active === isActive) {
      return;
    }

    try {
      await updateMutation.mutateAsync({
        sourceId: source.id,
        payload: {
          is_active: isActive,
        },
      });
      toast.success(t('leadSources.toasts.updated'));
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  if (leadSourcesQuery.error) {
    return (
      <section className="bg-card rounded-2xl border border-white/5 p-8 shadow-2xl shadow-black/20">
        <div className="bg-background rounded-[1.5rem] border border-dashed border-white/10 p-6 text-center">
          <p className="text-destructive text-sm font-semibold">
            {t('leadSources.failedToLoad')}
          </p>
          <p className="text-muted-foreground mt-2 text-sm">
            {getErrorMessage(leadSourcesQuery.error)}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-card rounded-2xl border border-white/5 p-8 shadow-2xl shadow-black/20">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-foreground text-lg font-semibold">
            {t('leadSources.title')}
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            {t('leadSources.subtitle')}
          </p>
        </div>

        <Button
          type="button"
          onClick={handleOpenCreate}
          disabled={!canManageSources}
        >
          {t('leadSources.add')}
        </Button>
      </div>

      {leadSourcesQuery.isLoading ? (
        <div className="bg-background rounded-[1.5rem] border border-dashed border-white/10 p-8 text-center">
          <p className="text-muted-foreground text-sm">
            {t('leadSources.loading')}
          </p>
        </div>
      ) : (leadSourcesQuery.data ?? []).length === 0 ? (
        <div className="bg-background rounded-[1.5rem] border border-dashed border-white/10 p-8 text-center">
          <p className="text-muted-foreground text-sm">
            {t('leadSources.empty')}
          </p>
        </div>
      ) : (
        <div className="bg-background overflow-x-auto rounded-lg border border-white/5">
          <Table>
            <TableHeader>
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-muted-foreground">
                  {t('leadSources.table.name')}
                </TableHead>
                <TableHead className="text-muted-foreground">
                  {t('leadSources.table.active')}
                </TableHead>
                <TableHead className="text-muted-foreground text-right">
                  {t('leadSources.table.actions')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(leadSourcesQuery.data ?? []).map((source) => (
                <TableRow
                  key={source.id}
                  className="border-white/5 hover:bg-white/5"
                >
                  <TableCell className="text-foreground font-medium">
                    <div className="group inline-flex items-center gap-2">
                      {editingSourceId === source.id ? (
                        <Input
                          value={editingName}
                          onChange={(event) =>
                            setEditingName(event.target.value)
                          }
                          onBlur={() => void handleSaveName(source)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                              event.preventDefault();
                              void handleSaveName(source);
                            }

                            if (event.key === 'Escape') {
                              setEditingSourceId(null);
                              setEditingName('');
                            }
                          }}
                          autoFocus
                          disabled={updateMutation.isPending}
                          className="h-8"
                        />
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleStartNameEdit(source)}
                          disabled={!canManageSources}
                          className="text-foreground inline-flex items-center gap-2 text-left disabled:cursor-default"
                        >
                          <span>{source.name}</span>
                          <Pencil className="text-muted-foreground h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-70" />
                        </button>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {editingStatusSourceId === source.id ? (
                      <div className="inline-flex items-center gap-2">
                        <Switch
                          checked={source.is_active}
                          onCheckedChange={(checked) =>
                            void handleStatusChange(source, checked)
                          }
                          disabled={
                            !canManageSources || updatingSourceId === source.id
                          }
                          aria-label={t('leadSources.form.active')}
                        />
                        <span className="text-xs">
                          {source.is_active
                            ? t('leadSources.status.active')
                            : t('leadSources.status.inactive')}
                        </span>
                      </div>
                    ) : (
                      <div className="group inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleStartStatusEdit(source)}
                          disabled={!canManageSources}
                          className="text-muted-foreground inline-flex items-center gap-2 text-left text-xs disabled:cursor-default"
                        >
                          <span>
                            {source.is_active
                              ? t('leadSources.status.active')
                              : t('leadSources.status.inactive')}
                          </span>
                          <Pencil className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-70" />
                        </button>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteSource(source)}
                        disabled={!canManageSources || deleteMutation.isPending}
                        className="text-red-400 hover:text-red-300"
                      >
                        {deleteMutation.isPending &&
                        deleteMutation.variables === source.id
                          ? t('leadSources.actions.deleting')
                          : t('leadSources.actions.delete')}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('leadSources.createDialog.title')}</DialogTitle>
            <DialogDescription>
              {t('leadSources.createDialog.description')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t('leadSources.form.name')}
              </label>
              <Input
                value={createName}
                onChange={(event) => setCreateName(event.target.value)}
                placeholder={t('leadSources.form.namePlaceholder')}
              />
            </div>

            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={createActive}
                onCheckedChange={(checked) => setCreateActive(checked === true)}
              />
              {t('leadSources.form.active')}
            </label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateOpen(false)}
            >
              {t('leadSources.form.cancel')}
            </Button>
            <Button
              type="button"
              onClick={handleCreateSource}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending
                ? t('leadSources.form.creating')
                : t('leadSources.form.create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
