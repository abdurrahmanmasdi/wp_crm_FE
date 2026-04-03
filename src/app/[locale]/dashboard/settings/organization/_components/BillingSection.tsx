import { ArrowRight, CreditCard } from 'lucide-react';
import Link from 'next/link';
import { SectionCard } from './SectionCard';

export function BillingSection() {
  return (
    <SectionCard title="Billing" icon={CreditCard}>
      <div className="space-y-6">
        <div>
          <p className="text-on-surface-variant mb-1 text-[10px] font-bold tracking-widest uppercase">
            Current Plan
          </p>
          <p className="text-2xl font-bold tracking-tight text-white">
            Enterprise Plus
          </p>
          <p className="text-on-surface-variant mt-1 text-xs">
            Next invoice: <span className="text-on-surface">Oct 24, 2024</span>
          </p>
        </div>

        <Link
          href="/billing"
          className="flex w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 py-3.5 text-white transition-colors hover:bg-white/10"
        >
          <span className="text-xs font-bold tracking-widest uppercase">
            Manage Subscription
          </span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </SectionCard>
  );
}
