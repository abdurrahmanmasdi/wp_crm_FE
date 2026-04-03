import * as z from 'zod';
import type { Control, UseFormRegister } from 'react-hook-form';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------

export const socialLinkSchema = z.object({
  platform: z.string().min(1, 'Platform is required'),
  url: z.string().url('Must be a valid URL'),
});

export const bankAccountSchema = z.object({
  bank_name: z.string().min(1, 'Required'),
  iban: z.string().min(1, 'Required'),
  account_holder_name: z.string().min(1, 'Required'),
  currency: z.string().min(1, 'Required'),
  is_default: z.boolean(),
});

export const organizationFormSchema = z.object({
  name: z.string().min(1, 'Legal Name is required'),
  tax_number: z.string().optional(),
  tax_office: z.string().optional(),
  industry_category: z.string().optional(),
  address: z.string().optional(),
  logo_url: z.string().url().optional().or(z.literal('')),
  brand_colors: z
    .array(
      z.object({
        key: z.string().min(1, 'Key is required'),
        value: z.string().min(1, 'Color value is required'),
      })
    )
    .optional(),
  default_currency: z.string().default('USD'),
  website_url: z.string().url().optional().or(z.literal('')),
  public_email: z.string().email().optional().or(z.literal('')),
  public_phone: z.string().optional(),
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
