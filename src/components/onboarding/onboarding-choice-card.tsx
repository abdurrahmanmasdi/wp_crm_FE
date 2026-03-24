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
      <div className="glass-card kinetic-shadow group relative h-full overflow-hidden rounded-xl border border-[#3c4a46]/10 bg-[#161b22] p-10 text-left transition-all duration-300 hover:-translate-y-1 hover:border-[#2dd4bf]/40">
        <div className="absolute inset-0 bg-linear-to-br from-[#2dd4bf]/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
        <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-full bg-[#1c2026] transition-colors group-hover:bg-[#2dd4bf]/20">
          <Icon className="h-8 w-8 text-[#bacac5] transition-colors group-hover:text-[#2dd4bf]" />
        </div>
        <h2 className="text-[1.5rem] font-semibold tracking-[-0.04em] text-[#dfe2eb] transition-colors group-hover:text-[#2dd4bf]">
          {title}
        </h2>
        <p className="mt-2 max-w-sm text-sm leading-relaxed tracking-[-0.01em] text-[#bacac5]">
          {description}
        </p>
        <div className="mt-10 inline-flex items-center gap-2 text-[#2dd4bf] transition-transform group-hover:translate-x-0.5">
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
