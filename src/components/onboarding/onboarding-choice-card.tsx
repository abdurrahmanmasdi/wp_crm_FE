import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';

type OnboardingChoiceCardProps = {
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
  ctaLabel: string;
};

export function OnboardingChoiceCard({
  href,
  icon: Icon,
  title,
  description,
  ctaLabel,
}: OnboardingChoiceCardProps) {
  return (
    <Link href={href} className="block">
      <div className="glass-card kinetic-shadow group bg-card hover:border-accent/40 relative h-full overflow-hidden rounded-xl border border-white/10 p-10 text-left transition-all duration-300 hover:-translate-y-1">
        <div className="from-accent/5 absolute inset-0 bg-linear-to-br to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
        <div className="bg-secondary group-hover:bg-accent/20 mb-8 flex h-16 w-16 items-center justify-center rounded-full transition-colors">
          <Icon className="text-muted-foreground group-hover:text-accent h-8 w-8 transition-colors" />
        </div>
        <h2 className="text-foreground group-hover:text-accent text-[1.5rem] font-semibold tracking-[-0.04em] transition-colors">
          {title}
        </h2>
        <p className="text-muted-foreground mt-2 max-w-sm text-sm leading-relaxed tracking-[-0.01em]">
          {description}
        </p>
        <div className="text-accent mt-10 inline-flex items-center gap-2 transition-transform group-hover:translate-x-0.5">
          <span className="text-sm font-semibold">{ctaLabel}</span>
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            className="h-5 w-5"
          >
            <path
              d="M5 12h14m0 0-6-6m6 6-6 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    </Link>
  );
}
