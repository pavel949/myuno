import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Star } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { BackButton } from '@/components/uno/BackButton';
import { SEOHead } from '@/components/seo';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useLanguage } from '@/contexts/LanguageContext';
import { APP_ROUTES } from '@/lib/config/routes';
import { AREA_LANDINGS } from '@/content/landings/areaLandings';
import { cn } from '@/lib/utils';

const ALL_TAGS = Array.from(
  new Set(AREA_LANDINGS.flatMap((l) => l.area.popular_for)),
).sort();

export default function RelocationAreasPage() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const [maxPriceSqm, setMaxPriceSqm] = useState(150000);
  const [activeTags, setActiveTags] = useState<string[]>([]);

  const toggleTag = (tag: string) => {
    setActiveTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const filtered = useMemo(() => {
    return AREA_LANDINGS.filter(({ area }) => {
      if (area.avg_price_sqm > maxPriceSqm) return false;
      if (!activeTags.length) return true;
      return activeTags.some((t) => area.popular_for.includes(t));
    });
  }, [maxPriceSqm, activeTags]);

  const title = isRu ? 'Где жить на Пхукете' : 'Where to live in Phuket';
  const description = isRu
    ? 'Фильтруйте районы по стилю жизни и бюджету, затем откройте подробный гид.'
    : 'Filter districts by lifestyle and budget, then open the full area guide.';

  return (
    <AppLayout>
      <SEOHead title={title} description={description} url="https://myuno.app/relocate/areas" />
      <div className="px-4 pb-28 pt-4 max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-4">
          <BackButton fallbackPath={APP_ROUTES.RELOCATE} variant="ghost" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>

        <div className="mt-6 rounded-none border border-border bg-card p-4 space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {isRu ? 'Макс. средняя цена / м² (THB)' : 'Max avg price / sqm (THB)'}
            </p>
            <p className="text-sm text-foreground mt-1">฿{(maxPriceSqm / 1000).toFixed(0)}k</p>
            <Slider
              className="mt-3"
              min={40000}
              max={150000}
              step={5000}
              value={[maxPriceSqm]}
              onValueChange={(v) => setMaxPriceSqm(v[0] ?? maxPriceSqm)}
            />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {isRu ? 'Стиль жизни (можно несколько)' : 'Lifestyle (multi-select)'}
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              {ALL_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs border transition-colors capitalize',
                    activeTags.includes(tag) ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground',
                  )}
                >
                  {tag.replace(/-/g, ' ')}
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground mt-4">
          {isRu ? 'Показано районов:' : 'Areas shown:'} {filtered.length}
        </p>

        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {filtered.map(({ slug, area }) => {
            const name = isRu ? area.name_ru : area.name_en;
            const desc = isRu ? area.description_ru : area.description_en;
            const mapHref = `https://www.google.com/maps/search/?api=1&query=${area.lat},${area.lng}`;
            return (
              <li key={slug}>
                <div className="h-full rounded-none border border-border bg-card p-4 flex flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="text-base font-semibold text-foreground">{name}</h2>
                    <div className="flex shrink-0 gap-0.5" aria-label={`rating ${area.investment_rating}`}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={
                            i < area.investment_rating ? 'h-3.5 w-3.5 fill-primary text-primary' : 'h-3.5 w-3.5 text-muted-foreground/40'
                          }
                          aria-hidden
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-3">{desc}</p>
                  <p className="text-[11px] text-muted-foreground mt-2">
                    ฿{(area.avg_price_sqm / 1000).toFixed(0)}k/m² · {area.avg_yield}% {isRu ? 'доходность' : 'yield'}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-auto pt-3">
                    <Button asChild size="sm" variant="default" className="text-xs">
                      <Link to={APP_ROUTES.AREA_DETAIL(slug)}>{isRu ? 'Гид района' : 'Area guide'}</Link>
                    </Button>
                    <Button asChild size="sm" variant="outline" className="text-xs">
                      <a href={mapHref} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        Map
                      </a>
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <Button asChild variant="link" className="mt-4 px-0">
          <Link to={APP_ROUTES.AREA_INDEX}>{isRu ? 'Полный каталог районов' : 'Full area index'}</Link>
        </Button>
      </div>
    </AppLayout>
  );
}
