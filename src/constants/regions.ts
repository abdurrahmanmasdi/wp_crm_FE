export type RegionOption = {
  value: string;
  label: string;
};

export type CallingCodeOption = RegionOption & {
  regionCode: string;
};

export const COMMON_ISO_COUNTRIES: RegionOption[] = [
  { value: 'TR', label: 'Turkey' },
  { value: 'AE', label: 'United Arab Emirates' },
  { value: 'SA', label: 'Saudi Arabia' },
  { value: 'QA', label: 'Qatar' },
  { value: 'KW', label: 'Kuwait' },
  { value: 'OM', label: 'Oman' },
  { value: 'BH', label: 'Bahrain' },
  { value: 'EG', label: 'Egypt' },
  { value: 'JO', label: 'Jordan' },
  { value: 'LB', label: 'Lebanon' },
  { value: 'IQ', label: 'Iraq' },
  { value: 'US', label: 'United States' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'DE', label: 'Germany' },
  { value: 'FR', label: 'France' },
  { value: 'ES', label: 'Spain' },
  { value: 'IT', label: 'Italy' },
  { value: 'NL', label: 'Netherlands' },
  { value: 'IN', label: 'India' },
  { value: 'CN', label: 'China' },
  { value: 'JP', label: 'Japan' },
  { value: 'RU', label: 'Russia' },
] as const;

export const MAJOR_TIMEZONES: RegionOption[] = [
  { value: 'Europe/Istanbul', label: 'Istanbul (Europe/Istanbul)' },
  { value: 'Asia/Dubai', label: 'Dubai (Asia/Dubai)' },
  { value: 'Asia/Riyadh', label: 'Riyadh (Asia/Riyadh)' },
  { value: 'Asia/Qatar', label: 'Doha (Asia/Qatar)' },
  { value: 'Asia/Kuwait', label: 'Kuwait City (Asia/Kuwait)' },
  { value: 'Africa/Cairo', label: 'Cairo (Africa/Cairo)' },
  { value: 'Europe/London', label: 'London (Europe/London)' },
  { value: 'Europe/Paris', label: 'Paris (Europe/Paris)' },
  { value: 'Europe/Berlin', label: 'Berlin (Europe/Berlin)' },
  { value: 'America/New_York', label: 'New York (America/New_York)' },
  { value: 'America/Los_Angeles', label: 'Los Angeles (America/Los_Angeles)' },
  { value: 'Asia/Kolkata', label: 'Mumbai (Asia/Kolkata)' },
  { value: 'Asia/Shanghai', label: 'Shanghai (Asia/Shanghai)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (Asia/Tokyo)' },
] as const;

export const SUPPORTED_LANGUAGES: RegionOption[] = [
  { value: 'ar', label: 'Arabic' },
  { value: 'en', label: 'English' },
  { value: 'tr', label: 'Turkish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'es', label: 'Spanish' },
  { value: 'it', label: 'Italian' },
  { value: 'ru', label: 'Russian' },
] as const;

export const COUNTRY_CALLING_CODES: CallingCodeOption[] = [
  { value: '+90', label: 'Turkey (+90)', regionCode: 'TR' },
  { value: '+971', label: 'UAE (+971)', regionCode: 'AE' },
  { value: '+966', label: 'Saudi Arabia (+966)', regionCode: 'SA' },
  { value: '+974', label: 'Qatar (+974)', regionCode: 'QA' },
  { value: '+965', label: 'Kuwait (+965)', regionCode: 'KW' },
  { value: '+20', label: 'Egypt (+20)', regionCode: 'EG' },
  { value: '+962', label: 'Jordan (+962)', regionCode: 'JO' },
  { value: '+961', label: 'Lebanon (+961)', regionCode: 'LB' },
  { value: '+44', label: 'United Kingdom (+44)', regionCode: 'GB' },
  { value: '+1', label: 'United States (+1)', regionCode: 'US' },
  { value: '+33', label: 'France (+33)', regionCode: 'FR' },
  { value: '+49', label: 'Germany (+49)', regionCode: 'DE' },
] as const;
