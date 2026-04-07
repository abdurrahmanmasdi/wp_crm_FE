'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import {
  LayoutDashboard,
  Settings,
  Users,
  MessageSquare,
  ChevronDown,
  Package,
} from 'lucide-react';
import { useState } from 'react';

import { cn } from '@/lib/utils';
import { usePermissions } from '@/hooks/usePermissions';
import { AppResource } from '@/constants/permissions.registry';

interface NavigationItem {
  href?: string;
  labelKey: string;
  icon?: React.ComponentType<{ className?: string }>;
  resource?: string;
  children?: NavigationItem[];
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
    href: '/dashboard/products',
    labelKey: 'products',
    icon: Package,
  },
  {
    href: '/dashboard/chat',
    labelKey: 'chat',
    icon: MessageSquare,
  },
  {
    labelKey: 'settings',
    icon: Settings,
    children: [
      {
        href: '/dashboard/settings/team',
        labelKey: 'teamManagement',
        resource: AppResource.TEAM_MEMBERS,
      },
      {
        href: '/dashboard/settings/roles',
        labelKey: 'rolesPermissions',
        resource: AppResource.ROLES,
      },
      {
        href: '/dashboard/settings/organization',
        labelKey: 'orgSettings',
        resource: AppResource.ORGANIZATION,
      },
      {
        href: '/dashboard/settings/crm',
        labelKey: 'crmSettings',
      },
    ],
  },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations('Navigation');
  const isRTL = locale === 'ar';
  const { hasPermission } = usePermissions();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Filter navigation items based on user permissions
  // Deep filtering: if item has children, filter them AND hide parent if no children remain
  const visibleItems = navigationItems
    .map((item) => {
      // If item has children, filter them based on permissions
      if (item.children) {
        const visibleChildren = item.children.filter((child) => {
          if (!child.resource) return true;
          return hasPermission(child.resource);
        });
        // Only return parent if it has visible children
        return visibleChildren.length > 0
          ? { ...item, children: visibleChildren }
          : null;
      }
      // For regular items without children
      if (!item.resource) return item;
      return hasPermission(item.resource) ? item : null;
    })
    .filter((item): item is NavigationItem => item !== null);

  // Check if a parent item should be auto-expanded (if any child route is active)
  const getIsParentActive = (item: NavigationItem): boolean => {
    if (!item.children) return false;
    return item.children.some(
      (child) => child.href && pathname.startsWith(child.href)
    );
  };

  // Determine whether a parent item should be expanded (either manually or auto)
  const isItemExpanded = (item: NavigationItem): boolean => {
    return expandedItems.has(item.labelKey) || getIsParentActive(item);
  };

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
        {visibleItems.map((item) => {
          // Check if this is a parent item with children
          if (item.children && item.icon) {
            const Icon = item.icon;
            const isManuallyExpanded = expandedItems.has(item.labelKey);
            const isParentActive = getIsParentActive(item);
            const isShown = isItemExpanded(item); // Show if manually expanded OR auto-expanded

            const toggleExpanded = () => {
              const newExpanded = new Set(expandedItems);
              if (isManuallyExpanded) {
                newExpanded.delete(item.labelKey);
              } else {
                newExpanded.add(item.labelKey);
              }
              setExpandedItems(newExpanded);
            };

            return (
              <div key={item.labelKey} className="space-y-1">
                {/* Parent item */}
                <button
                  onClick={toggleExpanded}
                  className={cn(
                    'group relative flex w-full items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-300',
                    isParentActive
                      ? 'bg-primary/10 text-primary hover:bg-primary/15 shadow-[inset_0_0_0_1px_var(--glow-primary-xl)]'
                      : 'text-muted-foreground hover:text-foreground hover:bg-primary/5 hover:shadow-[0_0_12px_var(--glow-primary-sm)]'
                  )}
                >
                  {!isParentActive && (
                    <div className="from-primary/0 via-primary/0 to-primary/0 group-hover:from-primary/5 group-hover:via-primary/0 absolute inset-0 rounded-2xl bg-linear-to-r opacity-0 blur transition-all duration-300 group-hover:opacity-100" />
                  )}
                  <div className="flex items-center gap-3">
                    <Icon
                      className={cn(
                        'h-4 w-4 transition-all duration-300',
                        isParentActive
                          ? 'drop-shadow-[0_0_8px_var(--glow-primary-xl)]'
                          : 'group-hover:scale-110 group-hover:drop-shadow-[0_0_4px_var(--glow-primary-md)]'
                      )}
                    />
                    <span className="relative z-10">{t(item.labelKey)}</span>
                  </div>
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 transition-transform duration-300',
                      isShown && 'rotate-180'
                    )}
                  />
                </button>

                {/* Child items */}
                {isShown && (
                  <div className="ml-4 space-y-1 border-l border-white/10 pl-3">
                    {item.children.map((child) => {
                      if (!child.href) return null;
                      const isActive = pathname === child.href;

                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={cn(
                            'group relative flex items-center gap-3 rounded-2xl px-3 py-2 text-xs font-medium transition-all duration-300',
                            isActive
                              ? 'bg-primary/10 text-primary hover:bg-primary/15 shadow-[inset_0_0_0_1px_var(--glow-primary-xl)]'
                              : 'text-muted-foreground hover:text-foreground hover:bg-primary/5 hover:shadow-[0_0_12px_var(--glow-primary-sm)]'
                          )}
                        >
                          {!isActive && (
                            <div className="from-primary/0 via-primary/0 to-primary/0 group-hover:from-primary/5 group-hover:via-primary/0 absolute inset-0 rounded-2xl bg-linear-to-r opacity-0 blur transition-all duration-300 group-hover:opacity-100" />
                          )}
                          <span className="relative z-10">
                            {t(child.labelKey)}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          // Regular item (no children)
          if (!item.href || !item.icon) return null;
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group relative flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-300',
                isActive
                  ? 'bg-primary/10 text-primary hover:bg-primary/15 shadow-[inset_0_0_0_1px_var(--glow-primary-xl)]'
                  : 'text-muted-foreground hover:text-foreground hover:bg-primary/5 hover:shadow-[0_0_12px_var(--glow-primary-sm)]'
              )}
            >
              {!isActive && (
                <div className="from-primary/0 via-primary/0 to-primary/0 group-hover:from-primary/5 group-hover:via-primary/0 absolute inset-0 rounded-2xl bg-linear-to-r opacity-0 blur transition-all duration-300 group-hover:opacity-100" />
              )}
              <Icon
                className={cn(
                  'h-4 w-4 transition-all duration-300',
                  isActive
                    ? 'drop-shadow-[0_0_8px_var(--glow-primary-xl)]'
                    : 'group-hover:scale-110 group-hover:drop-shadow-[0_0_4px_var(--glow-primary-md)]'
                )}
              />
              <span className="relative z-10">{t(item.labelKey)}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
