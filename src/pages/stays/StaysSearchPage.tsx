import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Search, Loader2, MapPin, ArrowUpDown, Users, SlidersHorizontal } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { BackButton } from '@/components/uno/BackButton';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { APP_ROUTES } from '@/lib/config/routes';
import {
  useStaysSearch,
  STAYS_ZONE_OPTIONS,
  STAYS_PROPERTY_TYPES,
  type StaysSearchFilters,
  type StaysZone,
  type StaysListingRow,
} from '@/hooks/useStaysSearch';

type SortOption = 'default' | 'price_asc' | 'price_desc' | 'bedrooms_desc';

const AMENITY_FILTERS = [
  { key: 'pool', labelEn: 'Pool', labelRu: 'Бассейн' },
  { key: 'wifi', labelEn: 'WiFi', labelRu: 'Wi-Fi' },
  { key: 'parking', labelEn: 'Parking', labelRu: 'Парковка' },
  { key: 'kitchen', labelEn: 'Kitchen', labelRu: 'Кухня' },
  { key: 'air_conditioning', labelEn: 'AC', labelRu: 'Кондиционер' },
  { key: 'washing', labelEn: 'Washer', labelRu: 'Стиральная' },
  { key: 'tv', labelEn: 'TV', labelRu: 'ТВ' },
  { key: 'pet', labelEn: 'Pets OK', labelRu: 'С питомцами' },
] as const;

function zoneLabelRu(z: StaysZone): string {
  const map: Record<StaysZone, string> = {
    'Bang Tao': 'Банг Тао',
    Surin: 'Сурин',
    Kamala: 'Камала',
    Patong: 'Патонг',
    Rawai: 'Равай',
  };
  return map[z] ?? z;
}

