import type { ColumnDef } from '@tanstack/react-table';

import type { LeadWithRelations } from '@/types/leads';

export const leadsColumns: Array<ColumnDef<LeadWithRelations>> = [
  {
    id: 'first_name',
    accessorFn: (row) => `${row.first_name} ${row.last_name}`,
  },
  {
    id: 'status',
    accessorKey: 'status',
  },
  {
    id: 'priority',
    accessorKey: 'priority',
  },
  {
    id: 'estimated_value',
    accessorKey: 'estimated_value',
  },
  {
    id: 'created_at',
    accessorKey: 'created_at',
    cell: ({ row }) => {
      const date = row.getValue<Date>('created_at');
      if (!date) return '';
      return new Intl.DateTimeFormat(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).format(date);
    },
  },
];
