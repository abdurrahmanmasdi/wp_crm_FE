'use client';

import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { z } from 'zod';
import { Loader2, MessageCircle, ExternalLink } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SharedTextField } from '@/components/ui/form-controls/SharedTextField';
import { SharedSearchableSelectField } from '@/components/ui/form-controls/SharedSearchableSelectField';
import {
  useUsersControllerUpdateMembershipProfileV1,
  useUsersControllerUpdateGlobalProfileV1,
  getUsersControllerGetPerformanceProfileV1QueryKey,
} from '@/api-generated/endpoints/users';
import { getErrorMessage } from '@/lib/error-utils';
import { SUPPORTED_LANGUAGES } from './profile.constants';
import type { UsersControllerGetPerformanceProfileV1200 } from '@/api-generated/model';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const workspaceFormSchema = z.object({
  job_title: z.string(),
  specializations: z.array(z.string()),
});

const personalFormSchema = z.object({
  phone_number: z.string(),
  whatsapp_number: z.string(),
  spoken_languages: z.array(z.string()),
});

type WorkspaceFormData = {
  job_title: string;
  specializations: string[];
};

type PersonalFormData = {
  phone_number: string;
  whatsapp_number: string;
  spoken_languages: string[];
};

// ============================================================================
// OPTIONS
// ============================================================================

const SPECIALIZATION_OPTIONS = [
  { value: 'sales', label: 'Sales' },
  { value: 'support', label: 'Customer Support' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'operations', label: 'Operations' },
  { value: 'management', label: 'Management' },
  { value: 'analytics', label: 'Analytics' },
];

interface UserData {
  phone_number?: string;
  whatsapp_number?: string;
  spoken_languages?: string[];
}

interface MembershipData {
  job_title?: string;
  specializations?: string[];
}

