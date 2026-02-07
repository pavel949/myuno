import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { MapPin, Building2, Search, Loader2, Navigation, Keyboard, ExternalLink } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePropertyProjects } from '@/hooks/usePropertyProjects';
import { cn } from '@/lib/utils';

// Popular Phuket areas (static fallback)
const POPULAR_PLACES = [
  { id: 'patong-beach', nameEn: 'Patong Beach Area', nameRu: 'Район Патонг Бич', address: 'Patong, Kathu, Phuket' },
  { id: 'kata-beach', nameEn: 'Kata Beach Area', nameRu: 'Район Ката Бич', address: 'Kata, Karon, Phuket' },
  { id: 'karon-beach', nameEn: 'Karon Beach Area', nameRu: 'Район Карон Бич', address: 'Karon, Phuket' },
  { id: 'bang-tao', nameEn: 'Bang Tao / Laguna Area', nameRu: 'Банг Тао / Лагуна', address: 'Bang Tao, Choeng Thale, Phuket' },
  { id: 'old-town', nameEn: 'Phuket Old Town', nameRu: 'Старый город Пхукет', address: 'Talat Yai, Phuket Town' },
  { id: 'rawai', nameEn: 'Rawai Area', nameRu: 'Район Равай', address: 'Rawai, Phuket' },
  { id: 'kamala', nameEn: 'Kamala Beach Area', nameRu: 'Район Камала', address: 'Kamala, Kathu, Phuket' },
  { id: 'surin', nameEn: 'Surin Beach Area', nameRu: 'Район Сурин', address: 'Surin, Choeng Thale, Phuket' },
];

interface GeocodeSuggestion {
  mapbox_id: string;
  name: string;
  address: string;
  type: string;
}

