'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { LayoutDashboard, Settings, Users, MessageSquare } from 'lucide-react';

import { cn } from '@/lib/utils';
import { usePermissions } from '@/hooks/usePermissions';
import { AppResource } from '@/constants/permissions.registry';

interface NavigationItem {
  href: string;
  labelKey: string;
  icon: React.ComponentType<{ className?: string }>;
  resource?: string;
}

const navigationItems: NavigationItem[] = [
  {
    href: '/dashboard',
    labelKey: 'dashboard',
    icon: LayoutDashboard,
  },
  {
    href: '/dashboard/leads',
    labelKey: 'leads',
    icon: Users,
    resource: AppResource.LEADS,
  },
  {
    href: '/dashboard/chat',
    labelKey: 'chat',
    icon: MessageSquare,
  },
  {
    href: '/dashboard/settings',
    labelKey: 'settings',
    icon: Settings,
  },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations('Navigation');
  const isRTL = locale === 'ar';
  const { hasPermission } = usePermissions();

  // Filter navigation items based on user permissions
  // If the item doesn't require a resource, show it to everyone
  // Otherwise, check if the user has permission for that resource
  const visibleItems = navigationItems.filter((item) => {
    if (!item.resource) return true;
    console.log("Checking permission for resource:", item.resource);
    return hasPermission(item.resource);
  });

  return (
    <aside
      className={cn(
        'bg-background text-foreground fixed top-0 flex h-screen w-64 flex-col px-4 py-6 shadow-2xl shadow-black/30',
        isRTL
          ? 'right-0 border-l border-white/5'
          : 'left-0 border-r border-white/5'
      )}
    >
      <div className="mb-10 flex items-center gap-3 px-2">
        <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-2xl shadow-[0_0_18px_var(--glow-primary-sm)]">
          <LayoutDashboard className="h-5 w-5" />
        </div>

        <div>
          <h1 className="font-headline text-foreground text-xl font-bold tracking-[-0.04em]">
            TourCRM
          </h1>
          <p className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">
            {t('Sidebar.dashboardSuite')}
          </p>
        </div>
      </div>

      <nav className="space-y-1">
        {visibleItems.map(({ href, labelKey, icon: Icon }) => {
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
              <span className="relative z-10">{t(labelKey)}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto rounded-2xl border border-white/5 bg-white/5 p-4">
        <p className="text-muted-foreground text-xs font-semibold tracking-[0.2em] uppercase">
          {t('Sidebar.liveMode')}
        </p>
        <p className="text-foreground mt-2 text-sm leading-6">
          {t('Sidebar.liveDescription')}
        </p>
      </div>
    </aside>
  );
}
