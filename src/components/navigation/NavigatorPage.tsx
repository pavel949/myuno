/**
 * NavigatorPage — Super-app ecosystem map (fintech tile layout)
 * Accessible from bottom nav "Navigator" tab
 */
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plane, Home, Scale, TrendingUp, Building2, HardHat,
  Smartphone, ArrowLeftRight, Car, Landmark, Zap,
  Utensils, Sparkles, Stethoscope, ClipboardList, ShoppingBag, Users,
  FileSearch, Calculator, Shield,
  Calendar, BarChart3, Wrench, PenTool, DollarSign,
  Building, Search, LineChart, Palette, LayoutGrid, X,
  Compass, Anchor, Dumbbell, CalendarDays, GraduationCap, Baby, PawPrint, Heart,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/layout/AppLayout';
import { cn } from '@/lib/utils';
import { APP_ROUTES } from '@/lib/config/routes';
import { NavChips, type NavChipItem } from '@/components/nav/NavChips';

interface ClusterService {
  labelRu: string;
  labelEn: string;
  icon: React.ElementType;
  path: string;
  status: 'available' | 'soon' | 'pro';
}

interface Cluster {
  id: string;
  labelRu: string;
  labelEn: string;
  valueRu: string;
  valueEn: string;
  color: string;
  icon: React.ElementType;
  services: ClusterService[];
}