interface Suggestion {
  id: string;
  name: string;
  address: string;
  source: 'mapbox' | 'project' | 'area';
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function AddressAutocomplete({ value, onChange, placeholder, className }: AddressAutocompleteProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { data: projects } = usePropertyProjects();
  const [isFocused, setIsFocused] = useState(false);
  const [query, setQuery] = useState('');
  const [geocodeResults, setGeocodeResults] = useState<GeocodeSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [geolocating, setGeolocating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Geocode search
  const searchGeocode = useCallback(async (q: string) => {
    if (q.length < 2) {
      setGeocodeResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/geocode-address?query=${encodeURIComponent(q)}&language=${language}`;
      const res = await fetch(url, {
        headers: { 'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
      });
      const json = await res.json();
      setGeocodeResults(json.results || []);
    } catch (err) {
      console.error('[AddressAutocomplete] geocode error:', err);
      setGeocodeResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [language]);

  // Debounced search
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange(val);
    setQuery(val);
    if (!isFocused) setIsFocused(true);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchGeocode(val), 300);
  };

  // DB project suggestions filtered by query
  const projectSuggestions = useMemo((): Suggestion[] => {
    const items = (projects || []).map(p => ({
      id: p.id,
      name: isRu ? p.name_ru : p.name_en,
      address: p.address || p.district || '',
      source: 'project' as const,
    }));
    if (!query || query.length < 1) return items.slice(0, 4);
    const q = query.toLowerCase();
    return items.filter(s => s.name.toLowerCase().includes(q) || s.address.toLowerCase().includes(q)).slice(0, 4);
  }, [projects, query, isRu]);

  // Area suggestions
  const areaSuggestions = useMemo((): Suggestion[] => {
    const items = POPULAR_PLACES.map(p => ({
      id: p.id,
      name: isRu ? p.nameRu : p.nameEn,
      address: p.address,
      source: 'area' as const,
    }));
    if (!query || query.length < 2) return items;
    const q = query.toLowerCase();
    return items.filter(s => s.name.toLowerCase().includes(q) || s.address.toLowerCase().includes(q));
  }, [query, isRu]);

  // Mapbox suggestions
  const mapboxSuggestions = useMemo((): Suggestion[] =>
    geocodeResults.map(r => ({
      id: r.mapbox_id,
      name: r.name,
      address: r.address,
      source: 'mapbox' as const,
    })),
  [geocodeResults]);

  const handleSelect = (s: Suggestion) => {
    const full = s.address && s.address !== s.name ? `${s.name}, ${s.address}` : s.name;
    onChange(full);
    setQuery('');
    setGeocodeResults([]);
    setIsFocused(false);
  };

  const handleFocus = () => {
    setIsFocused(true);
    setQuery(value);
  };

  // "Use my location" via browser geolocation + reverse geocode
  const handleUseLocation = async () => {
    if (!navigator.geolocation) return;
    setGeolocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/geocode-address?lat=${latitude}&lng=${longitude}&language=${language}`;
          const res = await fetch(url, {
            headers: { 'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
          });
          const json = await res.json();
          if (json.results?.[0]) {
            onChange(json.results[0].address || json.results[0].name);
          }
        } catch (err) {
          console.error('[AddressAutocomplete] reverse geocode error:', err);
        } finally {
          setGeolocating(false);
          setIsFocused(false);
        }
      },
      () => setGeolocating(false),
      { timeout: 8000 }
    );
  };

  const hasMapbox = mapboxSuggestions.length > 0;
  const hasProjects = projectSuggestions.length > 0;
  const hasAreas = areaSuggestions.length > 0;
  const showDropdown = isFocused && (hasMapbox || hasProjects || hasAreas || isSearching || query.length === 0);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="relative flex gap-1.5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            value={value}
            onChange={handleInputChange}
            onFocus={handleFocus}
            placeholder={placeholder || (isRu ? 'Отель, вилла или адрес' : 'Hotel, villa or address')}
            className="h-11 pl-9 pr-9"
            autoComplete="off"
          />
          {isSearching && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
          )}
        </div>
        {value && value.length >= 3 && (
          <button
            type="button"
            title={isRu ? 'Открыть на карте' : 'Open on map'}
            className="h-11 w-11 shrink-0 rounded-lg border border-border bg-background flex items-center justify-center hover:bg-accent transition-colors"
            onClick={() => {
              const mapQuery = encodeURIComponent(value);
              const mapUrl = isRu
                ? `https://yandex.ru/maps/?text=${mapQuery}`
                : `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;
              window.open(mapUrl, '_blank', 'noopener');
            }}
          >
            <ExternalLink className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {showDropdown && (
        <div className="absolute z-[100] left-0 right-0 mt-1 bg-popover border border-border rounded-xl shadow-lg max-h-[60vh] overflow-y-auto touch-pan-y">
          {/* Use my location */}
          <button
            type="button"
            className="w-full flex items-center gap-3 px-3 py-3 hover:bg-accent/50 active:bg-accent transition-colors text-left border-b border-border/50"
            onClick={handleUseLocation}
            disabled={geolocating}
          >
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
              {geolocating ? <Loader2 className="w-4 h-4 animate-spin text-blue-500" /> : <Navigation className="w-4 h-4 text-blue-500" />}
            </div>
            <span className="text-sm font-medium">{isRu ? 'Мое местоположение' : 'Use my location'}</span>
          </button>

          {/* Mapbox geocode results */}
          {hasMapbox && (
            <>
              <div className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider bg-muted/50">
                {isRu ? 'Результаты поиска' : 'Search results'}
              </div>
              {mapboxSuggestions.map(s => (
                <SuggestionRow key={s.id} suggestion={s} onSelect={handleSelect} icon={<MapPin className="w-4 h-4 text-primary" />} iconBg="bg-primary/10" />
              ))}
            </>
          )}

          {/* DB projects */}
          {hasProjects && (
            <>
              <div className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider bg-muted/50 border-t border-border/50">
                {isRu ? 'Жилые комплексы' : 'Residences'}
              </div>
              {projectSuggestions.map(s => (
                <SuggestionRow key={s.id} suggestion={s} onSelect={handleSelect} icon={<Building2 className="w-4 h-4 text-amber-600" />} iconBg="bg-amber-500/10" />
              ))}
            </>
          )}

          {/* Popular areas - only when no mapbox results */}
          {!hasMapbox && hasAreas && (
            <>
              <div className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider bg-muted/50 border-t border-border/50">
                {isRu ? 'Популярные районы' : 'Popular areas'}
              </div>
              {areaSuggestions.map(s => (
                <SuggestionRow key={s.id} suggestion={s} onSelect={handleSelect} icon={<MapPin className="w-4 h-4 text-muted-foreground" />} iconBg="bg-muted" />
              ))}
            </>
          )}

          {/* Loading state */}
          {isSearching && !hasMapbox && (
            <div className="px-3 py-4 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              {isRu ? 'Поиск...' : 'Searching...'}
            </div>
          )}

          {/* Manual entry hint */}
          {query.length >= 2 && !isSearching && !hasMapbox && (
            <div className="px-3 py-3 text-center text-xs text-muted-foreground border-t border-border/50 flex items-center justify-center gap-1.5">
              <Keyboard className="w-3.5 h-3.5" />
              {isRu ? 'Или введите адрес вручную' : 'Or type your address manually'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SuggestionRow({ suggestion, onSelect, icon, iconBg }: {
  suggestion: Suggestion;
  onSelect: (s: Suggestion) => void;
  icon: React.ReactNode;
  iconBg: string;
}) {
  return (
    <button
      type="button"
      className="w-full flex items-start gap-3 px-3 py-2.5 hover:bg-accent/50 active:bg-accent transition-colors text-left min-h-[48px]"
      onClick={() => onSelect(suggestion)}
    >
      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5", iconBg)}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="font-medium text-sm truncate">{suggestion.name}</p>
        <p className="text-xs text-muted-foreground truncate">{suggestion.address}</p>
      </div>
    </button>
  );
}
