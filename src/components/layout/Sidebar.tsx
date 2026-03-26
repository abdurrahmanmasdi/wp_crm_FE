'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Settings, MapPinned, Users } from 'lucide-react';

import { cn } from '@/lib/utils';

const navigationItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/leads', label: 'Leads', icon: Users },
  { href: '/dashboard/tours', label: 'Tours', icon: MapPinned },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
] as const;

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="bg-background text-foreground fixed top-0 left-0 flex h-screen w-64 flex-col border-r border-white/5 px-4 py-6 shadow-2xl shadow-black/30">
      <div className="mb-10 flex items-center gap-3 px-2">
        <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-2xl shadow-[0_0_18px_var(--glow-primary-sm)]">
          <LayoutDashboard className="h-5 w-5" />
        </div>

        <div>
          <h1 className="font-headline text-foreground text-xl font-bold tracking-[-0.04em]">
            TourCRM
          </h1>
          <p className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">
            Dashboard Suite
          </p>
        </div>
      </div>

      <nav className="space-y-1">
        {navigationItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'group relative flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-300',
                isActive
                  ? 'bg-primary/10 text-primary hover:bg-primary/15 shadow-[inset_0_0_0_1px_var(--glow-primary-xl)]'
                  : 'text-muted-foreground hover:text-foreground hover:bg-primary/5 hover:shadow-[0_0_12px_var(--glow-primary-sm)]'
              )}
            >
              {!isActive && (
                <div className="from-primary/0 via-primary/0 to-primary/0 group-hover:from-primary/5 group-hover:via-primary/0 absolute inset-0 rounded-2xl bg-gradient-to-r opacity-0 blur transition-all duration-300 group-hover:opacity-100" />
              )}
              <Icon
                className={cn(
                  'h-4 w-4 transition-all duration-300',
                  isActive
                    ? 'drop-shadow-[0_0_8px_var(--glow-primary-xl)]'
                    : 'group-hover:scale-110 group-hover:drop-shadow-[0_0_4px_var(--glow-primary-md)]'
                )}
              />
              <span className="relative z-10">{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto rounded-2xl border border-white/5 bg-white/5 p-4">
        <p className="text-muted-foreground text-xs font-semibold tracking-[0.2em] uppercase">
          Live mode
        </p>
        <p className="text-foreground mt-2 text-sm leading-6">
          Track leads, tours, and pipeline movement from one place.
        </p>
      </div>
    </aside>
  );
}
