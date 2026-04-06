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

type AddressComponentLike = {
  types: string[];
  longText?: string;
  long_name?: string;
};

type PredictionItem = {
  id: string;
  mainText: string;
  secondaryText: string;
  text: string;
  source: 'places' | 'geocoder';
  prediction?: google.maps.places.PlacePrediction;
  result?: google.maps.GeocoderResult;
};

function getComponentValue(component?: AddressComponentLike) {
  return component?.longText || component?.long_name;
}

function extractDistrict(components?: AddressComponentLike[]) {
  const sublocality = components?.find(
    (component) => component.types.includes('sublocality') || component.types.includes('sublocality_level_1')
  );
  const locality = components?.find((component) => component.types.includes('locality'));
  const adminArea = components?.find((component) => component.types.includes('administrative_area_level_2'));

  return getComponentValue(sublocality) || getComponentValue(locality) || getComponentValue(adminArea);
}

function splitAddress(text: string) {
  const parts = text.split(',').map((part) => part.trim()).filter(Boolean);
  return {
    mainText: parts[0] || text,
    secondaryText: parts.slice(1).join(', '),
  };
}

/**
 * Google Places Autocomplete input using Places API with Geocoder fallback.
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
  const [predictions, setPredictions] = useState<PredictionItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorHint, setErrorHint] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const containerRef = useRef<HTMLDivElement>(null);
  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);

  useEffect(() => {
    if (!isLoaded || !window.google?.maps) return;
    if (!sessionTokenRef.current && window.google.maps.places) {
      sessionTokenRef.current = new google.maps.places.AutocompleteSessionToken();
    }
    if (!geocoderRef.current) {
      geocoderRef.current = new google.maps.Geocoder();
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

  const fetchGeocoderPredictions = useCallback(async (input: string) => {
    if (!geocoderRef.current) return [] as PredictionItem[];

    const results = await new Promise<google.maps.GeocoderResult[]>((resolve) => {
      geocoderRef.current?.geocode(
        {
          address: input,
          componentRestrictions: { country: 'TH' },
          region: 'TH',
        },
        (nextResults, status) => {
          if (status === google.maps.GeocoderStatus.OK && nextResults) {
            resolve(nextResults);
            return;
          }
          resolve([]);
        }
      );
    });

    return results.slice(0, 5).map((result) => {
      const text = result.formatted_address || '';
      const { mainText, secondaryText } = splitAddress(text);

      return {
        id: result.place_id,
        mainText,
        secondaryText,
        text,
        source: 'geocoder' as const,
        result,
      };
    });
  }, []);

  const fetchPredictions = useCallback(async (input: string) => {
    if (!window.google?.maps || input.trim().length < 2) {
      setPredictions([]);
      setIsOpen(false);
      setErrorHint(null);
      return;
    }

    setLoading(true);
    setErrorHint(null);

    try {
      let nextPredictions: PredictionItem[] = [];

      try {
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

        nextPredictions = (suggestions || [])
          .map((suggestion) => suggestion.placePrediction)
          .filter((prediction): prediction is google.maps.places.PlacePrediction => Boolean(prediction))
          .slice(0, 5)
          .map((prediction) => ({
            id: prediction.placeId,
            mainText: prediction.mainText?.toString() || prediction.text.toString(),
            secondaryText: prediction.secondaryText?.toString() || '',
            text: prediction.text.toString(),
            source: 'places' as const,
            prediction,
          }));
      } catch (error) {
        console.warn('[GooglePlacesAutocomplete] Places autocomplete failed, using geocoder fallback.', error);
      }

      if (nextPredictions.length === 0) {
        nextPredictions = await fetchGeocoderPredictions(input);
      }

      setPredictions(nextPredictions);
      setIsOpen(nextPredictions.length > 0);

      if (nextPredictions.length === 0) {
        setErrorHint('Google suggestions are unavailable for this domain right now.');
      }
    } finally {
      setLoading(false);
    }
  }, [fetchGeocoderPredictions]);

  const handleInputChange = (val: string) => {
    onChange(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void fetchPredictions(val);
    }, 300);
  };

  const handlePlaceSelection = (place: PlaceResult) => {
    onChange(place.address);
    onPlaceSelect(place);
    if (window.google?.maps?.places) {
      sessionTokenRef.current = new google.maps.places.AutocompleteSessionToken();
    }
  };

  const handleSelect = async (item: PredictionItem) => {
    try {
      setIsOpen(false);

      if (item.source === 'geocoder' && item.result?.geometry?.location) {
        handlePlaceSelection({
          address: item.result.formatted_address,
          lat: item.result.geometry.location.lat(),
          lng: item.result.geometry.location.lng(),
          district: extractDistrict(item.result.address_components),
        });
        return;
      }

      if (!item.prediction) return;

      const place = item.prediction.toPlace();
      const { place: hydratedPlace } = await place.fetchFields({
        fields: ['location', 'formattedAddress', 'addressComponents'],
      });

      const lat = hydratedPlace.location?.lat();
      const lng = hydratedPlace.location?.lng();
      if (typeof lat !== 'number' || typeof lng !== 'number') return;

      handlePlaceSelection({
        address: hydratedPlace.formattedAddress || item.text,
        lat,
        lng,
        district: extractDistrict(hydratedPlace.addressComponents),
      });
    } catch (error) {
      console.warn('[GooglePlacesAutocomplete] Failed to resolve selected place.', error);
      setErrorHint('Could not load place details from Google.');
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
              key={prediction.id}
              type="button"
              onClick={() => void handleSelect(prediction)}
              className="w-full flex items-start gap-2.5 px-3 py-2.5 text-left hover:bg-muted/50 transition-colors text-sm"
            >
              <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="font-medium truncate">{prediction.mainText}</p>
                <p className="text-xs text-muted-foreground truncate">{prediction.secondaryText}</p>
              </div>
            </button>
          ))}
          <div className="px-3 py-1.5 border-t bg-muted/30">
            <p className="text-[10px] text-muted-foreground">Powered by Google</p>
          </div>
        </div>
      )}

      {errorHint && !loading && (
        <p className="mt-2 text-xs text-muted-foreground">{errorHint}</p>
      )}
    </div>
  );
}
