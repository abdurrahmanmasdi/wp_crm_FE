'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  LayoutGrid,
  List as ListIcon,
  Building2,
  CalendarDays,
  Car,
  Wand2,
  MoreVertical,
  Plus,
  ImageIcon,
  X,
  PlusCircle,
  Search,
  Tag,
  Package,
  Clock,
  Loader2,
  Trash2,
  Edit,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

import { useAuthStore } from '@/store/useAuthStore';
import { usePermissions } from '@/hooks/usePermissions';
import { useDebounce } from '@/hooks/useDebounce';
import { productService } from '@/lib/product.service';
import { queryKeys } from '@/lib/query-keys';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from '@/components/ui/sheet';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

// --- Types ---
export type ProductType =
  | 'REAL_ESTATE_ASSET'
  | 'SCHEDULED_EVENT'
  | 'RESOURCE_RENTAL'
  | 'DYNAMIC_SERVICE';

export interface ProductInstance {
  id: string;
  start_date: string;
  end_date: string;
  max_capacity: number;
  booked_quantity: number;
  is_available: boolean;
}

export interface Product {
  id: string;
  type: ProductType;
  title: string;
  description?: string;
  base_price: number;
  currency: string;
  available_addons?: { name: string; price: number }[];
  specifications: Record<string, any> | null;
  media: { file_url: string; is_primary: boolean }[];
  _count?: { instances: number; line_items: number };
  instances?: ProductInstance[];
  created_at?: string;
}

export type FilterField = 'type' | 'title' | 'base_price' | 'currency';
export type FilterOperator = 'equals' | 'contains' | 'greater_than' | 'less_than';

export interface FilterNode {
  id: string;
  field: FilterField;
  operator: FilterOperator;
  value: string;
}

// --- Helpers ---
const getTypeConfig = (type: ProductType) => {
  switch (type) {
    case 'REAL_ESTATE_ASSET':
      return { icon: Building2, label: 'Real Estate', badgeColor: 'bg-yellow-500/90', textColor: 'text-yellow-500', bg: 'bg-yellow-500/10' };
    case 'SCHEDULED_EVENT':
      return { icon: CalendarDays, label: 'Event', badgeColor: 'bg-blue-500/90', textColor: 'text-blue-500', bg: 'bg-blue-500/10' };
    case 'RESOURCE_RENTAL':
      return { icon: Car, label: 'Rental', badgeColor: 'bg-amber-500/90', textColor: 'text-amber-500', bg: 'bg-amber-500/10' };
    case 'DYNAMIC_SERVICE':
      return { icon: Wand2, label: 'Service', badgeColor: 'bg-purple-500/90', textColor: 'text-purple-500', bg: 'bg-purple-500/10' };
    default:
      return { icon: Package, label: 'Product', badgeColor: 'bg-zinc-500/90', textColor: 'text-zinc-500', bg: 'bg-zinc-500/10' };
  }
};

const formatPrice = (price: number, currency: string) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price);
};

const formatDate = (isoString: string) => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(isoString));
};

// --- Sub Components ---

