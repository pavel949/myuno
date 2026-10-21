/**
 * VendorLocationField — unified location picker for vendor onboarding forms.
 *
 * Renders a Google Places autocomplete + draggable map marker so that vendors
 * (salons, restaurants, gyms, pharmacies, vet clinics, florists, shops, venues)
 * can pin their physical address. Outputs `{ address, lat, lng, district? }`.
 *
 * Falls back to a plain text input when Google Maps is not available so the
 * form is still usable in degraded mode.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { GoogleMap, Marker } from '@react-google-maps/api';
import { Loader2, Navigation, MapPin } from 'lucide-react';
import { GooglePlacesAutocomplete } from '@/components/shared/GooglePlacesAutocomplete';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useGoogleMaps } from '@/contexts/GoogleMapsContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLocation as useLocationContext } from '@/contexts/LocationContext';
import { useGoogleGeocode } from '@/hooks/useGoogleGeocode';
import { getMapCenter, DEFAULT_CITY } from '@/lib/config';
import { logger } from '@/lib/logger';
import { cn } from '@/lib/utils';

export interface VendorLocationValue {
  address: string;
  lat: number | null;
  lng: number | null;
  district?: string | null;
}

interface Props {
  value: VendorLocationValue;
  onChange: (value: VendorLocationValue) => void;
  label?: string;
  required?: boolean;
  className?: string;
}

const mapContainerStyle: React.CSSProperties = {
  width: '100%',
  height: '220px',
  borderRadius: '0px',
};

export function VendorLocationField({
  value,
  onChange,
  label,
  required,
  className,
}: Props) {
  const { language } = useLanguage();
  const { isLoaded, hasKey } = useGoogleMaps();
  const { getCityConfig } = useLocationContext();
  const { reverseGeocode } = useGoogleGeocode();
  const [requestingLocation, setRequestingLocation] = useState(false);

  const isRu = language === 'ru';

  const defaultCenter = useMemo(() => {
    const cityConfig = getCityConfig();
    if (cityConfig) return { lat: cityConfig.lat, lng: cityConfig.lng };
    const c = getMapCenter(DEFAULT_CITY);
    return { lat: c[1], lng: c[0] };
  }, [getCityConfig]);

  const hasPin =
    typeof value.lat === 'number' &&
    typeof value.lng === 'number' &&
    Number.isFinite(value.lat) &&
    Number.isFinite(value.lng);

  const mapCenter = hasPin
    ? { lat: value.lat as number, lng: value.lng as number }
    : defaultCenter;

  const handlePlaceSelect = useCallback(
    (place: { address: string; lat: number; lng: number; district?: string }) => {
      onChange({
        address: place.address,
        lat: place.lat,
        lng: place.lng,
        district: place.district ?? null,
      });
    },
    [onChange],
  );

  const handleAddressChange = useCallback(
    (next: string) => {
      onChange({ ...value, address: next });
    },
    [onChange, value],
  );

  const handleMarkerDragEnd = useCallback(
    async (event: google.maps.MapMouseEvent) => {
      if (!event.latLng) return;
      const lat = event.latLng.lat();
      const lng = event.latLng.lng();
      try {
        const result = await reverseGeocode(lat, lng);
        onChange({
          address: result?.address || value.address,
          lat,
          lng,
          district: value.district ?? null,
        });
      } catch (err) {
        logger.warn('[VendorLocationField] reverse geocode failed', err);
        onChange({ ...value, lat, lng });
      }
    },
    [onChange, reverseGeocode, value],
  );

  const handleUseMyLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    setRequestingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        try {
          const result = await reverseGeocode(lat, lng);
          onChange({
            address: result?.address || value.address,
            lat,
            lng,
            district: null,
          });
        } catch (err) {
          logger.warn('[VendorLocationField] reverse geocode failed', err);
          onChange({ ...value, lat, lng });
        } finally {
          setRequestingLocation(false);
        }
      },
      (err) => {
        logger.warn('[VendorLocationField] geolocation denied', err);
        setRequestingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }, [onChange, reverseGeocode, value]);

  const labelText =
    label ?? (isRu ? 'Адрес и точка на карте' : 'Address & map pin');

  return (
    <div className={cn('space-y-2', className)}>
      <Label className="flex items-center gap-1 text-sm font-medium">
        <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
        {labelText}
        {required && <span className="text-destructive">*</span>}
      </Label>

      {hasKey && isLoaded ? (
        <>
          <GooglePlacesAutocomplete
            value={value.address}
            onChange={handleAddressChange}
            onPlaceSelect={handlePlaceSelect}
            placeholder={
              isRu
                ? 'Начните вводить адрес (Пхукет)…'
                : 'Start typing your address (Phuket)…'
            }
          />

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleUseMyLocation}
              disabled={requestingLocation}
            >
              {requestingLocation ? (
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Navigation className="mr-2 h-3.5 w-3.5" />
              )}
              {isRu ? 'Использовать моё местоположение' : 'Use my location'}
            </Button>
            {hasPin && (
              <span className="font-mono text-xs text-muted-foreground">
                {value.lat?.toFixed(5)}, {value.lng?.toFixed(5)}
              </span>
            )}
          </div>

          <div className="overflow-hidden border border-border">
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={mapCenter}
              zoom={hasPin ? 16 : 11}
              options={{
                disableDefaultUI: true,
                zoomControl: true,
                gestureHandling: 'cooperative',
              }}
              onClick={(e) => {
                if (e.latLng) {
                  void handleMarkerDragEnd(e);
                }
              }}
            >
              {hasPin && (
                <Marker
                  position={{ lat: value.lat as number, lng: value.lng as number }}
                  draggable
                  onDragEnd={handleMarkerDragEnd}
                />
              )}
            </GoogleMap>
          </div>

          <p className="text-xs text-muted-foreground">
            {isRu
              ? 'Перетащите маркер или кликните по карте, чтобы уточнить точку. Без точной геометки бизнес не попадёт на карту Пхукета.'
              : 'Drag the marker or tap the map to fine-tune the pin. Without exact coordinates, the business will not appear on the Phuket map.'}
          </p>
        </>
      ) : (
        <>
          <Input
            value={value.address}
            onChange={(e) => handleAddressChange(e.target.value)}
            placeholder={isRu ? 'Введите адрес' : 'Enter address'}
          />
          <p className="text-xs text-muted-foreground">
            {isRu
              ? 'Google Maps временно недоступен — точку можно будет уточнить позже.'
              : 'Google Maps is unavailable — you can fine-tune the pin later.'}
          </p>
        </>
      )}
    </div>
  );
}
