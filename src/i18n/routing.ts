import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

/**
 * i18n routing configuration
 * Defines supported locales and default locale for next-intl
 */
export const routing = defineRouting({
  // A list of all locales that are supported
  locales: ['en', 'tr', 'ar'],
  // Used when no locale matches
  defaultLocale: 'en',
});

// Type for valid locales
export type Locale = (typeof routing.locales)[number];

/**
 * Helper to check if a locale is valid
 */
export function isValidLocale(locale: unknown): locale is Locale {
  return routing.locales.includes(locale as Locale);
}

// CRITICAL: This generates the localized routing APIs that our LanguageToggle uses
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
