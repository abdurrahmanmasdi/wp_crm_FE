'use client';

import { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
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
  useCreatePipelineStageMutation,
  useDeletePipelineStageMutation,
  usePipelineStagesQuery,
  useUpdatePipelineStageMutation,
} from '@/hooks/useCrmSettings';
import { usePermissions } from '@/hooks/usePermissions';
import { getErrorMessage } from '@/lib/error-utils';
import type { PipelineStage } from '@/types/crm-settings';

function parseOrderIndex(input: string): number | null {
  const parsed = Number(input);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }

  return Math.floor(parsed);
}

export function PipelineStagesSettings() {
  const t = useTranslations('Settings.CRM');
  const { hasPermission } = usePermissions();
  const stagesQuery = usePipelineStagesQuery();
  const createMutation = useCreatePipelineStageMutation();
  const updateMutation = useUpdatePipelineStageMutation();
  const deleteMutation = useDeletePipelineStageMutation();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createOrderIndex, setCreateOrderIndex] = useState('0');

  const [editingStage, setEditingStage] = useState<PipelineStage | null>(null);
  const [editName, setEditName] = useState('');
  const [editOrderIndex, setEditOrderIndex] = useState('0');

  const canManageStages = hasPermission(
    AppResource.ORGANIZATION,
    AppAction.MANAGE
  );

  const orderedStages = useMemo(
    () => stagesQuery.data ?? [],
    [stagesQuery.data]
  );

  const handleOpenCreate = () => {
    setCreateName('');
    setCreateOrderIndex(String(orderedStages.length));
    setIsCreateOpen(true);
  };

  const handleCreateStage = async () => {
    const name = createName.trim();
    const orderIndex = parseOrderIndex(createOrderIndex);

    if (!name) {
      toast.error(t('pipelineStages.validation.nameRequired'));
      return;
    }

    if (orderIndex === null) {
      toast.error(t('pipelineStages.validation.orderIndexInvalid'));
      return;
    }

    try {
      await createMutation.mutateAsync({
        name,
        order_index: orderIndex,
      });
      toast.success(t('pipelineStages.toasts.created'));
      setIsCreateOpen(false);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleEditStage = (stage: PipelineStage) => {
    setEditingStage(stage);
    setEditName(stage.name);
    setEditOrderIndex(String(stage.order_index));
  };

  const handleSaveEdit = async () => {
    if (!editingStage) {
      return;
    }

    const name = editName.trim();
    const orderIndex = parseOrderIndex(editOrderIndex);

    if (!name) {
      toast.error(t('pipelineStages.validation.nameRequired'));
      return;
    }

    if (orderIndex === null) {
      toast.error(t('pipelineStages.validation.orderIndexInvalid'));
      return;
    }

    try {
      await updateMutation.mutateAsync({
        stageId: editingStage.id,
        payload: {
          name,
          order_index: orderIndex,
        },
      });
      toast.success(t('pipelineStages.toasts.updated'));
      setEditingStage(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleDeleteStage = async (stage: PipelineStage) => {
    if (
      !window.confirm(t('pipelineStages.deleteConfirm', { name: stage.name }))
    ) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(stage.id);
      toast.success(t('pipelineStages.toasts.deleted'));
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleMoveStage = async (stageId: string, direction: 'up' | 'down') => {
    const currentIndex = orderedStages.findIndex(
      (stage) => stage.id === stageId
    );

    if (currentIndex === -1) {
      return;
    }

    const targetIndex =
      direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    if (targetIndex < 0 || targetIndex >= orderedStages.length) {
      return;
    }

    const currentStage = orderedStages[currentIndex];
    const targetStage = orderedStages[targetIndex];

    try {
      await updateMutation.mutateAsync({
        stageId: currentStage.id,
        payload: {
          order_index: targetStage.order_index,
        },
      });

      await updateMutation.mutateAsync({
        stageId: targetStage.id,
        payload: {
          order_index: currentStage.order_index,
        },
      });

      toast.success(t('pipelineStages.toasts.reordered'));
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  if (stagesQuery.error) {
    return (
      <section className="bg-card rounded-2xl border border-white/5 p-8 shadow-2xl shadow-black/20">
        <div className="bg-background rounded-[1.5rem] border border-dashed border-white/10 p-6 text-center">
          <p className="text-destructive text-sm font-semibold">
            {t('pipelineStages.failedToLoad')}
          </p>
          <p className="text-muted-foreground mt-2 text-sm">
            {getErrorMessage(stagesQuery.error)}
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
            {t('pipelineStages.title')}
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            {t('pipelineStages.subtitle')}
          </p>
        </div>

        <Button
          type="button"
          onClick={handleOpenCreate}
          disabled={!canManageStages}
        >
          {t('pipelineStages.add')}
        </Button>
      </div>

      {stagesQuery.isLoading ? (
        <div className="bg-background rounded-[1.5rem] border border-dashed border-white/10 p-8 text-center">
          <p className="text-muted-foreground text-sm">
            {t('pipelineStages.loading')}
          </p>
        </div>
      ) : orderedStages.length === 0 ? (
        <div className="bg-background rounded-[1.5rem] border border-dashed border-white/10 p-8 text-center">
          <p className="text-muted-foreground text-sm">
            {t('pipelineStages.empty')}
          </p>
        </div>
      ) : (
        <div className="bg-background overflow-x-auto rounded-lg border border-white/5">
          <Table>
            <TableHeader>
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-muted-foreground">
                  {t('pipelineStages.table.name')}
                </TableHead>
                <TableHead className="text-muted-foreground">
                  {t('pipelineStages.table.orderIndex')}
                </TableHead>
                <TableHead className="text-muted-foreground text-right">
                  {t('pipelineStages.table.actions')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orderedStages.map((stage, index) => (
                <TableRow
                  key={stage.id}
                  className="border-white/5 hover:bg-white/5"
                >
                  <TableCell className="text-foreground font-medium">
                    {stage.name}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <span>{stage.order_index}</span>
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => void handleMoveStage(stage.id, 'up')}
                          disabled={
                            !canManageStages ||
                            updateMutation.isPending ||
                            index === 0
                          }
                          aria-label={t('pipelineStages.actions.moveUp')}
                        >
                          <ChevronUp className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => void handleMoveStage(stage.id, 'down')}
                          disabled={
                            !canManageStages ||
                            updateMutation.isPending ||
                            index === orderedStages.length - 1
                          }
                          aria-label={t('pipelineStages.actions.moveDown')}
                        >
                          <ChevronDown className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditStage(stage)}
                        disabled={!canManageStages}
                      >
                        {t('pipelineStages.actions.edit')}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteStage(stage)}
                        disabled={!canManageStages || deleteMutation.isPending}
                        className="text-red-400 hover:text-red-300"
                      >
                        {deleteMutation.isPending &&
                        deleteMutation.variables === stage.id
                          ? t('pipelineStages.actions.deleting')
                          : t('pipelineStages.actions.delete')}
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
            <DialogTitle>{t('pipelineStages.createDialog.title')}</DialogTitle>
            <DialogDescription>
              {t('pipelineStages.createDialog.description')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t('pipelineStages.form.name')}
              </label>
              <Input
                value={createName}
                onChange={(event) => setCreateName(event.target.value)}
                placeholder={t('pipelineStages.form.namePlaceholder')}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t('pipelineStages.form.orderIndex')}
              </label>
              <Input
                type="number"
                min={0}
                value={createOrderIndex}
                onChange={(event) => setCreateOrderIndex(event.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateOpen(false)}
            >
              {t('pipelineStages.form.cancel')}
            </Button>
            <Button
              type="button"
              onClick={handleCreateStage}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending
                ? t('pipelineStages.form.creating')
                : t('pipelineStages.form.create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(editingStage)}
        onOpenChange={(open) => {
          if (!open) {
            setEditingStage(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('pipelineStages.editDialog.title')}</DialogTitle>
            <DialogDescription>
              {t('pipelineStages.editDialog.description')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t('pipelineStages.form.name')}
              </label>
              <Input
                value={editName}
                onChange={(event) => setEditName(event.target.value)}
                placeholder={t('pipelineStages.form.namePlaceholder')}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t('pipelineStages.form.orderIndex')}
              </label>
              <Input
                type="number"
                min={0}
                value={editOrderIndex}
                onChange={(event) => setEditOrderIndex(event.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditingStage(null)}
            >
              {t('pipelineStages.form.cancel')}
            </Button>
            <Button
              type="button"
              onClick={handleSaveEdit}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending
                ? t('pipelineStages.form.saving')
                : t('pipelineStages.form.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
