'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';

type HeroVisualProps = {
  imageAlt: string;
};

export function HeroVisual({ imageAlt }: HeroVisualProps) {
  const t = useTranslations('HeroVisual');
  return (
    <div className="group bg-background relative mx-auto mb-24 aspect-4/5 w-full max-w-5xl overflow-hidden rounded-2xl border border-white/10 sm:mb-32 sm:aspect-video">
      <div className="from-primary/10 absolute inset-0 bg-[radial-gradient(circle_at_center,var(--tw-gradient-stops))] via-transparent to-transparent opacity-50" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="grid h-full w-full grid-cols-4 grid-rows-8 gap-3 p-4 opacity-50 transition-opacity duration-700 group-hover:opacity-70 sm:grid-cols-12 sm:grid-rows-6 sm:gap-4 sm:p-8 sm:opacity-40 sm:group-hover:opacity-60">
          <div className="bg-secondary col-span-4 row-span-2 rounded-xl border border-white/10 sm:col-span-4" />
          <div className="bg-secondary relative col-span-4 row-span-4 overflow-hidden rounded-xl border border-white/10 sm:col-span-8">
            <Image
              alt={imageAlt}
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuA_mVcOTrcNSfWu1LVfEZSFiIDyavma8T1WE-JsEMKOqpPR0NLlAXVJZV15inZmYUrjNkGbQkSmm_Xr8djada4HeOj2UUNQRxyrN6j-TG4GCWe4toHgTGthwOKQwsqsSAESwgedk6-roG2LGaCkH7b0J_8irOXyMAORQ6KI2DJKRYxkbzm0YZA_X-Gk5HSNZS0OKGEPUTdaK-uR-h6qae0_Y46GPmbfLxvJICm81tzj1FAB4W_EDf6WYSXV8k4WsvcZD-D4_dk75TVw"
              fill
              loading="eager"
              sizes="(max-width: 1024px) 100vw, 66vw"
              className="h-full w-full object-cover opacity-35 grayscale transition-all duration-1000 hover:grayscale-0 sm:opacity-30"
            />
          </div>
          <div className="bg-secondary col-span-2 row-span-2 rounded-xl border border-white/10 sm:col-span-4 sm:row-span-3" />
          <div className="border-primary/40 bg-primary/20 col-span-1 row-span-1 rounded-xl border sm:col-span-2 sm:row-span-2" />
          <div className="bg-secondary hidden rounded-xl border border-white/10 sm:col-span-3 sm:row-span-1 sm:block" />
        </div>
      </div>
      <div className="glass-panel border-primary/20 absolute top-4 left-4 rounded-xl border p-3 text-left transition-transform duration-500 hover:translate-y-0 sm:top-1/4 sm:left-1/4 sm:translate-y-4 sm:p-4">
        <div className="text-primary mb-1 text-[10px] font-bold uppercase">
          {t('activeTours')}
        </div>
        <div className="text-foreground text-lg font-bold sm:text-2xl">
          {t('activeTourValue')}
        </div>
      </div>
      <div className="glass-panel absolute right-4 bottom-4 rounded-xl border border-white/20 p-3 text-left transition-transform duration-500 hover:translate-y-0 sm:right-1/4 sm:bottom-1/4 sm:-translate-y-4 sm:p-4">
        <div className="text-muted-foreground mb-1 text-[10px] font-bold uppercase">
          {t('leadConversion')}
        </div>
        <div className="text-primary text-lg font-bold sm:text-2xl">
          {t('leadConversionValue')}
        </div>
      </div>
    </div>
  );
}
