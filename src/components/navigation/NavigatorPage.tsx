/**
 * NavigatorPage — Ecosystem map with accordion clusters
 * Accessible from bottom nav "Навигатор" tab
 */
import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plane, Home, Scale, TrendingUp, Building2, HardHat,
  ChevronDown, Smartphone, ArrowLeftRight, Car, Landmark, Zap,
  Utensils, Sparkles, Stethoscope, ClipboardList, ShoppingBag, Users,
  FileSearch, Calculator, Shield, FileText,
  Calendar, BarChart3, Wrench, PenTool, DollarSign,
  Building, Search, LineChart, Palette,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/layout/AppLayout';
import { cn } from '@/lib/utils';
import { APP_ROUTES } from '@/lib/config/routes';

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
  /** Who this block is for + value (shown under title) */
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
      { labelRu: 'Курсы валют', labelEn: 'Exchange Rates', icon: ArrowLeftRight, path: APP_ROUTES.EXCHANGE, status: 'available' },
      { labelRu: 'Аренда авто', labelEn: 'Car Rental', icon: Car, path: APP_ROUTES.TRANSPORT, status: 'available' },
      { labelRu: 'Банковский счёт', labelEn: 'Bank Account', icon: Landmark, path: APP_ROUTES.BANKING, status: 'available' },
      { labelRu: 'Fast Track', labelEn: 'Fast Track', icon: Zap, path: APP_ROUTES.FAST_TRACK, status: 'available' },
    ],
  },
  {
    id: 'live',
    labelRu: 'ЖИТЬ',
    labelEn: 'LIVE',
    valueRu: 'Резиденты: быт, здоровье, еда, покупки — без хаоса в десяти приложениях.',
    valueEn: 'Residents: dining, wellness, home services, shopping — one place.',
    color: '#4E7BFF',
    icon: Home,
    services: [
      { labelRu: 'Рестораны', labelEn: 'Restaurants', icon: Utensils, path: APP_ROUTES.RESTAURANTS, status: 'available' },
      { labelRu: 'Уборка', labelEn: 'Cleaning', icon: Sparkles, path: APP_ROUTES.CLEANING, status: 'available' },
      { labelRu: 'Медицина', labelEn: 'Medical', icon: Stethoscope, path: APP_ROUTES.MEDICAL, status: 'available' },
      { labelRu: 'Услуги', labelEn: 'Home services', icon: Wrench, path: APP_ROUTES.SERVICES, status: 'available' },
      { labelRu: 'Маркет', labelEn: 'Market', icon: ShoppingBag, path: APP_ROUTES.MARKET, status: 'available' },
      { labelRu: 'Красота', labelEn: 'Beauty & spa', icon: Palette, path: APP_ROUTES.BEAUTY, status: 'available' },
    ],
  },
  {
    id: 'legal',
    labelRu: 'ЛЕГАЛЬНО',
    labelEn: 'STAY LEGAL',
    valueRu: 'Статус, налоги, договоры и страховки — спокойствие и соответствие правилам.',
    valueEn: 'Visa status, taxes, contracts & insurance — stay compliant with less stress.',
    color: '#F59E0B',
    icon: Scale,
    services: [
      { labelRu: 'Визы', labelEn: 'Visas', icon: Plane, path: APP_ROUTES.VISA_IMMIGRATION, status: 'available' },
      { labelRu: 'Налоги', labelEn: 'Taxes', icon: Calculator, path: APP_ROUTES.TAX_NAV, status: 'available' },
      { labelRu: 'ContractAI', labelEn: 'ContractAI', icon: FileSearch, path: APP_ROUTES.CONTRACT_ANALYSIS, status: 'available' },
      { labelRu: 'Страхование', labelEn: 'Insurance', icon: Shield, path: APP_ROUTES.INSURANCE, status: 'available' },
    ],
  },
  {
    id: 'invest',
    labelRu: 'КУПИТЬ',
    labelEn: 'INVEST',
    valueRu: 'Покупатели и инвесторы: каталог, новостройки, вторичка, застройщики, ROI.',
    valueEn: 'Buyers & investors: search, off-plan, resale, developers, ROI tools.',
    color: '#A855F7',
    icon: TrendingUp,
    services: [
      { labelRu: 'Поиск недвижимости', labelEn: 'Property Search', icon: Search, path: APP_ROUTES.PROPERTY, status: 'available' },
      { labelRu: 'Новостройки', labelEn: 'New Developments', icon: Building2, path: APP_ROUTES.OFFPLAN, status: 'available' },
      { labelRu: 'Вторичка', labelEn: 'Resale', icon: Building2, path: APP_ROUTES.RESALE, status: 'available' },
      { labelRu: 'Застройщики', labelEn: 'Developers', icon: Users, path: APP_ROUTES.DEVELOPERS, status: 'available' },
      { labelRu: 'ROI / инвестиции', labelEn: 'ROI & invest hub', icon: BarChart3, path: APP_ROUTES.INVEST, status: 'available' },
      { labelRu: 'DueDiligence AI', labelEn: 'DueDiligence AI', icon: Shield, path: APP_ROUTES.INVEST, status: 'soon' },
    ],
  },
  {
    id: 'manage',
    labelRu: 'УПРАВЛЯТЬ',
    labelEn: 'MANAGE',
    valueRu: 'Собственники и управляющие: брони, финансы, операции, CRM — один кабинет.',
    valueEn: 'Hosts & managers: bookings, money, ops, CRM — one workspace.',
    color: '#06B6D4',
    icon: Building2,
    services: [
      { labelRu: 'Кабинет MC', labelEn: 'MC dashboard', icon: Calendar, path: '/mc', status: 'available' },
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
    valueRu: 'Застройщики: портал, лиды, витрина проектов и консультации по сделкам.',
    valueEn: 'Developers: portal, leads, project showcase & deal advisory.',
    color: '#F43F5E',
    icon: HardHat,
    services: [
      { labelRu: 'Портал', labelEn: 'Portal', icon: Building, path: APP_ROUTES.DEVELOPER_PORTAL, status: 'available' },
      { labelRu: 'Застройщикам', labelEn: 'Developer program', icon: LineChart, path: APP_ROUTES.FOR_REAL_ESTATE_DEVELOPERS, status: 'available' },
      { labelRu: 'Витрина новостроек', labelEn: 'Newbuilds showcase', icon: Building2, path: APP_ROUTES.NEWBUILDS, status: 'available' },
      { labelRu: 'Консультация', labelEn: 'Advisory', icon: PenTool, path: APP_ROUTES.PROPERTY_CONSULTATION, status: 'available' },
    ],
  },
];