interface ProfileTabsProps {
  data: UsersControllerGetPerformanceProfileV1200;
  isEditing?: boolean;
  onEditingChange?: (isEditing: boolean) => void;
  submitRef?: React.Ref<{
    submitWorkspace: () => void;
    submitPersonal: () => void;
  }>;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const ProfileTabs = forwardRef<
  { submitWorkspace: () => void; submitPersonal: () => void },
  ProfileTabsProps
>(({ data, isEditing = false, onEditingChange, submitRef }, ref) => {
  const t = useTranslations();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('workspace');

  const user = data?.user as UserData | undefined;
  const membership = data?.membership as MembershipData | undefined;

  // =========================================================================
  // WORKSPACE FORM
  // =========================================================================

  const workspaceForm = useForm<WorkspaceFormData>({
    resolver: zodResolver(workspaceFormSchema),
    defaultValues: {
      job_title: '',
      specializations: [],
    },
  });

  const { mutate: updateMembership, isPending: isWorkspaceSaving } =
    useUsersControllerUpdateMembershipProfileV1();

  const onWorkspaceSubmit = (data: WorkspaceFormData) => {
    updateMembership(
      {
        data: {
          job_title: data.job_title || undefined,
          specializations: data.specializations?.length
            ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (data.specializations as any)
            : undefined,
        },
      },
      {
        onSuccess: () => {
          toast.success(t('dashboard.profile.workspace_updated'));
          queryClient.invalidateQueries({
            queryKey: getUsersControllerGetPerformanceProfileV1QueryKey(),
          });
        },
        onError: (error) => {
          try {
            const errorMessage = getErrorMessage(error);
            toast.error(errorMessage || t('dashboard.profile.workspace_error'));
          } catch {
            toast.error(t('dashboard.profile.workspace_error'));
          }
        },
      }
    );
  };

  // =========================================================================
  // PERSONAL FORM
  // =========================================================================

  const personalForm = useForm<PersonalFormData>({
    resolver: zodResolver(personalFormSchema),
    defaultValues: {
      phone_number: '',
      whatsapp_number: '',
      spoken_languages: [],
    },
  });

  const { mutate: updateGlobalProfile, isPending: isPersonalSaving } =
    useUsersControllerUpdateGlobalProfileV1();

  const onPersonalSubmit = (data: PersonalFormData) => {
    updateGlobalProfile(
      {
        data: {
          phone_number: data.phone_number || undefined,
          whatsapp_number: data.whatsapp_number || undefined,
          spoken_languages: data.spoken_languages?.length
            ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (data.spoken_languages as any)
            : undefined,
        },
      },
      {
        onSuccess: () => {
          toast.success(t('dashboard.profile.personal_updated'));
          queryClient.invalidateQueries({
            queryKey: getUsersControllerGetPerformanceProfileV1QueryKey(),
          });
        },
        onError: (error) => {
          try {
            const errorMessage = getErrorMessage(error);
            toast.error(errorMessage || t('dashboard.profile.personal_error'));
          } catch {
            toast.error(t('dashboard.profile.personal_error'));
          }
        },
      }
    );
  };

  // =========================================================================
  // INITIALIZE FORMS WITH DATA
  // =========================================================================

  useEffect(() => {
    if (membership) {
      workspaceForm.reset({
        job_title: membership?.job_title ?? '',
        specializations: (membership?.specializations as string[]) ?? [],
      });
    }
  }, [membership, workspaceForm]);

  useEffect(() => {
    if (user) {
      personalForm.reset({
        phone_number: user?.phone_number ?? '',
        whatsapp_number: user?.whatsapp_number ?? '',
        spoken_languages: (user?.spoken_languages as string[]) ?? [],
      });
    }
  }, [user, personalForm]);

  // =========================================================================
  // EXPOSE FORM SUBMIT METHODS VIA REF
  // =========================================================================

  useImperativeHandle(
    ref,
    () => ({
      submitWorkspace: () => {
        workspaceForm.handleSubmit(onWorkspaceSubmit)();
      },
      submitPersonal: () => {
        personalForm.handleSubmit(onPersonalSubmit)();
      },
    }),
    [workspaceForm, personalForm, onWorkspaceSubmit, onPersonalSubmit]
  );

  // =========================================================================
  // RENDER
  // =========================================================================

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      {/* Tab List */}
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="workspace">
          {t('dashboard.profile.tab_workspace')}
        </TabsTrigger>
        <TabsTrigger value="personal">
          {t('dashboard.profile.tab_personal')}
        </TabsTrigger>
      </TabsList>

      {/* ===================================================================== */}
      {/* TAB 1: WORKSPACE SETTINGS */}
      {/* ===================================================================== */}

      <TabsContent value="workspace" className="pt-6">
        {!isEditing ? (
          // VIEW MODE
          <div className="space-y-6">
            {/* Data Points Grid */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Job Title Data Point */}
              <div className="border-border rounded-lg border bg-slate-900/50 p-4">
                <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                  {t('dashboard.profile.job_title_label')}
                </p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {membership?.job_title || 'Not set'}
                </p>
              </div>

              {/* Specializations Data Point */}
              <div className="border-border rounded-lg border bg-slate-900/50 p-4">
                <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                  {t('dashboard.profile.specializations_label')}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {membership?.specializations &&
                  membership.specializations.length > 0 ? (
                    membership.specializations.map((spec) => {
                      const specOption = SPECIALIZATION_OPTIONS.find(
                        (o) => o.value === spec
                      );
                      return (
                        <Badge
                          key={spec}
                          variant="secondary"
                          className="border-blue-500/30 bg-blue-500/20 text-blue-300 hover:bg-blue-500/30"
                        >
                          {specOption?.label || spec}
                        </Badge>
                      );
                    })
                  ) : (
                    <span className="text-muted-foreground text-sm italic">
                      {t('dashboard.profile.no_specializations')}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          // EDIT MODE
          <Form {...workspaceForm}>
            <form onSubmit={workspaceForm.handleSubmit(onWorkspaceSubmit)}>
              <div className="space-y-4">
                {/* Job Title Field */}
                <SharedTextField
                  control={workspaceForm.control}
                  name="job_title"
                  label={t('dashboard.profile.job_title_label')}
                  placeholder={t('dashboard.profile.job_title_placeholder')}
                  description={t('dashboard.profile.job_title_description')}
                />

                {/* Specializations Field */}
                <SharedSearchableSelectField
                  control={workspaceForm.control}
                  name="specializations"
                  label={t('dashboard.profile.specializations_label')}
                  placeholder={t(
                    'dashboard.profile.specializations_placeholder'
                  )}
                  searchPlaceholder={t(
                    'dashboard.profile.specializations_search'
                  )}
                  emptyLabel={t('dashboard.profile.no_specializations')}
                  description={t(
                    'dashboard.profile.specializations_description'
                  )}
                  options={SPECIALIZATION_OPTIONS}
                  multiple
                  disabled={isWorkspaceSaving}
                />
              </div>

              {/* Save Button */}
              <div className="mt-6 flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isWorkspaceSaving}
                  onClick={() => {
                    workspaceForm.reset();
                    onEditingChange?.(false);
                  }}
                >
                  {t('Common.cancel')}
                </Button>
                <Button
                  type="submit"
                  disabled={isWorkspaceSaving}
                  className="gap-2"
                >
                  {isWorkspaceSaving && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  {isWorkspaceSaving
                    ? t('dashboard.profile.saving')
                    : t('dashboard.profile.save_changes')}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </TabsContent>

      {/* ===================================================================== */}
      {/* TAB 2: PERSONAL INFORMATION */}
      {/* ===================================================================== */}

      <TabsContent value="personal" className="pt-6">
        {!isEditing ? (
          // VIEW MODE
          <div className="space-y-6">
            {/* Data Points Grid */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Phone Number Data Point */}
              <div className="border-border rounded-lg border bg-slate-900/50 p-4">
                <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                  {t('dashboard.profile.phone_label')}
                </p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {user?.phone_number || 'Not set'}
                </p>
              </div>

              {/* WhatsApp Number Data Point with Verify Button */}
              <div className="border-border rounded-lg border bg-slate-900/50 p-4">
                <p className="text-muted-foreground mb-2 text-xs font-semibold tracking-wider uppercase">
                  {t('dashboard.profile.whatsapp_label')}
                </p>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-lg font-semibold text-white">
                    {user?.whatsapp_number || 'Not set'}
                  </p>
                  {user?.whatsapp_number && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        // Open WhatsApp with the number
                        window.open(
                          `https://wa.me/${user.whatsapp_number?.replace(/[^0-9]/g, '')}`,
                          '_blank'
                        );
                      }}
                      className="gap-1 text-green-400 hover:bg-green-500/10 hover:text-green-300"
                      title="Test WhatsApp link"
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span className="text-xs">Verify</span>
                    </Button>
                  )}
                </div>
              </div>

              {/* Languages Data Point - Spans full width */}
              <div className="border-border rounded-lg border bg-slate-900/50 p-4 md:col-span-2">
                <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                  {t('dashboard.profile.languages_label')}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {user?.spoken_languages &&
                  user.spoken_languages.length > 0 ? (
                    user.spoken_languages.map((lang) => {
                      const langOption = SUPPORTED_LANGUAGES.find(
                        (o) => o.value === lang
                      );
                      return (
                        <Badge
                          key={lang}
                          variant="secondary"
                          className="border-purple-500/30 bg-purple-500/20 text-purple-300 hover:bg-purple-500/30"
                        >
                          {langOption?.label || lang}
                        </Badge>
                      );
                    })
                  ) : (
                    <span className="text-muted-foreground text-sm italic">
                      {t('dashboard.profile.no_languages')}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          // EDIT MODE
          <Form {...personalForm}>
            <form onSubmit={personalForm.handleSubmit(onPersonalSubmit)}>
              <div className="space-y-4">
                {/* Phone Number Field */}
                <SharedTextField
                  control={personalForm.control}
                  name="phone_number"
                  label={t('dashboard.profile.phone_label')}
                  placeholder={t('dashboard.profile.phone_placeholder')}
                  type="tel"
                  description={t('dashboard.profile.phone_description')}
                />

                {/* WhatsApp Number Field */}
                <FormField
                  control={personalForm.control}
                  name="whatsapp_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <MessageCircle className="h-4 w-4" />
                        {t('dashboard.profile.whatsapp_label')}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="tel"
                          placeholder={t(
                            'dashboard.profile.whatsapp_placeholder'
                          )}
                          disabled={isPersonalSaving}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        {t('dashboard.profile.whatsapp_description')}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Spoken Languages Field */}
                <SharedSearchableSelectField
                  control={personalForm.control}
                  name="spoken_languages"
                  label={t('dashboard.profile.languages_label')}
                  placeholder={t('dashboard.profile.languages_placeholder')}
                  searchPlaceholder={t('dashboard.profile.languages_search')}
                  emptyLabel={t('dashboard.profile.no_languages')}
                  description={t('dashboard.profile.languages_description')}
                  options={SUPPORTED_LANGUAGES}
                  multiple
                  disabled={isPersonalSaving}
                />
              </div>

              {/* Save Button */}
              <div className="mt-6 flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isPersonalSaving}
                  onClick={() => {
                    personalForm.reset();
                    onEditingChange?.(false);
                  }}
                >
                  {t('Common.cancel')}
                </Button>
                <Button
                  type="submit"
                  disabled={isPersonalSaving}
                  className="gap-2"
                >
                  {isPersonalSaving && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  {isPersonalSaving
                    ? t('dashboard.profile.saving')
                    : t('dashboard.profile.save_changes')}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </TabsContent>
    </Tabs>
  );
});

ProfileTabs.displayName = 'ProfileTabs';
