'use client';

import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import { ChevronDown } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { RoleFormData } from '@/components/settings/RoleEditorSheet';

type LanguageOption = {
  code: string;
  label: string;
};

interface RoleTranslationFieldsProps {
  register: UseFormRegister<RoleFormData>;
  errors: FieldErrors<RoleFormData>;
  isSystemRole: boolean;
  activeTranslations: string[];
  availableLanguages: LanguageOption[];
  availableToAdd: LanguageOption[];
  onAddTranslation: (languageCode: string) => void;
  onRemoveTranslation: (languageCode: string) => void;
  rolePlaceholder: string;
  systemRoleNotice: string;
}

export function RoleTranslationFields({
  register,
  errors,
  isSystemRole,
  activeTranslations,
  availableLanguages,
  availableToAdd,
  onAddTranslation,
  onRemoveTranslation,
  rolePlaceholder,
  systemRoleNotice,
}: RoleTranslationFieldsProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="name">
          Role Name (Default / Turkish)
        </label>
        <Input
          id="name"
          {...register('name')}
          placeholder={rolePlaceholder}
          disabled={isSystemRole}
          className={isSystemRole ? 'bg-muted cursor-not-allowed' : ''}
        />
        {isSystemRole && (
          <p className="text-muted-foreground text-xs">{systemRoleNotice}</p>
        )}
        {errors.name && (
          <p className="text-destructive text-xs">{errors.name.message}</p>
        )}
      </div>

      {activeTranslations.length > 0 && (
        <div className="space-y-3">
          {activeTranslations.map((language) => {
            const langLabel =
              availableLanguages.find((l) => l.code === language)?.label ||
              language;
            return (
              <div key={language} className="space-y-2">
                <div className="flex items-center justify-between">
                  <label
                    className="text-sm font-medium"
                    htmlFor={`translation-${language}`}
                  >
                    Role Name ({langLabel})
                  </label>
                  <button
                    type="button"
                    onClick={() => onRemoveTranslation(language)}
                    className="text-xs text-red-400 hover:text-red-300"
                  >
                    Remove
                  </button>
                </div>
                <Input
                  id={`translation-${language}`}
                  {...register(`translations.${language}`)}
                  placeholder={`Role name in ${langLabel}`}
                />
              </div>
            );
          })}
        </div>
      )}

      {availableToAdd.length > 0 && (
        <div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="outline" className="w-full gap-2">
                <span>+</span>
                Add Translation
                <ChevronDown className="ml-auto h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              {availableToAdd.map((lang) => (
                <DropdownMenuItem
                  key={lang.code}
                  onClick={() => onAddTranslation(lang.code)}
                >
                  {lang.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
}
