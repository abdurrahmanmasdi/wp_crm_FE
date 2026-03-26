/**
 * Middleware for next-intl
 * Handles locale detection, redirection, and request configuration
 *
 * Matcher explicitly ignores:
 * - API routes (/api/*)
 * - Static files (_next/*, .*, etc.)
 * - Public assets (public/*)
 */

import createMiddleware from 'next-intl/middleware';
import { routing } from '@/i18n/routing';

export default createMiddleware({
  locales: routing.locales,
  defaultLocale: routing.defaultLocale,
  localePrefix: 'always', // Always include locale in URL
});

export const config = {
  // Matcher pattern - explicitly ignores system paths and static content
  matcher: [
    // Match all routes except those explicitly excluded
    '/((?!api|_next|.*\\.|public).*)',
    // Also match root
    '/',
  ],
};