const CLUSTERS: Cluster[] = [
  {
    id: 'arrive',
    labelRu: 'ПРИЕХАТЬ',
    labelEn: 'ARRIVE',
    valueRu: 'Туристы и новые резиденты: дорога от аэропорта, связь, деньги, мобильность.',
    valueEn: 'Tourists & new residents: airport transfers, connectivity, money, getting around.',
    color: '#00D68F',
    icon: Plane,
    services: [
      { labelRu: 'Трансферы', labelEn: 'Transfers', icon: Car, path: APP_ROUTES.AIRPORT_TRANSFER, status: 'available' },
      { labelRu: 'SIM-карты', labelEn: 'SIM Cards', icon: Smartphone, path: APP_ROUTES.SIM_START, status: 'available' },
      { labelRu: 'Курсы валют', labelEn: 'Exchange', icon: ArrowLeftRight, path: APP_ROUTES.EXCHANGE, status: 'available' },
      { labelRu: 'Авто', labelEn: 'Car Rental', icon: Car, path: APP_ROUTES.TRANSPORT, status: 'available' },
      { labelRu: 'Банк', labelEn: 'Bank', icon: Landmark, path: APP_ROUTES.BANKING, status: 'available' },
      { labelRu: 'Fast Track', labelEn: 'Fast Track', icon: Zap, path: APP_ROUTES.FAST_TRACK, status: 'available' },
    ],
  },
  {
    id: 'live',
    labelRu: 'ЖИТЬ',
    labelEn: 'LIVE',
    valueRu: 'Резиденты: быт, здоровье, еда, покупки — без хаоса.',
    valueEn: 'Residents: dining, wellness, home services, shopping — one place.',
    color: '#4E7BFF',
    icon: Home,
    services: [
      { labelRu: 'Рестораны', labelEn: 'Restaurants', icon: Utensils, path: APP_ROUTES.RESTAURANTS, status: 'available' },
      { labelRu: 'Афиша', labelEn: 'Events', icon: CalendarDays, path: APP_ROUTES.EVENTS, status: 'available' },
      { labelRu: 'Красота', labelEn: 'Beauty', icon: Palette, path: APP_ROUTES.BEAUTY, status: 'available' },
      { labelRu: 'Медицина', labelEn: 'Medical', icon: Stethoscope, path: APP_ROUTES.MEDICAL, status: 'available' },
      { labelRu: 'Маркет', labelEn: 'Market', icon: ShoppingBag, path: APP_ROUTES.MARKET, status: 'available' },
      { labelRu: 'Уборка', labelEn: 'Cleaning', icon: Sparkles, path: APP_ROUTES.CLEANING, status: 'available' },
      { labelRu: 'Услуги', labelEn: 'Services', icon: Wrench, path: APP_ROUTES.SERVICES, status: 'available' },
    ],
  },
  {
    id: 'enjoy',
    labelRu: 'ОТДЫХАТЬ',
    labelEn: 'ENJOY',
    valueRu: 'Впечатления, яхты, спорт, события — лучшее на Пхукете.',
    valueEn: 'Experiences, yachts, fitness, events — the best of Phuket.',
    color: '#EC4899',
    icon: Heart,
    services: [
      { labelRu: 'Впечатления', labelEn: 'Experiences', icon: Compass, path: APP_ROUTES.EXPERIENCES, status: 'available' },
      { labelRu: 'Яхты', labelEn: 'Yachts', icon: Anchor, path: APP_ROUTES.YACHTS, status: 'available' },
      { labelRu: 'События', labelEn: 'Events', icon: CalendarDays, path: APP_ROUTES.EVENTS, status: 'available' },
      { labelRu: 'Фитнес', labelEn: 'Fitness', icon: Dumbbell, path: APP_ROUTES.FITNESS, status: 'available' },
      { labelRu: 'Цветы', labelEn: 'Flowers', icon: Sparkles, path: APP_ROUTES.FLOWERS, status: 'available' },
    ],
  },
  {
    id: 'legal',
    labelRu: 'ЛЕГАЛЬНО',
    labelEn: 'STAY LEGAL',
    valueRu: 'Статус, налоги, договоры и страховки.',
    valueEn: 'Visa status, taxes, contracts & insurance.',
    color: '#F59E0B',
    icon: Scale,
    services: [
      { labelRu: 'Визы', labelEn: 'Visas', icon: Plane, path: APP_ROUTES.VISA_IMMIGRATION, status: 'available' },
      { labelRu: 'Налоги', labelEn: 'Taxes', icon: Calculator, path: APP_ROUTES.TAX_NAV, status: 'available' },
      { labelRu: 'ContractAI', labelEn: 'ContractAI', icon: FileSearch, path: APP_ROUTES.CONTRACT_ANALYSIS, status: 'available' },
      { labelRu: 'Страховка', labelEn: 'Insurance', icon: Shield, path: APP_ROUTES.INSURANCE, status: 'available' },
    ],
  },
  {
    id: 'invest',
    labelRu: 'КУПИТЬ',
    labelEn: 'INVEST',
    valueRu: 'Каталог, новостройки, вторичка, застройщики, ROI.',
    valueEn: 'Search, off-plan, resale, developers, ROI tools.',
    color: '#A855F7',
    icon: TrendingUp,
    services: [
      { labelRu: 'Поиск', labelEn: 'Property', icon: Search, path: APP_ROUTES.PROPERTY, status: 'available' },
      { labelRu: 'Новостройки', labelEn: 'Off-plan', icon: Building2, path: APP_ROUTES.OFFPLAN, status: 'available' },
      { labelRu: 'Вторичка', labelEn: 'Resale', icon: Building2, path: APP_ROUTES.RESALE, status: 'available' },
      { labelRu: 'Застройщики', labelEn: 'Developers', icon: Users, path: APP_ROUTES.DEVELOPERS, status: 'available' },
      { labelRu: 'ROI', labelEn: 'ROI Hub', icon: BarChart3, path: APP_ROUTES.INVEST, status: 'available' },
      { labelRu: 'DueDiligence', labelEn: 'DueDiligence', icon: Shield, path: APP_ROUTES.INVEST, status: 'soon' },
    ],
  },
  {
    id: 'family',
    labelRu: 'СЕМЬЯ',
    labelEn: 'FAMILY & PETS',
    valueRu: 'Школы, няни, ветеринары, питомцы.',
    valueEn: 'Schools, childcare, vets, pet services.',
    color: '#F59E0B',
    icon: Baby,
    services: [
      { labelRu: 'Образование', labelEn: 'Education', icon: GraduationCap, path: APP_ROUTES.EDUCATION, status: 'available' },
      { labelRu: 'Няни', labelEn: 'Babysitters', icon: Baby, path: APP_ROUTES.BABYSITTER, status: 'available' },
      { labelRu: 'Питомцы', labelEn: 'Pets', icon: PawPrint, path: APP_ROUTES.PETS, status: 'available' },
      { labelRu: 'Школы', labelEn: 'Schools', icon: Search, path: APP_ROUTES.SCHOOL_FINDER, status: 'available' },
      { labelRu: 'Аптеки', labelEn: 'Pharmacy', icon: Stethoscope, path: APP_ROUTES.PHARMACY, status: 'available' },
    ],
  },
  {
    id: 'manage',
    labelRu: 'УПРАВЛЯТЬ',
    labelEn: 'MANAGE',
    valueRu: 'Собственники: брони, финансы, CRM — один кабинет.',
    valueEn: 'Hosts & managers: bookings, money, ops, CRM.',
    color: '#06B6D4',
    icon: Building2,
    services: [
      { labelRu: 'Кабинет', labelEn: 'Dashboard', icon: Calendar, path: '/mc', status: 'available' },
      { labelRu: 'Календарь', labelEn: 'Calendar', icon: Calendar, path: APP_ROUTES.MC_CALENDAR, status: 'available' },
      { labelRu: 'Финансы', labelEn: 'Finances', icon: DollarSign, path: APP_ROUTES.MC_FINANCE, status: 'available' },
      { labelRu: 'Операции', labelEn: 'Operations', icon: ClipboardList, path: '/mc/operations', status: 'available' },
      { labelRu: 'Отчёты', labelEn: 'Reports', icon: BarChart3, path: APP_ROUTES.MC_REPORTS, status: 'pro' },
      { labelRu: 'CRM', labelEn: 'CRM', icon: Users, path: APP_ROUTES.MC_CRM_DASHBOARD, status: 'pro' },
    ],
  },
  {
    id: 'build',
    labelRu: 'ДЕВЕЛОПЕРАМ',
    labelEn: 'FOR DEVELOPERS',
    valueRu: 'Портал, лиды, витрина проектов, консультации.',
    valueEn: 'Portal, leads, project showcase & deal advisory.',
    color: '#F43F5E',
    icon: HardHat,
    services: [
      { labelRu: 'Портал', labelEn: 'Portal', icon: Building, path: APP_ROUTES.DEVELOPER_PORTAL, status: 'available' },
      { labelRu: 'Программа', labelEn: 'Program', icon: LineChart, path: APP_ROUTES.FOR_REAL_ESTATE_DEVELOPERS, status: 'available' },
      { labelRu: 'Витрина', labelEn: 'Showcase', icon: Building2, path: APP_ROUTES.NEWBUILDS, status: 'available' },
      { labelRu: 'Консультация', labelEn: 'Advisory', icon: PenTool, path: APP_ROUTES.PROPERTY_CONSULTATION, status: 'available' },
    ],
  },
];

