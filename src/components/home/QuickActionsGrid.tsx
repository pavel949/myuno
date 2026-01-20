import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, Stethoscope, Anchor, Home, AlertTriangle, MessageSquare, UtensilsCrossed, Ship, Flower2, Sparkles } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { triggerRipple } from '@/hooks/useRipple';
import { triggerHaptic } from '@/hooks/useHapticFeedback';
import { playSound } from '@/hooks/useSoundEffects';
import { getFeedbackSettings } from '@/hooks/useFeedbackSettings';

interface QuickAction {
  id: string;
  icon: React.ElementType;
  label: string;
  labelRu: string;
  path: string;
  gradient: string;
  badge?: string;
  badgeRu?: string;
  isUrgent?: boolean;
  isPopular?: boolean;
}

const quickActions: QuickAction[] = [
  {
    id: 'consultation',
    icon: MessageSquare,
    label: 'Consultation',
    labelRu: 'Консультация',
    path: '/property/consultation',
    gradient: 'from-violet-500 to-purple-600',
    badge: 'Expert',
    badgeRu: 'Эксперт',
    isPopular: true,
  },
  {
    id: 'transfer',
    icon: Car,
    label: 'Transfers',
    labelRu: 'Трансфер',
    path: '/transport/airport',
    gradient: 'from-indigo-500 to-blue-500',
    badge: 'Popular',
    badgeRu: 'Популярно',
    isPopular: true,
  },
  {
    id: 'restaurants',
    icon: UtensilsCrossed,
    label: 'Restaurants',
    labelRu: 'Рестораны',
    path: '/restaurants',
    gradient: 'from-orange-500 to-red-500',
    isPopular: true,
  },
  {
    id: 'yachts',
    icon: Ship,
    label: 'Yachts',
    labelRu: 'Яхты',
    path: '/yachts',
    gradient: 'from-cyan-500 to-blue-500',
  },
  {
    id: 'water',
    icon: Anchor,
    label: 'Water Sports',
    labelRu: 'Водный спорт',
    path: '/water',
    gradient: 'from-sky-500 to-cyan-500',
  },
  {
    id: 'property',
    icon: Home,
    label: 'Real Estate',
    labelRu: 'Недвижимость',
    path: '/property',
    gradient: 'from-teal-500 to-emerald-500',
  },
  {
    id: 'beauty',
    icon: Sparkles,
    label: 'Beauty & SPA',
    labelRu: 'Красота',
    path: '/beauty',
    gradient: 'from-pink-500 to-rose-500',
  },
  {
    id: 'flowers',
    icon: Flower2,
    label: 'Flowers',
    labelRu: 'Цветы',
    path: '/flowers',
    gradient: 'from-rose-500 to-pink-500',
  },
  {
    id: 'sos',
    icon: AlertTriangle,
    label: 'SOS',
    labelRu: 'SOS',
    path: '/sos',
    gradient: 'from-red-500 to-orange-500',
    badge: '24/7',
    badgeRu: '24/7',
    isUrgent: true,
  },
  {
    id: 'medical',
    icon: Stethoscope,
    label: 'Medical',
    labelRu: 'Медицина',
    path: '/medical',
    gradient: 'from-emerald-500 to-green-500',
  },
];

export function QuickActionsGrid() {
  const navigate = useNavigate();
  const { language } = useLanguage();

  const handleClick = (action: QuickAction, e: React.MouseEvent<HTMLButtonElement>) => {
    triggerRipple(e);
    const settings = getFeedbackSettings();
    if (settings.hapticEnabled) triggerHaptic(action.isUrgent ? 'medium' : 'light');
    if (settings.soundEnabled) playSound('click');
    navigate(action.path);
  };

  return (
    <div className="grid grid-cols-5 gap-2">
      {quickActions.map((action) => {
        const Icon = action.icon;
        const label = language === 'ru' ? action.labelRu : action.label;
        const badge = language === 'ru' ? action.badgeRu : action.badge;
        
        return (
          <button
            key={action.id}
            onClick={(e) => handleClick(action, e)}
            className={cn(
              "relative flex flex-col items-center p-2 rounded-xl",
              "hover:bg-card/80 transition-all group active:scale-95",
              action.isUrgent && "ring-1 ring-red-500/30"
            )}
          >
            {/* Badge */}
            {badge && (
              <Badge 
                className={cn(
                  "absolute -top-1 -right-1 text-[8px] px-1.5 py-0.5 border-0 z-10",
                  action.isUrgent 
                    ? "bg-red-500 text-white animate-pulse" 
                    : action.isPopular 
                      ? "bg-amber-500 text-white"
                      : "bg-primary text-primary-foreground"
                )}
              >
                {badge}
              </Badge>
            )}
            
            {/* Icon Container */}
            <div className={cn(
              "w-11 h-11 rounded-xl flex items-center justify-center mb-1.5 bg-gradient-to-br",
              action.gradient,
              "group-hover:scale-110 transition-transform shadow-sm"
            )}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            
            {/* Label */}
            <span className={cn(
              "text-[10px] font-medium text-center leading-tight line-clamp-2",
              "text-muted-foreground group-hover:text-foreground transition-colors"
            )}>
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
