/**
 * @module SearchableSelect
 * @description Select component with search functionality for long lists
 * 
 * Use this for lists with 10+ items where users need to find options quickly.
 * Supports grouping, custom rendering, and keyboard navigation.
 */

import * as React from 'react';
import { Check, ChevronsUpDown, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
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

export interface SearchableSelectOption {
  value: string;
  label: string;
  labelRu?: string;
  group?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  description?: string;
}

export interface SearchableSelectProps {
  options: SearchableSelectOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  className?: string;
  language?: 'en' | 'ru';
  /** Show clear button when value is selected */
  clearable?: boolean;
  /** Group options by their group property */
  grouped?: boolean;
}

export function SearchableSelect({
  options,
  value,
  onValueChange,
  placeholder = 'Select...',
  searchPlaceholder = 'Search...',
  emptyMessage = 'No results found.',
  disabled = false,
  className,
  language = 'en',
  clearable = false,
  grouped = false,
}: SearchableSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');

  const selectedOption = options.find((opt) => opt.value === value);

  const getLabel = (option: SearchableSelectOption) => {
    return language === 'ru' && option.labelRu ? option.labelRu : option.label;
  };

  // Filter options based on search
  const filteredOptions = React.useMemo(() => {
    if (!searchQuery) return options;
    const query = searchQuery.toLowerCase();
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(query) ||
        opt.labelRu?.toLowerCase().includes(query) ||
        opt.description?.toLowerCase().includes(query)
    );
  }, [options, searchQuery]);

  // Group options if needed
  const groupedOptions = React.useMemo(() => {
    if (!grouped) return { '': filteredOptions };
    
    return filteredOptions.reduce((acc, opt) => {
      const group = opt.group || '';
      if (!acc[group]) acc[group] = [];
      acc[group].push(opt);
      return acc;
    }, {} as Record<string, SearchableSelectOption[]>);
  }, [filteredOptions, grouped]);

  const handleSelect = (optionValue: string) => {
    onValueChange?.(optionValue);
    setOpen(false);
    setSearchQuery('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onValueChange?.('');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'w-full justify-between font-normal',
            !value && 'text-muted-foreground',
            className
          )}
        >
          <span className="flex items-center gap-2 truncate">
            {selectedOption?.icon}
            {selectedOption ? getLabel(selectedOption) : placeholder}
          </span>
          <span className="flex items-center gap-1">
            {clearable && value && (
              <X
                className="h-4 w-4 opacity-50 hover:opacity-100"
                onClick={handleClear}
              />
            )}
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
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
            {Object.entries(groupedOptions).map(([groupName, groupOptions]) => (
              <CommandGroup key={groupName} heading={groupName || undefined}>
                {groupOptions.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    disabled={option.disabled}
                    onSelect={() => handleSelect(option.value)}
                    className="flex items-center gap-2"
                  >
                    <Check
                      className={cn(
                        'h-4 w-4',
                        value === option.value ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    {option.icon}
                    <div className="flex flex-col">
                      <span>{getLabel(option)}</span>
                      {option.description && (
                        <span className="text-xs text-muted-foreground">
                          {option.description}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
