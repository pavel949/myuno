import { useNavigate } from 'react-router-dom';
import { 
  Plane, Flower2, Car, Droplets, Home, Bike,
  AlertTriangle, Stethoscope
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { triggerRipple } from '@/hooks/useRipple';
import { cn } from '@/lib/utils';

interface QuickAction {
  id: string;
  icon: typeof Car;
  labelEn: string;
  labelRu: string;
  path: string;
  gradient: string;
  isUrgent?: boolean;
  badge?: string;
  badgeRu?: string;
}

// Prioritized: Transfer, Flowers, Car/Bike rental, Water, Short-term rental
const quickActions: QuickAction[] = [
  {
    id: 'transfer',
    icon: Plane,
    labelEn: 'Transfer',
    labelRu: 'Трансфер',
    path: '/transport/airport',
    gradient: 'from-blue-500 to-indigo-500',
    badge: 'POPULAR',
    badgeRu: 'ТОП',
  },
  {
    id: 'flowers',
    icon: Flower2,
    labelEn: 'Flowers',
    labelRu: 'Цветы',
    path: '/flowers',
    gradient: 'from-rose-500 to-pink-500',
  },
  {
    id: 'car-rental',
    icon: Car,
    labelEn: 'Car Rental',
    labelRu: 'Авто',
    path: '/transport',
    gradient: 'from-amber-500 to-orange-500',
  },
  {
    id: 'bike-rental',
    icon: Bike,
    labelEn: 'Bike',
    labelRu: 'Байк',
    path: '/transport',
    gradient: 'from-lime-500 to-green-500',
  },
  {
    id: 'water',
    icon: Droplets,
    labelEn: 'Water',
    labelRu: 'Вода',
    path: '/water',
    gradient: 'from-cyan-500 to-blue-500',
  },
  {
    id: 'property',
    icon: Home,
    labelEn: 'Rent',
    labelRu: 'Аренда',
    path: '/property',
    gradient: 'from-teal-500 to-emerald-500',
    badge: 'INSTANT',
    badgeRu: 'МГНОВЕННО',
  },
  {
    id: 'sos',
    icon: AlertTriangle,
    labelEn: 'SOS',
    labelRu: 'SOS',
    path: '/sos',
    gradient: 'from-red-500 to-rose-600',
    isUrgent: true,
  },
  {
    id: 'medical',
    icon: Stethoscope,
    labelEn: 'Medical',
    labelRu: 'Врач',
    path: '/medical',
    gradient: 'from-emerald-500 to-green-500',
    badge: '24/7',
    badgeRu: '24/7',
  },
];

export function QuickActionsGrid() {
  const { language } = useLanguage();
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-4 gap-3">
      {quickActions.map((action) => {
        const Icon = action.icon;
        return (
          <button
            key={action.id}
            onClick={(e) => {
              triggerRipple(e);
              navigate(action.path);
            }}
            className={cn(
              "relative flex flex-col items-center p-3 rounded-2xl transition-all active:scale-95",
              action.isUrgent 
                ? "bg-red-500/10 border-2 border-red-500/30 hover:border-red-500/50" 
                : "bg-card border border-border/50 hover:border-primary/30"
            )}
          >
            {/* Badge */}
            {action.badge && (
              <span className={cn(
                "absolute -top-1.5 -right-1.5 px-1.5 py-0.5 rounded-full text-[8px] font-bold uppercase",
                action.isUrgent 
                  ? "bg-red-500 text-white animate-pulse" 
                  : "bg-primary text-primary-foreground"
              )}>
                {language === 'ru' ? action.badgeRu : action.badge}
              </span>
            )}

            {/* Icon */}
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center mb-2 bg-gradient-to-br",
              action.gradient
            )}>
              <Icon className="w-6 h-6 text-white" />
            </div>

            {/* Label */}
            <span className={cn(
              "text-xs font-medium",
              action.isUrgent ? "text-red-500" : "text-foreground"
            )}>
              {language === 'ru' ? action.labelRu : action.labelEn}
            </span>
          </button>
        );
      })}
    </div>
  );
}
