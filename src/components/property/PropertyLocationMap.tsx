import React, { useRef, useCallback, useState } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGoogleMaps } from '@/contexts/GoogleMapsContext';
import { GoogleMap, Circle, Marker } from '@react-google-maps/api';

interface PropertyLocationMapProps {
  lat?: number | null;
  lng?: number | null;
  district?: string;
  address?: string;
}

const mapContainerStyle: React.CSSProperties = { width: '100%', height: '100%' };

export function PropertyLocationMap({ lat, lng, district, address }: PropertyLocationMapProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { hasKey, isLoaded, loadError } = useGoogleMaps();

  const hasCoords = lat != null && lng != null && lat !== 0 && lng !== 0;
  const mapLat = hasCoords ? lat : 7.8804;
  const mapLng = hasCoords ? lng : 98.3923;
  const center = { lat: mapLat!, lng: mapLng! };

  const mapError = !hasKey || !!loadError;

  return (
    <div>
      <h2 className="text-xl font-semibold mb-3">
        {isRu ? 'Где вы будете' : "Where you'll be"}
      </h2>

      <div className="rounded-2xl overflow-hidden border border-border h-[300px] mb-3 relative">
        {!hasKey || (!isLoaded && !loadError) ? (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : mapError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/30 gap-2">
            <MapPin className="w-8 h-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{isRu ? 'Карта временно недоступна' : 'Map temporarily unavailable'}</p>
          </div>
        ) : (
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={center}
            zoom={hasCoords ? 14 : 11}
            options={{
              streetViewControl: false,
              mapTypeControl: false,
              fullscreenControl: false,
              zoomControl: true,
              styles: [
                { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'simplified' }] },
              ],
            }}
          >
            {hasCoords && (
              <>
                <Circle
                  center={center}
                  radius={500}
                  options={{
                    fillColor: 'hsl(142, 76%, 36%)',
                    fillOpacity: 0.1,
                    strokeColor: 'hsl(142, 76%, 36%)',
                    strokeOpacity: 0.3,
                    strokeWeight: 2,
                  }}
                />
                <Marker position={center} />
              </>
            )}
          </GoogleMap>
        )}
      </div>

      <div className="flex items-start gap-2 text-muted-foreground">
        <MapPin className="w-5 h-5 mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-medium text-foreground">{district || 'Phuket'}</p>
          {address && <p className="text-sm">{address}</p>}
          {hasCoords && (
            <p className="text-xs mt-1">
              {isRu ? 'Точное местоположение будет предоставлено после бронирования' : 'Exact location provided after booking'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
