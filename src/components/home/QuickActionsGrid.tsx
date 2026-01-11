import { useNavigate } from 'react-router-dom';
import { 
  Car, UtensilsCrossed, AlertTriangle, Plane,
  SprayCan, Stethoscope, Shield, Sparkles
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

const quickActions: QuickAction[] = [
  {
    id: 'taxi',
    icon: Car,
    labelEn: 'Taxi',
    labelRu: 'Такси',
    path: '/transport/taxi',
    gradient: 'from-yellow-500 to-amber-500',
    badge: 'FAST',
    badgeRu: 'БЫСТРО',
  },
  {
    id: 'food',
    icon: UtensilsCrossed,
    labelEn: 'Food',
    labelRu: 'Еда',
    path: '/restaurants',
    gradient: 'from-orange-500 to-red-500',
  },
  {
    id: 'airport',
    icon: Plane,
    labelEn: 'Airport',
    labelRu: 'Аэропорт',
    path: '/transport/airport',
    gradient: 'from-blue-500 to-indigo-500',
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
    id: 'cleaning',
    icon: SprayCan,
    labelEn: 'Cleaning',
    labelRu: 'Уборка',
    path: '/cleaning',
    gradient: 'from-cyan-500 to-teal-500',
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
  {
    id: 'insurance',
    icon: Shield,
    labelEn: 'Insurance',
    labelRu: 'Страховка',
    path: '/insurance',
    gradient: 'from-indigo-500 to-purple-500',
  },
  {
    id: 'beauty',
    icon: Sparkles,
    labelEn: 'Beauty',
    labelRu: 'Красота',
    path: '/beauty',
    gradient: 'from-pink-500 to-rose-500',
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
