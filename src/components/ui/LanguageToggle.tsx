'use client';
import { useTransition } from 'react';
import { ChevronDown, Languages, Loader2 } from 'lucide-react';
import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/routing';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const languageOptions = [
  { value: 'en', label: 'English (EN)', shortLabel: 'EN' },
  { value: 'tr', label: 'Türkçe (TR)', shortLabel: 'TR' },
  { value: 'ar', label: 'العربية (AR)', shortLabel: 'AR' },
] as const;

type SupportedLocale = 'en' | 'tr' | 'ar';

export function LanguageToggle({ className }: { className?: string }) {
  const locale = useLocale() as SupportedLocale;
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  function switchLanguage(newLocale: SupportedLocale) {
    if (newLocale === locale) return;

    // startTransition ensures the UI doesn't freeze while fetching the new language chunks
    startTransition(() => {
      // This smoothly replaces the locale in the URL and updates the cookie behind the scenes
      router.replace(pathname, { locale: newLocale });
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          aria-label="Language menu"
          disabled={isPending}
          className={cn(
            'text-muted-foreground hover:text-primary h-10 rounded-full px-3 transition-colors duration-200 hover:bg-white/5',
            className
          )}
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Languages className="h-4 w-4" />
          )}
          <span className="text-xs font-bold tracking-wider uppercase">
            {languageOptions.find((option) => option.value === locale)
              ?.shortLabel ?? 'EN'}
          </span>
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="bg-card text-foreground w-52 rounded-2xl border border-white/10 p-2 shadow-2xl shadow-black/40"
      >
        <div className="flex flex-col gap-1">
          {languageOptions.map(({ value, label }) => (
            <button
              key={value}
              disabled={isPending}
              onClick={() => switchLanguage(value as SupportedLocale)}
              className={cn(
                'cursor-pointer rounded-xl px-3 py-2 text-left text-sm transition-colors duration-150',
                locale === value
                  ? 'bg-primary text-primary-foreground font-semibold'
                  : 'text-foreground hover:bg-secondary hover:text-primary',
                isPending && 'cursor-not-allowed opacity-50'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
