import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Wrench } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { MiniAppLayout, type MiniAppLayoutProps } from '@/components/miniapp/MiniAppLayout';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/uno/EmptyState';
import { useServiceFunctions } from '@/hooks/useServiceFunctions';
import { ServiceFunctionCard } from '@/components/services';
import { SERVICE_CATEGORIES } from '@/lib/config/homeServiceFunctions';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePersonaFilter } from '@/hooks/usePersonaFilter';
import { MarketplaceServiceGrid } from '@/components/services/MarketplaceServiceGrid';

// Only equivalent names are aliases. Unavailable trades must not silently
// become a different service (e.g. photography → handyman).
const CATEGORY_ALIAS: Record<string, string> = {
  'pest-control': 'pest_control', 'ac-repair': 'ac', gardening: 'garden',
};

function EmbeddedServicesLayout({ title, subtitle, searchValue, onSearchChange, searchPlaceholder, children }: MiniAppLayoutProps) {
  return <div className="space-y-6">
    <header className="space-y-2"><h1 className="text-2xl font-semibold">{title}</h1><p className="text-muted-foreground">{subtitle}</p></header>
    <Input type="search" aria-label={searchPlaceholder} placeholder={searchPlaceholder} value={searchValue} onChange={event => onSearchChange?.(event.target.value)} />
    {children}
  </div>;
}

export default function ServicesIndex({ embedded = false }: { embedded?: boolean } = {}) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const location = useLocation();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { functions, categories, search } = useServiceFunctions();
  const { applyFilter } = usePersonaFilter();
  const query = params.get('q') ?? '';
  const rawCategory = params.get('category') ?? params.get('type') ?? 'all';
  const category = CATEGORY_ALIAS[rawCategory] ?? rawCategory;
  const unknownCategory = category !== 'all' && !SERVICE_CATEGORIES.some(c => c.id === category);
  const returnTo = location.pathname + location.search;
  const Layout = embedded ? EmbeddedServicesLayout : MiniAppLayout;

  let requests = query.trim() ? search(query) : functions;
  if (category !== 'all') requests = requests.filter(fn => fn.category === category);
  requests = applyFilter(requests, fn => [fn.category, fn.id]);
  if (params.get('sort') === 'popular' || params.get('sort') === 'rating') {
    requests = [...requests].sort((a, b) => Number(Boolean(b.isPopular)) - Number(Boolean(a.isPopular)));
  }

  const update = (key: 'q' | 'category', value: string) => {
    const next = new URLSearchParams(params);
    if (value && value !== 'all') next.set(key, value);
    else next.delete(key);
    if (key === 'category') next.delete('type');
    setParams(next, { replace: key === 'q' });
  };
  const clear = () => {
    const next = new URLSearchParams(params);
    ['q', 'category', 'type', 'sort'].forEach(key => next.delete(key));
    setParams(next);
  };

  return (
    <Layout
      title={isRu ? 'Услуги' : 'Services'}
      subtitle={isRu ? 'Найдите услугу или выберите категорию.' : 'Find a service or choose a category.'}
      fallbackPath="/"
      searchValue={query}
      onSearchChange={value => update('q', value)}
      searchPlaceholder={isRu ? 'Поиск услуг…' : 'Search services…'}
      showHero={false}
      showFilter={false}
      showEcosystemHint={false}
    >
      <nav aria-label={isRu ? 'Другие категории услуг' : 'More service categories'} className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
        <Link className="min-h-11 inline-flex items-center underline underline-offset-4" to="/cleaning">{isRu ? 'Уборка' : 'Cleaning'}</Link>
        <Link className="min-h-11 inline-flex items-center underline underline-offset-4" to="/transport">{isRu ? 'Транспорт' : 'Transport'}</Link>
        <Link className="min-h-11 inline-flex items-center underline underline-offset-4" to="/thai-services">{isRu ? 'Местные компании' : 'Local businesses'}</Link>
      </nav>

      <MarketplaceServiceGrid search={query} returnTo={returnTo} />

      <section aria-labelledby="service-requests" className="space-y-4">
        <header className="space-y-2">
          <h2 id="service-requests" className="font-display text-lg">{isRu ? 'Услуги для дома по запросу' : 'Home service requests'}</h2>
          <p className="text-sm text-muted-foreground">{isRu
            ? 'Цены ориентировочные. Исполнитель, время и итоговая стоимость подтверждаются после заявки.'
            : 'Prices are estimates. The provider, time and final price are confirmed after your request.'}</p>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span id="request-category-label">{isRu ? 'Категория заявки' : 'Request category'}</span>
            <Select value={category} onValueChange={value => update('category', value)}>
              <SelectTrigger aria-labelledby="request-category-label" className="min-h-11 w-full sm:w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent collisionPadding={12} className="max-w-[calc(100vw-24px)]">
                <SelectItem className="min-h-11" value="all">{isRu ? 'Все категории' : 'All categories'}</SelectItem>
                {unknownCategory && <SelectItem className="min-h-11" value={category}>{rawCategory}</SelectItem>}
                {categories.map(item => <SelectItem className="min-h-11" key={item.id} value={item.id}>{item.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </header>
        {requests.length === 0 ? (
          <div className="space-y-2">
            <EmptyState icon={Wrench} title={isRu ? 'Услуги не найдены' : 'No services found'} />
            <Button variant="outline" onClick={clear}>{isRu ? 'Сбросить поиск и категорию' : 'Clear search and category'}</Button>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {requests.map(fn => <ServiceFunctionCard key={fn.id} fn={fn}
              onClick={() => navigate(`/services/order/${fn.id}?returnTo=${encodeURIComponent(returnTo)}`)} />)}
          </div>
        )}
      </section>
    </Layout>
  );
}
