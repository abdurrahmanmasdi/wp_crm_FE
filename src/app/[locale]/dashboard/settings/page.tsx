'use client';

import { useTranslations } from 'next-intl';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { AccessRequestsList } from '@/components/settings/AccessRequestsList';
import { RolesList } from '@/components/settings/RolesList';
import { TeamMembersList } from '@/components/settings/TeamMembersList';

export default function SettingsPage() {
  const t = useTranslations('Settings');
  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <p className="text-primary text-sm font-semibold tracking-[0.2em] uppercase">
          {t('workspaceLabel')}
        </p>
        <h1 className="font-headline text-foreground text-3xl font-bold tracking-tight md:text-4xl">
          {t('pageTitle')}
        </h1>
        <p className="text-muted-foreground max-w-2xl text-sm leading-6 md:text-base">
          {t('pageDescription')}
        </p>
      </section>

      <Tabs defaultValue="requests" className="space-y-6">
        <div className="bg-card rounded-[1.5rem] border border-white/5 p-2 shadow-2xl shadow-black/20">
          <TabsList className="bg-background grid h-auto w-full grid-cols-3 rounded-[1.2rem] border border-white/5 p-1">
            <TabsTrigger
              value="team"
              className="text-muted-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-[1rem] px-4 py-2.5 text-sm font-semibold transition-all data-[state=active]:shadow-[0_12px_30px_var(--glow-primary-lg)]"
            >
              {t('tabs.team')}
            </TabsTrigger>
            <TabsTrigger
              value="roles"
              className="text-muted-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-[1rem] px-4 py-2.5 text-sm font-semibold transition-all data-[state=active]:shadow-[0_12px_30px_var(--glow-primary-lg)]"
            >
              {t('tabs.roles')}
            </TabsTrigger>
            <TabsTrigger
              value="requests"
              className="text-muted-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-[1rem] px-4 py-2.5 text-sm font-semibold transition-all data-[state=active]:shadow-[0_12px_30px_var(--glow-primary-lg)]"
            >
              {t('tabs.requests')}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="team" className="mt-0">
          <TeamMembersList />
        </TabsContent>

        <TabsContent value="roles" className="mt-0">
          <RolesList />
        </TabsContent>

        <TabsContent value="requests" className="mt-0">
          <AccessRequestsList />
        </TabsContent>
      </Tabs>
    </div>
  );
}
