import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MapPin, Star, ArrowLeft, List } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRestaurants } from '@/hooks/useRestaurants';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GoogleMap, Marker, InfoWindow } from '@react-google-maps/api';
import { useGoogleMaps } from '@/contexts/GoogleMapsContext';
import { CITY_GEOGRAPHY } from '@/lib/config/geography';
import { Loader2 } from 'lucide-react';

const mapContainerStyle: React.CSSProperties = { width: '100%', height: '100%' };

export default function RestaurantMap() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { language } = useLanguage();
  const { hasKey, isLoaded, loadError } = useGoogleMaps();
  const [selectedRestaurant, setSelectedRestaurant] = useState<string | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);

  const mode = searchParams.get('mode') || 'delivery';
  const { restaurants } = useRestaurants({ deliveryOnly: mode === 'delivery' ? true : undefined });
  const filteredRestaurants = restaurants.filter(r => r.lat && r.lng);

  const phuketGeo = CITY_GEOGRAPHY.phuket;
  const center = useMemo(() => ({ lat: phuketGeo.center.lat, lng: phuketGeo.center.lng }), []);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  const selected = selectedRestaurant
    ? filteredRestaurants.find(r => r.id === selectedRestaurant)
    : null;

  const showLoading = !hasKey || !isLoaded;

  return (
    <AppLayout>
      <div className="h-screen flex flex-col">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-20 p-4 flex items-center justify-between">
          <Button variant="secondary" size="icon" className="bg-background/90 backdrop-blur-sm shadow-lg" onClick={() => navigate('/restaurants')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" className="bg-background/90 backdrop-blur-sm shadow-lg" onClick={() => navigate(`/restaurants?mode=${mode}`)}>
              <List className="w-4 h-4 mr-2" />
              {language === 'ru' ? 'Список' : 'List'}
            </Button>
          </div>
        </div>

        {/* Map */}
        <div className="flex-1 w-full relative">
          {showLoading ? (
            <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  {language === 'ru' ? 'Загрузка карты...' : 'Loading map...'}
                </p>
              </div>
            </div>
          ) : loadError ? (
            <div className="absolute inset-0 flex items-center justify-center bg-card">
              <p className="text-muted-foreground">{loadError.message}</p>
            </div>
          ) : (
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={center}
              zoom={phuketGeo.zoom}
              onLoad={onMapLoad}
              options={{ streetViewControl: false, mapTypeControl: false, fullscreenControl: true, zoomControl: true }}
            >
              {filteredRestaurants.map(restaurant => (
                <Marker
                  key={restaurant.id}
                  position={{ lat: restaurant.lat!, lng: restaurant.lng! }}
                  label={{ text: '🍽️', fontSize: '16px' }}
                  title={language === 'ru' ? restaurant.name_ru : restaurant.name_en}
                  onClick={() => {
                    setSelectedRestaurant(restaurant.id);
                    mapRef.current?.panTo({ lat: restaurant.lat!, lng: restaurant.lng! });
                    mapRef.current?.setZoom(14);
                  }}
                />
              ))}
              {selected && selected.lat && selected.lng && (
                <InfoWindow
                  position={{ lat: selected.lat, lng: selected.lng }}
                  onCloseClick={() => setSelectedRestaurant(null)}
                >
                  <div className="min-w-[180px]">
                    <h3 className="font-semibold text-sm">{language === 'ru' ? selected.name_ru : selected.name_en}</h3>
                    <p className="text-xs text-gray-500">{selected.cuisine}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                      <span className="text-xs">{selected.rating}</span>
                    </div>
                  </div>
                </InfoWindow>
              )}
            </GoogleMap>
          )}
        </div>

        {/* Selected Restaurant Card */}
        {selected && (
          <div className="absolute bottom-4 left-4 right-4 z-20">
            <div className="bg-card rounded-xl border shadow-lg p-4">
              <div className="flex gap-3">
                <img
                  src={selected.cover_image || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400'}
                  alt={language === 'ru' ? selected.name_ru : selected.name_en}
                  className="w-20 h-20 rounded-lg object-cover"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{language === 'ru' ? selected.name_ru : selected.name_en}</h3>
                  <p className="text-sm text-muted-foreground">{selected.cuisine}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="text-sm font-medium">{selected.rating}</span>
                    </div>
                    <Badge variant={selected.is_active ? 'default' : 'secondary'}>
                      {selected.is_active ? (language === 'ru' ? 'Открыто' : 'Open') : (language === 'ru' ? 'Закрыто' : 'Closed')}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <Button variant="outline" className="flex-1" onClick={() => setSelectedRestaurant(null)}>
                  {language === 'ru' ? 'Закрыть' : 'Close'}
                </Button>
                <Button className="flex-1" onClick={() => navigate(`/restaurants/${selected.id}?mode=${mode}`)}>
                  {language === 'ru' ? 'Подробнее' : 'Details'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Legend */}
        {!selected && (
          <div className="absolute bottom-4 left-4 z-10">
            <div className="bg-card/90 backdrop-blur-sm rounded-lg p-2 text-xs">
              <div className="flex items-center gap-2">
                <span>🍽️</span>
                <span className="text-muted-foreground">
                  {filteredRestaurants.length} {language === 'ru' ? 'ресторанов' : 'restaurants'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
