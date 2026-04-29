'use client';

import { useTranslations } from 'next-intl';

import { LeadSourcesSettings } from '@/components/settings/crm/LeadSourcesSettings';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function CRMSettingsPage() {
  const t = useTranslations('Settings.CRM');

  return (
    <Tabs defaultValue="leadSources" className="space-y-6">
      <div className="bg-card rounded-[1.5rem] border border-white/5 p-2 shadow-2xl shadow-black/20">
        <TabsList className="bg-background grid h-auto w-full grid-cols-2 rounded-[1.2rem] border border-white/5 p-1">
          <TabsTrigger
            value="leadSources"
            className="text-muted-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-[1rem] px-4 py-2.5 text-sm font-semibold transition-all data-[state=active]:shadow-[0_12px_30px_var(--glow-primary-lg)]"
          >
            {t('tabs.leadSources')}
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="leadSources" className="mt-0">
        <LeadSourcesSettings />
      </TabsContent>
    </Tabs>
  );
}
