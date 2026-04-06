import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, ChevronDown } from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear, subYears, startOfQuarter, endOfQuarter, subQuarters } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export type DatePreset = 'this_month' | 'last_month' | 'this_quarter' | 'last_quarter' | 'this_year' | 'last_year' | 'all_time' | 'custom';

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

interface FinancialDateFilterProps {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  preset: DatePreset;
  onPresetChange: (preset: DatePreset) => void;
}

export function FinancialDateFilter({ 
  dateRange, 
  onDateRangeChange, 
  preset, 
  onPresetChange 
}: FinancialDateFilterProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const [isOpen, setIsOpen] = useState(false);

  const presets: { value: DatePreset; label: string; labelRu: string }[] = [
    { value: 'this_month', label: 'This Month', labelRu: 'Текущий месяц' },
    { value: 'last_month', label: 'Last Month', labelRu: 'Прошлый месяц' },
    { value: 'this_quarter', label: 'This Quarter', labelRu: 'Текущий квартал' },
    { value: 'last_quarter', label: 'Last Quarter', labelRu: 'Прошлый квартал' },
    { value: 'this_year', label: 'This Year', labelRu: 'Текущий год' },
    { value: 'last_year', label: 'Last Year', labelRu: 'Прошлый год' },
    { value: 'all_time', label: 'All Time', labelRu: 'Всё время' },
    { value: 'custom', label: 'Custom', labelRu: 'Произвольный' },
  ];

  const getPresetDateRange = (presetValue: DatePreset): DateRange => {
    const now = new Date();
    
    switch (presetValue) {
      case 'this_month':
        return { from: startOfMonth(now), to: endOfMonth(now) };
      case 'last_month': {
        const lastMonth = subMonths(now, 1);
        return { from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) };
      }
      case 'this_quarter':
        return { from: startOfQuarter(now), to: endOfQuarter(now) };
      case 'last_quarter': {
        const lastQuarter = subQuarters(now, 1);
        return { from: startOfQuarter(lastQuarter), to: endOfQuarter(lastQuarter) };
      }
      case 'this_year':
        return { from: startOfYear(now), to: endOfYear(now) };
      case 'last_year': {
        const lastYear = subYears(now, 1);
        return { from: startOfYear(lastYear), to: endOfYear(lastYear) };
      }
      case 'all_time':
        return { from: undefined, to: undefined };
      case 'custom':
        return dateRange;
      default:
        return { from: undefined, to: undefined };
    }
  };

  const handlePresetClick = (presetValue: DatePreset) => {
    onPresetChange(presetValue);
    if (presetValue !== 'custom') {
      onDateRangeChange(getPresetDateRange(presetValue));
      setIsOpen(false);
    }
  };

  const currentPresetLabel = presets.find(p => p.value === preset);
  
  const formatDateRange = () => {
    if (preset === 'all_time' || (!dateRange.from && !dateRange.to)) {
      return isRu ? 'Всё время' : 'All Time';
    }
    if (preset !== 'custom') {
      return isRu ? currentPresetLabel?.labelRu : currentPresetLabel?.label;
    }
    if (dateRange.from && dateRange.to) {
      return `${format(dateRange.from, 'd MMM', { locale: isRu ? ru : undefined })} - ${format(dateRange.to, 'd MMM yyyy', { locale: isRu ? ru : undefined })}`;
    }
    if (dateRange.from) {
      return `${isRu ? 'с' : 'from'} ${format(dateRange.from, 'd MMM yyyy', { locale: isRu ? ru : undefined })}`;
    }
    return isRu ? 'Выберите даты' : 'Select dates';
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "justify-start text-left font-normal",
            !dateRange.from && !dateRange.to && preset === 'all_time' && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          <span className="truncate">{formatDateRange()}</span>
          <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex">
          {/* Presets sidebar */}
          <div className="border-r p-2 space-y-1">
            {presets.map((p) => (
              <Button
                key={p.value}
                variant={preset === p.value ? "secondary" : "ghost"}
                size="sm"
                className="w-full justify-start"
                onClick={() => handlePresetClick(p.value)}
              >
                {isRu ? p.labelRu : p.label}
              </Button>
            ))}
          </div>

          {/* Calendar for custom selection */}
          {preset === 'custom' && (
            <div className="p-3">
              <Calendar
                mode="range"
                selected={{ from: dateRange.from, to: dateRange.to }}
                onSelect={(range) => {
                  onDateRangeChange({
                    from: range?.from,
                    to: range?.to,
                  });
                }}
                numberOfMonths={1}
                locale={isRu ? ru : undefined}
              />
              <div className="flex justify-end mt-2">
                <Button 
                  size="sm" 
                  onClick={() => setIsOpen(false)}
                  disabled={!dateRange.from || !dateRange.to}
                >
                  {isRu ? 'Применить' : 'Apply'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Extended stats interface
export interface ExtendedFinancialStats {
  totalIncome: number;
  totalExpenses: number;
  netIncome: number;
  pendingPayments: number;
  periodIncome: number;
  periodExpenses: number;
  incomeByCategory: Record<string, number>;
  expensesByCategory: Record<string, number>;
  // New extended fields
  occupancyRate?: number;
  averageNightlyRate?: number;
  profitMargin: number;
  transactionCount: number;
  avgTransactionAmount: number;
  expenseBreakdown: {
    fixed: number;
    variable: number;
    platform: number;
  };
}

// Fixed expense categories
export const FIXED_EXPENSE_CATEGORIES = ['taxes', 'income_tax', 'insurance', 'loan_payment', 'depreciation'];
export const PLATFORM_EXPENSE_CATEGORIES = ['platform_fee', 'management_fee'];
