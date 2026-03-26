'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function MemberProfilePage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const t = useTranslations('MemberProfile');

  return (
    <div className="from-background to-card flex min-h-screen items-center justify-center bg-gradient-to-br px-4 py-8">
      <div className="bg-background/80 w-full max-w-md rounded-2xl border border-white/10 p-8 shadow-2xl backdrop-blur-sm">
        {/* Header Icon */}
        <div className="mb-6 flex justify-center">
          <div className="bg-primary/10 rounded-full p-4">
            <div className="text-primary text-2xl">👤</div>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-foreground mb-2 text-center text-2xl font-bold">
          {t('title')}
        </h1>

        {/* Description */}
        <p className="text-muted-foreground mb-8 text-center text-sm">
          {t('developmentDescription')}
        </p>

        {/* Info Box */}
        <div className="mb-8 rounded-lg border border-white/10 bg-white/5 p-4">
          <p className="text-muted-foreground text-xs">
            <span className="text-foreground font-semibold">
              {t('memberIdLabel')}
            </span>{' '}
            {params.id}
          </p>
        </div>

        {/* Back Button */}
        <Button
          onClick={() => router.back()}
          className="bg-primary text-primary-foreground hover:bg-primary/90 w-full font-semibold"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('backToTeam')}
        </Button>

        {/* Alternative Link */}
        <Button
          variant="outline"
          className="text-muted-foreground mt-3 w-full border-white/10 hover:bg-white/5"
          onClick={() => router.push('/dashboard/settings')}
        >
          {t('goToSettings')}
        </Button>
      </div>
    </div>
  );
}
