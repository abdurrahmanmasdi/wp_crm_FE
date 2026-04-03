import { cookies } from 'next/headers';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';

import { getQueryClient } from '@/lib/get-query-client';
import type { PaginatedProducts } from '@/lib/product.service';
import { queryKeys } from '@/lib/query-keys';
import { MembershipStatus } from '@/types/enums';
import ProductsCatalog from './_components/ProductsCatalog';

const INITIAL_PAGE = 1;
const INITIAL_LIMIT = 12;
const INITIAL_FILTERS_QUERY = encodeURIComponent(JSON.stringify([]));

type MembershipRecord = {
  status?: string;
  organization_id?: string;
  organizationId?: string;
  organization?: {
    id?: string;
  };
};

type MembershipResponse =
  | MembershipRecord[]
  | {
      memberships?: MembershipRecord[];
      organizations?: MembershipRecord[];
    };

function normalizeMemberships(data: MembershipResponse): MembershipRecord[] {
  if (Array.isArray(data)) {
    return data;
  }

  return data.memberships ?? data.organizations ?? [];
}

function extractOrganizationId(membership: MembershipRecord): string | null {
  return (
    membership.organization_id ??
    membership.organizationId ??
    membership.organization?.id ??
    null
  );
}

async function getServerOrganizationIdAndToken() {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;
  const locale = cookieStore.get('NEXT_LOCALE')?.value ?? 'en';

  if (!token) {
    return { organizationId: null, token: null, locale };
  }

  const apiBase =
    process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';
  const response = await fetch(`${apiBase}/users/me/organizations`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Accept-Language': locale,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    return { organizationId: null, token, locale };
  }

  const data = (await response.json()) as MembershipResponse;
  const memberships = normalizeMemberships(data);
  const activeMembership = memberships.find((membership) => {
    const status = membership.status ?? MembershipStatus.ACTIVE;
    return (
      status === MembershipStatus.ACTIVE &&
      Boolean(extractOrganizationId(membership))
    );
  });

  return {
    organizationId: activeMembership
      ? extractOrganizationId(activeMembership)
      : null,
    token,
    locale,
  };
}

async function prefetchProducts(
  organizationId: string,
  token: string,
  locale: string
): Promise<PaginatedProducts> {
  const apiBase =
    process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';
  const url = new URL(`${apiBase}/organizations/${organizationId}/products`);
  url.searchParams.set('page', String(INITIAL_PAGE));
  url.searchParams.set('limit', String(INITIAL_LIMIT));
  url.searchParams.set('filters', INITIAL_FILTERS_QUERY);

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
      'x-organization-id': organizationId,
      'Accept-Language': locale,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Failed to prefetch products');
  }

  return (await response.json()) as PaginatedProducts;
}

export default async function ProductsCatalogPage() {
  const queryClient = getQueryClient();
  const { organizationId, token, locale } =
    await getServerOrganizationIdAndToken();

  if (organizationId && token) {
    await queryClient.prefetchQuery({
      queryKey: [
        ...queryKeys.products.all(organizationId),
        INITIAL_FILTERS_QUERY,
        INITIAL_PAGE,
        INITIAL_LIMIT,
      ],
      queryFn: () => prefetchProducts(organizationId, token, locale),
    });
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProductsCatalog />
    </HydrationBoundary>
  );
}
