import React, { useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { 
  Anchor, 
  Plane, 
  Flower2, 
  Home, 
  Utensils, 
  Compass,
  Stethoscope,
  AlertTriangle,
  ShoppingBag,
  MoreHorizontal
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { triggerRipple } from '@/hooks/useRipple';
import { triggerHaptic } from '@/hooks/useHapticFeedback';
import { playSound } from '@/hooks/useSoundEffects';
import { getFeedbackSettings } from '@/hooks/useFeedbackSettings';
import { prefetchRoute } from '@/lib/routePrefetch';

interface QuickAction {
  id: string;
  icon: React.ElementType;
  label: string;
  labelRu: string;
  path: string;
  iconColor: string;
  bgColor: string;
  badge?: string;
  badgeRu?: string;
  isUrgent?: boolean;
}

// 10 essential services in 2x5 grid - clean SuperApp style
const quickActions: QuickAction[] = [
  // Row 1
  {
    id: 'yachts',
    icon: Anchor,
    label: 'Yachts',
    labelRu: 'Яхты',
    path: '/yachts',
    iconColor: 'text-cyan-600',
    bgColor: 'bg-cyan-500/10',
  },
  {
    id: 'transfer',
    icon: Plane,
    label: 'Transfer',
    labelRu: 'Трансфер',
    path: '/transport/airport',
    iconColor: 'text-indigo-600',
    bgColor: 'bg-indigo-500/10',
  },
  {
    id: 'flowers',
    icon: Flower2,
    label: 'Flowers',
    labelRu: 'Цветы',
    path: '/flowers',
    iconColor: 'text-rose-500',
    bgColor: 'bg-rose-500/10',
  },
  {
    id: 'property',
    icon: Home,
    label: 'Property',
    labelRu: 'Жильё',
    path: '/property',
    iconColor: 'text-teal-600',
    bgColor: 'bg-teal-500/10',
  },
  {
    id: 'restaurants',
    icon: Utensils,
    label: 'Food',
    labelRu: 'Еда',
    path: '/restaurants',
    iconColor: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
  },
  // Row 2
  {
    id: 'tours',
    icon: Compass,
    label: 'Tours',
    labelRu: 'Туры',
    path: '/tours',
    iconColor: 'text-amber-600',
    bgColor: 'bg-amber-500/10',
  },
  {
    id: 'medical',
    icon: Stethoscope,
    label: 'Medical',
    labelRu: 'Медицина',
    path: '/medical',
    iconColor: 'text-emerald-600',
    bgColor: 'bg-emerald-500/10',
  },
  {
    id: 'sos',
    icon: AlertTriangle,
    label: 'SOS',
    labelRu: 'SOS',
    path: '/sos',
    iconColor: 'text-red-500',
    bgColor: 'bg-red-500/10',
    badge: '24/7',
    badgeRu: '24/7',
    isUrgent: true,
  },
  {
    id: 'market',
    icon: ShoppingBag,
    label: 'Market',
    labelRu: 'Маркет',
    path: '/market',
    iconColor: 'text-violet-600',
    bgColor: 'bg-violet-500/10',
  },
  {
    id: 'more',
    icon: MoreHorizontal,
    label: 'More',
    labelRu: 'Ещё',
    path: '/discover',
    iconColor: 'text-muted-foreground',
    bgColor: 'bg-muted',
  },
];

export const QuickActionsGrid = memo(function QuickActionsGrid() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const queryClient = useQueryClient();

  const handleClick = useCallback((action: QuickAction, e: React.MouseEvent<HTMLButtonElement>) => {
    triggerRipple(e);
    const settings = getFeedbackSettings();
    if (settings.hapticEnabled) triggerHaptic(action.isUrgent ? 'medium' : 'light');
    if (settings.soundEnabled) playSound('click');
    navigate(action.path);
  }, [navigate]);

  const handlePrefetch = useCallback((path: string) => {
    prefetchRoute(path, queryClient);
  }, [queryClient]);

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
            onMouseEnter={() => handlePrefetch(action.path)}
            onTouchStart={() => handlePrefetch(action.path)}
            className={cn(
              "relative flex flex-col items-center p-2 rounded-xl",
              "hover:bg-card/80 transition-all group active:scale-95",
              action.isUrgent && "ring-1 ring-red-500/30"
            )}
          >
            {/* Badge - only for SOS */}
            {badge && (
              <Badge 
                className="absolute -top-1 -right-1 text-[8px] px-1.5 py-0.5 border-0 z-10 bg-red-500 text-white animate-pulse"
              >
                {badge}
              </Badge>
            )}
            
            {/* Icon Container - clean monochrome style */}
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center mb-1.5",
              action.bgColor,
              "group-hover:scale-110 transition-transform"
            )}>
              <Icon className={cn("w-6 h-6", action.iconColor)} />
            </div>
            
            {/* Label - single line */}
            <span className={cn(
              "text-[10px] font-medium text-center leading-tight truncate w-full",
              "text-muted-foreground group-hover:text-foreground transition-colors"
            )}>
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
});