const ALL_SERVICES: Array<ClusterService & { clusterColor: string; clusterLabelRu: string; clusterLabelEn: string }> =
  CLUSTERS.flatMap(c =>
    c.services
      .filter(s => s.status !== 'soon')
      .map(s => ({ ...s, clusterColor: c.color, clusterLabelRu: c.labelRu, clusterLabelEn: c.labelEn })),
  );

const SOON_SERVICES: Array<ClusterService & { clusterColor: string; clusterLabelRu: string; clusterLabelEn: string }> =
  CLUSTERS.flatMap(c =>
    c.services
      .filter(s => s.status === 'soon')
      .map(s => ({ ...s, clusterColor: c.color, clusterLabelRu: c.labelRu, clusterLabelEn: c.labelEn })),
  );

const TOTAL_NAVIGATOR_SERVICES = CLUSTERS.reduce((n, c) => n + c.services.filter(s => s.status !== 'soon').length, 0);

function NavigatorStatsFooter({
  stats,
  isRu,
}: {
  stats: { properties: number; bookings: number; providers: number } | undefined;
  isRu: boolean;
}) {
  if (stats === undefined) {
    return (
      <p className="text-xs text-muted-foreground">
        {isRu ? 'Загрузка…' : 'Loading…'}
      </p>
    );
  }

  const chunks: React.ReactNode[] = [];
  if (stats.properties > 0)
    chunks.push(<span key="p"><span className="text-primary font-bold">{stats.properties}+</span> {isRu ? 'объектов' : 'properties'}</span>);
  if (stats.bookings > 0)
    chunks.push(<span key="b"><span className="text-primary font-bold">{stats.bookings}+</span> {isRu ? 'бронирований' : 'bookings'}</span>);
  if (stats.providers > 0)
    chunks.push(<span key="v"><span className="text-primary font-bold">{stats.providers}+</span> {isRu ? 'партнёров' : 'partners'}</span>);

  if (chunks.length === 0) {
    return (
      <p className="text-xs text-muted-foreground leading-relaxed">
        {isRu
          ? 'Сервисы и партнёры на Пхукете — в одной экосистеме. Поддержка 24/7.'
          : 'Phuket services & partners in one ecosystem. 24/7 support.'}
      </p>
    );
  }

  const out: React.ReactNode[] = [];
  chunks.forEach((el, i) => {
    out.push(el);
    if (i < chunks.length - 1) out.push(<span key={`d${i}`} className="mx-2 text-muted-foreground/40">·</span>);
  });
  out.push(<span key="d247" className="mx-2 text-muted-foreground/40">·</span>);
  out.push(<span key="247"><span className="text-primary font-bold">24/7</span> {isRu ? 'поддержка' : 'support'}</span>);

  return <p className="text-xs text-muted-foreground leading-relaxed">{out}</p>;
}