export default function StaysSearchPage() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const [zones, setZones] = useState<StaysZone[]>([]);
  const [checkInStr, setCheckInStr] = useState('');
  const [checkOutStr, setCheckOutStr] = useState('');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [bedroomsMin, setBedroomsMin] = useState('');
  const [guestsCount, setGuestsCount] = useState('');
  const [propertyType, setPropertyType] = useState('all');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [showFilters, setShowFilters] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const filters: StaysSearchFilters = useMemo(() => {
    const parseNum = (s: string) => {
      const n = parseInt(s, 10);
      return Number.isFinite(n) ? n : null;
    };
    const parseBed = (s: string) => {
      const n = parseInt(s, 10);
      return Number.isFinite(n) && n > 0 ? n : null;
    };
    return {
      zones,
      checkIn: checkInStr ? new Date(`${checkInStr}T12:00:00`) : null,
      checkOut: checkOutStr ? new Date(`${checkOutStr}T12:00:00`) : null,
      priceMin: parseNum(priceMin),
      priceMax: parseNum(priceMax),
      bedroomsMin: parseBed(bedroomsMin),
      propertyType,
    };
  }, [zones, checkInStr, checkOutStr, priceMin, priceMax, bedroomsMin, propertyType]);

  const { data: results = [], isLoading, isFetching } = useStaysSearch(filters, submitted);

  const toggleZone = (z: StaysZone) => {
    setZones((prev) => (prev.includes(z) ? prev.filter((x) => x !== z) : [...prev, z]));
  };

  const toggleAmenity = (key: string) => {
    setSelectedAmenities(prev => prev.includes(key) ? prev.filter(a => a !== key) : [...prev, key]);
  };

  const handleSearch = () => {
    setSubmitted(true);
  };

  const nightly = (row: { price_per_night: number | null; price: number | null }) =>
    row.price_per_night ?? row.price ?? 0;

  // Post-filter by amenities and guest count, then sort
  const sortedResults = useMemo(() => {
    let filtered = [...results];

    // Guest count filter
    if (guestsCount) {
      const gc = parseInt(guestsCount, 10);
      if (gc > 0) {
        filtered = filtered.filter(r => !r.max_guests || r.max_guests >= gc);
      }
    }

    // Amenity filter (match all selected amenities against property amenities array)
    if (selectedAmenities.length > 0) {
      filtered = filtered.filter(r => {
        const propAmenities = (r.amenities || []).map((a: string) => a.toLowerCase());
        return selectedAmenities.every(sa =>
          propAmenities.some((pa: string) => pa.includes(sa))
        );
      });
    }

    // Sort
    switch (sortBy) {
      case 'price_asc':
        filtered.sort((a, b) => nightly(a) - nightly(b));
        break;
      case 'price_desc':
        filtered.sort((a, b) => nightly(b) - nightly(a));
        break;
      case 'bedrooms_desc':
        filtered.sort((a, b) => (b.bedrooms || 0) - (a.bedrooms || 0));
        break;
    }

    return filtered;
  }, [results, sortBy, guestsCount]);

  return (
    <AppLayout showHeader={false} showBottomNav>
      <div className="min-h-screen bg-background pb-24">
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
          <div className="px-4 py-3 flex items-center gap-3">
            <BackButton fallbackPath={APP_ROUTES.PROPERTY} variant="ghost" size="sm" />
            <h1 className="text-lg font-semibold">{isRu ? 'Поиск жилья' : 'Find a Stay'}</h1>
          </div>
        </header>

        <div className="px-4 py-4 space-y-6 max-w-3xl mx-auto">
          <section className="space-y-3">
            <Label className="text-base">{isRu ? 'Зона Пхукета' : 'Phuket Zone'}</Label>
            <div className="flex flex-wrap gap-2">
              {STAYS_ZONE_OPTIONS.map((z) => (
                <button
                  key={z}
                  type="button"
                  onClick={() => toggleZone(z)}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-sm transition-colors',
                    zones.includes(z)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-muted/50 border-border hover:border-primary/40',
                  )}
                >
                  {zoneLabelRu(z)}
                </button>
              ))}
            </div>
          </section>

          <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="stays-checkin">{isRu ? 'Заезд' : 'Check-in'}</Label>
              <Input
                id="stays-checkin"
                type="date"
                value={checkInStr}
                onChange={(e) => setCheckInStr(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stays-checkout">{isRu ? 'Выезд' : 'Check-out'}</Label>
              <Input
                id="stays-checkout"
                type="date"
                value={checkOutStr}
                onChange={(e) => setCheckOutStr(e.target.value)}
              />
            </div>
          </section>

          {/* Guest count */}
          <section className="space-y-2">
            <Label htmlFor="stays-guests">{isRu ? 'Количество гостей' : 'Guests'}</Label>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <Input
                id="stays-guests"
                inputMode="numeric"
                placeholder={isRu ? '2' : '2'}
                value={guestsCount}
                onChange={e => setGuestsCount(e.target.value)}
                className="w-24"
              />
            </div>
          </section>

          <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="stays-min">{isRu ? 'Цена за ночь от (฿)' : 'Price from (฿)'}</Label>
              <Input
                id="stays-min"
                inputMode="numeric"
                placeholder="1000"
                value={priceMin}
                onChange={(e) => setPriceMin(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stays-max">{isRu ? 'Цена за ночь до (฿)' : 'Price to (฿)'}</Label>
              <Input
                id="stays-max"
                inputMode="numeric"
                placeholder="20000"
                value={priceMax}
                onChange={(e) => setPriceMax(e.target.value)}
              />
            </div>
          </section>

          <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="stays-bed">{isRu ? 'Спален (мин.)' : 'Bedrooms (min)'}</Label>
              <Input
                id="stays-bed"
                inputMode="numeric"
                placeholder="1"
                value={bedroomsMin}
                onChange={(e) => setBedroomsMin(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stays-type">{isRu ? 'Тип объекта' : 'Property Type'}</Label>
              <select
                id="stays-type"
                className="flex h-10 w-full rounded-none border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
              >
                {STAYS_PROPERTY_TYPES.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </section>

          {/* Amenity Filters */}
          <section className="space-y-3">
            <button
              type="button"
              className="flex items-center gap-2 text-sm font-medium"
              onClick={() => setShowFilters(!showFilters)}
            >
              <SlidersHorizontal className="w-4 h-4" />
              {isRu ? 'Удобства' : 'Amenities'}
              {selectedAmenities.length > 0 && (
                <Badge variant="secondary" className="text-xs">{selectedAmenities.length}</Badge>
              )}
            </button>
            {showFilters && (
              <div className="flex flex-wrap gap-2">
                {AMENITY_FILTERS.map(a => (
                  <button
                    key={a.key}
                    type="button"
                    onClick={() => toggleAmenity(a.key)}
                    className={cn(
                      'rounded-full border px-3 py-1.5 text-sm transition-colors',
                      selectedAmenities.includes(a.key)
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-muted/50 border-border hover:border-primary/40',
                    )}
                  >
                    {isRu ? a.labelRu : a.labelEn}
                  </button>
                ))}
              </div>
            )}
          </section>

          <Button
            type="button"
            className="w-full gap-2"
            size="lg"
            onClick={handleSearch}
            disabled={isLoading || isFetching}
          >
            {isLoading || isFetching ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Search className="h-5 w-5" />
            )}
            {isRu ? 'Найти' : 'Search'}
          </Button>

          {submitted && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {isFetching
                  ? (isRu ? 'Проверяем календарь и брони…' : 'Checking calendar...')
                  : (isRu ? `Найдено: ${sortedResults.length}` : `Found: ${sortedResults.length}`)}
              </p>
              {!isFetching && sortedResults.length > 1 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-1">
                      <ArrowUpDown className="w-3.5 h-3.5" />
                      {isRu ? 'Сортировка' : 'Sort'}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setSortBy('default')}>
                      {isRu ? 'По умолчанию' : 'Default'} {sortBy === 'default' && '✓'}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy('price_asc')}>
                      {isRu ? 'Цена: дешевле' : 'Price: Low to High'} {sortBy === 'price_asc' && '✓'}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy('price_desc')}>
                      {isRu ? 'Цена: дороже' : 'Price: High to Low'} {sortBy === 'price_desc' && '✓'}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy('bedrooms_desc')}>
                      {isRu ? 'Больше спален' : 'Most Bedrooms'} {sortBy === 'bedrooms_desc' && '✓'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            {submitted &&
              sortedResults.map((p) => {
                const img = p.cover_image || p.images?.[0];
                const title = isRu ? (p.title_ru || p.title_en || 'Объект') : (p.title_en || p.title_ru || 'Property');
                const zone = p.district || '—';
                const price = nightly(p);
                const cur = p.currency || 'THB';
                const inquiryUrl = `${APP_ROUTES.PROPERTY_INQUIRY(p.id)}${checkInStr && checkOutStr
                  ? `?checkIn=${encodeURIComponent(format(new Date(`${checkInStr}T12:00:00`), 'yyyy-MM-dd'))}&checkOut=${encodeURIComponent(format(new Date(`${checkOutStr}T12:00:00`), 'yyyy-MM-dd'))}&guests=2`
                  : ''
                  }`;

                return (
                  <Card key={p.id} className="overflow-hidden border-border/80">
                    <div className="aspect-[4/3] bg-muted relative">
                      {img ? (
                        <img
                          src={img}
                          alt=""
                          className="absolute inset-0 w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-xs">
                          {isRu ? 'Нет фото' : 'No photo'}
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4 space-y-2">
                      <h2 className="font-semibold leading-snug line-clamp-2">{title}</h2>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        <span className="line-clamp-1">{zone}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary" className="font-normal">
                          {price > 0 ? `${price.toLocaleString('ru-RU')} ${cur}/${isRu ? 'ночь' : 'night'}` : (isRu ? 'Цена по запросу' : 'Price on request')}
                        </Badge>
                        {p.bedrooms != null && (
                          <span className="text-xs text-muted-foreground">
                            {p.bedrooms} {isRu ? 'спален' : 'bed'}
                          </span>
                        )}
                        {p.property_type && (
                          <span className="text-xs text-muted-foreground capitalize">
                            {p.property_type}
                          </span>
                        )}
                      </div>
                      <Button
                        type="button"
                        className="w-full"
                        variant="default"
                        onClick={() => navigate(inquiryUrl)}
                      >
                        {isRu ? 'Узнать цену' : 'Check Price'}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
          </div>

          {submitted && !isFetching && sortedResults.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              {isRu ? 'Ничего не найдено. Измените даты или фильтры.' : 'No results found. Try different dates or filters.'}
            </p>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
