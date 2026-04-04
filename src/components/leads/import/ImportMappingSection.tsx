'use client';

import { useTranslations } from 'next-intl';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MAPPING_FIELD_LABEL_KEYS, NONE_VALUE, type ImportMapping } from './import.types';

type ImportMappingSectionProps = {
  mapping: ImportMapping;
  setMapping: (val: React.SetStateAction<ImportMapping>) => void;
  headers: string[];
};

export function ImportMappingSection({ mapping, setMapping, headers }: ImportMappingSectionProps) {
  const t = useTranslations('Leads');

  return (
    <section className="space-y-3 rounded-lg border p-3">
      <div>
        <h3 className="text-sm font-semibold">
          {t('import.mapping.sectionTitle')}
        </h3>
        <p className="text-muted-foreground text-xs">
          {t('import.mapping.sectionDescription')}
        </p>
      </div>

      {(Object.keys(MAPPING_FIELD_LABEL_KEYS) as Array<keyof ImportMapping>).map((fieldKey) => (
        <div key={fieldKey} className="grid gap-1">
          <p className="text-sm font-medium">
            {t(MAPPING_FIELD_LABEL_KEYS[fieldKey] as never)}
          </p>
          <Select
            value={mapping[fieldKey] || NONE_VALUE}
            onValueChange={(value) =>
              setMapping((previousMapping) => ({
                ...previousMapping,
                [fieldKey]: value === NONE_VALUE ? '' : value,
              }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder={t('import.mapping.selectColumn')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE_VALUE}>
                {t('import.mapping.none')}
              </SelectItem>
              {headers.map((header) => (
                <SelectItem key={`${fieldKey}-${header}`} value={header}>
                  {header}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ))}
    </section>
  );
}
