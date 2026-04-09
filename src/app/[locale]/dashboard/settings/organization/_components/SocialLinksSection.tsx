'use client';

import { useState } from 'react';
import { Globe, Link2, Plus, Trash2, Save, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  createSocialLink,
  deleteSocialLink,
  getSocialLinks,
  updateSocialLink,
} from '@/lib/api/organization';
import { socialLinkSchema } from '../_schema';
import { SectionCard } from './SectionCard';
import type { SocialLink } from '@/types/organizations-generated';
import * as z from 'zod';

type SocialLinkFormValues = z.infer<typeof socialLinkSchema>;

function SocialLinkRow({
  link,
  onRemoveEmpty,
}: {
  link?: SocialLink;
  onRemoveEmpty?: () => void;
}) {
  const queryClient = useQueryClient();
  const isNew = !link;

  const form = useForm<SocialLinkFormValues>({
    resolver: zodResolver(socialLinkSchema),
    defaultValues: {
      platform: link?.platform ?? '',
      url: link?.url ?? '',
    },
  });

  const saveMutation = useMutation({
    mutationFn: (data: SocialLinkFormValues) => {
      if (isNew) {
        return createSocialLink(data);
      }
      return updateSocialLink(link.id, data);
    },
    onSuccess: () => {
      toast.success(isNew ? 'Social link added' : 'Social link updated');
      queryClient.invalidateQueries({ queryKey: ['social-links'] });
      if (isNew && onRemoveEmpty) onRemoveEmpty();
    },
    onError: () => toast.error('Failed to save social link'),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (isNew || !link) return;
      await deleteSocialLink(link.id);
    },
    onSuccess: () => {
      if (!isNew) toast.success('Social link removed');
      queryClient.invalidateQueries({ queryKey: ['social-links'] });
    },
    onError: () => toast.error('Failed to remove social link'),
  });

  const onSubmit = (data: SocialLinkFormValues) => {
    saveMutation.mutate(data);
  };

  const isSaving = saveMutation.isPending;
  const isDeleting = deleteMutation.isPending;

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="group flex items-center gap-4 rounded-lg"
      >
        <div className="bg-surface-container-lowest border-outline-variant/10 text-on-surface-variant group-hover:text-primary mt-6 flex h-10 w-10 shrink-0 items-center justify-center rounded border transition-colors">
          <Link2 className="h-4 w-4" />
        </div>

        <div className="grid flex-1 grid-cols-1 gap-3 md:grid-cols-2">
          <FormField
            control={form.control}
            name="platform"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Platform</FormLabel>
                <FormControl>
                  <Input placeholder="LinkedIn" {...field} />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>URL</FormLabel>
                <FormControl>
                  <Input
                    placeholder="https://linkedin.com/company/kinetic"
                    {...field}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <div className="mt-6 flex items-center gap-2">
          <Button
            type="submit"
            size="sm"
            disabled={isSaving || isDeleting || !form.formState.isDirty}
            className={`transition-opacity ${!form.formState.isDirty && !isNew ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'} bg-primary/20 text-primary hover:bg-primary/30`}
          >
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={`transition-opacity ${!isNew ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'} text-error/60 hover:text-error`}
            disabled={isSaving || isDeleting}
            onClick={() => {
              if (isNew && onRemoveEmpty) onRemoveEmpty();
              else deleteMutation.mutate();
            }}
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export function SocialLinksSection() {
  const [showNewRow, setShowNewRow] = useState(false);

  const { data: links = [], isLoading } = useQuery({
    queryKey: ['social-links'],
    queryFn: getSocialLinks,
  });

  return (
    <SectionCard title="Social Profiles" icon={Globe} className="lg:col-span-5">
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="text-primary h-6 w-6 animate-spin" />
          </div>
        ) : (
          <>
            {links.map((link: SocialLink) => (
              <SocialLinkRow key={link.id} link={link} />
            ))}
            {showNewRow && (
              <SocialLinkRow onRemoveEmpty={() => setShowNewRow(false)} />
            )}
          </>
        )}

        <Button
          type="button"
          variant="outline"
          className="border-outline-variant/30 text-on-surface-variant hover:border-primary/50 hover:text-primary mt-4 w-full border-dashed"
          onClick={() => setShowNewRow(true)}
          disabled={showNewRow || isLoading}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Social Link
        </Button>
      </div>
    </SectionCard>
  );
}
