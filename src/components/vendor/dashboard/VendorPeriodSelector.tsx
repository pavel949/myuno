/**
 * VendorPeriodSelector - Timeframe selector for charts/analytics
 * Benchmark: Stripe, Shopify Analytics
 */
import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

export type Period = '7d' | '14d' | '30d' | '90d' | 'ytd' | 'all';

interface PeriodOption {
  value: Period;
  labelEn: string;
  labelRu: string;
  days: number | null;
}

const periodOptions: PeriodOption[] = [
  { value: '7d', labelEn: 'Last 7 days', labelRu: 'За 7 дней', days: 7 },
  { value: '14d', labelEn: 'Last 14 days', labelRu: 'За 14 дней', days: 14 },
  { value: '30d', labelEn: 'Last 30 days', labelRu: 'За 30 дней', days: 30 },
  { value: '90d', labelEn: 'Last 90 days', labelRu: 'За 90 дней', days: 90 },
  { value: 'ytd', labelEn: 'Year to date', labelRu: 'С начала года', days: null },
  { value: 'all', labelEn: 'All time', labelRu: 'Всё время', days: null },
];

interface VendorPeriodSelectorProps {
  value: Period;
  onChange: (value: Period) => void;
  className?: string;
  compact?: boolean;
}

export function VendorPeriodSelector({
  value,
  onChange,
  className,
  compact = false,
}: VendorPeriodSelectorProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const currentOption = periodOptions.find(o => o.value === value) || periodOptions[0];

  return (
    <Select value={value} onValueChange={(v) => onChange(v as Period)}>
      <SelectTrigger className={cn(
        "h-8 text-xs",
        compact ? "w-[110px]" : "w-[140px]",
        className
      )}>
        <Calendar className="h-3 w-3 mr-1.5 text-muted-foreground" />
        <SelectValue>
          {isRu ? currentOption.labelRu : currentOption.labelEn}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {periodOptions.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {isRu ? option.labelRu : option.labelEn}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// Helper to get date range from period
export function getPeriodDateRange(period: Period): { start: Date; end: Date } {
  const end = new Date();
  let start: Date;

  switch (period) {
    case '7d':
      start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '14d':
      start = new Date(end.getTime() - 14 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case '90d':
      start = new Date(end.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case 'ytd':
      start = new Date(end.getFullYear(), 0, 1);
      break;
    case 'all':
    default:
      start = new Date(2020, 0, 1); // Fallback to a reasonable start date
      break;
  }

  return { start, end };
}

// Helper to get comparison period (previous period of same length)
export function getComparisonPeriodRange(period: Period): { start: Date; end: Date } {
  const { start, end } = getPeriodDateRange(period);
  const duration = end.getTime() - start.getTime();
  
  return {
    start: new Date(start.getTime() - duration),
    end: new Date(end.getTime() - duration),
  };
}