function ProductsFilterBar({
  filters,
  setFilters,
}: {
  filters: FilterNode[];
  setFilters: React.Dispatch<React.SetStateAction<FilterNode[]>>;
}) {
  const addFilter = () => {
    setFilters([
      ...filters,
      { id: Math.random().toString(), field: 'title', operator: 'contains', value: '' },
    ]);
  };

  const removeFilter = (id: string) => {
    setFilters(filters.filter((f) => f.id !== id));
  };

  const updateFilter = (id: string, key: keyof FilterNode, val: string) => {
    setFilters(filters.map((f) => (f.id === id ? { ...f, [key]: val } : f)));
  };

  return (
    <div className="flex flex-col gap-3 w-full bg-zinc-900/40 p-4 rounded-xl border border-white/5 backdrop-blur-md mb-6">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm font-semibold text-zinc-300">Advanced Filters</span>
        <button
          onClick={addFilter}
          className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors ml-auto bg-primary/10 px-2 py-1 rounded-md"
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
              {/* Field */}
              <select
                value={filter.field}
                onChange={(e) => updateFilter(filter.id, 'field', e.target.value as FilterField)}
                className="bg-zinc-950 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-zinc-300 focus:outline-none focus:ring-1 focus:ring-primary/50 flex-1 max-w-[150px]"
              >
                <option value="title">Title</option>
                <option value="type">Product Type</option>
                <option value="base_price">Base Price</option>
                <option value="currency">Currency</option>
              </select>

              {/* Operator */}
              <select
                value={filter.operator}
                onChange={(e) => updateFilter(filter.id, 'operator', e.target.value as FilterOperator)}
                className="bg-zinc-950 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-zinc-300 focus:outline-none focus:ring-1 focus:ring-primary/50 flex-1 max-w-[140px]"
              >
                <option value="equals">Equals (IS)</option>
                <option value="contains">Contains</option>
                <option value="greater_than">Greater Than (&gt;)</option>
                <option value="less_than">Less Than (&lt;)</option>
              </select>

              {/* Value Input */}
              {filter.field === 'type' ? (
                <select
                  value={filter.value}
                  onChange={(e) => updateFilter(filter.id, 'value', e.target.value)}
                  className="bg-zinc-950 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-zinc-100 flex-1 focus:outline-none focus:ring-1 focus:ring-primary/50"
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
                  onChange={(e) => updateFilter(filter.id, 'value', e.target.value)}
                  placeholder="Enter value..."
                  className="bg-zinc-950 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-zinc-100 placeholder:text-zinc-600 flex-1 focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
              )}

              <button
                onClick={() => removeFilter(filter.id)}
                className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-zinc-800 rounded-md transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
        {filters.length === 0 && (
          <div className="text-xs text-zinc-500 py-2 border border-dashed border-white/5 bg-zinc-950/30 rounded-lg flex items-center justify-center">
            No active filters. Displaying all products.
          </div>
        )}
      </div>
    </div>
  );
}

