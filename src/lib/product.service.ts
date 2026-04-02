import { api } from '@/lib/api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ProductMedia = {
  id: string;
  product_id: string;
  file_url: string;
  file_name: string;
  is_primary: boolean;
  created_at: string;
};

export type ProductInstance = {
  id: string;
  product_id: string;
  start_date: string;
  end_date: string;
  max_capacity: number;
  booked_quantity: number;
  is_available: boolean;
  created_at: string;
};

export type Product = {
  id: string;
  organization_id: string;
  type: string;
  title: string;
  description?: string;
  base_price: string; // returned as Decimal string
  currency: string;
  specifications: Record<string, unknown>;
  available_addons: Array<{ name: string; price: number }>;
  media: ProductMedia[];
  instances: ProductInstance[];
  created_at: string;
  updated_at: string;
};

// ---------------------------------------------------------------------------
// Request DTOs
// ---------------------------------------------------------------------------

export type CreateProductMediaDto = {
  file_url: string;
  file_name: string;
};

export type CreateProductInstanceDto = {
  start_date: string;
  end_date: string;
  max_capacity: number;
};

export type CreateProductDto = {
  type: string;
  title: string;
  description?: string;
  base_price: number;
  currency: string;
  specifications: Record<string, unknown>;
  available_addons?: Array<{ name: string; price: number }>;
  /** First item is auto-set as is_primary by backend */
  media?: CreateProductMediaDto[];
  instances?: CreateProductInstanceDto[];
};

export type UpdateProductDto = Partial<
  Omit<CreateProductDto, 'media' | 'instances'>
>;

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export const productService = {
  /** GET /api/v1/products */
  getAll(): Promise<Product[]> {
    return api.get<Product[]>('/products').then((r) => r.data);
  },

  /** GET /api/v1/products/:id */
  getById(id: string): Promise<Product> {
    return api.get<Product>(`/products/${id}`).then((r) => r.data);
  },

  /** POST /api/v1/products */
  create(dto: CreateProductDto): Promise<Product> {
    return api.post<Product>('/products', dto).then((r) => r.data);
  },

  /** PATCH /api/v1/products/:id */
  update(id: string, dto: UpdateProductDto): Promise<Product> {
    return api.patch<Product>(`/products/${id}`, dto).then((r) => r.data);
  },

  /** DELETE /api/v1/products/:id */
  delete(id: string): Promise<void> {
    return api.delete(`/products/${id}`).then(() => undefined);
  },

  // ── Media ──────────────────────────────────────────────────────────────

  /** POST /api/v1/products/:id/media */
  addMedia(productId: string, dto: CreateProductMediaDto): Promise<ProductMedia> {
    return api
      .post<ProductMedia>(`/products/${productId}/media`, dto)
      .then((r) => r.data);
  },

  /**
   * PUT /api/v1/products/:productId/media/:mediaId/primary
   * Atomically flips is_primary on the given media item.
   */
  setPrimaryMedia(productId: string, mediaId: string): Promise<void> {
    return api
      .put(`/products/${productId}/media/${mediaId}/primary`)
      .then(() => undefined);
  },
};
