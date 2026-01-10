import React from 'react';
import { useCurrency, currencies } from '@/contexts/CurrencyContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface CurrencySwitcherProps {
  size?: 'sm' | 'default';
  className?: string;
}

export function CurrencySwitcher({ size = 'default', className }: CurrencySwitcherProps) {
  const { currency, setCurrency, currencyInfo } = useCurrency();
  const { language } = useLanguage();

  const currencyList = Object.values(currencies);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg",
            "bg-secondary/50 hover:bg-secondary text-foreground",
            "text-xs font-medium transition-colors",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
            size === 'sm' && "px-2 py-1 text-[11px]",
            className
          )}
        >
          <span>{currencyInfo.symbol}</span>
          <span className="hidden sm:inline">{currency}</span>
          <ChevronDown className="w-3 h-3 opacity-50" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[160px] bg-popover border border-border">
        {currencyList.map((curr) => (
          <DropdownMenuItem
            key={curr.code}
            onClick={() => setCurrency(curr.code)}
            className="flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span className="text-base w-5">{curr.symbol}</span>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{curr.code}</span>
                <span className="text-xs text-muted-foreground">
                  {language === 'ru' ? curr.nameRu : curr.name}
                </span>
              </div>
            </div>
            {currency === curr.code && (
              <Check className="w-4 h-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
