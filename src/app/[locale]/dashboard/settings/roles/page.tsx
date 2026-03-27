'use client';

import { RequirePermission } from '@/components/auth/RequirePermission';
import { AppResource, AppAction } from '@/constants/permissions.registry';
import { RolesList } from '@/components/settings/RolesList';

export default function RolesPage() {
  return (
    <RequirePermission
      resource={AppResource.ROLES}
      action={AppAction.READ_ALL}
      fallback="hide"
    >
      <RolesList />
    </RequirePermission>
  );
}