function ServiceTile({
  service,
  clusterColor,
  isRu,
  onNavigate,
}: {
  service: ClusterService;
  clusterColor: string;
  isRu: boolean;
  onNavigate: (path: string) => void;
}) {
  const SIcon = service.icon;
  const isSoon = service.status === 'soon';
  const isPro = service.status === 'pro';

  return (
    <button
      onClick={() => !isSoon && onNavigate(service.path)}
      className={cn(
        'relative flex flex-col items-center justify-center gap-1.5',
        'w-[72px] min-w-[72px] h-[72px] rounded-2xl',
        'active:scale-[0.93] transition-all duration-150 snap-start shrink-0',
        isSoon && 'opacity-40 pointer-events-none',
      )}
      style={{ background: clusterColor + '14' }}
      disabled={isSoon}
    >
      <SIcon className="w-5 h-5" style={{ color: clusterColor }} />
      <span className="text-[10px] font-medium text-foreground leading-tight text-center px-1 line-clamp-1">
        {isRu ? service.labelRu : service.labelEn}
      </span>
      {isPro && (
        <span
          className="absolute top-1 right-1 text-[7px] font-bold px-1 py-px rounded-full"
          style={{ background: '#F59E0B22', color: '#F59E0B' }}
        >
          PRO
        </span>
      )}
      {isSoon && (
        <span
          className="absolute top-1 right-1 text-[7px] font-medium px-1 py-px rounded-full"
          style={{ background: 'hsl(0 0% 100% / 0.08)', color: 'hsl(var(--muted-foreground))' }}
        >
          Soon
        </span>
      )}
    </button>
  );
}

