import type { OrganizationFormInputValues } from './_schema';

// ---------------------------------------------------------------------------
// Select option lists
// ---------------------------------------------------------------------------

export const industryOptions = [
  { label: 'Enterprise Software & SaaS', value: 'Enterprise Software & SaaS' },
  { label: 'Financial Technology', value: 'Financial Technology' },
  { label: 'Infrastructure & Security', value: 'Infrastructure & Security' },
];

export const currencyOptions = [
  { label: 'USD ($)', value: 'USD' },
  { label: 'EUR (€)', value: 'EUR' },
  { label: 'GBP (£)', value: 'GBP' },
  { label: 'TRY (₺)', value: 'TRY' },
];

// ---------------------------------------------------------------------------
// Form default values (blank state before data loads)
// ---------------------------------------------------------------------------

export const defaultValues: OrganizationFormInputValues = {
  name: '',
  slug: '',
  tax_number: '',
  tax_office: '',
  industry_category: 'Enterprise Software & SaaS',
  address: '',
  logo_url: '',
  brand_colors: [
    { key: 'primary', value: '#57f1db' },
    { key: 'secondary', value: '#2dd4bf' },
  ],
  default_currency: 'USD',
  website_url: '',
  public_email: '',
  public_phone: '',
};
