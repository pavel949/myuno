/**
 * PropertySortSelect - Sort dropdown for property listings
 */

import { pickLang } from '@/lib/i18n/pickLang';
import React from 'react';
import { ArrowUpDown } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { PropertySortKey } from '@/lib/propertySortPrice';

export type { PropertySortKey } from '@/lib/propertySortPrice';

interface PropertySortSelectProps {
  value: PropertySortKey;
  onChange: (value: PropertySortKey) => void;
}

const sortOptions: Array<{ value: PropertySortKey; labelEn: string; labelRu: string; labelTh: string }> = [
  { value: 'recommended', labelEn: 'Recommended', labelRu: 'Рекомендуемые', labelTh: 'แนะนำ' },
  { value: 'price_asc', labelEn: 'Price: Low → High', labelRu: 'Цена: по возрастанию', labelTh: 'ราคา: ต่ำไปสูง' },
  { value: 'price_desc', labelEn: 'Price: High → Low', labelRu: 'Цена: по убыванию', labelTh: 'ราคา: สูงไปต่ำ' },
  { value: 'rating', labelEn: 'Top Rated', labelRu: 'По рейтингу', labelTh: 'คะแนนสูงสุด' },
  { value: 'newest', labelEn: 'Newest', labelRu: 'Новые', labelTh: 'ใหม่ล่าสุด' },
];

export function PropertySortSelect({ value, onChange }: PropertySortSelectProps) {
  const { language } = useLanguage();

  return (
    <Select value={value} onValueChange={(v) => onChange(v as PropertySortKey)}>
      <SelectTrigger aria-label={pickLang(language, { ru: 'Сортировка', en: 'Sort homes', th: 'เรียงลำดับที่พัก' })} className="w-auto gap-1.5 h-8 text-xs border-border/50 bg-background">
        <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {sortOptions.map((opt) => (
          <SelectItem key={opt.value} value={opt.value} className="text-xs">
            {pickLang(language, { ru: opt.labelRu, en: opt.labelEn, th: opt.labelTh })}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