export default function NavigatorPage() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [activeCluster, setActiveCluster] = useState<string>('all');

  const clusterChips: NavChipItem[] = useMemo(
    () => [
      { id: 'all', label: isRu ? 'Все' : 'All', count: TOTAL_NAVIGATOR_SERVICES },
      ...CLUSTERS.map((c) => ({
        id: c.id,
        label: isRu ? c.labelRu : c.labelEn,
        accentColor: c.color,
        count: c.services.filter((s) => s.status !== 'soon').length,
      })),
    ],
    [isRu],
  );

  const visibleClusters = useMemo(
    () => (activeCluster === 'all' ? CLUSTERS : CLUSTERS.filter((c) => c.id === activeCluster)),
    [activeCluster],
  );

  const { data: stats } = useQuery({
    queryKey: ['navigator-stats'],
    queryFn: async () => {
      const [properties, bookings, providers] = await Promise.all([
        supabase.from('properties').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('property_bookings').select('id', { count: 'exact', head: true }),
        supabase.from('providers').select('id', { count: 'exact', head: true }).eq('is_active', true),
      ]);
      return {
        properties: properties.count ?? 0,
        bookings: bookings.count ?? 0,
        providers: providers.count ?? 0,
      };
    },
    staleTime: 10 * 60 * 1000,
  });

  const trimmedQuery = query.trim().toLowerCase();

  const searchResults = useMemo(() => {
    if (!trimmedQuery) return null;
    return ALL_SERVICES.filter(s => {
      const label = isRu ? s.labelRu : s.labelEn;
      const cluster = isRu ? s.clusterLabelRu : s.clusterLabelEn;
      return (
        label.toLowerCase().includes(trimmedQuery) ||
        cluster.toLowerCase().includes(trimmedQuery)
      );
    });
  }, [trimmedQuery, isRu]);

  return (
    <AppLayout>
      <div className="px-4 py-6 pb-24 max-w-2xl mx-auto space-y-5">

        {/* Header */}
        <div className="text-center space-y-1">
          <h1 className="text-[22px] font-display font-bold text-foreground">
            {isRu ? 'Навигатор' : 'Navigator'}
          </h1>
          <p className="text-sm text-muted-foreground leading-snug">
            {isRu
              ? `${TOTAL_NAVIGATOR_SERVICES} сервисов · один суперапп myUNO`
              : `${TOTAL_NAVIGATOR_SERVICES} services · one myUNO superapp`}
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={isRu ? 'Найти сервис…' : 'Search services…'}
            className={cn(
              'w-full h-10 pl-9 pr-9 rounded-[var(--radius-md)] text-sm',
              'bg-[hsl(var(--bg-elevated))] border border-[hsl(0_0%_100%_/_0.07)]',
              'text-foreground placeholder:text-muted-foreground/60',
              'focus:outline-none focus:ring-1 focus:ring-primary/40',
            )}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Cluster filter chips — only when not searching */}
        {searchResults === null && (
          <NavChips
            items={clusterChips}
            activeId={activeCluster}
            onChange={setActiveCluster}
            ariaLabel={isRu ? 'Фильтр по кластерам' : 'Filter by cluster'}
          />
        )}

        {/* Search results — grid of tiles */}
        {searchResults !== null && (
          <div className="space-y-2">
            {searchResults.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                {isRu ? 'Ничего не найдено' : 'No results found'}
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {searchResults.map(service => (
                  <ServiceTile
                    key={`search-${service.path}-${service.labelEn}`}
                    service={service}
                    clusterColor={service.clusterColor}
                    isRu={isRu}
                    onNavigate={navigate}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Cluster tile rows — filtered by activeCluster */}
        {searchResults === null && (
          <div className="space-y-5">
            {visibleClusters.map(cluster => {
              const Icon = cluster.icon;
              const services = cluster.services;
              const availableCount = services.filter(s => s.status !== 'soon').length;

              return (
                <section key={cluster.id}>
                  {/* Cluster header */}
                  <div className="flex items-center gap-2.5 mb-2.5">
                    <div
                      className="w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0"
                      style={{ background: cluster.color + '1A' }}
                    >
                      <Icon className="w-4 h-4" style={{ color: cluster.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3
                          className="text-[13px] font-display font-bold tracking-wide"
                          style={{ color: cluster.color }}
                        >
                          {isRu ? cluster.labelRu : cluster.labelEn}
                        </h3>
                        <span className="text-[10px] text-muted-foreground/50 font-medium">
                          {availableCount}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground/70 leading-snug line-clamp-1">
                        {isRu ? cluster.valueRu : cluster.valueEn}
                      </p>
                    </div>
                  </div>

                  {/* Tile row — horizontal scroll */}
                  <div className="flex gap-2 overflow-x-auto scrollbar-hide snap-x snap-mandatory -mx-4 px-4 pb-1">
                    {services.map(service => (
                      <ServiceTile
                        key={`${cluster.id}-${service.path}-${service.labelEn}`}
                        service={service}
                        clusterColor={cluster.color}
                        isRu={isRu}
                        onNavigate={navigate}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}

        {/* Coming soon */}
        {searchResults === null && SOON_SERVICES.length > 0 && (
          <div
            className="rounded-[var(--radius-md)] p-4 space-y-3"
            style={{ background: 'hsl(var(--bg-elevated))', border: '1px solid hsl(0 0% 100% / 0.05)' }}
          >
            <p className="text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-wider">
              {isRu ? 'Скоро' : 'Coming soon'}
            </p>
            <div className="flex flex-wrap gap-2">
              {SOON_SERVICES.map(s => {
                const SIcon = s.icon;
                return (
                  <div
                    key={`soon-${s.labelEn}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full opacity-50"
                    style={{ background: s.clusterColor + '14', border: `1px solid ${s.clusterColor}20` }}
                  >
                    <SIcon className="w-3.5 h-3.5" style={{ color: s.clusterColor }} />
                    <span className="text-[11px] font-medium" style={{ color: s.clusterColor }}>
                      {isRu ? s.labelRu : s.labelEn}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Stats + All apps link */}
        {searchResults === null && (
          <div
            className="rounded-[var(--radius-md)] p-4 space-y-3 text-center"
            style={{ background: 'hsl(var(--bg-surface))', border: '1px solid hsl(0 0% 100% / 0.05)' }}
          >
            <NavigatorStatsFooter stats={stats} isRu={isRu} />
            <button
              onClick={() => {
                window.dispatchEvent(new CustomEvent('navigator:open-apps-drawer'));
              }}
              className="inline-flex items-center gap-1.5 text-[12px] text-primary font-medium hover:underline"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              {isRu ? 'Все сервисы →' : 'All services →'}
            </button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