function NavigatorStatsFooter({
  stats,
  isRu,
}: {
  stats: { properties: number; bookings: number; providers: number } | undefined;
  isRu: boolean;
}) {
  const loading = stats === undefined;
  const chunks: React.ReactNode[] = [];

  if (!loading) {
    if (stats.properties > 0) {
      chunks.push(
        <span key="p">
          <span className="text-primary font-bold">{stats.properties}+</span>{' '}
          {isRu ? 'объектов' : 'properties'}
        </span>,
      );
    }
    if (stats.bookings > 0) {
      chunks.push(
        <span key="b">
          <span className="text-primary font-bold">{stats.bookings}+</span>{' '}
          {isRu ? 'бронирований' : 'bookings'}
        </span>,
      );
    }
    if (stats.providers > 0) {
      chunks.push(
        <span key="v">
          <span className="text-primary font-bold">{stats.providers}+</span>{' '}
          {isRu ? 'партнёров' : 'partners'}
        </span>,
      );
    }
  }

  if (loading) {
    return (
      <p className="text-xs text-muted-foreground">
        {isRu ? 'Загрузка…' : 'Loading…'}
      </p>
    );
  }

  if (chunks.length === 0) {
    return (
      <p className="text-xs text-muted-foreground leading-relaxed">
        {isRu
          ? 'Сервисы и партнёры на Пхукете — в одной экосистеме. Поддержка 24/7.'
          : 'Phuket services & partners in one ecosystem. 24/7 support.'}
      </p>
    );
  }

  const with247 = (
    <span key="247">
      <span className="text-primary font-bold">24/7</span> {isRu ? 'поддержка' : 'support'}
    </span>
  );

  const out: React.ReactNode[] = [];
  chunks.forEach((el, i) => {
    out.push(el);
    if (i < chunks.length - 1) {
      out.push(<span key={`dot-${i}`} className="mx-2 text-muted-foreground/40">·</span>);
    }
  });
  out.push(<span key="dot247" className="mx-2 text-muted-foreground/40">·</span>);
  out.push(with247);

  return <p className="text-xs text-muted-foreground leading-relaxed">{out}</p>;
}

