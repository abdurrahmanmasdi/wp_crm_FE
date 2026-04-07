import { api } from '@/lib/api';
import type {
  CreateProductDto as ApiCreateProductDto,
  ProductInstanceDto as ApiProductInstanceDto,
  ProductMediaDto as ApiProductMediaDto,
  UpdateProductDto as ApiUpdateProductDto,
} from '@/api-generated/model';

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

export type FindProductsQueryDto = {
  page?: number;
  limit?: number;
  search?: string;
  type?: string;
  filters?: string; // JSON string of filter rules
  sorts?: string; // JSON string of sort rules in format: [{"field":"title","direction":"asc"}]
};

export type PaginatedProducts = {
  data: Product[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type CreateProductMediaDto = ApiProductMediaDto;
export type CreateProductInstanceDto = ApiProductInstanceDto;
export type CreateProductDto = ApiCreateProductDto;
export type UpdateProductDto = ApiUpdateProductDto;

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export const productService = {
  /** GET /api/v1/organizations/:organizationId/products */
  getAll(
    organizationId: string,
    params?: FindProductsQueryDto
  ): Promise<PaginatedProducts> {
    return api
      .get<PaginatedProducts>(`/organizations/${organizationId}/products`, {
        params,
      })
      .then((r) => r.data);
  },

  /** GET /api/v1/organizations/:organizationId/products/:id */
  getById(organizationId: string, id: string): Promise<Product> {
    return api
      .get<Product>(`/organizations/${organizationId}/products/${id}`)
      .then((r) => r.data);
  },

  /** POST /api/v1/organizations/:organizationId/products */
  create(organizationId: string, dto: CreateProductDto): Promise<Product> {
    return api
      .post<Product>(`/organizations/${organizationId}/products`, dto)
      .then((r) => r.data);
  },

  /** PATCH /api/v1/organizations/:organizationId/products/:id */
  update(
    organizationId: string,
    id: string,
    dto: UpdateProductDto
  ): Promise<Product> {
    return api
      .patch<Product>(`/organizations/${organizationId}/products/${id}`, dto)
      .then((r) => r.data);
  },

  /** DELETE /api/v1/organizations/:organizationId/products/:id */
  delete(organizationId: string, id: string): Promise<void> {
    return api
      .delete(`/organizations/${organizationId}/products/${id}`)
      .then(() => undefined);
  },

  // ── Media ──────────────────────────────────────────────────────────────

  /** POST /api/v1/organizations/:organizationId/products/:id/media */
  addMedia(
    organizationId: string,
    productId: string,
    dto: CreateProductMediaDto
  ): Promise<ProductMedia> {
    return api
      .post<ProductMedia>(
        `/organizations/${organizationId}/products/${productId}/media`,
        dto
      )
      .then((r) => r.data);
  },

  /**
   * PUT /api/v1/products/:productId/media/:mediaId/primary
   * Atomically flips is_primary on the given media item.
   */
  setPrimaryMedia(
    organizationId: string,
    productId: string,
    mediaId: string
  ): Promise<void> {
    return api
      .put(
        `/organizations/${organizationId}/products/${productId}/media/${mediaId}/primary`
      )
      .then(() => undefined);
  },

  /**
   * POST /api/v1/organizations/:organizationId/products/:productId/media/upload
   * Uploads files as FormData (multipart/form-data).
   * Expects FormData with 'files' entries appended for each file.
   */
  uploadMedia(
    organizationId: string,
    productId: string,
    formData: FormData
  ): Promise<{ data: ProductMedia[] }> {
    return api
      .post<{ data: ProductMedia[] }>(
        `/organizations/${organizationId}/products/${productId}/media/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      )
      .then((r) => r.data);
  },
};
