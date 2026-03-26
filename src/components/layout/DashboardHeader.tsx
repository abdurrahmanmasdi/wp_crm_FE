'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
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

  const initials = useMemo(() => getUserInitials(user), [user]);

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-4 border-b border-white/5 bg-[#0a0e14]/80 px-6 backdrop-blur-xl">
      <div className="flex flex-1 items-center gap-4 lg:max-w-2xl">
        <div className="relative w-full max-w-xl">
          <Search className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-[#859490] transition-colors" />
          <Input
            type="search"
            placeholder="Search leads, tours, or agencies..."
            className="h-11 rounded-full border-white/10 bg-[#161b22] pr-4 pl-11 text-sm text-[#dfe2eb] placeholder:text-[#859490] focus-visible:ring-1 focus-visible:ring-[#00f0ff]/40"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 text-[#bacac5]">
        <ThemeToggle />
        <LanguageToggle />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              className="h-11 rounded-full border border-white/10 bg-[#161b22] px-2.5 text-[#dfe2eb] hover:bg-white/5 hover:text-[#00f0ff]"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#00f0ff]/30 to-[#2dd4bf]/20 text-xs font-bold text-[#00f0ff]">
                {initials}
              </span>
              <ChevronDown className="h-4 w-4 opacity-70" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            className="w-56 rounded-2xl border border-white/10 bg-[#161b22] p-2 text-[#dfe2eb] shadow-2xl shadow-black/40"
          >
            <div className="px-3 py-2">
              <p className="text-sm font-semibold text-[#dfe2eb]">
                Welcome back
              </p>
              <p className="text-xs text-[#859490]">
                {user && typeof user === 'object'
                  ? ((user as { email?: string }).email ?? 'account')
                  : 'account'}
              </p>
            </div>

            <DropdownMenuItem
              className="rounded-xl px-3 py-2 text-sm text-[#dfe2eb] focus:bg-[#262a31] focus:text-[#00f0ff]"
              onClick={() => router.push('/dashboard/settings')}
            >
              Profile settings
            </DropdownMenuItem>

            <DropdownMenuItem
              className="rounded-xl px-3 py-2 text-sm text-[#ffb4ab] focus:bg-red-500/10 focus:text-[#ffb4ab]"
              onClick={() => {
                logout();
                router.push('/auth/login');
              }}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
