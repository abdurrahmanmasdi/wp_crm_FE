import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Briefcase, ExternalLink, Gavel } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { SectionCard } from './SectionCard';
import type { OrganizationFormValues } from '../_schema';

type Props = { values: Partial<OrganizationFormValues> };

export function LegalDocumentsSection({ values }: Props) {
  const t = useTranslations('Settings.LegalDocuments.Section');
  const termsConfigured = !!values.terms_and_conditions?.trim();
  const privacyConfigured = !!values.privacy_policy?.trim();

  return (
    <SectionCard title={t('title')} icon={Gavel} className="lg:col-span-6">
      <div className="space-y-4">
        <div className="bg-surface-container-lowest border-outline-variant/10 flex items-center justify-between rounded-lg border p-4">
          <div className="flex items-center gap-4">
            <Briefcase className="text-on-surface-variant h-4 w-4" />
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">{t('termsTitle')}</p>
                {termsConfigured ? (
                  <Badge
                    variant="outline"
                    className="border-emerald-500/20 bg-emerald-500/10 text-emerald-500"
                  >
                    {t('configured')}
                  </Badge>
                ) : (
                  <Badge variant="destructive">{t('missing')}</Badge>
                )}
              </div>
              <p className="text-on-surface-variant text-[10px] font-light">
                {termsConfigured ? t('configuredReady') : t('notConfigured')}
              </p>
            </div>
          </div>
          <Link
            href="organization/legal/terms"
            className="text-primary flex items-center gap-1 px-0 text-xs font-bold tracking-widest uppercase transition-opacity hover:opacity-70"
          >
            {termsConfigured ? t('edit') : t('setupNow')}
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>

        <div className="bg-surface-container-lowest border-outline-variant/10 flex items-center justify-between rounded-lg border p-4">
          <div className="flex items-center gap-4">
            <Gavel className="text-on-surface-variant h-4 w-4" />
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">{t('privacyTitle')}</p>
                {privacyConfigured ? (
                  <Badge
                    variant="outline"
                    className="border-emerald-500/20 bg-emerald-500/10 text-emerald-500"
                  >
                    {t('configured')}
                  </Badge>
                ) : (
                  <Badge variant="destructive">{t('missing')}</Badge>
                )}
              </div>
              <p className="text-on-surface-variant text-[10px] font-light">
                {privacyConfigured ? t('configuredReady') : t('notConfigured')}
              </p>
            </div>
          </div>
          <Link
            href="organization/legal/privacy"
            className="text-primary flex items-center gap-1 px-0 text-xs font-bold tracking-widest uppercase transition-opacity hover:opacity-70"
          >
            {privacyConfigured ? t('edit') : t('setupNow')}
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </SectionCard>
  );
}
