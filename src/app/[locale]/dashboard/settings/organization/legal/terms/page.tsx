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
  real_estate: `<h2>Terms and Conditions for Real Estate Services</h2><p>Welcome to our Real Estate Platform. These Terms and Conditions ("Agreement") govern your use of our property listing and transaction services ("Services"). By accessing or using our platform, you agree to comply with and be bound by these Terms.</p><h3>1. Property Listing Standards</h3><p>All property listings must comply with local and state regulations. Listings must contain accurate descriptions, current photographs, and factual information. The Company reserves the right to remove any listing that violates these standards or misrepresents a property.</p><h3>2. Commission and Payment Terms</h3><p>Real estate agents using our platform agree to pay the specified commission fees as outlined in the Service Plan selected. Payment is due upon completion of a transaction or as otherwise specified in individual service agreements.</p><h3>3. Fair Housing Compliance</h3><p>All users agree to comply with the Fair Housing Act and all applicable federal, state, and local fair housing laws. Discrimination based on protected characteristics is strictly prohibited.</p>`,

  tourism: `<h2>Terms and Conditions for Tourism and Travel Services</h2><p>These Terms and Conditions ("Terms") apply to all users of our travel booking and tourism information platform ("Platform"). Your use of the Platform constitutes your acceptance of these Terms in their entirety.</p><h3>1. Booking and Reservation Policies</h3><p>All bookings made through our Platform are subject to the cancellation, refund, and modification policies of the respective service providers (hotels, airlines, tour operators). The Company acts as an intermediary and is not responsible for service provider actions or failures.</p><h3>2. Travel Information Accuracy</h3><p>While we strive to provide accurate and current travel information, exchange rates, availability, and pricing are subject to change. We recommend confirming all details directly with service providers before finalizing bookings.</p><h3>3. Visa and Documentation Requirements</h3><p>Users are responsible for obtaining appropriate visas, travel documents, and insurance required for international travel. The Company does not provide visa advice and is not liable for travel delays or denials due to documentation issues.</p>`,
};

export default function TermsEditorPage() {
  const t = useTranslations('Settings.LegalDocuments.TermsEditor');
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const activeOrganizationId = useAuthStore((s) => s.activeOrganizationId);
  const queryClient = useQueryClient();
  const hasHydrated = useRef(false);

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
        heading: {
          levels: [1, 2, 3],
        },
      }),
      TextStyle,
      FontSize,
      BulletList.configure({
        HTMLAttributes: {
          class: 'list-disc list-inside',
        },
      }),
      OrderedList.configure({
        HTMLAttributes: {
          class: 'list-decimal list-inside',
        },
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
        // Removed duplicate prose classes here to prevent conflicts!
        class:
          'border border-border rounded-md p-6 min-h-[600px] focus:outline-none focus:ring-2 focus:ring-primary',
      },
    },
  });

  // Hydrate editor with fetched organization data (once)
  useEffect(() => {
    if (
      editor &&
      orgQuery.data &&
      !hasHydrated.current &&
      orgQuery.data.terms_and_conditions?.trim()
    ) {
      editor.commands.setContent(orgQuery.data.terms_and_conditions);
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
        // Robust regex to force empty paragraphs to stay open
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
      // Trigger the Orval mutation
      const payload = {
        terms_and_conditions: content,
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await mutation.mutateAsync(payload as any);

      toast.success(t('saveSuccess') || 'Document saved successfully');
      router.push('/dashboard/settings/organization');
    } catch (error) {
      console.error('Failed to save terms:', error);
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
              >
                <ArrowLeft className="h-4 w-4" />
                {t('backToSettings') || 'Back to Settings'}
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">
              {t('title') || 'Terms and Conditions'}
            </h1>
            <p className="text-muted-foreground mt-2 text-sm">
              {t('subtitle') || 'Manage your legal documents.'}
            </p>
          </div>
          <Button onClick={handleSave} className="h-10 px-6">
            {t('saveDocument') || 'Save Document'}
          </Button>
        </div>

        {/* Loading State */}
        {orgQuery.isLoading && (
          <div className="border-border bg-muted/50 flex h-[600px] items-center justify-center rounded-lg border">
            <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
          </div>
        )}

        {/* Editor Card */}
        {!orgQuery.isLoading && (
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
                      placeholder={
                        t('selectTemplate') || 'Select a template...'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="real_estate">
                      {t('realEstate') || 'Real Estate'}
                    </SelectItem>
                    <SelectItem value="tourism">
                      {t('tourism') || 'Tourism & Travel'}
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
                    {[
                      '12px',
                      '14px',
                      '16px',
                      '18px',
                      '20px',
                      '24px',
                      '30px',
                    ].map((size) => (
                      <SelectItem key={size} value={size}>
                        {size}
                      </SelectItem>
                    ))}
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

            {/* Editor - Typography wrapper added explicitly here, with forced minimum heights for empty paragraphs */}
            <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none [&_li]:mt-1 [&_li>p]:inline [&_ol]:ml-4 [&_ol]:list-decimal [&_p:empty]:min-h-[1.5rem] [&_ul]:ml-4 [&_ul]:list-disc">
              <EditorContent editor={editor} />
            </div>

            {/* Footer Actions */}
            <div className="border-border mt-6 flex justify-end gap-3 border-t pt-6">
              <Link href="/dashboard/settings/organization">
                <Button variant="outline">{t('cancel') || 'Cancel'}</Button>
              </Link>
              <Button onClick={handleSave}>
                {t('saveDocument') || 'Save Document'}
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
