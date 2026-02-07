import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MapPin, Building2, Hotel, Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePropertyProjects } from '@/hooks/usePropertyProjects';
import { cn } from '@/lib/utils';

// Popular Phuket hotels/landmarks (static fallback)
const POPULAR_PLACES = [
  { id: 'patong-beach', nameEn: 'Patong Beach Area', nameRu: 'Район Патонг Бич', address: 'Patong, Kathu, Phuket', type: 'area' as const },
  { id: 'kata-beach', nameEn: 'Kata Beach Area', nameRu: 'Район Ката Бич', address: 'Kata, Karon, Phuket', type: 'area' as const },
  { id: 'karon-beach', nameEn: 'Karon Beach Area', nameRu: 'Район Карон Бич', address: 'Karon, Phuket', type: 'area' as const },
  { id: 'bang-tao', nameEn: 'Bang Tao / Laguna Area', nameRu: 'Банг Тао / Лагуна', address: 'Bang Tao, Choeng Thale, Phuket', type: 'area' as const },
  { id: 'old-town', nameEn: 'Phuket Old Town', nameRu: 'Старый город Пхукет', address: 'Talat Yai, Phuket Town', type: 'area' as const },
  { id: 'rawai', nameEn: 'Rawai Area', nameRu: 'Район Равай', address: 'Rawai, Phuket', type: 'area' as const },
  { id: 'kamala', nameEn: 'Kamala Beach Area', nameRu: 'Район Камала', address: 'Kamala, Kathu, Phuket', type: 'area' as const },
  { id: 'surin', nameEn: 'Surin Beach Area', nameRu: 'Район Сурин', address: 'Surin, Choeng Thale, Phuket', type: 'area' as const },
];

interface Suggestion {
  id: string;
  name: string;
  address: string;
  type: 'project' | 'area';
  district?: string;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function AddressAutocomplete({ value, onChange, placeholder, className }: AddressAutocompleteProps) {
  const { language } = useLanguage();
  const { data: projects, isLoading } = usePropertyProjects();
  const [isFocused, setIsFocused] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isRu = language === 'ru';

  const suggestions = useMemo((): Suggestion[] => {
    const projectSuggestions: Suggestion[] = (projects || []).map(p => ({
      id: p.id,
      name: isRu ? p.name_ru : p.name_en,
      address: p.address || p.district || '',
      type: 'project' as const,
      district: p.district,
    }));

    const areaSuggestions: Suggestion[] = POPULAR_PLACES.map(p => ({
      id: p.id,
      name: isRu ? p.nameRu : p.nameEn,
      address: p.address,
      type: 'area' as const,
    }));

    const all = [...projectSuggestions, ...areaSuggestions];

    if (!query || query.length < 1) {
      // Show popular areas first, then some projects
      return [...areaSuggestions.slice(0, 5), ...projectSuggestions.slice(0, 5)];
    }

    const q = query.toLowerCase();
    return all
      .filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.address.toLowerCase().includes(q) ||
        (s.district || '').toLowerCase().includes(q)
      )
      .slice(0, 10);
  }, [projects, query, isRu]);

  const handleSelect = (suggestion: Suggestion) => {
    const fullAddress = suggestion.address
      ? `${suggestion.name}, ${suggestion.address}`
      : suggestion.name;
    onChange(fullAddress);
    setQuery('');
    setIsFocused(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange(val);
    setQuery(val);
    if (!isFocused) setIsFocused(true);
  };

  const handleFocus = () => {
    setIsFocused(true);
    setQuery(value);
  };

  const showDropdown = isFocused && suggestions.length > 0;

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <Input
          ref={inputRef}
          value={value}
          onChange={handleInputChange}
          onFocus={handleFocus}
          placeholder={placeholder || (isRu ? 'Отель, кондо или адрес' : 'Hotel, condo or address')}
          className="h-11 pl-9"
          autoComplete="off"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {showDropdown && (
        <div className="absolute z-[100] left-0 right-0 mt-1 bg-popover border border-border rounded-xl shadow-lg max-h-[280px] overflow-y-auto touch-pan-y">
          {suggestions.some(s => s.type === 'area') && (
            <div className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider bg-muted/50">
              {isRu ? 'Районы' : 'Areas'}
            </div>
          )}
          {suggestions.filter(s => s.type === 'area').map(s => (
            <button
              key={s.id}
              type="button"
              className="w-full flex items-start gap-3 px-3 py-2.5 hover:bg-accent/50 active:bg-accent transition-colors text-left"
              onClick={() => handleSelect(s)}
            >
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <MapPin className="w-4 h-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">{s.name}</p>
                <p className="text-xs text-muted-foreground truncate">{s.address}</p>
              </div>
            </button>
          ))}

          {suggestions.some(s => s.type === 'project') && (
            <div className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider bg-muted/50 border-t border-border/50">
              {isRu ? 'Жилые комплексы' : 'Residences'}
            </div>
          )}
          {suggestions.filter(s => s.type === 'project').map(s => (
            <button
              key={s.id}
              type="button"
              className="w-full flex items-start gap-3 px-3 py-2.5 hover:bg-accent/50 active:bg-accent transition-colors text-left"
              onClick={() => handleSelect(s)}
            >
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0 mt-0.5">
                <Building2 className="w-4 h-4 text-amber-600" />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">{s.name}</p>
                <p className="text-xs text-muted-foreground truncate">{s.address}</p>
              </div>
            </button>
          ))}

          {suggestions.length === 0 && query.length > 0 && (
            <div className="px-3 py-4 text-center text-sm text-muted-foreground">
              {isRu ? 'Ничего не найдено — введите адрес вручную' : 'No results — type address manually'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
