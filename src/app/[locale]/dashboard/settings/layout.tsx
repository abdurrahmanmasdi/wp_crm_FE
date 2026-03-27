'use client';

import { useTranslations } from 'next-intl';

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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

      {children}
    </div>
  );
}
