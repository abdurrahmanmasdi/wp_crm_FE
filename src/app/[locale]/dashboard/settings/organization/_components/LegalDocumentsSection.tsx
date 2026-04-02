import { Briefcase, ExternalLink, Gavel } from 'lucide-react';
import Link from 'next/link';
import { SectionCard } from './SectionCard';

export function LegalDocumentsSection() {
  return (
    <SectionCard title="Legal Documents" icon={Gavel} className="lg:col-span-6">
      <div className="space-y-4">
        <div className="bg-surface-container-lowest border-outline-variant/10 flex items-center justify-between rounded-lg border p-4">
          <div className="flex items-center gap-4">
            <Briefcase className="text-on-surface-variant h-4 w-4" />
            <div>
              <p className="text-sm font-medium">Terms and Conditions</p>
              <p className="text-primary text-[10px]">
                Last updated: Oct 12, 2023
              </p>
            </div>
          </div>
          <a
            href="/legal/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary flex items-center gap-1 px-0 text-xs font-bold tracking-widest uppercase transition-opacity hover:opacity-70"
          >
            Manage
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>

        <div className="bg-surface-container-lowest border-outline-variant/10 flex items-center justify-between rounded-lg border p-4">
          <div className="flex items-center gap-4">
            <Gavel className="text-on-surface-variant h-4 w-4" />
            <div>
              <p className="text-sm font-medium">Privacy Policy</p>
              <p className="text-on-surface-variant text-[10px]">
                Draft status
              </p>
            </div>
          </div>
          <a
            href="/legal/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary flex items-center gap-1 px-0 text-xs font-bold tracking-widest uppercase transition-opacity hover:opacity-70"
          >
            Manage
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </SectionCard>
  );
}
