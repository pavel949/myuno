/**
 * @module MultiSelect
 * @description Multi-select component with tags/chips display
 * 
 * Use for selecting multiple options with visual feedback.
 * Supports grouping, search, and keyboard navigation.
 */

import * as React from 'react';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export interface MultiSelectOption {
  value: string;
  label: string;
  labelRu?: string;
  group?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  color?: string;
}

export interface MultiSelectProps {
  options: MultiSelectOption[];
  value?: string[];
  onValueChange?: (value: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  className?: string;
  language?: 'en' | 'ru';
  /** Maximum number of items that can be selected */
  maxItems?: number;
  /** Show selected items as badges in trigger */
  showBadges?: boolean;
  /** Maximum badges to show before collapsing */
  maxBadges?: number;
}

export function MultiSelect({
  options,
  value = [],
  onValueChange,
  placeholder = 'Select items...',
  searchPlaceholder = 'Search...',
  emptyMessage = 'No results found.',
  disabled = false,
  className,
  language = 'en',
  maxItems,
  showBadges = true,
  maxBadges = 3,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');

  const getLabel = (option: MultiSelectOption) => {
    return language === 'ru' && option.labelRu ? option.labelRu : option.label;
  };

  const selectedOptions = options.filter((opt) => value.includes(opt.value));

  // Filter options based on search
  const filteredOptions = React.useMemo(() => {
    if (!searchQuery) return options;
    const query = searchQuery.toLowerCase();
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(query) ||
        opt.labelRu?.toLowerCase().includes(query)
    );
  }, [options, searchQuery]);

  const handleSelect = (optionValue: string) => {
    const isSelected = value.includes(optionValue);
    
    if (isSelected) {
      onValueChange?.(value.filter((v) => v !== optionValue));
    } else {
      if (maxItems && value.length >= maxItems) return;
      onValueChange?.([...value, optionValue]);
    }
  };

  const handleRemove = (optionValue: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onValueChange?.(value.filter((v) => v !== optionValue));
  };

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onValueChange?.([]);
  };

  const displayBadges = showBadges && selectedOptions.length > 0;
  const visibleBadges = selectedOptions.slice(0, maxBadges);
  const hiddenCount = selectedOptions.length - maxBadges;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'w-full min-h-10 h-auto justify-between font-normal',
            !displayBadges && 'text-muted-foreground',
            className
          )}
        >
          <span className="flex flex-wrap items-center gap-1 flex-1">
            {displayBadges ? (
              <>
                {visibleBadges.map((option) => (
                  <Badge
                    key={option.value}
                    variant="secondary"
                    className="flex items-center gap-1 px-2 py-0.5"
                    style={option.color ? { backgroundColor: `${option.color}20`, color: option.color } : undefined}
                  >
                    {option.icon}
                    <span className="max-w-[100px] truncate text-xs">
                      {getLabel(option)}
                    </span>
                    <X
                      className="h-3 w-3 cursor-pointer opacity-70 hover:opacity-100"
                      onClick={(e) => handleRemove(option.value, e)}
                    />
                  </Badge>
                ))}
                {hiddenCount > 0 && (
                  <Badge variant="outline" className="px-2 py-0.5 text-xs">
                    +{hiddenCount}
                  </Badge>
                )}
              </>
            ) : (
              placeholder
            )}
          </span>
          <span className="flex items-center gap-1 shrink-0 ml-2">
            {value.length > 0 && (
              <X
                className="h-4 w-4 opacity-50 hover:opacity-100"
                onClick={handleClearAll}
              />
            )}
            <ChevronsUpDown className="h-4 w-4 opacity-50" />
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[--radix-popover-trigger-width] p-0 z-[999]" 
        align="start"
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={searchPlaceholder}
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList className="max-h-[300px] overflow-y-auto touch-pan-y">
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {filteredOptions.map((option) => {
                const isSelected = value.includes(option.value);
                const isDisabled = option.disabled || (!isSelected && maxItems && value.length >= maxItems);
                
                return (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    disabled={isDisabled}
                    onSelect={() => handleSelect(option.value)}
                    className="flex items-center gap-2"
                  >
                    <div
                      className={cn(
                        'flex h-4 w-4 items-center justify-center rounded border',
                        isSelected
                          ? 'bg-primary border-primary text-primary-foreground'
                          : 'border-input'
                      )}
                    >
                      {isSelected && <Check className="h-3 w-3" />}
                    </div>
                    {option.icon}
                    <span 
                      className={cn(option.color && 'font-medium')}
                      style={option.color ? { color: option.color } : undefined}
                    >
                      {getLabel(option)}
                    </span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
        {maxItems && (
          <div className="border-t p-2 text-xs text-muted-foreground text-center">
            {language === 'ru' 
              ? `Выбрано ${value.length} из ${maxItems}` 
              : `Selected ${value.length} of ${maxItems}`}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
