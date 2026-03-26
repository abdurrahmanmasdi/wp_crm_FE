'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ChevronDown, LogOut, Search } from 'lucide-react';

import { LanguageToggle } from '@/components/ui/LanguageToggle';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/store/useAuthStore';

function getUserInitials(user: unknown) {
  if (!user || typeof user !== 'object') {
    return 'TC';
  }

  const profile = user as {
    firstName?: string;
    first_name?: string;
    lastName?: string;
    last_name?: string;
    email?: string;
  };

  const first = profile.firstName ?? profile.first_name ?? '';
  const last = profile.lastName ?? profile.last_name ?? '';

  const initials = `${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase();

  if (initials) {
    return initials;
  }

  return profile.email?.slice(0, 2).toUpperCase() ?? 'TC';
}

export function DashboardHeader() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const t = useTranslations('Common');

  const initials = useMemo(() => getUserInitials(user), [user]);

  return (
    <header className="bg-background/80 sticky top-0 z-40 flex h-16 items-center justify-between gap-4 border-b border-white/5 px-6 backdrop-blur-xl">
      <div className="flex flex-1 items-center gap-4 lg:max-w-2xl">
        <div className="relative w-full max-w-xl">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 transition-colors" />
          <Input
            type="search"
            placeholder="Search leads, tours, or agencies..."
            className="bg-card text-foreground placeholder:text-muted-foreground focus-visible:ring-primary/40 h-11 rounded-full border-white/10 pr-4 pl-11 text-sm focus-visible:ring-1"
          />
        </div>
      </div>

      <div className="text-muted-foreground flex items-center gap-3">
        <ThemeToggle />
        <LanguageToggle />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              className="bg-card text-foreground hover:text-primary h-11 rounded-full border border-white/10 px-2.5 hover:bg-white/5"
            >
              <span className="from-primary/30 to-accent/20 text-primary flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br text-xs font-bold">
                {initials}
              </span>
              <ChevronDown className="h-4 w-4 opacity-70" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            className="bg-card text-foreground w-56 rounded-2xl border border-white/10 p-2 shadow-2xl shadow-black/40"
          >
            <div className="px-2 py-1.5">
              <p className="text-foreground text-sm font-semibold">
                Welcome back
              </p>
              <p className="text-muted-foreground text-xs">
                {user && typeof user === 'object'
                  ? ((user as { email?: string }).email ?? 'account')
                  : 'account'}
              </p>
            </div>

            <DropdownMenuItem
              className="text-foreground focus:bg-secondary focus:text-primary rounded-xl px-3 py-2 text-sm"
              onClick={() => router.push('/dashboard/settings')}
            >
              {t('profileSettings')}
            </DropdownMenuItem>

            <DropdownMenuItem
              className="text-destructive focus:bg-destructive/10 focus:text-destructive rounded-xl px-3 py-2 text-sm"
              onClick={() => {
                logout();
                router.push('/auth/login');
              }}
            >
              <LogOut className="mr-2 h-4 w-4" />
              {t('logout')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
