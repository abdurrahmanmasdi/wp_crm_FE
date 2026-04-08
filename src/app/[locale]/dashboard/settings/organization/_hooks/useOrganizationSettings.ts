'use client';

import { useCallback, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { orgService } from '@/lib/org.service';
import { useAuthStore } from '@/store/useAuthStore';

import { defaultValues } from '../_constants';
import {
  organizationFormSchema,
  type OrganizationFormInputValues,
  type OrganizationFormValues,
} from '../_schema';

// ---------------------------------------------------------------------------
// Hook – encapsulates all data-fetching, form state, and mutations
// ---------------------------------------------------------------------------

export function useOrganizationSettings() {
  const activeOrganizationId = useAuthStore((s) => s.activeOrganizationId);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);
  const queryClient = useQueryClient();

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const {
    data: currentOrg,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['organization', activeOrganizationId],
    queryFn: async () => {
      if (!activeOrganizationId) return null;
      const res = await orgService.getOrganization(activeOrganizationId);
      return res.data;
    },
    // Wait for Zustand rehydration so activeOrganizationId is the real value
    enabled: hasHydrated && Boolean(activeOrganizationId),
    retry: 1,
  });

  // ── Form ───────────────────────────────────────────────────────────────────
  const form = useForm<
    OrganizationFormInputValues,
    unknown,
    OrganizationFormValues
  >({
    resolver: zodResolver(organizationFormSchema),
    defaultValues,
  });

  // Map API response to hook form payload
  const getDbValues = useCallback(() => {
    if (!currentOrg) return defaultValues;
    return {
      name: currentOrg.name ?? '',
      slug: currentOrg.slug ?? '',
      tax_number: currentOrg.tax_number ?? '',
      tax_office: currentOrg.tax_office ?? '',
      industry_category:
        currentOrg.industry_category ?? 'Enterprise Software & SaaS',
      address: currentOrg.address ?? '',
      logo_url: currentOrg.logo_url ?? '',
      brand_colors: currentOrg.brand_colors
        ? Object.entries(currentOrg.brand_colors).map(([key, value]) => ({
            key,
            value: String(value),
          }))
        : defaultValues.brand_colors,
      default_currency: currentOrg.default_currency ?? 'USD',
      website_url: currentOrg.website_url ?? '',
      public_email: currentOrg.public_email ?? '',
      public_phone: currentOrg.public_phone ?? '',
      terms_and_conditions: currentOrg.terms_and_conditions ?? '',
      privacy_policy: currentOrg.privacy_policy ?? '',
    };
  }, [currentOrg]);

  // Populate the form once the API returns data
  useEffect(() => {
    if (currentOrg) form.reset(getDbValues());
  }, [currentOrg, form, getDbValues]);

  const onDiscard = () => {
    form.reset(getDbValues());
  };

  // ── Save mutation ──────────────────────────────────────────────────────────
  const mutation = useMutation({
    mutationFn: (data: OrganizationFormValues) => {
      if (!activeOrganizationId) throw new Error('No active organization');
      return orgService.updateOrganization(activeOrganizationId, data);
    },
    onSuccess: () => {
      toast.success('Organization settings updated successfully');
      queryClient.invalidateQueries({
        queryKey: ['organization', activeOrganizationId],
      });
      queryClient.invalidateQueries({ queryKey: ['memberships'] });
    },
    onError: () => {
      toast.error('Failed to update settings');
    },
  });

  const onSubmit = (data: OrganizationFormValues) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { slug, privacy_policy, terms_and_conditions, ...pureData } = data;

    const finalBrandColors = data.brand_colors?.reduce(
      (acc, curr) => {
        if (curr.key && curr.value) acc[curr.key] = curr.value;
        return acc;
      },
      {} as Record<string, string>
    );

    const payload = {
      ...pureData,
      brand_colors: Object.keys(finalBrandColors || {}).length
        ? finalBrandColors
        : null,
    };
    mutation.mutate(payload as OrganizationFormValues);
  };

  const onRetry = () =>
    queryClient.invalidateQueries({
      queryKey: ['organization', activeOrganizationId],
    });

  const isFormLoading = !hasHydrated || (!currentOrg && isLoading);

  return {
    form,
    isLoading: isFormLoading,
    isError,
    isSaving: mutation.isPending,
    onSubmit,
    onRetry,
    onDiscard,
  };
}
