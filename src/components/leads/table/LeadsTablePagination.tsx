'use client';

import { useMemo } from 'react';
import type { Table } from '@tanstack/react-table';
import { useTranslations } from 'next-intl';

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { LeadsMeta, LeadWithRelations } from '@/types/leads';

const ROWS_PER_PAGE_OPTIONS = [10, 20, 50, 100];

function getVisiblePageNumbers(
  currentPage: number,
  totalPages: number
): number[] {
  const maxVisiblePages = 5;

  if (totalPages <= maxVisiblePages) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const halfWindow = Math.floor(maxVisiblePages / 2);
  let start = Math.max(1, currentPage - halfWindow);
  const end = Math.min(totalPages, start + maxVisiblePages - 1);

  if (end - start + 1 < maxVisiblePages) {
    start = Math.max(1, end - maxVisiblePages + 1);
  }

  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

type LeadsTablePaginationProps = {
  table: Table<LeadWithRelations>;
  pagination: LeadsMeta;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
};

export function LeadsTablePagination({
  table: _table,
  pagination,
  onPageChange,
  onLimitChange,
}: LeadsTablePaginationProps) {
  const t = useTranslations('Leads');

  const currentLimit = pagination.limit > 0 ? pagination.limit : 20;
  const totalRows = Math.max(0, pagination.total);
  const totalPagesFromMeta =
    pagination.totalPages > 0
      ? pagination.totalPages
      : totalRows > 0
        ? Math.ceil(totalRows / currentLimit)
        : 1;
  const totalPages = Math.max(1, totalPagesFromMeta);
  const currentPage = Math.min(Math.max(1, pagination.page), totalPages);
  const pageNumbers = useMemo(
    () => getVisiblePageNumbers(currentPage, totalPages),
    [currentPage, totalPages]
  );

  const visibleFrom =
    totalRows === 0 ? 0 : (currentPage - 1) * currentLimit + 1;
  const visibleTo =
    totalRows === 0 ? 0 : Math.min(currentPage * currentLimit, totalRows);

  const handlePageNavigation = (nextPage: number) => {
    const clampedPage = Math.min(Math.max(nextPage, 1), totalPages);

    if (clampedPage !== currentPage) {
      onPageChange(clampedPage);
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-muted-foreground text-xs">
          {t('pagination.rowsPerPage')}
        </p>

        <Select
          value={String(currentLimit)}
          onValueChange={(value) => {
            const nextLimit = Number(value);
            if (Number.isFinite(nextLimit)) {
              onLimitChange(nextLimit);
            }
          }}
        >
          <SelectTrigger className="h-8 w-24">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ROWS_PER_PAGE_OPTIONS.map((option) => (
              <SelectItem key={option} value={String(option)}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <p className="text-muted-foreground text-xs">
          {t('pagination.range', {
            from: visibleFrom,
            to: visibleTo,
            total: totalRows,
          })}
        </p>
      </div>

      <Pagination className="mx-0 w-auto justify-end">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href="#"
              onClick={(event) => {
                event.preventDefault();
                handlePageNavigation(currentPage - 1);
              }}
              className={
                currentPage <= 1 ? 'pointer-events-none opacity-50' : ''
              }
            >
              {t('pagination.previous')}
            </PaginationPrevious>
          </PaginationItem>

          {pageNumbers.map((pageNumber) => (
            <PaginationItem key={pageNumber}>
              <PaginationLink
                href="#"
                isActive={pageNumber === currentPage}
                onClick={(event) => {
                  event.preventDefault();
                  handlePageNavigation(pageNumber);
                }}
              >
                {pageNumber}
              </PaginationLink>
            </PaginationItem>
          ))}

          <PaginationItem>
            <PaginationNext
              href="#"
              onClick={(event) => {
                event.preventDefault();
                handlePageNavigation(currentPage + 1);
              }}
              className={
                currentPage >= totalPages
                  ? 'pointer-events-none opacity-50'
                  : ''
              }
            >
              {t('pagination.next')}
            </PaginationNext>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
