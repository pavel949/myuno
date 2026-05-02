/**
 * ExploreMoreRail — "Другие сервисы в этом кластере" + link to Navigator
 */
import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ChevronRight,
  Car,
  Smartphone,
  ArrowLeftRight,
  Zap,
  Landmark,
  Utensils,
  Sparkles,
  Stethoscope,
  ShoppingBag,
  Plane,
  Calculator,
  Shield,
  Search,
  Building,
  BarChart3,
  Building2,
  Calendar,
  DollarSign,
  LineChart,
  Circle,
  type LucideIcon,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { APP_ROUTES } from '@/lib/config/routes';

// Static icon map — keep tree-shakable. Adding a new icon here requires
// adding the import above (intentional friction so we never regress to
// `import * as LucideIcons` and pull the entire 1.5k-icon barrel).
const ICONS: Record<string, LucideIcon> = {
  Car,
  Smartphone,
  ArrowLeftRight,
  Zap,
  Landmark,
  Utensils,
  Sparkles,
  Stethoscope,
  ShoppingBag,
  Plane,
  Calculator,
  Shield,
  Search,
  Building,
  BarChart3,
  Building2,
  Calendar,
  DollarSign,
  LineChart,
};

interface ServiceItem {
  labelRu: string;
  labelEn: string;
  icon: string; // lucide icon name
  path: string;
}

const CLUSTER_SERVICES: Record<string, ServiceItem[]> = {
  arrive: [
    { labelRu: 'Трансферы', labelEn: 'Transfers', icon: 'Car', path: '/transport/airport-transfer' },
    { labelRu: 'SIM-карты', labelEn: 'SIM Cards', icon: 'Smartphone', path: '/sim' },
    { labelRu: 'Обмен валют', labelEn: 'Exchange', icon: 'ArrowLeftRight', path: '/exchange' },
    { labelRu: 'Аренда авто', labelEn: 'Car Rental', icon: 'Car', path: '/transport' },
    { labelRu: 'Fast Track', labelEn: 'Fast Track', icon: 'Zap', path: '/transport/fast-track' },
    { labelRu: 'Банковский счёт', labelEn: 'Bank Account', icon: 'Landmark', path: '/banking' },
  ],
  live: [
    { labelRu: 'Рестораны', labelEn: 'Restaurants', icon: 'Utensils', path: '/restaurants' },
    { labelRu: 'Уборка', labelEn: 'Cleaning', icon: 'Sparkles', path: '/cleaning' },
    { labelRu: 'Медицина', labelEn: 'Medical', icon: 'Stethoscope', path: '/medical' },
    { labelRu: 'Маркет', labelEn: 'Market', icon: 'ShoppingBag', path: '/market' },
  ],
  legal: [
    { labelRu: 'Визы', labelEn: 'Visas', icon: 'Plane', path: '/visa' },
    { labelRu: 'Налоги', labelEn: 'Taxes', icon: 'Calculator', path: '/tax' },
    { labelRu: 'Страхование', labelEn: 'Insurance', icon: 'Shield', path: '/insurance' },
  ],
  invest: [
    { labelRu: 'Поиск', labelEn: 'Search', icon: 'Search', path: '/property' },
    { labelRu: 'Off-Plan', labelEn: 'Off-Plan', icon: 'Building', path: APP_ROUTES.OFFPLAN },
    { labelRu: 'ROI', labelEn: 'ROI Calculator', icon: 'BarChart3', path: '/invest' },
    { labelRu: 'Вторичка', labelEn: 'Resale', icon: 'Building2', path: '/property/resale' },
  ],
  manage: [
    { labelRu: 'Календарь', labelEn: 'Calendar', icon: 'Calendar', path: '/mc/calendar' },
    { labelRu: 'Финансы', labelEn: 'Finance', icon: 'DollarSign', path: '/mc/finance' },
    { labelRu: 'Клининг', labelEn: 'Cleaning', icon: 'Sparkles', path: '/mc/housekeeping' },
  ],
  build: [
    { labelRu: 'Продажи', labelEn: 'Sales', icon: 'LineChart', path: '/for-management-companies' },
    { labelRu: 'InvestCalc', labelEn: 'InvestCalc', icon: 'Calculator', path: '/invest' },
  ],
};

interface ExploreMoreRailProps {
  clusterId: string;
  currentPath?: string;
  className?: string;
}

export function ExploreMoreRail({ clusterId, currentPath, className }: ExploreMoreRailProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const navigate = useNavigate();

  const services = (CLUSTER_SERVICES[clusterId] || [])
    .filter(s => s.path !== currentPath)
    .slice(0, 3);

  if (services.length === 0) return null;

  return (
    <div className={`space-y-3 ${className || ''}`}>
      <h3 className="text-sm font-semibold text-foreground">
        {isRu ? 'Другие сервисы в этом кластере' : 'More in this cluster'}
      </h3>

      <div className="carousel-scroll gap-3 -mx-4 px-4">
        {services.map(service => {
          const IconComp = (LucideIcons as any)[service.icon] || LucideIcons.Circle;
          return (
            <button
              key={service.path}
              onClick={() => navigate(service.path)}
              className="flex items-center gap-3 p-3 rounded-none shrink-0 min-w-[180px] text-left transition-all "
              style={{
                background: 'hsl(var(--card))',
                border: '1px solid hsl(0 0% 100% / 0.07)',
              }}
            >
              <IconComp className="w-5 h-5 text-primary shrink-0" />
              <span className="text-[13px] font-semibold text-foreground flex-1">
                {isRu ? service.labelRu : service.labelEn}
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            </button>
          );
        })}
      </div>

      <Link
        to="/discover"
        className="flex items-center justify-center gap-1.5 text-[13px] text-primary font-semibold hover:text-primary/80 transition-colors min-h-[44px]"
      >
        {isRu ? 'Смотреть все 6 кластеров' : 'View all 6 clusters'} <ChevronRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}
