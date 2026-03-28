'use client';

import { useTranslations } from 'next-intl';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RequirePermission } from '@/components/auth/RequirePermission';
import { AppResource, AppAction } from '@/constants/permissions.registry';

import { AccessRequestsList } from '@/components/settings/AccessRequestsList';
import { TeamMembersList } from '@/components/settings/TeamMembersList';
import { TeamInvitationsSection } from '@/components/settings/team-members/TeamInvitationsSection';

export default function TeamPage() {
  const t = useTranslations('Settings');

  return (
    <Tabs defaultValue="team" className="space-y-6">
      <div className="bg-card rounded-[1.5rem] border border-white/5 p-2 shadow-2xl shadow-black/20">
        <TabsList className="bg-background grid h-auto w-full grid-cols-3 rounded-[1.2rem] border border-white/5 p-1">
          <RequirePermission
            resource={AppResource.TEAM_MEMBERS}
            action={AppAction.READ_ALL}
            fallback="disable"
          >
            <TabsTrigger
              value="team"
              className="text-muted-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-[1rem] px-4 py-2.5 text-sm font-semibold transition-all data-[state=active]:shadow-[0_12px_30px_var(--glow-primary-lg)]"
            >
              {t('tabs.team')}
            </TabsTrigger>
          </RequirePermission>
          <RequirePermission
            resource={AppResource.TEAM_MEMBERS}
            action={AppAction.EDIT_ALL}
            fallback="disable"
          >
            <TabsTrigger
              value="requests"
              className="text-muted-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-[1rem] px-4 py-2.5 text-sm font-semibold transition-all data-[state=active]:shadow-[0_12px_30px_var(--glow-primary-lg)]"
            >
              {t('tabs.requests')}
            </TabsTrigger>
          </RequirePermission>
          <RequirePermission
            resource={AppResource.TEAM_MEMBERS}
            action={AppAction.EDIT_ALL}
            fallback="disable"
          >
            <TabsTrigger
              value="invitations"
              className="text-muted-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-[1rem] px-4 py-2.5 text-sm font-semibold transition-all data-[state=active]:shadow-[0_12px_30px_var(--glow-primary-lg)]"
            >
              {t('tabs.invitations')}
            </TabsTrigger>
          </RequirePermission>
        </TabsList>
      </div>

      <TabsContent value="team" className="mt-0">
        <TeamMembersList />
      </TabsContent>

      <TabsContent value="requests" className="mt-0">
        <AccessRequestsList />
      </TabsContent>

      <TabsContent value="invitations" className="mt-0">
        <TeamInvitationsSection />
      </TabsContent>
    </Tabs>
  );
}
