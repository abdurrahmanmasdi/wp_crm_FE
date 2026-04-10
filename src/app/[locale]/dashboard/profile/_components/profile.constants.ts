/**
 * Profile Constants
 * Centralized configuration for profile-related enums, statuses, and tiers
 */

// ============================================================================
// SUPPORTED LANGUAGES
// ============================================================================

export const SUPPORTED_LANGUAGES = [
  { label: 'English', value: 'EN' },
  { label: 'Turkish', value: 'TR' },
  { label: 'العربية', value: 'AR' },
  { label: 'Français', value: 'FR' },
  { label: 'Deutsch', value: 'DE' },
  { label: 'Español', value: 'ES' },
  { label: 'Русский', value: 'RU' },
  { label: 'Italiano', value: 'IT' },
  { label: '中文', value: 'ZH' },
] as const;

export type SupportedLanguageValue =
  (typeof SUPPORTED_LANGUAGES)[number]['value'];

// ============================================================================
// AVAILABILITY STATUS CONFIG
// ============================================================================

export type AvailabilityStatus = 'ACTIVE' | 'ON_LEAVE' | 'OFF_SHIFT';

export interface StatusConfig {
  label: string;
  color: string;
  description?: string;
}

export const STATUS_CONFIG: Record<AvailabilityStatus, StatusConfig> = {
  ACTIVE: {
    label: 'Active',
    color: 'bg-green-500',
    description: 'Available for leads',
  },
  ON_LEAVE: {
    label: 'On Leave',
    color: 'bg-amber-500',
    description: 'Away from work',
  },
  OFF_SHIFT: {
    label: 'Off Shift',
    color: 'bg-gray-500',
    description: 'Outside working hours',
  },
} as const;

// ============================================================================
// AGENT TIER CONFIG
// ============================================================================

export type AgentTier = 'JUNIOR' | 'STANDARD' | 'SENIOR' | 'MANAGER';

export interface TierConfig {
  label: string;
  badgeColor: string;
  badgeTextColor: string;
  description?: string;
  displayOrder: number;
}

export const TIER_CONFIG: Record<AgentTier, TierConfig> = {
  JUNIOR: {
    label: 'Junior',
    badgeColor: 'bg-amber-700', // Bronze
    badgeTextColor: 'text-white',
    description: 'Entry-level sales agent',
    displayOrder: 1,
  },
  STANDARD: {
    label: 'Standard',
    badgeColor: 'bg-gray-400', // Silver
    badgeTextColor: 'text-white',
    description: 'Experienced sales agent',
    displayOrder: 2,
  },
  SENIOR: {
    label: 'Senior',
    badgeColor: 'bg-yellow-500', // Gold
    badgeTextColor: 'text-white',
    description: 'Senior sales agent',
    displayOrder: 3,
  },
  MANAGER: {
    label: 'Manager',
    badgeColor: 'bg-purple-600', // Purple
    badgeTextColor: 'text-white',
    description: 'Sales team manager or lead',
    displayOrder: 4,
  },
} as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get status label by availability status
 */
export function getStatusLabel(status: AvailabilityStatus): string {
  return STATUS_CONFIG[status]?.label || status;
}

/**
 * Get status color by availability status
 */
export function getStatusColor(status: AvailabilityStatus): string {
  return STATUS_CONFIG[status]?.color || 'bg-gray-500';
}

/**
 * Get tier label by agent tier
 */
export function getTierLabel(tier: AgentTier): string {
  return TIER_CONFIG[tier]?.label || tier;
}

/**
 * Get tier badge colors by agent tier
 */
export function getTierBadgeColor(tier: AgentTier): {
  backgroundColor: string;
  textColor: string;
} {
  const config = TIER_CONFIG[tier];
  return {
    backgroundColor: config?.badgeColor || 'bg-slate-500',
    textColor: config?.badgeTextColor || 'text-white',
  };
}

/**
 * Get all tiers sorted by display order
 */
export function getSortedTiers(): Array<{
  tier: AgentTier;
  config: TierConfig;
}> {
  return (Object.entries(TIER_CONFIG) as Array<[AgentTier, TierConfig]>)
    .map(([tier, config]) => ({ tier, config }))
    .sort((a, b) => a.config.displayOrder - b.config.displayOrder);
}

/**
 * Get all statuses as an array
 */
export function getAllStatuses(): Array<{
  status: AvailabilityStatus;
  config: StatusConfig;
}> {
  return Object.entries(STATUS_CONFIG).map(([status, config]) => ({
    status: status as AvailabilityStatus,
    config,
  }));
}
