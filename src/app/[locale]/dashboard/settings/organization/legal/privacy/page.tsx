'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  ArrowLeft,
  Upload,
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useEditor, EditorContent } from '@tiptap/react';
import { Extension } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { TextStyle } from '@tiptap/extension-text-style';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import ListItem from '@tiptap/extension-list-item';
import TextAlign from '@tiptap/extension-text-align';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import mammoth from 'mammoth';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getOrganization, updateOrganization } from '@/lib/api/organization';
import { useAuthStore } from '@/store/useAuthStore';
import type { Organization } from '@/types/organizations-generated';

// 1. Custom Font Size Extension
const FontSize = Extension.create({
  name: 'fontSize',
  addOptions() {
    return { types: ['textStyle'] };
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element) =>
              element.style.fontSize.replace(/['"]+/g, ''),
            renderHTML: (attributes) => {
              if (!attributes.fontSize) return {};
              return { style: `font-size: ${attributes.fontSize}` };
            },
          },
        },
      },
    ];
  },
  addCommands() {
    return {
      setFontSize:
        (fontSize) =>
        ({ chain }) => {
          return chain().setMark('textStyle', { fontSize }).run();
        },
      unsetFontSize:
        () =>
        ({ chain }) => {
          return chain()
            .setMark('textStyle', { fontSize: null })
            .removeEmptyTextStyle()
            .run();
        },
    };
  },
});

const TEMPLATES = {
  saas: `<h2>Privacy Policy for B2B SaaS</h2><p>This Privacy Policy describes how we collect, use, and handle your organization's data when you use our software applications. We are committed to protecting your corporate data and ensuring compliance with global privacy standards.</p><h3>1. Information We Collect</h3><p>We collect account information (such as administrator emails and billing details), customer data inputted into the CRM, and usage telemetry to improve our application's performance.</p><h3>2. How We Use Your Data</h3><p>Your data is used strictly to provide the core functionality of the CRM. We do not sell your corporate data or your clients' data to third-party data brokers under any circumstances.</p><h3>3. Data Security</h3><p>We implement industry-standard security measures including AES-256 encryption at rest and TLS 1.3 in transit to protect your information from unauthorized access.</p>`,

  ecommerce: `<h2>Privacy Policy for Retail & E-commerce</h2><p>This Privacy Policy applies to information collected through our retail operations and digital storefronts. We value the trust you place in us when sharing your personal information.</p><h3>1. Information Collection</h3><p>We collect personal information necessary to process your orders, including name, shipping address, billing address, and payment information. We may also collect browsing behavior through cookies to personalize your shopping experience.</p><h3>2. Third-Party Sharing</h3><p>We share necessary information with trusted third-party service providers (such as shipping carriers and payment gateways) strictly for the purpose of fulfilling your orders. These partners are legally bound to protect your data.</p><h3>3. Your Privacy Rights</h3><p>Depending on your jurisdiction, you have the right to request access to, correction of, or deletion of your personal data. Please contact our privacy team to exercise these rights.</p>`,
};

