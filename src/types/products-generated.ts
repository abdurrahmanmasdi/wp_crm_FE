import type {
  CreateProductDto,
  ProductInstanceDto,
  ProductMediaDto,
  UpdateProductDto,
} from '@/api-generated/model';

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
  base_price: string;
  currency: string;
  specifications: Record<string, unknown>;
  available_addons: Array<{ name: string; price: number }>;
  media: ProductMedia[];
  instances: ProductInstance[];
  created_at: string;
  updated_at: string;
};

export type FindProductsQueryDto = {
  page?: number;
  limit?: number;
  search?: string;
  type?: string;
  filters?: string;
  sorts?: string;
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

export type CreateProductMediaDto = ProductMediaDto;
export type CreateProductInstanceDto = ProductInstanceDto;
export type CreateProductPayload = CreateProductDto;
export type UpdateProductPayload = UpdateProductDto;
