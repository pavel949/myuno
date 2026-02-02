import { useState, useRef, useEffect } from 'react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, ChevronsUpDown, Store } from 'lucide-react';
import { useExpenseAutocomplete } from '@/hooks/useExpenseAutocomplete';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface VendorComboboxProps {
  value: string;
  onChange: (value: string) => void;
  onCategorySuggestion?: (category: string) => void;
  placeholder?: string;
  className?: string;
}

export function VendorCombobox({
  value,
  onChange,
  onCategorySuggestion,
  placeholder,
  className,
}: VendorComboboxProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const { recentVendors, suggestVendor, suggestCategory, isLoading } = useExpenseAutocomplete();

  const suggestions = suggestVendor(inputValue);
  const defaultPlaceholder = isRu ? 'Поставщик / магазин' : 'Vendor / store';

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleSelect = (vendorName: string) => {
    onChange(vendorName);
    setInputValue(vendorName);
    setOpen(false);

    // Suggest category based on vendor history
    const suggestedCategory = suggestCategory(vendorName);
    if (suggestedCategory && onCategorySuggestion) {
      onCategorySuggestion(suggestedCategory);
    }
  };

  const handleInputChange = (newValue: string) => {
    setInputValue(newValue);
    onChange(newValue);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className={cn('relative', className)}>
          <Store className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={() => setOpen(true)}
            placeholder={placeholder || defaultPlaceholder}
            className="pl-10 pr-10"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
            onClick={() => setOpen(!open)}
          >
            <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandList>
            {suggestions.length === 0 && inputValue && (
              <CommandEmpty>
                {isRu ? 'Нет совпадений' : 'No matches found'}
              </CommandEmpty>
            )}
            {suggestions.length > 0 && (
              <CommandGroup heading={isRu ? 'Недавние' : 'Recent'}>
                {suggestions.map((vendor) => (
                  <CommandItem
                    key={vendor.name}
                    value={vendor.name}
                    onSelect={() => handleSelect(vendor.name)}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <Check
                        className={cn(
                          'h-4 w-4',
                          value === vendor.name ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      <span>{vendor.name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {vendor.count} {isRu ? 'раз' : 'times'}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {!inputValue && recentVendors.length > 0 && (
              <CommandGroup heading={isRu ? 'Популярные' : 'Frequent'}>
                {recentVendors.slice(0, 5).map((vendor) => (
                  <CommandItem
                    key={vendor.name}
                    value={vendor.name}
                    onSelect={() => handleSelect(vendor.name)}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <Check
                        className={cn(
                          'h-4 w-4',
                          value === vendor.name ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      <span>{vendor.name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {vendor.count} {isRu ? 'раз' : 'times'}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
