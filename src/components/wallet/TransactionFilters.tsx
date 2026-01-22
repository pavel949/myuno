import { useState } from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Calendar as CalendarIcon, Filter, Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { TransactionFilters as Filters, TransactionType } from '@/hooks/useWalletTransactions';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface TransactionFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  onExport?: () => void;
}

const typeOptions: { value: TransactionType | 'all'; labelRu: string; labelEn: string }[] = [
  { value: 'all', labelRu: 'Все типы', labelEn: 'All types' },
  { value: 'topup', labelRu: 'Пополнения', labelEn: 'Top-ups' },
  { value: 'payment', labelRu: 'Оплаты', labelEn: 'Payments' },
  { value: 'refund', labelRu: 'Возвраты', labelEn: 'Refunds' },
  { value: 'bonus', labelRu: 'Бонусы', labelEn: 'Bonuses' },
  { value: 'cashback', labelRu: 'Кэшбэк', labelEn: 'Cashback' },
];

export function TransactionFiltersComponent({
  filters,
  onFiltersChange,
  onExport,
}: TransactionFiltersProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const [isOpen, setIsOpen] = useState(false);

  const activeFilterCount = [
    filters.type && filters.type !== 'all',
    filters.dateFrom,
    filters.dateTo,
  ].filter(Boolean).length;

  const clearFilters = () => {
    onFiltersChange({});
  };

  return (
    <div className="flex items-center gap-2">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="w-4 h-4" />
            {isRu ? 'Фильтры' : 'Filters'}
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="start">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">{isRu ? 'Фильтры' : 'Filters'}</h4>
              {activeFilterCount > 0 && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 text-xs">
                  <X className="w-3 h-3 mr-1" />
                  {isRu ? 'Сбросить' : 'Clear'}
                </Button>
              )}
            </div>

            {/* Type filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{isRu ? 'Тип' : 'Type'}</label>
              <Select
                value={filters.type || 'all'}
                onValueChange={(value) => onFiltersChange({ 
                  ...filters, 
                  type: value as TransactionType | 'all' 
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {typeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {isRu ? option.labelRu : option.labelEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date from */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{isRu ? 'С даты' : 'From date'}</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !filters.dateFrom && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dateFrom 
                      ? format(filters.dateFrom, 'PPP', { locale: isRu ? ru : undefined })
                      : isRu ? 'Выберите дату' : 'Pick a date'
                    }
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.dateFrom}
                    onSelect={(date) => onFiltersChange({ ...filters, dateFrom: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Date to */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{isRu ? 'По дату' : 'To date'}</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !filters.dateTo && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dateTo 
                      ? format(filters.dateTo, 'PPP', { locale: isRu ? ru : undefined })
                      : isRu ? 'Выберите дату' : 'Pick a date'
                    }
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.dateTo}
                    onSelect={(date) => onFiltersChange({ ...filters, dateTo: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {onExport && (
        <Button variant="outline" size="sm" onClick={onExport} className="gap-2">
          <Download className="w-4 h-4" />
          {isRu ? 'Экспорт' : 'Export'}
        </Button>
      )}
    </div>
  );
}
