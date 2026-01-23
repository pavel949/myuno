import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MapPin, Star, ArrowLeft, Navigation, List } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';
import { demoRestaurants } from './restaurantsData';

// Demo coordinates for restaurants in Phuket
const restaurantCoordinates: Record<string, { lat: number; lng: number }> = {
  'rest-1': { lat: 7.8965, lng: 98.2956 }, // Patong
  'rest-2': { lat: 7.8172, lng: 98.3028 }, // Kata
  'rest-3': { lat: 7.7817, lng: 98.3156 }, // Rawai
  'rest-4': { lat: 7.9518, lng: 98.2831 }, // Kamala
  'rest-5': { lat: 7.8425, lng: 98.3397 }, // Chalong
};

export default function RestaurantMap() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { language } = useLanguage();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState<string | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);

  const mode = searchParams.get('mode') || 'delivery';

  const filteredRestaurants = demoRestaurants.filter(rest => {
    if (mode === 'delivery') return rest.acceptsDelivery;
    if (mode === 'reservation') return rest.acceptsReservations;
    return true;
  });

  useEffect(() => {
    let isMounted = true;
    
    const getToken = async () => {
      try {
        const { data } = await supabase.functions.invoke('get-mapbox-token');
        if (isMounted && data?.token) {
          setMapboxToken(data.token);
        }
      } catch (error) {
        if (isMounted) {
          console.error('Error fetching mapbox token:', error);
        }
      }
    };
    getToken();
    
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!mapboxToken || !mapContainerRef.current || mapRef.current) return;

    mapboxgl.accessToken = mapboxToken;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [98.3388, 7.8804], // Phuket center
      zoom: 11,
    });

    map.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
      }),
      'top-right'
    );

    // Store markers and listeners for cleanup
    const markers: mapboxgl.Marker[] = [];
    const clickListeners: Array<{ el: HTMLElement; handler: () => void }> = [];

    map.on('load', () => {
      setMapLoaded(true);
      
      // Add markers for each restaurant
      filteredRestaurants.forEach((restaurant) => {
        const coords = restaurantCoordinates[restaurant.id];
        if (!coords) return;

        const el = document.createElement('div');
        el.className = 'restaurant-marker';
        el.innerHTML = `
          <div class="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg cursor-pointer transform hover:scale-110 transition-transform">
            <span class="text-lg">🍽️</span>
          </div>
        `;

        const clickHandler = () => {
          setSelectedRestaurant(restaurant.id);
          map.flyTo({
            center: [coords.lng, coords.lat],
            zoom: 14,
          });
        };
        
        el.addEventListener('click', clickHandler);
        clickListeners.push({ el, handler: clickHandler });

        const marker = new mapboxgl.Marker(el)
          .setLngLat([coords.lng, coords.lat])
          .addTo(map);
        markers.push(marker);
      });
    });

    mapRef.current = map;

    return () => {
      // Clean up event listeners
      clickListeners.forEach(({ el, handler }) => {
        el.removeEventListener('click', handler);
      });
      // Remove markers
      markers.forEach(marker => marker.remove());
      map.remove();
      mapRef.current = null;
    };
  }, [mapboxToken, filteredRestaurants]);

  const selected = selectedRestaurant 
    ? filteredRestaurants.find(r => r.id === selectedRestaurant)
    : null;

  return (
    <AppLayout>
      <div className="h-screen flex flex-col">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-20 p-4 flex items-center justify-between">
          <Button
            variant="secondary"
            size="icon"
            className="bg-background/90 backdrop-blur-sm shadow-lg"
            onClick={() => navigate('/restaurants')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              className="bg-background/90 backdrop-blur-sm shadow-lg"
              onClick={() => navigate(`/restaurants?mode=${mode}`)}
            >
              <List className="w-4 h-4 mr-2" />
              {language === 'ru' ? 'Список' : 'List'}
            </Button>
          </div>
        </div>

        {/* Map */}
        <div ref={mapContainerRef} className="flex-1 w-full" />

        {/* Loading state */}
        {!mapLoaded && (
          <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10">
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                {language === 'ru' ? 'Загрузка карты...' : 'Loading map...'}
              </p>
            </div>
          </div>
        )}

        {/* Selected Restaurant Card */}
        {selected && (
          <div className="absolute bottom-4 left-4 right-4 z-20">
            <div className="bg-card rounded-xl border shadow-lg p-4">
              <div className="flex gap-3">
                <img
                  src={selected.image}
                  alt={language === 'ru' ? selected.nameRu : selected.nameEn}
                  className="w-20 h-20 rounded-lg object-cover"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">
                    {language === 'ru' ? selected.nameRu : selected.nameEn}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {language === 'ru' ? selected.cuisineRu : selected.cuisine}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="text-sm font-medium">{selected.rating}</span>
                    </div>
                    <Badge variant={selected.isOpen ? 'default' : 'secondary'}>
                      {selected.isOpen 
                        ? (language === 'ru' ? 'Открыто' : 'Open')
                        : (language === 'ru' ? 'Закрыто' : 'Closed')}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setSelectedRestaurant(null)}
                >
                  {language === 'ru' ? 'Закрыть' : 'Close'}
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => navigate(`/restaurants/${selected.id}?mode=${mode}`)}
                >
                  {language === 'ru' ? 'Подробнее' : 'Details'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="absolute bottom-4 left-4 z-10">
          {!selected && (
            <div className="bg-card/90 backdrop-blur-sm rounded-lg p-2 text-xs">
              <div className="flex items-center gap-2">
                <span>🍽️</span>
                <span className="text-muted-foreground">
                  {filteredRestaurants.length} {language === 'ru' ? 'ресторанов' : 'restaurants'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
