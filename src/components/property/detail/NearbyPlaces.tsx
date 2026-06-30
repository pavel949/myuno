/**
 * NearbyPlaces — "What's nearby" list for the property detail page.
 *
 * Lists the nearest points of interest (beaches, restaurants, hospitals, etc.)
 * with a human category label and distance in m/km. Benefits every listing with
 * coordinates — not hotel-specific. Renders nothing while empty so it never adds
 * an empty section for properties without coords or POI coverage.
 */
import { MapPin, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNearbyPois } from '@/hooks/useNearbyPois';

interface NearbyPlacesProps {
  lat?: number | null;
  lng?: number | null;
  limit?: number;
}

/** Bilingual labels for the common OSM/POI categories the RPC returns. */
const CATEGORY_LABELS: Record<string, { en: string; ru: string }> = {
  beach: { en: 'Beach', ru: 'Пляж' },
  restaurant: { en: 'Restaurant', ru: 'Ресторан' },
  cafe: { en: 'Café', ru: 'Кафе' },
  bar: { en: 'Bar', ru: 'Бар' },
  hospital: { en: 'Hospital', ru: 'Больница' },
  clinic: { en: 'Clinic', ru: 'Клиника' },
  pharmacy: { en: 'Pharmacy', ru: 'Аптека' },
  school: { en: 'School', ru: 'Школа' },
  supermarket: { en: 'Supermarket', ru: 'Супермаркет' },
  shopping: { en: 'Shopping', ru: 'Магазины' },
  mall: { en: 'Mall', ru: 'Торговый центр' },
  bank: { en: 'Bank', ru: 'Банк' },
  atm: { en: 'ATM', ru: 'Банкомат' },
  gym: { en: 'Gym', ru: 'Фитнес' },
  park: { en: 'Park', ru: 'Парк' },
  airport: { en: 'Airport', ru: 'Аэропорт' },
  bus_station: { en: 'Bus station', ru: 'Автостанция' },
  attraction: { en: 'Attraction', ru: 'Достопримечательность' },
  temple: { en: 'Temple', ru: 'Храм' },
  viewpoint: { en: 'Viewpoint', ru: 'Смотровая площадка' },
};

function categoryLabel(category: string, isRu: boolean): string {
  const known = CATEGORY_LABELS[category];
  if (known) return isRu ? known.ru : known.en;
  // Fallback: prettify the raw slug (e.g. "fast_food" -> "Fast food").
  const pretty = category.replace(/_/g, ' ');
  return pretty.charAt(0).toUpperCase() + pretty.slice(1);
}

function formatDistance(meters: number, isRu: boolean): string {
  if (meters < 1000) {
    return isRu ? `${Math.round(meters)} м` : `${Math.round(meters)} m`;
  }
  const km = (meters / 1000).toFixed(1);
  return isRu ? `${km} км` : `${km} km`;
}

export function NearbyPlaces({ lat, lng, limit = 8 }: NearbyPlacesProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { data, isLoading } = useNearbyPois({ lat, lng, limit });

  // No coords or no data → render nothing (avoid an empty section).
  const hasCoords = lat != null && lng != null && lat !== 0 && lng !== 0;
  if (!hasCoords) return null;

  if (isLoading) {
    return (
      <div>
        <h2 className="text-xl font-semibold mb-3">
          {isRu ? 'Что рядом' : "What's nearby"}
        </h2>
        <div className="flex items-center gap-2 text-muted-foreground py-4">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">{isRu ? 'Загрузка…' : 'Loading…'}</span>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) return null;

  return (
    <div>
      <h2 className="text-xl font-semibold mb-3">
        {isRu ? 'Что рядом' : "What's nearby"}
      </h2>
      <ul className="divide-y divide-border border border-border">
        {data.slice(0, limit).map((poi, i) => (
          <li
            key={`${poi.source_id ?? poi.name}-${i}`}
            className="flex items-center justify-between gap-3 px-3 py-2.5"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{poi.name}</p>
                <p className="text-xs text-muted-foreground">
                  {categoryLabel(poi.category, isRu)}
                </p>
              </div>
            </div>
            <span className="text-sm font-mono text-muted-foreground flex-shrink-0 tabular-nums">
              {formatDistance(poi.distance_m, isRu)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
