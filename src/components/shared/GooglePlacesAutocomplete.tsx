import { useEffect, useRef, useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { MapPin, Loader2, Search } from 'lucide-react';
import { useGoogleMaps } from '@/contexts/GoogleMapsContext';
import { cn } from '@/lib/utils';

interface PlaceResult {
  address: string;
  lat: number;
  lng: number;
  district?: string;
}

interface GooglePlacesAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onPlaceSelect: (place: PlaceResult) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

/**
 * Google Places Autocomplete input using the new Places API.
 * Falls back to a plain text input if Google Maps is not loaded.
 */
export function GooglePlacesAutocomplete({
  value,
  onChange,
  onPlaceSelect,
  placeholder = 'Search address...',
  className,
  disabled,
}: GooglePlacesAutocompleteProps) {
  const { isLoaded, hasKey } = useGoogleMaps();
  const [predictions, setPredictions] = useState<google.maps.places.PlacePrediction[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const containerRef = useRef<HTMLDivElement>(null);
  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);

  useEffect(() => {
    if (!isLoaded || !window.google?.maps?.places) return;
    if (!sessionTokenRef.current) {
      sessionTokenRef.current = new google.maps.places.AutocompleteSessionToken();
    }
  }, [isLoaded]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const fetchPredictions = useCallback(async (input: string) => {
    if (!window.google?.maps?.places || input.trim().length < 2) {
      setPredictions([]);
      setIsOpen(false);
      return;
    }

    try {
      setLoading(true);

      const { AutocompleteSuggestion } = await google.maps.importLibrary('places') as google.maps.PlacesLibrary;

      if (!sessionTokenRef.current) {
        sessionTokenRef.current = new google.maps.places.AutocompleteSessionToken();
      }

      const { suggestions } = await AutocompleteSuggestion.fetchAutocompleteSuggestions({
        input,
        includedRegionCodes: ['th'],
        includedPrimaryTypes: ['premise', 'subpremise', 'street_address', 'route', 'establishment'],
        sessionToken: sessionTokenRef.current,
      });

      const nextPredictions = (suggestions || [])
        .map((suggestion) => suggestion.placePrediction)
        .filter((prediction): prediction is google.maps.places.PlacePrediction => Boolean(prediction));

      setPredictions(nextPredictions);
      setIsOpen(nextPredictions.length > 0);
    } catch {
      setPredictions([]);
      setIsOpen(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInputChange = (val: string) => {
    onChange(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void fetchPredictions(val);
    }, 300);
  };

  const handleSelect = async (prediction: google.maps.places.PlacePrediction) => {
    try {
      setIsOpen(false);
      onChange(prediction.text.toString());

      const place = prediction.toPlace();
      const { place: hydratedPlace } = await place.fetchFields({
        fields: ['location', 'formattedAddress', 'addressComponents'],
      });

      const lat = hydratedPlace.location?.lat();
      const lng = hydratedPlace.location?.lng();
      const address = hydratedPlace.formattedAddress || prediction.text.toString();

      const sublocality = hydratedPlace.addressComponents?.find((component) =>
        component.types.includes('sublocality') || component.types.includes('sublocality_level_1')
      );
      const locality = hydratedPlace.addressComponents?.find((component) =>
        component.types.includes('locality')
      );
      const administrativeArea = hydratedPlace.addressComponents?.find((component) =>
        component.types.includes('administrative_area_level_2')
      );
      const district = sublocality?.longText || locality?.longText || administrativeArea?.longText;

      if (typeof lat === 'number' && typeof lng === 'number') {
        onPlaceSelect({ address, lat, lng, district });
        sessionTokenRef.current = new google.maps.places.AutocompleteSessionToken();
      }
    } catch {
      // silent fallback: keep text input value only
    }
  };

  if (!hasKey || !isLoaded) {
    return (
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={className}
        disabled={disabled}
      />
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          value={value}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => predictions.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          className={cn('pl-9 pr-8', className)}
          disabled={disabled}
          autoComplete="off"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {isOpen && predictions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg overflow-hidden">
          {predictions.map((prediction) => (
            <button
              key={prediction.placeId}
              type="button"
              onClick={() => void handleSelect(prediction)}
              className="w-full flex items-start gap-2.5 px-3 py-2.5 text-left hover:bg-muted/50 transition-colors text-sm"
            >
              <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="font-medium truncate">
                  {prediction.mainText?.toString() || prediction.text.toString()}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {prediction.secondaryText?.toString() || ''}
                </p>
              </div>
            </button>
          ))}
          <div className="px-3 py-1.5 border-t bg-muted/30">
            <p className="text-[10px] text-muted-foreground">Powered by Google</p>
          </div>
        </div>
      )}
    </div>
  );
}
