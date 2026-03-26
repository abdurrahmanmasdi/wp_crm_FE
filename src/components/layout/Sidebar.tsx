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
    <aside className="fixed top-0 left-0 flex h-screen w-64 flex-col border-r border-white/5 bg-[#0a0d12] px-4 py-6 text-[#dfe2eb] shadow-2xl shadow-black/30">
      <div className="mb-10 flex items-center gap-3 px-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#00f0ff]/10 text-[#00f0ff] shadow-[0_0_18px_rgba(0,240,255,0.08)]">
          <LayoutDashboard className="h-5 w-5" />
        </div>

        <div>
          <h1 className="font-headline text-xl font-bold tracking-[-0.04em] text-[#dfe2eb]">
            TourCRM
          </h1>
          <p className="text-[10px] font-bold tracking-wider text-[#bacac5] uppercase">
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
                'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors duration-200',
                isActive
                  ? 'bg-[#00f0ff]/10 text-[#00f0ff] shadow-[inset_0_0_0_1px_rgba(0,240,255,0.15)]'
                  : 'text-[#bacac5] hover:bg-white/5 hover:text-[#dfe2eb]'
              )}
            >
              <Icon
                className={cn(
                  'h-4 w-4',
                  isActive && 'drop-shadow-[0_0_8px_rgba(0,240,255,0.3)]'
                )}
              />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto rounded-2xl border border-white/5 bg-white/5 p-4">
        <p className="text-xs font-semibold tracking-[0.2em] text-[#bacac5] uppercase">
          Live mode
        </p>
        <p className="mt-2 text-sm leading-6 text-[#dfe2eb]">
          Track leads, tours, and pipeline movement from one place.
        </p>
      </div>
    </aside>
  );
}