function ProductsToolbar({
  viewMode,
  setViewMode,
}: {
  viewMode: 'GRID' | 'LIST';
  setViewMode: (m: 'GRID' | 'LIST') => void;
}) {
  return (
    <div className="flex items-center justify-end mb-4">
      <div className="flex items-center p-1 bg-zinc-900 border border-white/10 rounded-lg">
        <button
          onClick={() => setViewMode('GRID')}
          className={`p-1.5 rounded-md transition-colors ${
            viewMode === 'GRID' ? 'bg-zinc-800 text-zinc-100 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <LayoutGrid className="h-4 w-4" />
        </button>
        <button
          onClick={() => setViewMode('LIST')}
          className={`p-1.5 rounded-md transition-colors ${
            viewMode === 'LIST' ? 'bg-zinc-800 text-zinc-100 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <ListIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function ProductSpecs({ specs }: { specs: Record<string, any> | null }) {
  if (!specs) return null;
  const keys = Object.keys(specs).slice(0, 3);
  if (keys.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1 mt-2 mb-3">
      {keys.map((key) => {
        const val = specs[key];
        const displayKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        return (
          <span
            key={key}
            className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-zinc-800 text-zinc-400 border border-white/5"
          >
            {val} {displayKey}
          </span>
        );
      })}
    </div>
  );
}

function ActionMenu({ product }: { product: Product }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const activeOrganizationId = useAuthStore(s => s.activeOrganizationId);
  
  const canUpdate = hasPermission('products', 'update') || hasPermission('product', 'edit');
  const canDelete = hasPermission('products', 'delete') || hasPermission('product', 'delete');

  const [isOpen, setIsOpen] = useState(false);

  // Mutation for deleting a product
  const deleteMutation = useMutation({
    mutationFn: () => productService.delete(product.id),
    onSuccess: () => {
      toast.success('Product deleted successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all(activeOrganizationId) });
    },
    onError: (err: any) => {
      toast.error('Failed to delete product', {
        description: err?.response?.data?.message || err.message,
      });
    },
    onSettled: () => {
      setIsOpen(false);
    }
  });

  if (!canUpdate && !canDelete) return null;

  return (
    <div className="relative">
      <button 
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="p-2 bg-black/60 backdrop-blur-md text-white rounded-md hover:bg-black/80 border border-white/10 shadow-sm"
      >
        {deleteMutation.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <MoreVertical className="h-4 w-4" />
        )}
      </button>
      
      {isOpen && (
        <div className="absolute right-0 top-10 w-36 bg-zinc-900 border border-white/10 rounded-lg shadow-xl overflow-hidden z-20">
          {canUpdate && (
            <button 
              onClick={(e) => { 
                e.stopPropagation(); 
                setIsOpen(false); 
                router.push(`/dashboard/products/edit/${product.id}`);
              }}
              className="w-full flex items-center gap-2 text-left px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
            >
              <Edit className="h-3.5 w-3.5" /> Edit
            </button>
          )}
          {canDelete && (
            <button 
              onClick={(e) => { 
                e.stopPropagation(); 
                // Using simple confirm for fast deletion safety
                if (window.confirm(`Are you sure you want to delete ${product.title}?`)) {
                   deleteMutation.mutate();
                } else {
                   setIsOpen(false);
                }
              }}
              disabled={deleteMutation.isPending}
              className="w-full flex items-center gap-2 text-left px-4 py-2 text-sm text-red-500 hover:bg-red-500/10 transition-colors border-t border-white/5 opacity-100 disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function ProductCard({ product, onClick }: { product: Product, onClick: () => void }) {
  const primaryMedia = product.media?.find((m) => m.is_primary) || product.media?.[0];
  const typeConfig = getTypeConfig(product.type);
  const TypeIcon = typeConfig.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4 }}
      onClick={onClick}
      className="group relative flex flex-col bg-zinc-900 border border-white/10 rounded-xl overflow-visible shadow-lg transition-all hover:shadow-2xl hover:border-white/20 cursor-pointer"
    >
      {/* Quick Actions */}
      <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        <ActionMenu product={product} />
      </div>

      {/* Image Header */}
      <div className="relative h-48 w-full bg-zinc-800 overflow-hidden rounded-t-xl">
        {primaryMedia ? (
          <img
            src={primaryMedia.file_url}
            alt={product.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-950 flex items-center justify-center">
            <ImageIcon className="h-8 w-8 text-zinc-700" />
          </div>
        )}
        
        {/* Type Badge */}
        <div className={`absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 ${typeConfig.badgeColor} backdrop-blur-md rounded-md shadow-sm`}>
          <TypeIcon className="h-3.5 w-3.5 text-white" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-white">
            {typeConfig.label}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-5 flex flex-col flex-1">
        <h3 className="text-zinc-100 font-semibold truncate text-base leading-snug">{product.title}</h3>
        
        <ProductSpecs specs={product.specifications} />
        
        <div className="mt-auto pt-4 flex items-end justify-between border-t border-white/5">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 mb-0.5">Base Price</span>
            <span className="text-lg font-bold text-zinc-100 leading-none">
              {formatPrice(product.base_price, product.currency)}
            </span>
          </div>
          
          <div className="flex gap-2">
            {product._count?.instances !== undefined && product.type === 'SCHEDULED_EVENT' && (
              <div className="flex flex-col items-center">
                <span className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider">Inst</span>
                <span className="text-xs font-semibold text-zinc-300">{product._count.instances}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ProductListRow({ product, onClick }: { product: Product, onClick: () => void }) {
  const primaryMedia = product.media?.find((m) => m.is_primary) || product.media?.[0];
  const typeConfig = getTypeConfig(product.type);
  const TypeIcon = typeConfig.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      onClick={onClick}
      className="group relative flex items-center bg-zinc-900 border border-white/10 rounded-xl p-3 pr-5 shadow-sm hover:shadow-md hover:border-white/20 transition-all gap-5 hover:-translate-y-0.5 cursor-pointer"
    >
       {/* Quick Actions */}
       <div className="absolute right-3 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        <ActionMenu product={product} />
      </div>

      {/* Thumbnail */}
      <div className="h-16 w-16 sm:h-20 sm:w-20 shrink-0 rounded-lg overflow-hidden bg-zinc-800 border border-white/5 relative">
        {primaryMedia ? (
          <img
            src={primaryMedia.file_url}
            alt={product.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-950 flex items-center justify-center">
            <ImageIcon className="h-5 w-5 text-zinc-700" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 pr-12">
        <div className="flex items-center gap-2 mb-1">
           <div className={`flex items-center justify-center h-5 w-5 rounded ${typeConfig.bg}`}>
               <TypeIcon className={`h-3 w-3 ${typeConfig.textColor}`} />
           </div>
          <h3 className="text-zinc-100 font-semibold truncate text-sm sm:text-base">{product.title}</h3>
        </div>
        <ProductSpecs specs={product.specifications} />
      </div>

      {/* Stats */}
      <div className="hidden md:flex items-center gap-6 text-sm pr-12">
         {(product.type === 'SCHEDULED_EVENT') && (
            <div className="flex flex-col text-right">
              <span className="text-[10px] uppercase font-bold text-zinc-500">Instances</span>
              <span className="text-zinc-300 font-medium">{product._count?.instances || 0}</span>
            </div>
         )}
      </div>

      {/* Price */}
      <div className="flex items-center gap-6 pr-8">
        <div className="flex flex-col text-right min-w-[90px]">
          <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 mb-0.5">Price</span>
          <span className="font-bold text-zinc-100">
            {formatPrice(product.base_price, product.currency)}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function ProductDetailsDrawer({ product, isOpen, onClose }: { product: Product | null, isOpen: boolean, onClose: () => void }) {
  const activeOrganizationId = useAuthStore(s => s.activeOrganizationId);

  // Fetch detailed product info to get nested instances array
  const { data: fullProduct, isLoading } = useQuery({
    queryKey: queryKeys.products.detail(activeOrganizationId, product?.id || ''),
    queryFn: () => productService.getById(product!.id),
    enabled: !!product?.id && isOpen, // Only fetch when drawer opens and we have an ID
  });

  if (!product) return null;

  // Use full product data if available, fallback to list item data while loading
  const displayProduct = (fullProduct as unknown as Product) || product;
  const typeConfig = getTypeConfig(displayProduct.type);
  const TypeIcon = typeConfig.icon;
  const primaryMedia = displayProduct.media?.find(m => m.is_primary) || displayProduct.media?.[0];

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto bg-zinc-950 border-white/10 p-0 text-white">
        {/* Banner Image */}
        <div className="relative h-64 w-full bg-zinc-900 border-b border-white/10">
          {primaryMedia ? (
            <img 
              src={primaryMedia.file_url} 
              alt={displayProduct.title} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
              <ImageIcon className="h-12 w-12 text-zinc-700" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 to-transparent" />
          
          <SheetClose className="absolute top-4 right-4 bg-black/50 hover:bg-black/80 text-white p-2 rounded-full backdrop-blur-md transition-colors border border-white/10 z-10 cursor-pointer text-sm font-semibold">
            <X className="h-4 w-4" />
          </SheetClose>

          <div className="absolute bottom-6 left-6 right-6">
            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 ${typeConfig.badgeColor} backdrop-blur-md rounded-lg shadow-sm border border-white/10 mb-3`}>
              <TypeIcon className="h-4 w-4 text-white" />
              <span className="text-xs font-bold uppercase tracking-wider text-white">
                {typeConfig.label}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-1 leading-tight">{displayProduct.title}</h2>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8 relative">
           
          {isLoading && (
            <div className="absolute top-0 left-0 w-full h-1 bg-zinc-900 overflow-hidden">
               <div className="h-full bg-primary/50 animate-pulse w-1/3 rounded"></div>
            </div>
          )}
          
          {/* Price & Primary Stats */}
          <div className="flex flex-wrap items-center gap-4 bg-zinc-900/50 border border-white/5 p-4 rounded-xl">
             <div className="flex flex-col flex-1 min-w-[120px]">
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1 flex items-center gap-2"><Tag className="h-3.5 w-3.5"/> Base Price</span>
                <span className="text-2xl font-bold text-white">
                  {formatPrice(displayProduct.base_price, displayProduct.currency)}
                </span>
             </div>
             {displayProduct.type === 'SCHEDULED_EVENT' && (
                <div className="flex flex-col flex-1 min-w-[120px]">
                  <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1 flex items-center gap-2"><CalendarDays className="h-3.5 w-3.5"/> Scheduled Instances</span>
                  <span className="text-xl font-bold text-zinc-200">{displayProduct._count?.instances || displayProduct.instances?.length || 0}</span>
                </div>
             )}
          </div>

          {/* Description */}
          {displayProduct.description && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-widest">Description</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                {displayProduct.description}
              </p>
            </div>
          )}

          {/* Render Instances Detail (If present in full payload) */}
          {displayProduct.instances && displayProduct.instances.length > 0 && (
             <div className="space-y-4">
               <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-widest flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Upcoming Instances
               </h3>
               <div className="space-y-2">
                 {displayProduct.instances.map((inst, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between bg-zinc-900 border border-white/5 p-3 rounded-lg gap-3">
                       <div className="flex flex-col">
                         <span className="text-sm font-medium text-zinc-200">
                           {formatDate(inst.start_date)}
                         </span>
                         <span className="text-xs text-zinc-500">
                           until {formatDate(inst.end_date)}
                         </span>
                       </div>
                       <div className="flex items-center gap-4 border-l border-white/5 pl-4 shrink-0">
                          <div className="flex flex-col text-right">
                            <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Capacity</span>
                            <span className="text-xs font-semibold text-zinc-300">{inst.booked_quantity} / {inst.max_capacity}</span>
                          </div>
                          <div className={`h-2 w-2 rounded-full ${inst.is_available ? 'bg-emerald-500' : 'bg-red-500'}`} title={inst.is_available ? 'Available' : 'Full'} />
                       </div>
                    </div>
                 ))}
               </div>
             </div>
          )}

          {/* Specifications Grid */}
          {displayProduct.specifications && Object.keys(displayProduct.specifications).length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-widest flex items-center gap-2">
                 <Package className="h-4 w-4" />
                 Specifications
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(displayProduct.specifications).map(([key, value]) => (
                  <div key={key} className="bg-zinc-900 border border-white/5 p-3 rounded-lg flex flex-col">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">
                      {key.replace(/_/g, ' ')}
                    </span>
                    <span className="text-sm font-medium text-zinc-200">
                      {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add-ons */}
          {displayProduct.available_addons && displayProduct.available_addons.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-widest">Available Add-ons</h3>
              <div className="space-y-2">
                {displayProduct.available_addons.map((addon, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-zinc-900 border border-white/5 p-3 rounded-lg">
                    <span className="text-sm font-medium text-zinc-200">{addon.name}</span>
                    <span className="text-sm font-bold text-zinc-400">
                       +{formatPrice(addon.price, displayProduct.currency)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </SheetContent>
    </Sheet>
  )
}

function LoadingSkeleton({ viewMode }: { viewMode: 'GRID' | 'LIST' }) {
  if (viewMode === 'GRID') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-zinc-900 border border-white/5 rounded-xl h-80 animate-pulse overflow-hidden flex flex-col">
            <div className="h-48 bg-zinc-800 w-full" />
            <div className="p-5 flex-1 flex flex-col gap-3">
              <div className="h-5 bg-zinc-800 rounded w-3/4" />
              <div className="flex gap-2">
                 <div className="h-4 bg-zinc-800 rounded w-16" />
                 <div className="h-4 bg-zinc-800 rounded w-16" />
              </div>
              <div className="mt-auto border-t border-white/5 pt-4">
                 <div className="h-6 bg-zinc-800 rounded w-1/3" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-zinc-900 border border-white/5 rounded-xl h-24 animate-pulse flex items-center p-3 gap-4">
           <div className="h-16 w-16 sm:h-20 sm:w-20 bg-zinc-800 rounded-lg shrink-0" />
           <div className="flex-1 space-y-2">
             <div className="h-5 bg-zinc-800 rounded w-1/3" />
             <div className="h-3 bg-zinc-800 rounded w-1/4" />
           </div>
           <div className="h-8 bg-zinc-800 rounded w-24 mr-4" />
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-4 text-center bg-zinc-900/30 border border-dashed border-white/10 rounded-2xl w-full">
      <div className="h-16 w-16 bg-zinc-800 rounded-full flex items-center justify-center mb-4 border border-white/5">
        <Search className="h-8 w-8 text-zinc-500" />
      </div>
      <h3 className="text-lg font-semibold text-zinc-100 mb-1">No products found</h3>
      <p className="text-sm text-zinc-400 max-w-sm mb-6">
        No products match your current filtering criteria. Adjust your filters or create a new product.
      </p>
    </div>
  );
}

// --- Main Page Component ---

export default function ProductsCatalogPage() {
  // Global States
  const { hasPermission } = usePermissions();
  const [viewMode, setViewMode] = useState<'GRID' | 'LIST'>('GRID');
  
  // Drawer state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Filtering Logic
  const [filters, setFilters] = useState<FilterNode[]>([]);
  const debouncedFilters = useDebounce(filters, 600);

  // Pagination Logic
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Reset page to 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedFilters]);

  const filtersQueryParam = useMemo(() => {
    return encodeURIComponent(JSON.stringify(debouncedFilters));
  }, [debouncedFilters]);

  // React Query fetch
  const { data: responseData, isLoading } = useQuery({
    queryKey: ['products', filtersQueryParam, currentPage],
    queryFn: async () => {
      // Connect to the actual product service holding the Paginated response logic
      const res = await productService.getAll({
         page: currentPage,
         limit: itemsPerPage,
         filters: filtersQueryParam
      });
      return res; // Type follows PaginatedProducts: { data: [], meta: {} }
    },
  });

  // Since we don't know the exact format previously, handle both nested data and direct array
  const products: Product[] = Array.isArray(responseData) ? responseData as unknown as Product[] : (responseData?.data as unknown as Product[] || []);
  const meta = responseData?.meta || { page: 1, limit: itemsPerPage, total: 0, totalPages: 1 };

  const canCreate = hasPermission('products', 'create');

  return (
    <div className="px-6 py-8 md:px-10 lg:px-12 max-w-[1400px] mx-auto min-h-screen pb-24">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Product Catalog</h1>
          <p className="text-zinc-400 text-sm">
            Manage your inventory, schedule events, and configure dynamic services.
          </p>
        </div>
        
        {canCreate && (
          <Link
            href="/dashboard/products/create"
            className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-semibold hover:brightness-110 transition-all shadow-[0_4px_14px_0_hsl(var(--primary)/20%)] active:scale-95 shrink-0"
          >
            <Plus className="h-4 w-4" />
            New Product
          </Link>
        )}
      </div>

      {/* Advanced Filters */}
      <ProductsFilterBar filters={filters} setFilters={setFilters} />

      {/* Toolbar / Layout Toggle */}
      <ProductsToolbar viewMode={viewMode} setViewMode={setViewMode} />

      {/* Product Details Drawer */}
      <ProductDetailsDrawer 
        product={selectedProduct} 
        isOpen={!!selectedProduct} 
        onClose={() => setSelectedProduct(null)} 
      />

      {/* Render Products Layer */}
      {isLoading ? (
        <LoadingSkeleton viewMode={viewMode} />
      ) : products.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-8">
          <AnimatePresence mode="popLayout">
            {viewMode === 'GRID' ? (
              <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map(product => (
                  <ProductCard 
                    key={product.id} 
                    product={product} 
                    onClick={() => setSelectedProduct(product)} 
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {products.map(product => (
                  <ProductListRow 
                    key={product.id} 
                    product={product} 
                    onClick={() => setSelectedProduct(product)} 
                  />
                ))}
              </div>
            )}
          </AnimatePresence>

          {/* Pagination Controls */}
          {meta.totalPages > 1 && (
            <Pagination className="mt-8 opacity-90 hover:opacity-100 transition-opacity">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                     onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                     className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
                
                {Array.from({ length: meta.totalPages }).map((_, i) => (
                  <PaginationItem key={i}>
                    <PaginationLink 
                      isActive={currentPage === i + 1}
                      onClick={() => setCurrentPage(i + 1)}
                      className="cursor-pointer"
                    >
                      {i + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}

                <PaginationItem>
                  <PaginationNext 
                     onClick={() => setCurrentPage(p => Math.min(meta.totalPages, p + 1))}
                     className={currentPage === meta.totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </div>
      )}
    </div>
  );
}
