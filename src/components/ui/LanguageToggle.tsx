'use client';

import { ChevronDown, Languages } from 'lucide-react';
import { useState } from 'react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const languageOptions = [
  { value: 'en', label: 'English (EN)', shortLabel: 'EN' },
  { value: 'tr', label: 'Türkçe (TR)', shortLabel: 'TR' },
  { value: 'ar', label: 'العربية (AR)', shortLabel: 'AR' },
] as const;

export function LanguageToggle({ className }: { className?: string }) {
  const [language, setLanguage] = useState('en');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          aria-label="Language menu"
          className={cn(
            'h-10 rounded-full px-3 text-[#bacac5] transition-colors duration-200 hover:bg-white/5 hover:text-[#57f1db]',
            className
          )}
        >
          <Languages className="h-4 w-4" />
          <span className="text-xs font-bold tracking-wider uppercase">
            {languageOptions.find((option) => option.value === language)
              ?.shortLabel ?? 'EN'}
          </span>
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-52 rounded-2xl border border-white/10 bg-[#161b22] p-2 text-[#dfe2eb] shadow-2xl shadow-black/40"
      >
        <DropdownMenuRadioGroup
          value={language}
          onValueChange={(value) => {
            setLanguage(value);
            console.log('Language selected:', value);
          }}
        >
          {languageOptions.map(({ value, label }) => (
            <DropdownMenuRadioItem
              key={value}
              value={value}
              className="cursor-pointer rounded-xl px-3 py-2 text-sm text-[#dfe2eb] focus:bg-[#262a31] focus:text-[#57f1db]"
            >
              {label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
