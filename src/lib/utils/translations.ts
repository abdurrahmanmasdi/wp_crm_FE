/**
 * Translation Utilities
 * Provides helper functions for handling multilingual content
 */

import type { Role } from '@/types/access-control-generated';

/**
 * Get the localized role name based on the current locale
 *
 * Robust implementation that handles:
 * - Turkish (tr) as base language
 * - Locale normalization (e.g., "en-US" -> "en")
 * - Stringified JSON translations from API
 * - Missing translations with graceful fallback
 * - JSON parsing errors
 *
 * @param role - The role object with optional translations
 * @param currentLocale - The current active locale (e.g., 'tr', 'en', 'en-US', 'ar')
 * @returns The localized role name, or the default name if translation is not available
 */
export function getLocalizedRoleName(
  role: Role & Record<string, unknown>,
  currentLocale: string
): string {
  // 1. Base case: If Turkish, return the default name immediately
  if (currentLocale === 'tr') return role.name;

  // 2. Normalize the locale (e.g., turn "en-US" into "en")
  const lang = currentLocale.split('-')[0];

  try {
    let translations = role.name_translations;

    // If there are no translations at all, fallback to default
    if (!translations) return role.name;

    // 3. Handle stringified JSON from the API
    if (typeof translations === 'string') {
      translations = JSON.parse(translations);
    }

    // 4. Return the translation if it exists, otherwise fallback to default
    if (typeof translations === 'object' && translations !== null) {
      return (translations as Record<string, string>)[lang] || role.name;
    }

    return role.name;
  } catch (error) {
    // If JSON parsing fails for any reason, fail gracefully
    console.error('Failed to parse role translations', error);
    return role.name;
  }
}

/**
 * Check if a role has a translation for a specific locale
 *
 * @param role - The role object
 * @param locale - The locale to check
 * @returns True if the role has a translation for the locale
 */
export function hasRoleTranslation(role: Role, locale: string): boolean {
  return !!role.name_translations?.[locale];
}

/**
 * Get all available translation languages for a role
 *
 * @param role - The role object
 * @returns Array of language codes that have translations
 */
export function getRoleTranslationLanguages(role: Role): string[] {
  return Object.keys(role.name_translations ?? {});
}
