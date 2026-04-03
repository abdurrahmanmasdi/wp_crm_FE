'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { PlusCircle, X } from 'lucide-react';

import type { FilterField, FilterNode, FilterOperator } from './product-types';

export function ProductsFilterBar({
  filters,
  setFilters,
}: {
  filters: FilterNode[];
  setFilters: React.Dispatch<React.SetStateAction<FilterNode[]>>;
}) {
  const addFilter = () => {
    setFilters([
      ...filters,
      {
        id: Math.random().toString(),
        field: 'title',
        operator: 'contains',
        value: '',
      },
    ]);
  };

  const removeFilter = (id: string) => {
    setFilters(filters.filter((f) => f.id !== id));
  };

  const updateFilter = (id: string, key: keyof FilterNode, val: string) => {
    setFilters(filters.map((f) => (f.id === id ? { ...f, [key]: val } : f)));
  };

  return (
    <div className="mb-6 flex w-full flex-col gap-3 rounded-xl border border-white/5 bg-zinc-900/40 p-4 backdrop-blur-md">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-sm font-semibold text-zinc-300">
          Advanced Filters
        </span>
        <button
          onClick={addFilter}
          className="bg-primary/10 text-primary hover:text-primary/80 ml-auto flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors"
        >
          <PlusCircle className="h-3.5 w-3.5" />
          Add Rule
        </button>
      </div>

      <div className="flex flex-col gap-2">
        <AnimatePresence>
          {filters.map((filter) => (
            <motion.div
              key={filter.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-2 overflow-hidden"
            >
              <select
                value={filter.field}
                onChange={(e) =>
                  updateFilter(
                    filter.id,
                    'field',
                    e.target.value as FilterField
                  )
                }
                className="focus:ring-primary/50 max-w-37.5 flex-1 rounded-lg border border-white/10 bg-zinc-950 px-3 py-1.5 text-sm text-zinc-300 focus:ring-1 focus:outline-none"
              >
                <option value="title">Title</option>
                <option value="type">Product Type</option>
                <option value="base_price">Base Price</option>
                <option value="currency">Currency</option>
              </select>

              <select
                value={filter.operator}
                onChange={(e) =>
                  updateFilter(
                    filter.id,
                    'operator',
                    e.target.value as FilterOperator
                  )
                }
                className="focus:ring-primary/50 max-w-35 flex-1 rounded-lg border border-white/10 bg-zinc-950 px-3 py-1.5 text-sm text-zinc-300 focus:ring-1 focus:outline-none"
              >
                <option value="equals">Equals (IS)</option>
                <option value="contains">Contains</option>
                <option value="greater_than">Greater Than (&gt;)</option>
                <option value="less_than">Less Than (&lt;)</option>
              </select>

              {filter.field === 'type' ? (
                <select
                  value={filter.value}
                  onChange={(e) =>
                    updateFilter(filter.id, 'value', e.target.value)
                  }
                  className="focus:ring-primary/50 flex-1 rounded-lg border border-white/10 bg-zinc-950 px-3 py-1.5 text-sm text-zinc-100 focus:ring-1 focus:outline-none"
                >
                  <option value="">Select Type...</option>
                  <option value="REAL_ESTATE_ASSET">Real Estate</option>
                  <option value="SCHEDULED_EVENT">Events</option>
                  <option value="RESOURCE_RENTAL">Rentals</option>
                  <option value="DYNAMIC_SERVICE">Services</option>
                </select>
              ) : (
                <input
                  type={filter.field === 'base_price' ? 'number' : 'text'}
                  value={filter.value}
                  onChange={(e) =>
                    updateFilter(filter.id, 'value', e.target.value)
                  }
                  placeholder="Enter value..."
                  className="focus:ring-primary/50 flex-1 rounded-lg border border-white/10 bg-zinc-950 px-3 py-1.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:ring-1 focus:outline-none"
                />
              )}

              <button
                onClick={() => removeFilter(filter.id)}
                className="rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-red-400"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        {filters.length === 0 && (
          <div className="flex items-center justify-center rounded-lg border border-dashed border-white/5 bg-zinc-950/30 py-2 text-xs text-zinc-500">
            No active filters. Displaying all products.
          </div>
        )}
      </div>
    </div>
  );
}
