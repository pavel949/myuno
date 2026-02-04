import React, { useState } from 'react';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { ALL_SERVICE_CATEGORIES, SERVICE_DOMAINS } from '@/lib/config/homeServicesTaxonomy';

// General business categories (non-home-services)
const GENERAL_CATEGORIES = [
  { id: 'beauty', labelEn: 'Beauty & Spa', labelRu: 'Красота и спа', icon: '💆' },
  { id: 'food', labelEn: 'Food & Restaurants', labelRu: 'Еда и рестораны', icon: '🍽️' },
  { id: 'transport', labelEn: 'Transport', labelRu: 'Транспорт', icon: '🚗' },
  { id: 'medical', labelEn: 'Medical', labelRu: 'Медицина', icon: '🏥' },
  { id: 'fitness', labelEn: 'Fitness', labelRu: 'Фитнес', icon: '🏋️' },
  { id: 'education', labelEn: 'Education', labelRu: 'Образование', icon: '📚' },
  { id: 'tours', labelEn: 'Tours & Excursions', labelRu: 'Туры и экскурсии', icon: '🗺️' },
  { id: 'water', labelEn: 'Water Activities', labelRu: 'Водные развлечения', icon: '🌊' },
  { id: 'property', labelEn: 'Property', labelRu: 'Недвижимость', icon: '🏠' },
  { id: 'legal', labelEn: 'Legal Services', labelRu: 'Юридические услуги', icon: '⚖️' },
  { id: 'pets', labelEn: 'Pet Services', labelRu: 'Услуги для питомцев', icon: '🐕' },
  { id: 'events', labelEn: 'Events', labelRu: 'Мероприятия', icon: '🎉' },
  { id: 'yachts', labelEn: 'Yachts', labelRu: 'Яхты', icon: '⛵' },
  { id: 'flowers', labelEn: 'Flowers', labelRu: 'Цветы', icon: '💐' },
];

interface CategoryOption {
  id: string;
  labelEn: string;
  labelRu: string;
  icon?: string;
  group?: string;
}

interface CategorySelectorProps {
  value: string | string[];
  onChange: (value: string | string[]) => void;
  multiple?: boolean;
  placeholder?: string;
  className?: string;
}

export function CategorySelector({
  value,
  onChange,
  multiple = false,
  placeholder,
  className,
}: CategorySelectorProps) {
  const [open, setOpen] = useState(false);
  const { language } = useLanguage();
  const isRussian = language === 'ru';

  // Normalize value to array for internal handling
  const selectedValues = Array.isArray(value) ? value : value ? [value] : [];

  // Build category groups
  const categoryGroups = [
    {
      id: 'home_services',
      label: isRussian ? '🏠 Домашние услуги' : '🏠 Home Services',
      categories: ALL_SERVICE_CATEGORIES.map(cat => ({
        id: cat.id,
        labelEn: cat.labelEn,
        labelRu: cat.labelRu,
        icon: cat.icon,
        group: 'home_services',
      })),
    },
    {
      id: 'general',
      label: isRussian ? '🏢 Общие категории' : '🏢 General Verticals',
      categories: GENERAL_CATEGORIES.map(cat => ({
        id: cat.id,
        labelEn: cat.labelEn,
        labelRu: cat.labelRu,
        icon: cat.icon,
        group: 'general',
      })),
    },
  ];

  // Flatten for lookup
  const allCategories = categoryGroups.flatMap(g => g.categories);

  const handleSelect = (categoryId: string) => {
    if (multiple) {
      const newValues = selectedValues.includes(categoryId)
        ? selectedValues.filter(v => v !== categoryId)
        : [...selectedValues, categoryId];
      onChange(newValues);
    } else {
      onChange(categoryId);
      setOpen(false);
    }
  };

  const getDisplayValue = () => {
    if (selectedValues.length === 0) {
      return placeholder || (isRussian ? 'Выберите категорию...' : 'Select category...');
    }
    
    if (multiple && selectedValues.length > 2) {
      return isRussian 
        ? `${selectedValues.length} категорий выбрано`
        : `${selectedValues.length} categories selected`;
    }
    
    return selectedValues
      .map(v => {
        const cat = allCategories.find(c => c.id === v);
        return cat ? `${cat.icon || ''} ${isRussian ? cat.labelRu : cat.labelEn}`.trim() : v;
      })
      .join(', ');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('w-full justify-between font-normal', className)}
        >
          <span className="truncate">{getDisplayValue()}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[320px] p-0" 
        align="start"
        side="bottom"
        sideOffset={4}
      >
        <Command>
          <CommandInput 
            placeholder={isRussian ? 'Поиск категории...' : 'Search category...'} 
          />
          <CommandList className="max-h-[300px]">
            <CommandEmpty>
              {isRussian ? 'Категория не найдена' : 'No category found'}
            </CommandEmpty>
            
            {categoryGroups.map((group, groupIndex) => (
              <React.Fragment key={group.id}>
                {groupIndex > 0 && <CommandSeparator />}
                <CommandGroup heading={group.label}>
                  {group.categories.map((category) => (
                    <CommandItem
                      key={category.id}
                      value={`${category.id} ${category.labelEn} ${category.labelRu}`}
                      onSelect={() => handleSelect(category.id)}
                      className="cursor-pointer"
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          selectedValues.includes(category.id) ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      <span className="mr-2">{category.icon}</span>
                      <span>{isRussian ? category.labelRu : category.labelEn}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </React.Fragment>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// Export the general categories for use in other components
export { GENERAL_CATEGORIES };
