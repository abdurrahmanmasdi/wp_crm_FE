/**
 * i18n request configuration for next-intl App Router
 * Handles message loading for the current locale
 */

import { getRequestConfig } from 'next-intl/server';
import { routing, type Locale } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  // Resolve requestLocale if it's a promise, then validate
  const resolvedLocale = await Promise.resolve(requestLocale);

  // Use resolved locale if valid, otherwise fallback to default
  const locale: Locale = routing.locales.includes(resolvedLocale as Locale)
    ? (resolvedLocale as Locale)
    : routing.defaultLocale;

  // Load messages for the current locale
  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
