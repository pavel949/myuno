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
  Building, Search, LineChart
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/layout/AppLayout';
import { cn } from '@/lib/utils';

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
  color: string;
  icon: React.ElementType;
  services: ClusterService[];
}

const CLUSTERS: Cluster[] = [
  {
    id: 'arrive', labelRu: 'ПРИЕХАТЬ', labelEn: 'ARRIVE', color: '#00D68F', icon: Plane,
    services: [
      { labelRu: 'Трансферы', labelEn: 'Transfers', icon: Car, path: '/transport/airport-transfer', status: 'available' },
      { labelRu: 'SIM-карты', labelEn: 'SIM Cards', icon: Smartphone, path: '/sim', status: 'available' },
      { labelRu: 'Курсы валют', labelEn: 'Exchange Rates', icon: ArrowLeftRight, path: '/exchange', status: 'available' },
      { labelRu: 'Аренда авто', labelEn: 'Car Rental', icon: Car, path: '/transport', status: 'available' },
      { labelRu: 'Банковский счёт', labelEn: 'Bank Account', icon: Landmark, path: '/banking', status: 'available' },
      { labelRu: 'Fast Track', labelEn: 'Fast Track', icon: Zap, path: '/transport/fast-track', status: 'available' },
    ],
  },
  {
    id: 'live', labelRu: 'ЖИТЬ', labelEn: 'LIVE', color: '#4E7BFF', icon: Home,
    services: [
      { labelRu: 'Рестораны', labelEn: 'Restaurants', icon: Utensils, path: '/restaurants', status: 'available' },
      { labelRu: 'Уборка', labelEn: 'Cleaning', icon: Sparkles, path: '/cleaning', status: 'available' },
      { labelRu: 'Медицина', labelEn: 'Medical', icon: Stethoscope, path: '/medical', status: 'available' },
      { labelRu: 'Задачи', labelEn: 'Tasks', icon: ClipboardList, path: '/tasks', status: 'soon' },
      { labelRu: 'Маркет', labelEn: 'Market', icon: ShoppingBag, path: '/market', status: 'available' },
      { labelRu: 'CRM', labelEn: 'CRM', icon: Users, path: '/mc/crm-dashboard', status: 'pro' },
    ],
  },
  {
    id: 'legal', labelRu: 'ЛЕГАЛЬНО', labelEn: 'STAY LEGAL', color: '#F59E0B', icon: Scale,
    services: [
      { labelRu: 'Визы', labelEn: 'Visas', icon: Plane, path: '/visa', status: 'available' },
      { labelRu: 'Налоги', labelEn: 'Taxes', icon: Calculator, path: '/tax', status: 'available' },
      { labelRu: 'ContractAI', labelEn: 'ContractAI', icon: FileSearch, path: '/legal/contract-analysis', status: 'available' },
      { labelRu: 'Страхование', labelEn: 'Insurance', icon: Shield, path: '/insurance', status: 'available' },
    ],
  },
  {
    id: 'invest', labelRu: 'КУПИТЬ', labelEn: 'INVEST', color: '#A855F7', icon: TrendingUp,
    services: [
      { labelRu: 'Поиск недвижимости', labelEn: 'Property Search', icon: Search, path: '/property', status: 'available' },
      { labelRu: 'Новостройки', labelEn: 'New Developments', icon: Building2, path: '/newbuilds', status: 'available' },
      { labelRu: 'Вторичка', labelEn: 'Resale', icon: Building2, path: '/property/resale', status: 'available' },
      { labelRu: 'Застройщики', labelEn: 'Developers', icon: Users, path: '/newbuilds/developers', status: 'available' },
      { labelRu: 'ROI калькулятор', labelEn: 'ROI Calculator', icon: BarChart3, path: '/property/invest', status: 'available' },
      { labelRu: 'DueDiligence AI', labelEn: 'DueDiligence AI', icon: Shield, path: '/property/invest', status: 'soon' },
    ],
  },
  {
    id: 'manage', labelRu: 'УПРАВЛЯТЬ', labelEn: 'MANAGE', color: '#06B6D4', icon: Building2,
    services: [
      { labelRu: 'StaySync', labelEn: 'StaySync', icon: Calendar, path: '/mc', status: 'available' },
      { labelRu: 'Календарь', labelEn: 'Calendar', icon: Calendar, path: '/mc/calendar', status: 'available' },
      { labelRu: 'Финансы', labelEn: 'Finances', icon: DollarSign, path: '/mc/finance', status: 'available' },
      { labelRu: 'Клининг', labelEn: 'Cleaning', icon: Sparkles, path: '/mc/housekeeping', status: 'available' },
      { labelRu: 'Отчёты', labelEn: 'Reports', icon: BarChart3, path: '/mc/analytics', status: 'pro' },
    ],
  },
  {
    id: 'build', labelRu: 'ДЕВЕЛОПЕРАМ', labelEn: 'FOR DEVELOPERS', color: '#F43F5E', icon: HardHat,
    services: [
      { labelRu: 'Продажи', labelEn: 'Sales', icon: LineChart, path: '/for-management-companies', status: 'available' },
      { labelRu: 'Стройка', labelEn: 'Construction', icon: HardHat, path: '/for-management-companies', status: 'soon' },
      { labelRu: 'Ценообразование', labelEn: 'Pricing', icon: DollarSign, path: '/for-management-companies', status: 'soon' },
      { labelRu: 'MarketBrief', labelEn: 'MarketBrief', icon: PenTool, path: '/for-management-companies', status: 'soon' },
      { labelRu: 'InvestCalc', labelEn: 'InvestCalc', icon: Calculator, path: '/invest', status: 'available' },
    ],
  },
];

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
        <div className="text-center space-y-1">
          <h1 className="text-[22px] font-display font-bold text-foreground">
            {isRu ? 'Навигатор' : 'Navigator'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isRu ? '6 кластеров · 40+ сервисов · 1 экосистема' : '6 clusters · 40+ services · 1 ecosystem'}
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
                    <p className="text-xs text-muted-foreground">
                      {serviceCount} {isRu ? 'сервисов' : 'services'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-semibold rounded-[var(--radius-full)] px-2 py-0.5"
                      style={{ background: cluster.color + '1A', color: cluster.color }}
                    >
                      {serviceCount}
                    </span>
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
                              key={service.labelEn}
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

        {/* Stats bar */}
        <div className="rounded-[var(--radius-md)] p-4 text-center"
          style={{ background: 'hsl(var(--bg-surface))', border: '1px solid hsl(0 0% 100% / 0.07)' }}
        >
          <p className="text-xs text-muted-foreground leading-relaxed">
            <span className="text-primary font-bold">{stats?.properties ?? '…'}+</span> {isRu ? 'объектов' : 'properties'}
            <span className="mx-2 text-muted-foreground/40">·</span>
            <span className="text-primary font-bold">{stats?.bookings ?? '…'}+</span> {isRu ? 'бронирований' : 'bookings'}
            <span className="mx-2 text-muted-foreground/40">·</span>
            <span className="text-primary font-bold">{stats?.providers ?? '…'}+</span> {isRu ? 'партнёров' : 'partners'}
            <span className="mx-2 text-muted-foreground/40">·</span>
            <span className="text-primary font-bold">24/7</span> {isRu ? 'поддержка' : 'support'}
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
