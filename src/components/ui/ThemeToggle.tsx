'use client';

import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const themeOptions = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
] as const;

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const currentTheme = theme ?? 'system';
  const CurrentIcon =
    themeOptions.find((option) => option.value === currentTheme)?.icon ?? Moon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          aria-label="Theme menu"
          className={cn(
            'h-10 w-10 rounded-full text-[#bacac5] transition-colors duration-200 hover:bg-white/5 hover:text-[#57f1db]',
            className
          )}
        >
          <CurrentIcon className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-44 rounded-2xl border border-white/10 bg-[#161b22] p-2 text-[#dfe2eb] shadow-2xl shadow-black/40"
      >
        <DropdownMenuRadioGroup
          value={currentTheme}
          onValueChange={(value) => setTheme(value)}
        >
          {themeOptions.map(({ value, label, icon: Icon }) => (
            <DropdownMenuRadioItem
              key={value}
              value={value}
              className="cursor-pointer rounded-xl px-3 py-2 text-sm text-[#dfe2eb] focus:bg-[#262a31] focus:text-[#57f1db]"
            >
              <Icon className="mr-2 h-4 w-4" />
              {label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
