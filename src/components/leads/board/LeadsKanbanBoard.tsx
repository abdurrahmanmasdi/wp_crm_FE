'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  DragDropContext,
  Draggable,
  Droppable,
  type DropResult,
} from '@hello-pangea/dnd';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { LeadDetailSheet } from '@/components/leads/LeadDetailSheet';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  useOrganizationMembersQuery,
  useUpdateLeadMutation,
} from '@/hooks/useLeads';
import { getErrorMessage } from '@/lib/error-utils';
import type { PipelineStage } from '@/types/crm-settings';
import type { Lead } from '@/types/leads';

const UNASSIGNED_COLUMN_ID = '__unassigned__';

type LeadsKanbanBoardProps = {
  leads: Lead[];
  pipelineStages: PipelineStage[];
};

type BoardColumn = {
  id: string;
  name: string;
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

function toInitials(name: string): string {
  const parts = name
    .split(' ')
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
    .slice(0, 2);

  if (parts.length === 0) {
    return '?';
  }

  return parts.map((part) => part.charAt(0).toUpperCase()).join('');
}

function getAgentDisplayName(label: string): string {
  return label.split(' (')[0] || label;
}

export function LeadsKanbanBoard({
  leads,
  pipelineStages,
}: LeadsKanbanBoardProps) {
  const t = useTranslations('Leads');
  const membersQuery = useOrganizationMembersQuery();
  const updateLeadMutation = useUpdateLeadMutation();

  const [isMounted, setIsMounted] = useState(false);
  const [boardLeads, setBoardLeads] = useState<Lead[]>(leads);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  useEffect(() => {
    setIsMounted(true);

    return () => {
      setIsMounted(false);
    };
  }, []);

  useEffect(() => {
    setBoardLeads(leads);
  }, [leads]);

  const orderedColumns = useMemo<BoardColumn[]>(() => {
    const sortedStages = [...pipelineStages].sort(
      (left, right) => left.order_index - right.order_index
    );

    return [
      {
        id: UNASSIGNED_COLUMN_ID,
        name: t('board.unassigned'),
      },
      ...sortedStages.map((stage) => ({
        id: String(stage.id),
        name: stage.name,
      })),
    ];
  }, [pipelineStages, t]);

  const validStageIds = useMemo(
    () => new Set(pipelineStages.map((stage) => String(stage.id))),
    [pipelineStages]
  );

  const groupedLeads = useMemo(() => {
    const initialGroups = Object.fromEntries(
      orderedColumns.map((column) => [column.id, [] as Lead[]])
    ) as Record<string, Lead[]>;

    for (const lead of boardLeads) {
      const stageId =
        lead.pipeline_stage_id === null ? null : String(lead.pipeline_stage_id);

      const targetColumnId =
        stageId && validStageIds.has(stageId) ? stageId : UNASSIGNED_COLUMN_ID;

      initialGroups[targetColumnId].push(lead);
    }

    return initialGroups;
  }, [boardLeads, orderedColumns, validStageIds]);

  const agentLabelMap = useMemo(
    () =>
      new Map(
        (membersQuery.data ?? []).map((agent) => [agent.value, agent.label])
      ),
    [membersQuery.data]
  );

  const handleDragEnd = useCallback(
    async (result: DropResult) => {
      const { destination, source } = result;

      if (!destination) {
        return;
      }

      if (
        destination.droppableId === source.droppableId &&
        destination.index === source.index
      ) {
        return;
      }

      const sourceItems = [...(groupedLeads[source.droppableId] ?? [])];
      const destinationItems =
        source.droppableId === destination.droppableId
          ? sourceItems
          : [...(groupedLeads[destination.droppableId] ?? [])];

      const draggedLead = sourceItems[source.index];
      if (!draggedLead) {
        return;
      }

      sourceItems.splice(source.index, 1);

      const stageChanged = source.droppableId !== destination.droppableId;
      const nextStageId =
        destination.droppableId === UNASSIGNED_COLUMN_ID
          ? null
          : destination.droppableId;

      const patchedLead: Lead = stageChanged
        ? {
            ...draggedLead,
            pipeline_stage_id: nextStageId,
          }
        : draggedLead;

      destinationItems.splice(destination.index, 0, patchedLead);

      const nextGrouped = {
        ...groupedLeads,
        [source.droppableId]: sourceItems,
        [destination.droppableId]: destinationItems,
      };

      const previousLeads = boardLeads;
      const nextLeads = orderedColumns.flatMap(
        (column) => nextGrouped[column.id] ?? []
      );

      // Optimistically move the card immediately to prevent UI snapback.
      setBoardLeads(nextLeads);

      if (!stageChanged) {
        return;
      }

      try {
        await updateLeadMutation.mutateAsync({
          leadId: draggedLead.id,
          payload: {
            pipeline_stage_id: nextStageId,
          },
        });
      } catch (error) {
        setBoardLeads(previousLeads);
        toast.error(getErrorMessage(error) || t('board.dragError'));
      }
    },
    [boardLeads, groupedLeads, orderedColumns, t, updateLeadMutation]
  );

  return (
    <>
      <section className="bg-card flex min-h-0 flex-1 rounded-2xl border border-white/5 p-3 shadow-2xl shadow-black/20">
        <div className="flex min-h-0 flex-1 overflow-x-auto">
          {!isMounted ? null : (
            <DragDropContext onDragEnd={(result) => void handleDragEnd(result)}>
              <div className="flex min-h-0 flex-1 gap-3 pb-1">
                {orderedColumns.map((column) => {
                  const items = groupedLeads[column.id] ?? [];

                  return (
                    <Droppable
                      droppableId={String(column.id)}
                      key={String(column.id)}
                    >
                      {(provided, snapshot) => (
                        <article
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`flex h-full min-h-136 w-72 shrink-0 flex-col rounded-xl border border-zinc-200 bg-zinc-100/80 p-2 ${
                            snapshot.isDraggingOver
                              ? 'ring-2 ring-zinc-300'
                              : ''
                          }`}
                        >
                          <header className="mb-2 flex items-center justify-between px-1">
                            <h3 className="text-sm font-semibold text-zinc-700">
                              {column.name}
                            </h3>
                            <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-xs font-semibold text-zinc-700">
                              {items.length}
                            </span>
                          </header>

                          <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto rounded-md p-1">
                            {items.length === 0 ? (
                              <p className="px-2 py-4 text-xs text-zinc-500">
                                {t('board.noLeadsInColumn')}
                              </p>
                            ) : null}

                            {items.map((lead, index) => {
                              const leadName =
                                `${lead.first_name} ${lead.last_name}`.trim() ||
                                t('unknownLeadName');
                              const estimatedValue = formatEstimatedValue(
                                lead.estimated_value,
                                lead.currency,
                                t('notSet')
                              );

                              const assignedLabel = lead.assigned_agent_id
                                ? (agentLabelMap.get(lead.assigned_agent_id) ??
                                  t('board.unassignedAgent'))
                                : t('board.unassignedAgent');
                              const assignedDisplayName =
                                getAgentDisplayName(assignedLabel);

                              return (
                                <Draggable
                                  draggableId={String(lead.id)}
                                  index={index}
                                  key={String(lead.id)}
                                  disableInteractiveElementBlocking
                                >
                                  {(dragProvided, dragSnapshot) => (
                                    <div
                                      ref={dragProvided.innerRef}
                                      {...dragProvided.draggableProps}
                                      {...dragProvided.dragHandleProps}
                                    >
                                      <button
                                        type="button"
                                        onClick={() => setSelectedLead(lead)}
                                        className={`w-full rounded-lg border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:shadow-md ${
                                          dragSnapshot.isDragging
                                            ? 'shadow-lg ring-1 ring-slate-300'
                                            : ''
                                        }`}
                                      >
                                        <div className="flex items-start justify-between gap-2">
                                          <p className="text-sm font-semibold text-slate-900">
                                            {leadName}
                                          </p>
                                          <Badge
                                            className={getPriorityBadgeClass(
                                              lead.priority
                                            )}
                                          >
                                            {t(
                                              `priority.${lead.priority}` as never
                                            )}
                                          </Badge>
                                        </div>

                                        <p className="mt-2 text-xs text-slate-600">
                                          {t('board.expectedValue')}:{' '}
                                          {estimatedValue}
                                        </p>

                                        <div className="mt-3 flex items-center gap-2">
                                          <Avatar className="h-7 w-7">
                                            <AvatarFallback className="bg-slate-100 text-[10px] text-slate-700">
                                              {toInitials(assignedDisplayName)}
                                            </AvatarFallback>
                                          </Avatar>
                                          <p className="truncate text-xs text-slate-700">
                                            {assignedDisplayName}
                                          </p>
                                        </div>
                                      </button>
                                    </div>
                                  )}
                                </Draggable>
                              );
                            })}

                            {provided.placeholder}
                          </div>
                        </article>
                      )}
                    </Droppable>
                  );
                })}
              </div>
            </DragDropContext>
          )}
        </div>
      </section>

      <LeadDetailSheet
        lead={selectedLead}
        open={Boolean(selectedLead)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setSelectedLead(null);
          }
        }}
      />
    </>
  );
}
