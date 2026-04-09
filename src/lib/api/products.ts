import {
  productsControllerAddMediaV1,
  productsControllerCreateV1,
  productsControllerFindAllV1,
  productsControllerFindOneV1,
  productsControllerRemoveV1,
  productsControllerSetPrimaryMediaV1,
  productsControllerUpdateV1,
  productsControllerUploadMediaV1,
} from '@/api-generated/endpoints/products';
import type {
  CreateProductDto,
  ProductsControllerFindAllV1Params,
  UpdateProductDto,
} from '@/api-generated/model';
import type {
  CreateProductMediaDto,
  CreateProductPayload,
  FindProductsQueryDto,
  PaginatedProducts,
  Product,
  ProductInstance,
  ProductMedia,
  UpdateProductPayload,
} from '@/types/products-generated';

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object'
    ? (value as Record<string, unknown>)
    : {};
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function asNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return 0;
}

function asBoolean(value: unknown, fallback = false): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function normalizeProductMedia(raw: unknown): ProductMedia | null {
  const record = asRecord(raw);
  const fileUrl = asString(record.file_url);

  if (!fileUrl) {
    return null;
  }

  return {
    id: asString(record.id),
    product_id: asString(record.product_id),
    file_url: fileUrl,
    file_name: asString(record.file_name),
    is_primary: asBoolean(record.is_primary),
    created_at: asString(record.created_at),
  };
}

function normalizeProductInstance(raw: unknown): ProductInstance | null {
  const record = asRecord(raw);

  return {
    id: asString(record.id),
    product_id: asString(record.product_id),
    start_date: asString(record.start_date),
    end_date: asString(record.end_date),
    max_capacity: asNumber(record.max_capacity),
    booked_quantity: asNumber(record.booked_quantity),
    is_available: asBoolean(record.is_available),
    created_at: asString(record.created_at),
  };
}

function normalizeProduct(raw: unknown): Product | null {
  const record = asRecord(raw);
  const id = asString(record.id);

  if (!id) {
    return null;
  }

  const media = Array.isArray(record.media)
    ? record.media
        .map(normalizeProductMedia)
        .filter((item): item is ProductMedia => item !== null)
    : [];

  const instances = Array.isArray(record.instances)
    ? record.instances
        .map(normalizeProductInstance)
        .filter((item): item is ProductInstance => item !== null)
    : [];

  const addons = Array.isArray(record.available_addons)
    ? record.available_addons.map((addon) => {
        const addonRecord = asRecord(addon);
        return {
          name: asString(addonRecord.name),
          price: asNumber(addonRecord.price),
        };
      })
    : [];

  return {
    id,
    organization_id: asString(record.organization_id),
    type: asString(record.type),
    title: asString(record.title),
    description: asString(record.description) || undefined,
    base_price: String(record.base_price ?? '0'),
    currency: asString(record.currency) || 'USD',
    specifications: asRecord(record.specifications),
    available_addons: addons,
    media,
    instances,
    created_at: asString(record.created_at),
    updated_at: asString(record.updated_at),
  };
}

function normalizePaginatedProducts(raw: unknown): PaginatedProducts {
  if (Array.isArray(raw)) {
    return {
      data: raw.map(normalizeProduct).filter((item): item is Product => !!item),
      meta: {
        page: 1,
        limit: raw.length,
        total: raw.length,
        totalPages: 1,
      },
    };
  }

  const record = asRecord(raw);
  const data = Array.isArray(record.data)
    ? record.data
    : Array.isArray(record.items)
      ? record.items
      : [];
  const meta = asRecord(record.meta);

  return {
    data: data.map(normalizeProduct).filter((item): item is Product => !!item),
    meta: {
      page: asNumber(meta.page) || 1,
      limit: asNumber(meta.limit) || data.length || 1,
      total: asNumber(meta.total) || data.length,
      totalPages: asNumber(meta.totalPages) || 1,
    },
  };
}

function normalizeProductMediaList(raw: unknown): ProductMedia[] {
  if (!raw || typeof raw !== 'object') {
    return [];
  }

  const record = raw as Record<string, unknown>;
  const list = Array.isArray(record.data)
    ? record.data
    : Array.isArray(record.items)
      ? record.items
      : [];

  return list
    .map(normalizeProductMedia)
    .filter((item): item is ProductMedia => item !== null);
}

function toFindAllParams(
  params?: FindProductsQueryDto
): ProductsControllerFindAllV1Params | undefined {
  if (!params) {
    return undefined;
  }

  return {
    page: params.page,
    limit: params.limit,
    filters: params.filters,
    sorts: params.sorts,
    ...(params.type
      ? { type: params.type as ProductsControllerFindAllV1Params['type'] }
      : {}),
  };
}

export async function setProductPrimaryMedia(
  organizationId: string,
  productId: string,
  mediaId: string
): Promise<void> {
  await productsControllerSetPrimaryMediaV1(organizationId, productId, mediaId);
}

export const productService = {
  async getAll(
    organizationId: string,
    params?: FindProductsQueryDto
  ): Promise<PaginatedProducts> {
    const response = (await productsControllerFindAllV1(
      organizationId,
      toFindAllParams(params)
    )) as unknown;

    return normalizePaginatedProducts(response);
  },

  async getById(organizationId: string, id: string): Promise<Product> {
    const response = (await productsControllerFindOneV1(
      organizationId,
      id
    )) as unknown;
    const normalized = normalizeProduct(response);

    if (!normalized) {
      throw new Error('Unexpected product response');
    }

    return normalized;
  },

  async create(
    organizationId: string,
    dto: CreateProductPayload
  ): Promise<Product> {
    const response = (await productsControllerCreateV1(
      organizationId,
      dto as CreateProductDto
    )) as unknown;
    const normalized = normalizeProduct(response);

    if (!normalized) {
      throw new Error('Unexpected product response');
    }

    return normalized;
  },

  async update(
    organizationId: string,
    id: string,
    dto: UpdateProductPayload
  ): Promise<Product> {
    const response = (await productsControllerUpdateV1(
      organizationId,
      id,
      dto as UpdateProductDto
    )) as unknown;
    const normalized = normalizeProduct(response);

    if (!normalized) {
      throw new Error('Unexpected product response');
    }

    return normalized;
  },

  async delete(organizationId: string, id: string): Promise<void> {
    await productsControllerRemoveV1(organizationId, id);
  },

  async addMedia(
    organizationId: string,
    productId: string,
    dto: CreateProductMediaDto
  ): Promise<ProductMedia> {
    const response = (await productsControllerAddMediaV1(
      organizationId,
      productId,
      {
        data: dto,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )) as unknown;
    const normalized = normalizeProductMedia(response);

    if (!normalized) {
      throw new Error('Unexpected product media response');
    }

    return normalized;
  },

  async setPrimaryMedia(
    organizationId: string,
    productId: string,
    mediaId: string
  ): Promise<void> {
    await setProductPrimaryMedia(organizationId, productId, mediaId);
  },

  async uploadMedia(
    organizationId: string,
    productId: string,
    formData: FormData
  ): Promise<{ data: ProductMedia[] }> {
    const response = (await productsControllerUploadMediaV1(
      organizationId,
      productId,
      {
        data: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )) as unknown;

    return {
      data: normalizeProductMediaList(response),
    };
  },
};

export type {
  CreateProductMediaDto,
  CreateProductInstanceDto,
  CreateProductPayload as CreateProductDto,
  FindProductsQueryDto,
  PaginatedProducts,
  Product,
  ProductInstance,
  ProductMedia,
  UpdateProductPayload as UpdateProductDto,
} from '@/types/products-generated';
