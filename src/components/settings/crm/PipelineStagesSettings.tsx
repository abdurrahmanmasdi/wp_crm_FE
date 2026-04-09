'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  DragDropContext,
  Draggable,
  Droppable,
  type DropResult,
} from '@hello-pangea/dnd';
import { GripVertical, Pencil } from 'lucide-react';
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
import type { PipelineStage } from '@/types/crm-settings-generated';

function parseOrderIndex(input: string): number | null {
  const parsed = Number(input);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }

  return Math.floor(parsed);
}

function reorderStages(
  stages: PipelineStage[],
  sourceIndex: number,
  destinationIndex: number
): PipelineStage[] {
  const next = [...stages];
  const [moved] = next.splice(sourceIndex, 1);

  if (!moved) {
    return stages;
  }

  next.splice(destinationIndex, 0, moved);

  return next.map((stage, index) => ({
    ...stage,
    order_index: index,
  }));
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

  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [editingStageId, setEditingStageId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [draggingRowWidth, setDraggingRowWidth] = useState<number | null>(null);
  const tableContainerRef = useRef<HTMLDivElement | null>(null);

  const canManageStages = hasPermission(
    AppResource.ORGANIZATION,
    AppAction.MANAGE
  );

  const orderedStages = useMemo(
    () => stagesQuery.data ?? [],
    [stagesQuery.data]
  );

  useEffect(() => {
    setStages(orderedStages);
  }, [orderedStages]);

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

  const handleStartNameEdit = (stage: PipelineStage) => {
    if (!canManageStages) {
      return;
    }

    setEditingStageId(stage.id);
    setEditingName(stage.name);
  };

  const handleSaveName = async (stage: PipelineStage) => {
    const nextName = editingName.trim();

    if (!nextName) {
      toast.error(t('pipelineStages.validation.nameRequired'));
      setEditingStageId(null);
      setEditingName('');
      return;
    }

    setEditingStageId(null);
    setEditingName('');

    if (nextName === stage.name) {
      return;
    }

    try {
      await updateMutation.mutateAsync({
        stageId: stage.id,
        payload: {
          name: nextName,
        },
      });

      setStages((previous) =>
        previous.map((item) =>
          item.id === stage.id ? { ...item, name: nextName } : item
        )
      );

      toast.success(t('pipelineStages.toasts.updated'));
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

  const handleDragStart = () => {
    const width = tableContainerRef.current?.getBoundingClientRect().width;
    setDraggingRowWidth(width ?? null);
  };

  const handleDragEnd = async (result: DropResult) => {
    setDraggingRowWidth(null);

    if (!canManageStages) {
      return;
    }

    const { destination, source } = result;

    if (!destination || destination.index === source.index) {
      return;
    }

    const previousStages = stages;
    const nextStages = reorderStages(stages, source.index, destination.index);

    setStages(nextStages);

    const startIndex = Math.min(source.index, destination.index);
    const endIndex = Math.max(source.index, destination.index);
    const previousOrderMap = new Map(
      previousStages.map((stage) => [stage.id, stage.order_index])
    );

    const affectedStages = nextStages
      .slice(startIndex, endIndex + 1)
      .filter((stage) => previousOrderMap.get(stage.id) !== stage.order_index);

    try {
      for (const stage of affectedStages) {
        await updateMutation.mutateAsync({
          stageId: stage.id,
          payload: {
            order_index: stage.order_index,
          },
        });
      }

      if (affectedStages.length > 0) {
        toast.success(t('pipelineStages.toasts.reordered'));
      }
    } catch (error) {
      setStages(previousStages);
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
      ) : stages.length === 0 ? (
        <div className="bg-background rounded-[1.5rem] border border-dashed border-white/10 p-8 text-center">
          <p className="text-muted-foreground text-sm">
            {t('pipelineStages.empty')}
          </p>
        </div>
      ) : (
        <div
          ref={tableContainerRef}
          className="bg-background overflow-x-auto rounded-lg border border-white/5"
        >
          <DragDropContext
            onDragStart={handleDragStart}
            onDragEnd={(result) => void handleDragEnd(result)}
          >
            <Droppable droppableId="pipeline-stages-settings">
              {(dropProvided) => (
                <Table className="w-full table-fixed">
                  <TableHeader>
                    <TableRow className="border-white/5 hover:bg-transparent">
                      <TableHead className="text-muted-foreground">
                        {t('pipelineStages.table.name')}
                      </TableHead>
                      <TableHead className="text-muted-foreground w-24">
                        {t('pipelineStages.table.orderIndex')}
                      </TableHead>
                      <TableHead className="text-muted-foreground w-32 text-right">
                        {t('pipelineStages.table.actions')}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody
                    ref={dropProvided.innerRef}
                    {...dropProvided.droppableProps}
                  >
                    {stages.map((stage, index) => (
                      <Draggable
                        key={stage.id}
                        draggableId={stage.id}
                        index={index}
                        isDragDisabled={
                          !canManageStages || updateMutation.isPending
                        }
                      >
                        {(dragProvided, dragSnapshot) => (
                          <TableRow
                            ref={dragProvided.innerRef}
                            {...dragProvided.draggableProps}
                            style={{
                              ...dragProvided.draggableProps.style,
                              ...(dragSnapshot.isDragging
                                ? {
                                    width: draggingRowWidth ?? undefined,
                                    display: 'table',
                                    tableLayout: 'fixed',
                                  }
                                : {}),
                            }}
                            className={`border-white/5 hover:bg-white/5 ${
                              dragSnapshot.isDragging ? 'bg-white/10' : ''
                            }`}
                          >
                            <TableCell className="text-foreground font-medium">
                              <div className="group flex w-full items-center gap-2">
                                <button
                                  type="button"
                                  {...(dragProvided.dragHandleProps ?? {})}
                                  className="text-muted-foreground hover:text-foreground rounded p-1"
                                  disabled={
                                    !canManageStages || updateMutation.isPending
                                  }
                                  aria-label={t(
                                    'pipelineStages.table.orderIndex'
                                  )}
                                >
                                  <GripVertical className="h-4 w-4" />
                                </button>

                                {editingStageId === stage.id ? (
                                  <Input
                                    value={editingName}
                                    onChange={(event) =>
                                      setEditingName(event.target.value)
                                    }
                                    onBlur={() => void handleSaveName(stage)}
                                    onKeyDown={(event) => {
                                      if (event.key === 'Enter') {
                                        event.preventDefault();
                                        void handleSaveName(stage);
                                      }

                                      if (event.key === 'Escape') {
                                        setEditingStageId(null);
                                        setEditingName('');
                                      }
                                    }}
                                    autoFocus
                                    disabled={updateMutation.isPending}
                                    className="h-8 flex-1"
                                  />
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleStartNameEdit(stage)}
                                    disabled={!canManageStages}
                                    className="text-foreground inline-flex min-w-0 flex-1 items-center justify-between gap-2 text-left disabled:cursor-default"
                                  >
                                    <span className="truncate">
                                      {stage.name}
                                    </span>
                                    <Pencil className="text-muted-foreground h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-70" />
                                  </button>
                                )}
                              </div>
                            </TableCell>

                            <TableCell className="text-muted-foreground w-24">
                              {stage.order_index}
                            </TableCell>

                            <TableCell className="w-32">
                              <div className="flex justify-end gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteStage(stage)}
                                  disabled={
                                    !canManageStages || deleteMutation.isPending
                                  }
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
                        )}
                      </Draggable>
                    ))}
                    {dropProvided.placeholder}
                  </TableBody>
                </Table>
              )}
            </Droppable>
          </DragDropContext>
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
    </section>
  );
}
