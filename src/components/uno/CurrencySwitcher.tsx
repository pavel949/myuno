import React from 'react';
import { useCurrency, currencies, Currency } from '@/contexts/CurrencyContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
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
        <Button 
          variant="ghost" 
          size="sm"
          className={cn(
            "h-8 px-2 gap-1 font-medium text-xs",
            size === 'sm' && "h-7 px-1.5 text-xs",
            className
          )}
        >
          <span className="text-sm">{currencyInfo.symbol}</span>
          <span className="hidden sm:inline">{currency}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[140px]">
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
