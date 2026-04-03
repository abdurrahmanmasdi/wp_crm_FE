import {
  Building2,
  CalendarDays,
  Car,
  Package,
  Wand2,
  type LucideIcon,
} from 'lucide-react';

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
  specifications: Record<string, unknown> | null;
  media: { file_url: string; is_primary: boolean }[];
  _count?: { instances: number; line_items: number };
  instances?: ProductInstance[];
  created_at?: string;
}

export type FilterField = 'type' | 'title' | 'base_price' | 'currency';
export type FilterOperator =
  | 'equals'
  | 'contains'
  | 'greater_than'
  | 'less_than';

export interface FilterNode {
  id: string;
  field: FilterField;
  operator: FilterOperator;
  value: string;
}

export type ProductTypeConfig = {
  icon: LucideIcon;
  label: string;
  badgeColor: string;
  textColor: string;
  bg: string;
};

export const getTypeConfig = (type: ProductType): ProductTypeConfig => {
  switch (type) {
    case 'REAL_ESTATE_ASSET':
      return {
        icon: Building2,
        label: 'Real Estate',
        badgeColor: 'bg-yellow-500/90',
        textColor: 'text-yellow-500',
        bg: 'bg-yellow-500/10',
      };
    case 'SCHEDULED_EVENT':
      return {
        icon: CalendarDays,
        label: 'Event',
        badgeColor: 'bg-blue-500/90',
        textColor: 'text-blue-500',
        bg: 'bg-blue-500/10',
      };
    case 'RESOURCE_RENTAL':
      return {
        icon: Car,
        label: 'Rental',
        badgeColor: 'bg-amber-500/90',
        textColor: 'text-amber-500',
        bg: 'bg-amber-500/10',
      };
    case 'DYNAMIC_SERVICE':
      return {
        icon: Wand2,
        label: 'Service',
        badgeColor: 'bg-purple-500/90',
        textColor: 'text-purple-500',
        bg: 'bg-purple-500/10',
      };
    default:
      return {
        icon: Package,
        label: 'Product',
        badgeColor: 'bg-zinc-500/90',
        textColor: 'text-zinc-500',
        bg: 'bg-zinc-500/10',
      };
  }
};

export const formatPrice = (price: number, currency: string) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price);
};

export const formatDate = (isoString: string) => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(isoString));
};