function StatusBadge({ status, isRu }: { status: ClusterService['status']; isRu: boolean }) {
  const config = {
    available: { label: isRu ? 'Доступно' : 'Available', bg: 'hsl(var(--primary) / 0.12)', color: 'hsl(var(--primary))' },
    soon: { label: isRu ? 'Скоро' : 'Soon', bg: 'hsl(0 0% 100% / 0.07)', color: 'hsl(var(--muted-foreground))' },
    pro: { label: 'Pro', bg: 'hsl(45 93% 47% / 0.12)', color: '#F59E0B' },
  }[status];

  return (
    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-[var(--radius-full)]"
      style={{ background: config.bg, color: config.color }}
    >
      {config.label}
    </span>
  );
}

const TOTAL_NAVIGATOR_SERVICES = CLUSTERS.reduce((n, c) => n + c.services.length, 0);

export default function NavigatorPage() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const navigate = useNavigate();
  const [openCluster, setOpenCluster] = useState<string | null>(null);

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

  const toggleCluster = useCallback((id: string) => {
    setOpenCluster(prev => prev === id ? null : id);
  }, []);

  return (
    <AppLayout>
      <div className="px-4 py-6 pb-24 max-w-2xl mx-auto space-y-5">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-[22px] font-display font-bold text-foreground">
            {isRu ? 'Навигатор' : 'Navigator'}
          </h1>
          <p className="text-sm text-muted-foreground leading-snug max-w-md mx-auto">
            {isRu
              ? `Шесть сценариев · ${TOTAL_NAVIGATOR_SERVICES} быстрых входов · одна экосистема myUNO`
              : `Six scenarios · ${TOTAL_NAVIGATOR_SERVICES} shortcuts · one myUNO ecosystem`}
          </p>
          <p className="text-xs text-muted-foreground/90 leading-relaxed max-w-lg mx-auto px-1">
            {isRu
              ? 'Каждый блок — для своей аудитории: от прилёта и быта до сделок с недвижимостью и кабинета управляющей компании.'
              : 'Each block matches an audience: arrival & daily life, legal, buying property, host operations, or development.'}
          </p>
        </div>

        {/* Cluster accordions */}
        <div className="space-y-3">
          {CLUSTERS.map(cluster => {
            const Icon = cluster.icon;
            const isOpen = openCluster === cluster.id;
            const serviceCount = cluster.services.length;

            return (
              <div key={cluster.id} className="rounded-[var(--radius-lg)] overflow-hidden"
                style={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(0 0% 100% / 0.07)',
                  borderLeft: `3px solid ${cluster.color}`,
                }}
              >
                {/* Header */}
                <button
                  onClick={() => toggleCluster(cluster.id)}
                  className="w-full flex items-center gap-3 p-4 text-left transition-all min-h-[60px]"
                >
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: cluster.color + '1A' }}
                  >
                    <Icon className="w-[18px] h-[18px]" style={{ color: cluster.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[15px] font-display font-semibold text-foreground">
                      {isRu ? cluster.labelRu : cluster.labelEn}
                    </h3>
                    <p className="text-[11px] text-muted-foreground leading-snug mt-1 line-clamp-2">
                      {isRu ? cluster.valueRu : cluster.valueEn}
                    </p>
                    <p className="text-[10px] text-muted-foreground/80 mt-1">
                      {serviceCount} {isRu ? 'сервисов' : 'services'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <ChevronDown
                      className={cn("w-4 h-4 text-muted-foreground transition-transform duration-300", isOpen && "rotate-180")}
                    />
                  </div>
                </button>

                {/* Expanded services */}
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="grid grid-cols-2 gap-2 px-4 pb-4">
                        {cluster.services.map(service => {
                          const SIcon = service.icon;
                          return (
                            <button
                              key={`${cluster.id}-${service.path}`}
                              onClick={() => service.status !== 'soon' && navigate(service.path)}
                              className={cn(
                                "flex flex-col gap-2 p-3 rounded-[var(--radius-md)] text-left transition-all min-h-[44px]",
                                service.status === 'soon' ? "opacity-50 cursor-default" : "active:scale-[0.97]"
                              )}
                              style={{ background: 'hsl(var(--bg-elevated))' }}
                            >
                              <div className="flex items-center justify-between w-full">
                                <SIcon className="w-5 h-5" style={{ color: cluster.color }} />
                                <StatusBadge status={service.status} isRu={isRu} />
                              </div>
                              <span className="text-[13px] font-semibold text-foreground leading-tight">
                                {isRu ? service.labelRu : service.labelEn}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* Stats bar — hide zero counts */}
        <div className="rounded-[var(--radius-md)] p-4 text-center"
          style={{ background: 'hsl(var(--bg-surface))', border: '1px solid hsl(0 0% 100% / 0.07)' }}
        >
          <NavigatorStatsFooter stats={stats} isRu={isRu} />
        </div>
      </div>
    </AppLayout>
  );
}
