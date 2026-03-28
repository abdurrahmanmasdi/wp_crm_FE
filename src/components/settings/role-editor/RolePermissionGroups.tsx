'use client';

import { useTranslations } from 'next-intl';

import { Checkbox } from '@/components/ui/checkbox';
import type { Permission } from '@/types/access-control';

interface RolePermissionGroupsProps {
  groupedPermissions: Record<string, Permission[]>;
  watchedPermissions: string[];
  onPermissionChange: (
    permissionId: string,
    checked: boolean | 'indeterminate'
  ) => void;
  isLoadingPermissions: boolean;
  permissionError?: string;
}

export function RolePermissionGroups({
  groupedPermissions,
  watchedPermissions,
  onPermissionChange,
  isLoadingPermissions,
  permissionError,
}: RolePermissionGroupsProps) {
  const t = useTranslations('Settings.Roles');

  return (
    <div>
      <h3 className="mb-4 text-sm font-semibold">{t('permissions')}</h3>
      {isLoadingPermissions ? (
        <p className="text-muted-foreground text-sm">
          {t('loadingPermissions')}
        </p>
      ) : Object.entries(groupedPermissions).length === 0 ? (
        <p className="text-muted-foreground text-sm">{t('noPermissions')}</p>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedPermissions)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([resourceName, resourcePermissions]) => (
              <div key={resourceName}>
                <h4 className="text-foreground mb-3 text-sm font-medium">
                  {resourceName}
                </h4>

                <div className="grid grid-cols-2 gap-3 pl-2">
                  {resourcePermissions.map((permission) => (
                    <div
                      key={permission.id}
                      className="flex flex-row items-start space-x-3"
                    >
                      <Checkbox
                        id={permission.id}
                        checked={watchedPermissions.includes(permission.id)}
                        onCheckedChange={(checked) => {
                          onPermissionChange(permission.id, checked);
                        }}
                        className="mt-1"
                      />
                      <div className="flex flex-col space-y-1">
                        <label
                          htmlFor={permission.id}
                          className="cursor-pointer text-sm font-normal"
                        >
                          {permission.action}
                        </label>
                        {permission.description && (
                          <p className="text-muted-foreground text-xs">
                            {permission.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}
      {permissionError ? (
        <p className="text-destructive mt-2 text-xs">{permissionError}</p>
      ) : null}
    </div>
  );
}
