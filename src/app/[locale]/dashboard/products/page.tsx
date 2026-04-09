import { cookies } from 'next/headers';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';

import { productsControllerFindAllV1 } from '@/api-generated/endpoints/products';
import { usersControllerGetUserOrganizationsV1 } from '@/api-generated/endpoints/users';
import { getQueryClient } from '@/lib/get-query-client';
import type { PaginatedProducts } from '@/lib/api/products';
import { queryKeys } from '@/lib/query-keys';
import { MembershipStatus } from '@/types/enums';
import ProductsCatalog from './_components/ProductsCatalog';

const INITIAL_PAGE = 1;
const INITIAL_LIMIT = 12;
const INITIAL_FILTERS_QUERY = '';

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

  const membershipsResponse = await usersControllerGetUserOrganizationsV1({
    headers: {
      Authorization: `Bearer ${token}`,
      'Accept-Language': locale,
    },
  }).catch(() => null);

  if (!membershipsResponse) {
    return { organizationId: null, token, locale };
  }

  const data = membershipsResponse as MembershipResponse;
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
  const response = (await productsControllerFindAllV1(
    organizationId,
    {
      page: INITIAL_PAGE,
      limit: INITIAL_LIMIT,
      ...(INITIAL_FILTERS_QUERY ? { filters: INITIAL_FILTERS_QUERY } : {}),
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'x-organization-id': organizationId,
        'Accept-Language': locale,
      },
    }
  )) as unknown;

  return response as PaginatedProducts;
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
