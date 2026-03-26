'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { AccessRequestsList } from '@/components/settings/AccessRequestsList';
import { RolesList } from '@/components/settings/RolesList';
import { TeamMembersList } from '@/components/settings/TeamMembersList';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <p className="text-sm font-semibold tracking-[0.2em] text-[#00f0ff] uppercase">
          Workspace
        </p>
        <h1 className="font-headline text-3xl font-bold tracking-tight text-[#dfe2eb] md:text-4xl">
          Workspace Settings
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-[#bacac5] md:text-base">
          Manage your workspace access and team configuration from one place.
        </p>
      </section>

      <Tabs defaultValue="requests" className="space-y-6">
        <div className="rounded-[1.5rem] border border-white/5 bg-[#161b22] p-2 shadow-2xl shadow-black/20">
          <TabsList className="grid h-auto w-full grid-cols-3 rounded-[1.2rem] border border-white/5 bg-[#0a0e14] p-1">
            <TabsTrigger
              value="team"
              className="rounded-[1rem] px-4 py-2.5 text-sm font-semibold text-[#bacac5] transition-all data-[state=active]:bg-[#00f0ff] data-[state=active]:text-[#003731] data-[state=active]:shadow-[0_12px_30px_rgba(0,240,255,0.18)]"
            >
              Team Members
            </TabsTrigger>
            <TabsTrigger
              value="roles"
              className="rounded-[1rem] px-4 py-2.5 text-sm font-semibold text-[#bacac5] transition-all data-[state=active]:bg-[#00f0ff] data-[state=active]:text-[#003731] data-[state=active]:shadow-[0_12px_30px_rgba(0,240,255,0.18)]"
            >
              Roles & Permissions
            </TabsTrigger>
            <TabsTrigger
              value="requests"
              className="rounded-[1rem] px-4 py-2.5 text-sm font-semibold text-[#bacac5] transition-all data-[state=active]:bg-[#00f0ff] data-[state=active]:text-[#003731] data-[state=active]:shadow-[0_12px_30px_rgba(0,240,255,0.18)]"
            >
              Access Requests
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
