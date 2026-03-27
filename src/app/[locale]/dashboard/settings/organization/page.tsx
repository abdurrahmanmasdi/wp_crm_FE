'use client';

import { RequirePermission } from '@/components/auth/RequirePermission';
import { AppResource } from '@/constants/permissions.registry';

export default function OrganizationPage() {
  return (
    <RequirePermission resource={AppResource.ORGANIZATION} fallback="hide">
      <div className="bg-card rounded-lg border border-white/5 p-6 shadow-lg">
        <h2 className="mb-4 text-lg font-semibold">
          Organization Settings Placeholder
        </h2>
        <p className="text-muted-foreground">
          Organization settings will be implemented here.
        </p>
      </div>
    </RequirePermission>
  );
}
