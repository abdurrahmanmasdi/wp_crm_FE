import * as z from 'zod';
import type {
  CreateProductDto as ApiCreateProductDto,
  UpdateProductDto as ApiUpdateProductDto,
} from '@/api-generated/model';
import {
  requiredStringSchema,
  positiveNumberSchema,
} from '@/lib/validations/common';

// ---------------------------------------------------------------------------
// Sub-schemas
// ---------------------------------------------------------------------------

export const addonSchema = z.object({
  name: requiredStringSchema('Addon name required'),
  price: positiveNumberSchema('Addon price must be positive'),
});

export const extraSpecSchema = z.object({
  key: requiredStringSchema('Attribute name required'),
  value: requiredStringSchema('Value required'),
});

const baseProductSchema = z.object({
  title: requiredStringSchema('Title must be at least 3 characters'),
  description: z.string().optional(),
  base_price: positiveNumberSchema('Base price must be positive'),
  currency: z.string().default('USD'),
  available_addons: z.array(addonSchema).optional(),
  /** Freeform key-value pairs shown in the Extra Attributes builder */
  extra_specifications: z.array(extraSpecSchema).optional(),
});

// ---------------------------------------------------------------------------
// Discriminated union — core specifications differ entirely by type
// ---------------------------------------------------------------------------

export const productFormSchema = z.discriminatedUnion('type', [
  // ── Real Estate ──────────────────────────────────────────────────────────
  baseProductSchema.extend({
    type: z.literal('REAL_ESTATE_ASSET'),
    specifications: z.object({
      bedrooms: z.coerce.number().min(0),
      bathrooms: z.coerce.number().min(0),
      square_meters: z.coerce.number().min(1, 'At least 1 m²'),
      year_built: z.coerce.number().min(1800, 'Enter a valid year'),
    }),
  }),

  // ── Scheduled Event ──────────────────────────────────────────────────────
  // start_date, end_date, max_capacity go into `instance` (mapped to `instances[0]`
  // in the backend payload). They are NOT part of specifications.
  baseProductSchema.extend({
    type: z.literal('SCHEDULED_EVENT'),
    instance: z.object({
      start_date: z.string().min(1, 'Start date is required'),
      end_date: z.string().min(1, 'End date is required'),
      max_capacity: z.coerce.number().min(1, 'Capacity must be at least 1'),
    }),
    specifications: z.object({
      duration_hours: z.coerce.number().min(0.5, 'At least 0.5 hours'),
      meeting_point: z.string().min(1, 'Meeting point is required'),
      difficulty_level: z.enum(['EASY', 'MEDIUM', 'HARD']),
    }),
  }),

  // ── Resource Rental ───────────────────────────────────────────────────────
  baseProductSchema.extend({
    type: z.literal('RESOURCE_RENTAL'),
    specifications: z.object({
      transmission: z.enum(['AUTOMATIC', 'MANUAL']),
      fuel_type: z.string().min(1, 'Fuel type is required'),
      seats: z.coerce.number().min(1, 'At least 1 seat'),
      daily_limit_km: z.coerce.number().min(0).optional(),
    }),
  }),

  // ── Dynamic Service ───────────────────────────────────────────────────────
  baseProductSchema.extend({
    type: z.literal('DYNAMIC_SERVICE'),
    specifications: z.object({
      base_fee: z.coerce.number().min(0),
      price_per_km: z.coerce.number().min(0).optional(),
      hourly_rate: z.coerce.number().min(0).optional(),
    }),
  }),
]);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ProductFormValues = z.infer<typeof productFormSchema>;
export type AddonFormValues = z.infer<typeof addonSchema>;
export type ExtraSpecFormValues = z.infer<typeof extraSpecSchema>;
export type ProductType = ProductFormValues['type'];
export type CreateProductDto = ApiCreateProductDto;
export type UpdateProductDto = ApiUpdateProductDto;

export const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  REAL_ESTATE_ASSET: 'Real Estate Asset',
  SCHEDULED_EVENT: 'Scheduled Event',
  RESOURCE_RENTAL: 'Resource Rental',
  DYNAMIC_SERVICE: 'Dynamic Service',
};

/** Map currency code → display symbol */
export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  TRY: '₺',
};

/** Local media item tracked in the gallery — not part of the zod schema */
export type LocalMediaItem = {
  /** persisted media id from backend (present for uploaded files) */
  mediaId?: string;
  /** browser-level preview URL (createObjectURL) */
  previewUrl: string;
  /** local file object (present for newly selected files) */
  file?: File;
  /** user-designated cover */
  isPrimary: boolean;
};
