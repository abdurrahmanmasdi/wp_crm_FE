'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import {
  productsControllerFindOneV1,
  useProductsControllerFindAllV1,
} from '@/api-generated/endpoints/products';
import { useAuthStore } from '@/store/useAuthStore';

export type ProductSearchAddon = {
  name: string;
  price: number;
};

export type ProductSearchInstance = {
  id: string;
  product_id: string;
  start_date: string;
  end_date: string;
  max_capacity: number;
  booked_quantity: number;
  is_available: boolean;
};

export type ProductSearchItem = {
  id: string;
  title: string;
  type: string;
  base_price: number;
  currency: string;
  available_addons: ProductSearchAddon[];
  instances: ProductSearchInstance[];
};

type UseProductSearchResult = {
  products: ProductSearchItem[];
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => Promise<unknown>;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object'
    ? (value as Record<string, unknown>)
    : {};
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function asBoolean(value: unknown, fallback = false): boolean {
  return typeof value === 'boolean' ? value : fallback;
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

function normalizeInstance(raw: unknown): ProductSearchInstance | null {
  const record = asRecord(raw);
  const id = asString(record.id);
  if (!id) {
    return null;
  }

  return {
    id,
    product_id: asString(record.product_id),
    start_date: asString(record.start_date),
    end_date: asString(record.end_date),
    max_capacity: asNumber(record.max_capacity),
    booked_quantity: asNumber(record.booked_quantity),
    is_available: asBoolean(record.is_available),
  };
}

function normalizeProduct(raw: unknown): ProductSearchItem | null {
  const record = asRecord(raw);
  const id = asString(record.id);
  if (!id) {
    return null;
  }

  const addonsRaw = Array.isArray(record.available_addons)
    ? record.available_addons
    : [];

  const instancesRaw = Array.isArray(record.instances) ? record.instances : [];

  return {
    id,
    title: asString(record.title),
    type: asString(record.type),
    base_price: asNumber(record.base_price),
    currency: asString(record.currency) || 'USD',
    available_addons: addonsRaw.map((addon) => {
      const addonRecord = asRecord(addon);
      return {
        name: asString(addonRecord.name),
        price: asNumber(addonRecord.price),
      };
    }),
    instances: instancesRaw
      .map(normalizeInstance)
      .filter((item): item is ProductSearchInstance => item !== null),
  };
}

function normalizeProductsResponse(raw: unknown): ProductSearchItem[] {
  if (Array.isArray(raw)) {
    return raw
      .map(normalizeProduct)
      .filter((item): item is ProductSearchItem => item !== null);
  }

  const record = asRecord(raw);
  const list = Array.isArray(record.data)
    ? record.data
    : Array.isArray(record.items)
      ? record.items
      : [];

  return list
    .map(normalizeProduct)
    .filter((item): item is ProductSearchItem => item !== null);
}

export function useProductSearch(search: string): UseProductSearchResult {
  const activeOrganizationId = useAuthStore(
    (state) => state.activeOrganizationId
  );

  const productsQuery = useProductsControllerFindAllV1(
    activeOrganizationId ?? '',
    {
      page: 1,
      limit: 100,
    },
    {
      query: {
        enabled: Boolean(activeOrganizationId),
        staleTime: 60_000,
      },
    }
  );

  const baseProducts = useMemo(
    () => normalizeProductsResponse(productsQuery.data),
    [productsQuery.data]
  );

  const filteredProducts = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) {
      return baseProducts;
    }

    return baseProducts.filter((product) =>
      product.title.toLowerCase().includes(needle)
    );
  }, [baseProducts, search]);

  const scheduledEventProductIds = useMemo(
    () =>
      filteredProducts
        .filter((product) => product.type === 'SCHEDULED_EVENT')
        .map((product) => product.id),
    [filteredProducts]
  );

  const schedulesQuery = useQuery({
    queryKey: [
      'products',
      'scheduled-event-instances',
      activeOrganizationId,
      scheduledEventProductIds,
    ],
    enabled:
      Boolean(activeOrganizationId) && scheduledEventProductIds.length > 0,
    staleTime: 60_000,
    queryFn: async () => {
      const orgId = activeOrganizationId;
      if (!orgId) {
        return new Map<string, ProductSearchInstance[]>();
      }

      const detailResponses = await Promise.all(
        scheduledEventProductIds.map(async (productId) => {
          const response = await productsControllerFindOneV1(orgId, productId);
          const normalized = normalizeProduct(response);
          return {
            productId,
            instances: normalized?.instances ?? [],
          };
        })
      );

      const map = new Map<string, ProductSearchInstance[]>();
      for (const item of detailResponses) {
        map.set(item.productId, item.instances);
      }

      return map;
    },
  });

  const products = useMemo(() => {
    const schedulesMap = schedulesQuery.data;

    return filteredProducts.map((product) => {
      if (product.type !== 'SCHEDULED_EVENT') {
        return product;
      }

      const fetchedInstances = schedulesMap?.get(product.id);
      if (!fetchedInstances) {
        return product;
      }

      return {
        ...product,
        instances: fetchedInstances,
      };
    });
  }, [filteredProducts, schedulesQuery.data]);

  return {
    products,
    isLoading: productsQuery.isLoading || schedulesQuery.isLoading,
    isFetching: productsQuery.isFetching || schedulesQuery.isFetching,
    isError: Boolean(productsQuery.error || schedulesQuery.error),
    error: productsQuery.error ?? schedulesQuery.error,
    refetch: async () => {
      const [productsResult, schedulesResult] = await Promise.all([
        productsQuery.refetch(),
        schedulesQuery.refetch(),
      ]);

      return { productsResult, schedulesResult };
    },
  };
}
