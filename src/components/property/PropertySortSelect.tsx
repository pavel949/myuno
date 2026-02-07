/**
 * PropertySortSelect - Sort dropdown for property listings
 */

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

export type PropertySortKey = 'recommended' | 'price_asc' | 'price_desc' | 'rating' | 'newest';

interface PropertySortSelectProps {
  value: PropertySortKey;
  onChange: (value: PropertySortKey) => void;
}

const sortOptions: Array<{ value: PropertySortKey; labelEn: string; labelRu: string }> = [
  { value: 'recommended', labelEn: 'Recommended', labelRu: 'Рекомендуемые' },
  { value: 'price_asc', labelEn: 'Price: Low → High', labelRu: 'Цена: по возрастанию' },
  { value: 'price_desc', labelEn: 'Price: High → Low', labelRu: 'Цена: по убыванию' },
  { value: 'rating', labelEn: 'Top Rated', labelRu: 'По рейтингу' },
  { value: 'newest', labelEn: 'Newest', labelRu: 'Новые' },
];

export function PropertySortSelect({ value, onChange }: PropertySortSelectProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  return (
    <Select value={value} onValueChange={(v) => onChange(v as PropertySortKey)}>
      <SelectTrigger className="w-auto gap-1.5 h-8 text-xs border-border/50 bg-background">
        <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {sortOptions.map((opt) => (
          <SelectItem key={opt.value} value={opt.value} className="text-xs">
            {isRu ? opt.labelRu : opt.labelEn}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