export default function PrivacyEditorPage() {
  const t = useTranslations('Settings.LegalDocuments.PrivacyEditor');
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasHydrated = useRef(false);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const activeOrganizationId = useAuthStore((s) => s.activeOrganizationId);
  const queryClient = useQueryClient();

  // Fetch existing organization data
  const orgQuery = useQuery({
    queryKey: ['organization', activeOrganizationId],
    queryFn: async () => {
      if (!activeOrganizationId) throw new Error('No active organization');
      return getOrganization(activeOrganizationId);
    },
    enabled: !!activeOrganizationId,
  });

  const mutation = useMutation<Organization, Error, Record<string, unknown>>({
    mutationFn: async (data: Record<string, unknown>) => {
      if (!activeOrganizationId) throw new Error('No active organization');
      return updateOrganization(activeOrganizationId, data);
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

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: false,
        orderedList: false,
        listItem: false,
        heading: { levels: [1, 2, 3] },
      }),
      TextStyle,
      FontSize,
      BulletList.configure({
        HTMLAttributes: { class: 'list-disc list-inside' },
      }),
      OrderedList.configure({
        HTMLAttributes: { class: 'list-decimal list-inside' },
      }),
      ListItem,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right'],
        defaultAlignment: 'left',
      }),
    ],
    immediatelyRender: false,
    content: '<p></p>',
    editorProps: {
      attributes: {
        class:
          'border border-border rounded-md p-6 min-h-[600px] focus:outline-none focus:ring-2 focus:ring-primary',
      },
    },
  });

  // Hydrate the editor with existing data on load
  useEffect(() => {
    // Note: Adjust 'orgQuery.data?.privacy_policy' based on your actual API response structure (e.g., orgQuery.data?.data?.privacy_policy)
    const existingPolicy = orgQuery.data?.privacy_policy;

    if (editor && existingPolicy && !hasHydrated.current) {
      editor.commands.setContent(existingPolicy);
      hasHydrated.current = true;
    }
  }, [editor, orgQuery.data]);

  const handleTemplateChange = (templateKey: string) => {
    setSelectedTemplate(templateKey);
    const template = TEMPLATES[templateKey as keyof typeof TEMPLATES];
    if (editor && template) {
      editor.commands.setContent(template);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer });
      if (editor) {
        const formattedHtml = result.value
          .replace(/<p>(\s|&nbsp;)*<\/p>/g, '<p><br></p>')
          .replace(/<p><\/p>/g, '<p><br></p>');

        editor.commands.setContent(formattedHtml);
        toast.success(
          t('documentImported') || 'Document imported successfully'
        );
      }
    } catch (error) {
      toast.error(t('importError') || 'Error importing document');
      console.error('Error importing document:', error);
    }
  };

  const handleSave = async () => {
    if (!editor) return;
    const content = editor.getHTML();

    try {
      await mutation.mutateAsync({
        privacy_policy: content, // Saving to the privacy_policy column
      });

      toast.success(t('saveSuccess') || 'Privacy Policy saved successfully');
      router.push('/dashboard/settings/organization');
    } catch (error) {
      console.error('Failed to save privacy policy:', error);
      toast.error(
        t('saveError') || 'Failed to save document. Please try again.'
      );
    }
  };

  const toggleBold = () => editor?.commands.toggleBold();
  const toggleItalic = () => editor?.commands.toggleItalic();
  const toggleH1 = () => editor?.commands.toggleHeading({ level: 1 });
  const toggleH2 = () => editor?.commands.toggleHeading({ level: 2 });
  const toggleH3 = () => editor?.commands.toggleHeading({ level: 3 });
  const toggleBulletList = () => editor?.commands.toggleBulletList();
  const toggleOrderedList = () => editor?.commands.toggleOrderedList();
  const alignLeft = () => editor?.commands.setTextAlign('left');
  const alignCenter = () => editor?.commands.setTextAlign('center');
  const alignRight = () => editor?.commands.setTextAlign('right');

  // Show loading spinner while fetching initial data
  if (orgQuery.isLoading) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center">
        <Loader2 className="text-muted-foreground h-10 w-10 animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      <div className="mx-auto max-w-5xl px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Link href="/dashboard/settings/organization">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground mb-4 gap-2"
                disabled={mutation.isPending}
              >
                <ArrowLeft className="h-4 w-4" />
                {t('backToSettings') || 'Back to Settings'}
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">
              {t('title') || 'Privacy Policy'}
            </h1>
            <p className="text-muted-foreground mt-2 text-sm">
              {t('subtitle') ||
                'Manage how your organization handles data privacy.'}
            </p>
          </div>
          <Button
            onClick={handleSave}
            className="h-10 px-6"
            disabled={mutation.isPending}
          >
            {mutation.isPending
              ? 'Saving...'
              : t('saveDocument') || 'Save Document'}
          </Button>
        </div>

        {/* Editor Card */}
        <Card className="p-6">
          {/* Controls Section */}
          <div className="mb-6 space-y-4">
            {/* Template Selector */}
            <div>
              <label className="mb-2 block text-sm font-medium">
                {t('useTemplate') || 'Use a Template'}
              </label>
              <Select
                value={selectedTemplate}
                onValueChange={handleTemplateChange}
              >
                <SelectTrigger className="w-full sm:w-[300px]">
                  <SelectValue
                    placeholder={t('selectTemplate') || 'Select a template...'}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="saas">
                    {t('saas') || 'B2B Software (SaaS)'}
                  </SelectItem>
                  <SelectItem value="ecommerce">
                    {t('ecommerce') || 'Retail & E-commerce'}
                  </SelectItem>
                </SelectContent>
              </Select>
              {selectedTemplate && (
                <p className="mt-2 text-xs text-yellow-600">
                  {t('templateWarning') ||
                    'Warning: Selecting a template will overwrite your current text.'}
                </p>
              )}
            </div>

            {/* File Import & Formatting */}
            <div className="border-border bg-muted/40 flex flex-wrap items-center gap-2 rounded-md border p-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                <span className="hidden sm:inline">
                  {t('importDocument') || 'Import Word'}
                </span>
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                accept=".docx"
                onChange={handleFileUpload}
                className="hidden"
              />

              <div className="border-border bg-border mx-1 h-6 w-px" />

              <Select
                onValueChange={(val) => editor?.commands.setFontSize(val)}
              >
                <SelectTrigger className="h-8 w-[90px] text-xs">
                  <SelectValue placeholder="Size" />
                </SelectTrigger>
                <SelectContent>
                  {['12px', '14px', '16px', '18px', '20px', '24px', '30px'].map(
                    (size) => (
                      <SelectItem key={size} value={size}>
                        {size}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>

              <div className="border-border bg-border mx-1 h-6 w-px" />

              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleBold}
                  className={
                    editor?.isActive('bold')
                      ? 'bg-accent text-accent-foreground'
                      : ''
                  }
                  title={t('bold') || 'Bold'}
                >
                  <Bold className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleItalic}
                  className={
                    editor?.isActive('italic')
                      ? 'bg-accent text-accent-foreground'
                      : ''
                  }
                  title={t('italic') || 'Italic'}
                >
                  <Italic className="h-4 w-4" />
                </Button>
              </div>

              <div className="border-border bg-border mx-1 h-6 w-px" />

              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleH1}
                  className={
                    editor?.isActive('heading', { level: 1 })
                      ? 'bg-accent text-accent-foreground'
                      : ''
                  }
                  title={t('heading1') || 'Heading 1'}
                >
                  <Heading1 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleH2}
                  className={
                    editor?.isActive('heading', { level: 2 })
                      ? 'bg-accent text-accent-foreground'
                      : ''
                  }
                  title={t('heading2') || 'Heading 2'}
                >
                  <Heading2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleH3}
                  className={
                    editor?.isActive('heading', { level: 3 })
                      ? 'bg-accent text-accent-foreground'
                      : ''
                  }
                  title={t('heading3') || 'Heading 3'}
                >
                  <Heading3 className="h-4 w-4" />
                </Button>
              </div>

              <div className="border-border bg-border mx-1 h-6 w-px" />

              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleBulletList}
                  className={
                    editor?.isActive('bulletList')
                      ? 'bg-accent text-accent-foreground'
                      : ''
                  }
                  title={t('bulletList') || 'Bullet List'}
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleOrderedList}
                  className={
                    editor?.isActive('orderedList')
                      ? 'bg-accent text-accent-foreground'
                      : ''
                  }
                  title={t('orderedList') || 'Ordered List'}
                >
                  <ListOrdered className="h-4 w-4" />
                </Button>
              </div>

              <div className="border-border bg-border mx-1 h-6 w-px" />

              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={alignLeft}
                  className={
                    editor?.isActive({ textAlign: 'left' })
                      ? 'bg-accent text-accent-foreground'
                      : ''
                  }
                  title={t('alignLeft') || 'Align Left'}
                >
                  <AlignLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={alignCenter}
                  className={
                    editor?.isActive({ textAlign: 'center' })
                      ? 'bg-accent text-accent-foreground'
                      : ''
                  }
                  title={t('alignCenter') || 'Align Center'}
                >
                  <AlignCenter className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={alignRight}
                  className={
                    editor?.isActive({ textAlign: 'right' })
                      ? 'bg-accent text-accent-foreground'
                      : ''
                  }
                  title={t('alignRight') || 'Align Right'}
                >
                  <AlignRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none [&_li]:mt-1 [&_li>p]:inline [&_ol]:ml-4 [&_ol]:list-decimal [&_p:empty]:min-h-[1.5rem] [&_ul]:ml-4 [&_ul]:list-disc">
            <EditorContent editor={editor} />
          </div>

          <div className="border-border mt-6 flex justify-end gap-3 border-t pt-6">
            <Link href="/dashboard/settings/organization">
              <Button variant="outline" disabled={mutation.isPending}>
                {t('cancel') || 'Cancel'}
              </Button>
            </Link>
            <Button onClick={handleSave} disabled={mutation.isPending}>
              {mutation.isPending
                ? 'Saving...'
                : t('saveDocument') || 'Save Document'}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
