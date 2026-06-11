import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { MapPin, Building2, Search, Loader2, Navigation, Keyboard, ExternalLink, Hotel, Check, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePropertyProjects } from '@/hooks/usePropertyProjects';
import { useGoogleGeocode } from '@/hooks/useGoogleGeocode';
import { hasGoogleMapsKey } from '@/lib/googleMaps';
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
  place_id: string;
  name: string;
  address: string;
  type: string;
  lat?: number;
  lng?: number;
}

interface Suggestion {
  id: string;
  name: string;
  address: string;
  source: 'google' | 'project' | 'area' | 'hotel';
  lat?: number;
  lng?: number;
  placeId?: string;
}

export interface AddressMeta {
  lat?: number;
  lng?: number;
  placeId?: string;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string, meta?: AddressMeta) => void;
  placeholder?: string;
  className?: string;
}

// Phuket viewport bias for Places (New)
const PHUKET_BIAS = {
  rectangle: {
    low: { latitude: 7.55, longitude: 98.18 },
    high: { latitude: 8.20, longitude: 98.55 },
  },
};

export function AddressAutocomplete({ value, onChange, placeholder, className }: AddressAutocompleteProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { data: projects } = usePropertyProjects();
  const googleGeocode = useGoogleGeocode(language);
  const useGoogle = hasGoogleMapsKey();

  const [isFocused, setIsFocused] = useState(false);
  const [query, setQuery] = useState('');
  const [geocodeResults, setGeocodeResults] = useState<GeocodeSuggestion[]>([]);
  const [hotelResults, setHotelResults] = useState<GeocodeSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [geolocating, setGeolocating] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<Suggestion | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const sessionTokenRef = useRef<unknown>(null);

  // Clear selection if the user edits the value away from the selected one
  const selectedFullText = selectedSuggestion
    ? (selectedSuggestion.address && selectedSuggestion.address !== selectedSuggestion.name
        ? `${selectedSuggestion.name}, ${selectedSuggestion.address}`
        : selectedSuggestion.name)
    : null;
  const isSelectionActive = !!selectedSuggestion && value === selectedFullText;

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

  // Places API (New) — hotels & lodging (better than Geocoder for establishment names)
  const searchPlacesHotels = useCallback(async (q: string): Promise<GeocodeSuggestion[]> => {
    try {
      const g = (window as unknown as { google?: { maps?: { importLibrary?: (n: string) => Promise<unknown> } } }).google;
      if (!g?.maps?.importLibrary) return [];
      const placesLib = await g.maps.importLibrary('places') as {
        AutocompleteSuggestion: { fetchAutocompleteSuggestions: (req: Record<string, unknown>) => Promise<{ suggestions: unknown[] }> };
        AutocompleteSessionToken: new () => unknown;
      };
      const { AutocompleteSuggestion, AutocompleteSessionToken } = placesLib;
      if (!sessionTokenRef.current) sessionTokenRef.current = new AutocompleteSessionToken();
      const { suggestions } = await AutocompleteSuggestion.fetchAutocompleteSuggestions({
        input: q,
        sessionToken: sessionTokenRef.current,
        language: isRu ? 'ru' : 'en',
        region: 'th',
        includedRegionCodes: ['th'],
        locationBias: PHUKET_BIAS,
        includedPrimaryTypes: ['lodging'],
      });
      return (suggestions || [])
        .map((s) => (s as { placePrediction?: { placeId: string; mainText?: { text: string }; secondaryText?: { text: string }; text?: { text: string } } }).placePrediction)
        .filter(Boolean)
        .slice(0, 5)
        .map((p) => ({
          place_id: p!.placeId,
          name: p!.mainText?.text || p!.text?.text || '',
          address: p!.secondaryText?.text || p!.text?.text || '',
          type: 'lodging',
        }));
    } catch (err) {
      console.warn('[AddressAutocomplete] Places (New) lodging fetch failed:', err);
      return [];
    }
  }, [isRu]);

  // Combined: hotels (Places New) + addresses (Geocoder)
  const searchGeocode = useCallback(
    async (q: string) => {
      if (q.length < 2) {
        setGeocodeResults([]);
        setHotelResults([]);
        return;
      }
      setIsSearching(true);
      try {
        if (useGoogle) {
          const [hotels, addresses] = await Promise.all([
            searchPlacesHotels(q),
            googleGeocode.searchAddress(q, { country: 'TH' }).then(res =>
              res.map((r) => ({
                place_id: r.placeId || `${r.lat},${r.lng}`,
                name: r.address.split(',')[0]?.trim() || r.address,
                address: r.address,
                type: 'address',
                lat: r.lat,
                lng: r.lng,
              }))
            ),
          ]);
          setHotelResults(hotels);
          setGeocodeResults(addresses);
        } else {
          setGeocodeResults([]);
          setHotelResults([]);
        }
      } catch (err) {
        console.error('[AddressAutocomplete] geocode error:', err);
        setGeocodeResults([]);
        setHotelResults([]);
      } finally {
        setIsSearching(false);
      }
    },
    [useGoogle, googleGeocode, searchPlacesHotels]
  );

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
      lat: typeof p.lat === 'number' ? p.lat : undefined,
      lng: typeof p.lng === 'number' ? p.lng : undefined,
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

  // Hotel suggestions (Places API New)
  const hotelSuggestions = useMemo((): Suggestion[] =>
    hotelResults.map((r) => ({
      id: r.place_id,
      name: r.name,
      address: r.address,
      source: 'hotel' as const,
      placeId: r.place_id,
    })),
    [hotelResults]
  );

  // Google geocode suggestions
  const geocodeSuggestions = useMemo((): Suggestion[] =>
    geocodeResults.map((r) => ({
      id: r.place_id,
      name: r.name,
      address: r.address,
      source: 'google' as const,
      lat: r.lat,
      lng: r.lng,
      placeId: r.place_id,
    })),
    [geocodeResults]
  );

  // Fetch lat/lng for a Place by id (Places API New) — needed for hotel selections
  const fetchPlaceLocation = useCallback(async (placeId: string): Promise<{ lat: number; lng: number; formattedAddress?: string } | null> => {
    try {
      const g = (window as unknown as { google?: { maps?: { importLibrary?: (n: string) => Promise<unknown> } } }).google;
      if (!g?.maps?.importLibrary) return null;
      const placesLib = await g.maps.importLibrary('places') as {
        Place: new (opts: { id: string; requestedLanguage?: string }) => {
          fetchFields: (req: { fields: string[] }) => Promise<unknown>;
          location?: { lat: () => number; lng: () => number } | null;
          formattedAddress?: string | null;
        };
      };
      const place = new placesLib.Place({ id: placeId, requestedLanguage: isRu ? 'ru' : 'en' });
      await place.fetchFields({ fields: ['location', 'formattedAddress'] });
      const loc = place.location;
      if (!loc) return null;
      return { lat: loc.lat(), lng: loc.lng(), formattedAddress: place.formattedAddress ?? undefined };
    } catch (err) {
      console.warn('[AddressAutocomplete] Place details fetch failed:', err);
      return null;
    }
  }, [isRu]);

  const handleSelect = async (s: Suggestion) => {
    let resolved: Suggestion = { ...s };
    let meta: AddressMeta = { lat: s.lat, lng: s.lng, placeId: s.placeId };

    // Hotels come without coords from autocomplete suggestions — resolve via Place Details
    if (s.source === 'hotel' && s.placeId && (s.lat == null || s.lng == null)) {
      setIsSearching(true);
      const details = await fetchPlaceLocation(s.placeId);
      setIsSearching(false);
      if (details) {
        meta = { lat: details.lat, lng: details.lng, placeId: s.placeId };
        // Prefer the canonical formatted address from Place Details
        if (details.formattedAddress) {
          resolved = { ...s, address: details.formattedAddress, lat: details.lat, lng: details.lng };
        } else {
          resolved = { ...s, lat: details.lat, lng: details.lng };
        }
      }
    }

    const full = resolved.address && resolved.address !== resolved.name
      ? `${resolved.name}, ${resolved.address}`
      : resolved.name;

    setSelectedSuggestion(resolved);
    onChange(full, meta);
    setQuery('');
    setGeocodeResults([]);
    setHotelResults([]);
    sessionTokenRef.current = null; // burn the session token after a selection
    setIsFocused(false);
  };

  const clearSelection = () => {
    setSelectedSuggestion(null);
    setQuery('');
    onChange('', undefined);
    setGeocodeResults([]);
    setHotelResults([]);
  };

  const handleFocus = () => {
    setIsFocused(true);
    setQuery(value);
  };

  const handleUseLocation = async () => {
    if (!navigator.geolocation) return;
    setGeolocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          if (useGoogle) {
            const result = await googleGeocode.reverseGeocode(latitude, longitude);
            if (result?.address) onChange(result.address, { lat: result.lat ?? latitude, lng: result.lng ?? longitude, placeId: result.placeId ?? undefined });
          } else {
            const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/geocode-address?lat=${latitude}&lng=${longitude}&language=${language}`;
            const res = await fetch(url, {
              headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
            });
            const json = await res.json();
            if (json.results?.[0]) onChange(json.results[0].address || json.results[0].name, { lat: latitude, lng: longitude });
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

  const hasHotels = hotelSuggestions.length > 0;
  const hasGeocode = geocodeSuggestions.length > 0;
  const hasProjects = projectSuggestions.length > 0;
  const hasAreas = areaSuggestions.length > 0;
  const showDropdown = isFocused && (hasHotels || hasGeocode || hasProjects || hasAreas || isSearching || query.length === 0);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="relative flex gap-1.5">
        <div className="relative flex-1">
          {isSelectionActive && selectedSuggestion ? (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
              {selectedSuggestion.source === 'hotel' ? (
                <Hotel className="w-4 h-4 text-primary" />
              ) : selectedSuggestion.source === 'project' ? (
                <Building2 className="w-4 h-4 text-accent-amber" />
              ) : (
                <MapPin className="w-4 h-4 text-primary" />
              )}
            </div>
          ) : (
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          )}
          <Input
            value={value}
            onChange={handleInputChange}
            onFocus={handleFocus}
            placeholder={placeholder || (isRu ? 'Отель, вилла или адрес' : 'Hotel, villa or address')}
            className={cn("h-11 pl-9", isSelectionActive ? "pr-16" : "pr-9")}
            autoComplete="off"
          />
          {isSearching && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
          )}
          {!isSearching && isSelectionActive && (
            <>
              <span
                className="absolute right-8 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-success/15 flex items-center justify-center"
                title={isRu ? 'Адрес подтверждён через Google' : 'Address verified via Google'}
              >
                <Check className="w-3 h-3 text-success" />
              </span>
              <button
                type="button"
                onClick={clearSelection}
                title={isRu ? 'Очистить' : 'Clear'}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
        {value && value.length >= 3 && (
          <button
            type="button"
            title={isRu ? 'Открыть на карте' : 'Open on map'}
            className="h-11 w-11 shrink-0 rounded-none border border-border bg-background flex items-center justify-center hover:bg-accent transition-colors"
            onClick={() => {
              const mapQuery = selectedSuggestion?.lat != null && selectedSuggestion?.lng != null
                ? `${selectedSuggestion.lat},${selectedSuggestion.lng}`
                : encodeURIComponent(value);
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
        <div className="absolute z-[100] left-0 right-0 mt-1 bg-popover border border-border rounded-none shadow-lg max-h-[60vh] overflow-y-auto touch-pan-y">
          {/* Use my location */}
          <button
            type="button"
            className="w-full flex items-center gap-3 px-3 py-3 hover:bg-accent/50 active:bg-accent transition-colors text-left border-b border-border/50"
            onClick={handleUseLocation}
            disabled={geolocating}
          >
            <div className="w-8 h-8 rounded-none bg-info/10 flex items-center justify-center shrink-0">
              {geolocating ? <Loader2 className="w-4 h-4 animate-spin text-info" /> : <Navigation className="w-4 h-4 text-info" />}
            </div>
            <span className="text-sm font-medium">{isRu ? 'Мое местоположение' : 'Use my location'}</span>
          </button>

          {/* Hotels — Places API (New), shown first as primary intent */}
          {hasHotels && (
            <>
              <div className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider bg-muted/50">
                {isRu ? 'Отели и виллы' : 'Hotels & lodging'}
              </div>
              {hotelSuggestions.map((s) => (
                <SuggestionRow key={s.id} suggestion={s} onSelect={handleSelect} icon={<Hotel className="w-4 h-4 text-primary" />} iconBg="bg-primary/10" />
              ))}
            </>
          )}

          {/* Google geocode (addresses) */}
          {hasGeocode && (
            <>
              <div className={cn(
                "px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider bg-muted/50",
                hasHotels && "border-t border-border/50"
              )}>
                {isRu ? 'Адреса' : 'Addresses'}
              </div>
              {geocodeSuggestions.map((s) => (
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
                <SuggestionRow key={s.id} suggestion={s} onSelect={handleSelect} icon={<Building2 className="w-4 h-4 text-accent-amber" />} iconBg="bg-accent-amber/10" />
              ))}
            </>
          )}

          {/* Popular areas — only when no other live results */}
          {!hasHotels && !hasGeocode && hasAreas && (
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
          {isSearching && !hasHotels && !hasGeocode && (
            <div className="px-3 py-4 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              {isRu ? 'Поиск...' : 'Searching...'}
            </div>
          )}

          {/* Manual entry hint */}
          {query.length >= 2 && !isSearching && !hasHotels && !hasGeocode && (
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
      <div className={cn("w-8 h-8 rounded-none flex items-center justify-center shrink-0 mt-0.5", iconBg)}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="font-medium text-sm truncate">{suggestion.name}</p>
        <p className="text-xs text-muted-foreground truncate">{suggestion.address}</p>
      </div>
    </button>
  );
}
