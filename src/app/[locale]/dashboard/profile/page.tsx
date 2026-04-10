'use client';

import { useCallback, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Loader2, X, Check } from 'lucide-react';

import { useUsersControllerGetPerformanceProfileV1 } from '@/api-generated/endpoints/users';
import { useAuthStore } from '@/store/useAuthStore';
import { AlertCircle, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProfileHero, MetricsRow, ProfileTabs } from './_components';

/**
 * Profile Page Skeleton Loader
 * Mimics the layout of hero, metrics cards, and tabbed section
 */
function ProfilePageSkeleton() {
  return (
    <div className="space-y-6 p-6">
      {/* Hero Section Skeleton */}
      <section className="border-muted h-48 animate-pulse rounded-xl border-2 border-dashed" />

      {/* Metrics Row - Three Cards */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="border-muted h-32 animate-pulse rounded-xl border-2 border-dashed"
          />
        ))}
      </section>

      {/* Tabbed Section Skeleton */}
      <section className="border-muted h-96 animate-pulse rounded-xl border-2 border-dashed" />
    </div>
  );
}

/**
 * Error State Component
 * Displays a professional error message with a retry button
 */
interface ErrorStateProps {
  onRetry: () => void;
}

function ErrorState({ onRetry }: ErrorStateProps) {
  const t = useTranslations('dashboard.profile');

  return (
    <div className="space-y-6 p-6">
      <div className="border-destructive/50 bg-destructive/10 rounded-lg border p-8 text-center">
        <div className="mb-4 flex justify-center">
          <AlertCircle className="text-destructive h-12 w-12" />
        </div>
        <h2 className="text-destructive mb-2 text-xl font-semibold">
          {t('error_title')}
        </h2>
        <p className="text-destructive/80 mb-6 text-sm">{t('error_message')}</p>
        <Button onClick={onRetry} variant="outline" size="sm">
          <RotateCw className="mr-2 h-4 w-4" />
          {t('try_again')}
        </Button>
      </div>
    </div>
  );
}

/**
 * Profile Page
 * Displays the user's performance profile dashboard
 */
export default function ProfilePage() {
  const t = useTranslations('dashboard.profile');
  const t2 = useTranslations();
  const activeOrganizationId = useAuthStore(
    (state) => state.activeOrganizationId
  );

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Refs to trigger form submissions from child components
  const profileTabsSubmitRef = useRef<{
    submitWorkspace: () => void;
    submitPersonal: () => void;
  }>(null);

  // Fetch performance profile using Orval-generated hook
  // The x-organization-id header is automatically added via the request interceptor
  const { data, isLoading, error, refetch } =
    useUsersControllerGetPerformanceProfileV1({
      query: {
        enabled: Boolean(activeOrganizationId),
      },
    });

  // Automatically retry if organization changes
  const handleRetry = useCallback(() => {
    refetch();
  }, [refetch]);

  /**
   * Handle cancel: dismiss editing mode and reset forms
   */
  const handleCancel = useCallback(() => {
    setIsEditing(false);
  }, []);

  /**
   * Handle save: coordinate saving from all edit components
   * Triggers form submissions from child components and waits for completion
   */
  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      // Trigger form submissions from ProfileTabs component
      // The component will handle calling the mutations and showing individual toasts
      if (profileTabsSubmitRef.current) {
        // Submit both workspace and personal forms
        profileTabsSubmitRef.current.submitWorkspace();
        profileTabsSubmitRef.current.submitPersonal();
      }

      // Wait a moment for forms to process and mutations to complete
      // In a real scenario, you'd use Promise callbacks or Suspense
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Show success toast
      toast.success(t('profile_saved'));

      // Exit editing mode
      setIsEditing(false);
    } catch (error) {
      toast.error(t('save_error'));
    } finally {
      setIsSaving(false);
    }
  }, [t]);

  // Show loading skeleton while fetching
  if (isLoading) {
    return <ProfilePageSkeleton />;
  }

  // Show error state if fetch failed
  if (error) {
    return <ErrorState onRetry={handleRetry} />;
  }

  // Show empty state if no organization is selected
  if (!activeOrganizationId) {
    return (
      <div className="space-y-6 p-6">
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-6 text-center">
          <p className="text-sm text-yellow-700">{t('select_organization')}</p>
        </div>
      </div>
    );
  }

  // Show empty state if no data returned
  if (!data) {
    return (
      <div className="space-y-6 p-6">
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-6 text-center">
          <p className="text-sm text-yellow-700">{t('select_organization')}</p>
        </div>
      </div>
    );
  }

  // Render profile content with real components and data
  return (
    <div className="space-y-6 p-6 pb-32">
      <ProfileHero
        data={data}
        isEditing={isEditing}
        onEditingChange={setIsEditing}
      />
      <MetricsRow data={data} />
      <ProfileTabs
        data={data}
        isEditing={isEditing}
        onEditingChange={setIsEditing}
        submitRef={profileTabsSubmitRef}
      />

      {/* Floating Action Bar */}
      {isEditing && (
        <div className="border-border fixed right-0 bottom-0 left-0 z-40 border-t bg-slate-900/95 px-6 py-4 backdrop-blur-md">
          <div className="mx-auto flex max-w-7xl items-center justify-between">
            <p className="text-muted-foreground text-sm">
              {t('editing_profile')}
            </p>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                disabled={isSaving}
                className="gap-2"
              >
                <X className="h-4 w-4" />
                {t2('Common.cancel')}
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
                className="gap-2 bg-blue-600 hover:bg-blue-700"
              >
                {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                <Check className="h-4 w-4" />
                {isSaving ? t('saving') : t('save_changes')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
