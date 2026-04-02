import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Search, Loader2, MapPin } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { BackButton } from '@/components/uno/BackButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { APP_ROUTES } from '@/lib/config/routes';
import {
  useStaysSearch,
  STAYS_ZONE_OPTIONS,
  STAYS_PROPERTY_TYPES,
  type StaysSearchFilters,
  type StaysZone,
} from '@/hooks/useStaysSearch';

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
  const [zones, setZones] = useState<StaysZone[]>([]);
  const [checkInStr, setCheckInStr] = useState('');
  const [checkOutStr, setCheckOutStr] = useState('');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [bedroomsMin, setBedroomsMin] = useState('');
  const [propertyType, setPropertyType] = useState('all');
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

  const handleSearch = () => {
    setSubmitted(true);
  };

  const nightly = (row: { price_per_night: number | null; price: number | null }) =>
    row.price_per_night ?? row.price ?? 0;

  return (
    <AppLayout showHeader={false} showBottomNav>
      <div className="min-h-screen bg-background pb-24">
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
          <div className="px-4 py-3 flex items-center gap-3">
            <BackButton fallbackPath={APP_ROUTES.PROPERTY} variant="ghost" size="sm" />
            <h1 className="text-lg font-semibold">Поиск жилья (STAYS)</h1>
          </div>
        </header>

        <div className="px-4 py-4 space-y-6 max-w-3xl mx-auto">
          <section className="space-y-3">
            <Label className="text-base">Зона Пхукета</Label>
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
              <Label htmlFor="stays-checkin">Заезд</Label>
              <Input
                id="stays-checkin"
                type="date"
                value={checkInStr}
                onChange={(e) => setCheckInStr(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stays-checkout">Выезд</Label>
              <Input
                id="stays-checkout"
                type="date"
                value={checkOutStr}
                onChange={(e) => setCheckOutStr(e.target.value)}
              />
            </div>
          </section>

          <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="stays-min">Цена за ночь от (฿)</Label>
              <Input
                id="stays-min"
                inputMode="numeric"
                placeholder="1000"
                value={priceMin}
                onChange={(e) => setPriceMin(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stays-max">Цена за ночь до (฿)</Label>
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
              <Label htmlFor="stays-bed">Спален (мин.)</Label>
              <Input
                id="stays-bed"
                inputMode="numeric"
                placeholder="1"
                value={bedroomsMin}
                onChange={(e) => setBedroomsMin(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stays-type">Тип объекта</Label>
              <select
                id="stays-type"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
            Найти
          </Button>

          {submitted && (
            <p className="text-sm text-muted-foreground text-center">
              {isFetching
                ? 'Проверяем календарь и брони…'
                : `Найдено: ${results.length}`}
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            {submitted &&
              results.map((p) => {
                const img = p.cover_image || p.images?.[0];
                const title = p.title_ru || p.title_en || 'Объект';
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
                          Нет фото
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
                          {price > 0 ? `${price.toLocaleString('ru-RU')} ${cur}/ночь` : 'Цена по запросу'}
                        </Badge>
                        {p.bedrooms != null && (
                          <span className="text-xs text-muted-foreground">
                            {p.bedrooms} спален
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
                        Узнать цену
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
          </div>

          {submitted && !isFetching && results.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              Ничего не найдено. Измените даты или фильтры.
            </p>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
