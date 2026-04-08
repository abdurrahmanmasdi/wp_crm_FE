import * as z from 'zod';
import type { Control, UseFormRegister } from 'react-hook-form';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------

export const socialLinkSchema = z.object({
  platform: z
    .string()
    .min(1, 'Platform is required')
    .max(255, 'Max 255 characters'),
  url: z.string().url('Must be a valid URL').max(1024, 'URL too long'),
});

export const bankAccountSchema = z.object({
  bank_name: z.string().min(1, 'Required').max(255, 'Max 255 characters'),
  iban: z.string().min(1, 'Required').max(255, 'Max 255 characters'),
  account_holder_name: z
    .string()
    .min(1, 'Required')
    .max(255, 'Max 255 characters'),
  currency: z.string().min(1, 'Required').max(255, 'Max 255 characters'),
  is_default: z.boolean(),
});

export const organizationFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Legal Name is required')
    .max(255, 'Max 255 characters'),
  slug: z.string().min(1, 'Slug is required').max(255, 'Max 255 characters'),
  tax_number: z.string().max(255, 'Max 255 characters').optional(),
  tax_office: z.string().max(255, 'Max 255 characters').optional(),
  industry_category: z.string().max(255, 'Max 255 characters').optional(),
  address: z.string().max(255, 'Max 255 characters').optional(),
  logo_url: z
    .string()
    .url()
    .max(1024, 'URL too long')
    .optional()
    .or(z.literal('')),
  brand_colors: z
    .array(
      z.object({
        key: z
          .string()
          .min(1, 'Key is required')
          .max(255, 'Max 255 characters'),
        value: z
          .string()
          .min(1, 'Color value is required')
          .max(255, 'Max 255 characters'),
      })
    )
    .optional(),
  default_currency: z.string().max(255, 'Max 255 characters').default('USD'),
  website_url: z
    .string()
    .url()
    .max(1024, 'URL too long')
    .optional()
    .or(z.literal('')),
  public_email: z
    .string()
    .email()
    .max(255, 'Max 255 characters')
    .optional()
    .or(z.literal('')),
  public_phone: z.string().max(255, 'Max 255 characters').optional(),
  terms_and_conditions: z.string().optional(),
  privacy_policy: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Derived TypeScript types
// ---------------------------------------------------------------------------

export type OrganizationFormValues = z.infer<typeof organizationFormSchema>;
export type OrganizationFormInputValues = z.input<
  typeof organizationFormSchema
>;

// Typed react-hook-form Control with schema transforms applied
export type OrganizationFormControl = Control<
  OrganizationFormInputValues,
  unknown,
  OrganizationFormValues
>;

// Props shared by sections that contain field arrays (need register too)
export type DynamicSectionProps = {
  control: OrganizationFormControl;
  register: UseFormRegister<OrganizationFormInputValues>;
};

// Generic card wrapper props
export type CardSectionProps = {
  title: string;
  icon: LucideIcon;
  children: ReactNode;
  className?: string;
};
