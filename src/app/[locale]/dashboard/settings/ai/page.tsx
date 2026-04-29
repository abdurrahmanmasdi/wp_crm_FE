'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Bot, Loader2, AlertCircle, Sparkles, Brain, MessageSquare, Zap } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

import {
  useAiPersonasControllerFindByOrganizationV1,
  useAiPersonasControllerCreateV1,
  useAiPersonasControllerUpdateV1,
  getAiPersonasControllerFindByOrganizationV1QueryKey,
} from '@/api-generated/endpoints/ai-personas';
import type {
  CreateAiPersonaDto,
  UpdateAiPersonaDto,
} from '@/api-generated/model';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useAuthStore } from '@/store/useAuthStore';
import { getErrorMessage } from '@/lib/error-utils';

// ---------------------------------------------------------------------------
// Validation schema
// ---------------------------------------------------------------------------
const aiPersonaSchema = z.object({
  name: z
    .string()
    .min(1, 'Persona name is required')
    .max(100, 'Name must be at most 100 characters'),
  system_prompt: z
    .string()
    .min(10, 'System prompt must be at least 10 characters')
    .max(5000, 'System prompt must be at most 5000 characters'),
  auto_attend_new_leads: z.boolean(),
  can_negotiate: z.boolean(),
});

type AiPersonaFormValues = z.infer<typeof aiPersonaSchema>;

// ---------------------------------------------------------------------------
// Type for the API response (persona shape returned by GET)
// ---------------------------------------------------------------------------
type AiPersonaResponse = {
  id?: string;
  name?: string;
  system_prompt?: string;
  auto_attend_new_leads?: boolean;
  can_negotiate?: boolean;
  organization_id?: string;
};

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------
export default function AiAssistantSettingsPage() {
  const activeOrganizationId = useAuthStore((s) => s.activeOrganizationId);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);
  const queryClient = useQueryClient();

  // ── Fetch existing persona ────────────────────────────────────────────────
  const {
    data: personaData,
    isLoading,
    isError,
  } = useAiPersonasControllerFindByOrganizationV1(activeOrganizationId ?? '', {
    query: {
      enabled: hasHydrated && Boolean(activeOrganizationId),
      retry: 1,
    },
  });

  const persona = personaData as AiPersonaResponse | null | undefined;

  // ── Form ─────────────────────────────────────────────────────────────────
  const form = useForm<AiPersonaFormValues>({
    resolver: zodResolver(aiPersonaSchema),
    defaultValues: {
      name: 'Assistant',
      system_prompt: '',
      auto_attend_new_leads: true,
      can_negotiate: false,
    },
  });

  // Populate the form once the API returns data
  useEffect(() => {
    if (persona) {
      form.reset({
        name: persona.name ?? 'Assistant',
        system_prompt: persona.system_prompt ?? '',
        auto_attend_new_leads: persona.auto_attend_new_leads ?? true,
        can_negotiate: persona.can_negotiate ?? false,
      });
    }
  }, [persona, form]);

  // ── Mutations ─────────────────────────────────────────────────────────────
  const { mutate: createPersona, isPending: isCreating } =
    useAiPersonasControllerCreateV1({
      mutation: {
        onSuccess: () => {
          toast.success('AI Assistant created successfully');
          void queryClient.invalidateQueries({
            queryKey: getAiPersonasControllerFindByOrganizationV1QueryKey(
              activeOrganizationId ?? ''
            ),
          });
        },
        onError: (err) => {
          toast.error(getErrorMessage(err));
        },
      },
    });

  const { mutate: updatePersona, isPending: isUpdating } =
    useAiPersonasControllerUpdateV1({
      mutation: {
        onSuccess: () => {
          toast.success('AI Assistant settings saved');
          void queryClient.invalidateQueries({
            queryKey: getAiPersonasControllerFindByOrganizationV1QueryKey(
              activeOrganizationId ?? ''
            ),
          });
        },
        onError: (err) => {
          toast.error(getErrorMessage(err));
        },
      },
    });

  const isSaving = isCreating || isUpdating;

  // ── Submit ────────────────────────────────────────────────────────────────
  const onSubmit = (values: AiPersonaFormValues) => {
    if (!activeOrganizationId) {
      toast.error('No active organization found');
      return;
    }

    if (persona?.id) {
      // Update existing
      const updatePayload: UpdateAiPersonaDto = {
        name: values.name,
        systemPrompt: values.system_prompt,
        autoAttendNewLeads: values.auto_attend_new_leads,
        canNegotiate: values.can_negotiate,
      };
      updatePersona({ id: persona.id, data: updatePayload });
    } else {
      // Create new
      const createPayload: CreateAiPersonaDto = {
        organizationId: activeOrganizationId,
        name: values.name,
        systemPrompt: values.system_prompt,
        autoAttendNewLeads: values.auto_attend_new_leads,
        canNegotiate: values.can_negotiate,
      };
      createPersona({ data: createPayload });
    }
  };

  // ── Loading state ─────────────────────────────────────────────────────────
  if (!hasHydrated || isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────
  if (isError) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
          <AlertCircle className="h-8 w-8 text-red-400" />
        </div>
        <div>
          <p className="text-lg font-semibold">Failed to load AI persona</p>
          <p className="text-muted-foreground mt-1 text-sm">
            We couldn&apos;t fetch your AI assistant configuration. Please check
            your connection and try again.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            queryClient.invalidateQueries({
              queryKey: getAiPersonasControllerFindByOrganizationV1QueryKey(
                activeOrganizationId ?? ''
              ),
            })
          }
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* ── Hero card ─────────────────────────────────────────────────── */}
        <Card className="border-primary/20 bg-primary/5 overflow-hidden">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="bg-primary/10 text-primary flex h-12 w-12 items-center justify-center rounded-2xl shadow-[0_0_24px_var(--glow-primary-md)]">
                <Bot className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-xl">AI Assistant Persona</CardTitle>
                <CardDescription>
                  Configure how your AI agent behaves when interacting with
                  leads.{' '}
                  {!persona?.id && (
                    <span className="text-amber-400">
                      No persona configured yet — fill out the form below to
                      create one.
                    </span>
                  )}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* ── Identity card ─────────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Sparkles className="text-primary h-5 w-5" />
              <div>
                <CardTitle>Identity</CardTitle>
                <CardDescription>
                  Set the name and personality of your AI assistant.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assistant Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Sofia, Max, Luna…"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    The name your AI will use when introducing itself to leads.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* ── System prompt card ────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Brain className="text-primary h-5 w-5" />
              <div>
                <CardTitle>System Prompt</CardTitle>
                <CardDescription>
                  The core instructions your AI follows in every conversation.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="system_prompt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prompt</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="You are Sofia, a warm and professional travel consultant for TourCRM. Your goal is to understand the client's travel wishes, answer questions, and guide them toward booking. Be concise, friendly, and use the client's native language when possible."
                      className="min-h-[180px] resize-y font-mono text-sm leading-relaxed"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Min 10 characters. Be specific about tone, role, and
                    boundaries.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* ── Behaviour card ────────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Zap className="text-primary h-5 w-5" />
              <div>
                <CardTitle>Behaviour</CardTitle>
                <CardDescription>
                  Control how autonomously the AI operates.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Auto-attend */}
            <FormField
              control={form.control}
              name="auto_attend_new_leads"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-xl border border-white/5 p-4 transition-colors hover:bg-white/[0.02]">
                  <div className="flex items-start gap-3">
                    <MessageSquare className="text-muted-foreground mt-0.5 h-5 w-5 shrink-0" />
                    <div>
                      <FormLabel className="cursor-pointer text-base font-medium">
                        Auto-attend New Leads
                      </FormLabel>
                      <FormDescription className="mt-0.5">
                        When enabled, the AI will automatically start a
                        conversation with every new lead that enters the system.
                      </FormDescription>
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Can negotiate */}
            <FormField
              control={form.control}
              name="can_negotiate"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-xl border border-white/5 p-4 transition-colors hover:bg-white/[0.02]">
                  <div className="flex items-start gap-3">
                    <Bot className="text-muted-foreground mt-0.5 h-5 w-5 shrink-0" />
                    <div>
                      <FormLabel className="cursor-pointer text-base font-medium">
                        Allow Negotiation
                      </FormLabel>
                      <FormDescription className="mt-0.5">
                        Permit the AI to offer discounts or adjust pricing
                        within predefined limits during a conversation.
                      </FormDescription>
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* ── Sticky save bar ───────────────────────────────────────────── */}
        <div className="border-border bg-background/80 sticky bottom-0 z-40 flex w-full items-center justify-end gap-4 border-t p-4 backdrop-blur-md">
          <Button
            type="button"
            variant="ghost"
            className="text-muted-foreground"
            disabled={!form.formState.isDirty || isSaving}
            onClick={() => {
              if (persona) {
                form.reset({
                  name: persona.name ?? 'Assistant',
                  system_prompt: persona.system_prompt ?? '',
                  auto_attend_new_leads:
                    persona.auto_attend_new_leads ?? true,
                  can_negotiate: persona.can_negotiate ?? false,
                });
              } else {
                form.reset();
              }
            }}
          >
            Discard Changes
          </Button>

          <Button
            type="submit"
            disabled={isSaving}
            className="text-on-primary px-10 py-3 text-sm font-bold tracking-widest uppercase"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : persona?.id ? (
              'Save Configuration'
            ) : (
              'Create AI Persona'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
