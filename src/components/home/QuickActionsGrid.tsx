import React, { useCallback, memo, useMemo } from 'react';
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
  ShoppingBag,
  MoreHorizontal,
  Scale,
  Shield,
  Sparkles,
  Car,
  GraduationCap,
  Briefcase,
  Banknote,
  Calendar,
  Wrench,
  Building2,
  Key
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUserPersonas, UserPersona } from '@/hooks/useUserPersonas';
import { useProfile, type UserType } from '@/hooks/useProfile';
import { useUserContext, type AppRole } from '@/hooks/useUserContext';
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

// ============================================
// ACTIONS BY USER TYPE
// ============================================

// Tourist-focused actions (leisure, exploration) - PRIORITY ORDER for tourists
const TOURIST_ACTIONS: QuickAction[] = [
  {
    id: 'property',
    icon: Home,
    label: 'Rent',
    labelRu: 'Аренда',
    path: '/property',
    iconColor: 'text-white',
    bgColor: 'bg-gradient-to-br from-teal-400 to-emerald-600',
  },
  {
    id: 'transfer',
    icon: Plane,
    label: 'Transfer',
    labelRu: 'Трансфер',
    path: '/transport/airport-transfer',
    iconColor: 'text-white',
    bgColor: 'bg-gradient-to-br from-indigo-400 to-purple-600',
  },
  {
    id: 'flowers',
    icon: Flower2,
    label: 'Flowers',
    labelRu: 'Цветы',
    path: '/flowers',
    iconColor: 'text-white',
    bgColor: 'bg-gradient-to-br from-rose-400 to-pink-600',
  },
  {
    id: 'transport',
    icon: Car,
    label: 'Transport',
    labelRu: 'Транспорт',
    path: '/transport',
    iconColor: 'text-white',
    bgColor: 'bg-gradient-to-br from-blue-400 to-indigo-600',
  },
  {
    id: 'experiences',
    icon: Compass,
    label: 'Experiences',
    labelRu: 'Впечатления',
    path: '/experiences',
    iconColor: 'text-white',
    bgColor: 'bg-gradient-to-br from-amber-400 to-orange-600',
  },
  {
    id: 'yachts',
    icon: Anchor,
    label: 'Yachts',
    labelRu: 'Яхты',
    path: '/yachts',
    iconColor: 'text-white',
    bgColor: 'bg-gradient-to-br from-cyan-400 to-blue-600',
  },
  {
    id: 'beauty',
    icon: Sparkles,
    label: 'Beauty',
    labelRu: 'Красота',
    path: '/beauty',
    iconColor: 'text-white',
    bgColor: 'bg-gradient-to-br from-pink-400 to-rose-600',
  },
  {
    id: 'restaurants',
    icon: Utensils,
    label: 'Food',
    labelRu: 'Еда',
    path: '/restaurants',
    iconColor: 'text-white',
    bgColor: 'bg-gradient-to-br from-orange-400 to-red-500',
  },
];

// Resident-focused actions (long-term living infrastructure)
const RESIDENT_ACTIONS: QuickAction[] = [
  {
    id: 'visa',
    icon: Briefcase,
    label: 'Visa',
    labelRu: 'Визы',
    path: '/visa',
    iconColor: 'text-white',
    bgColor: 'bg-gradient-to-br from-purple-400 to-indigo-600',
  },
  {
    id: 'property',
    icon: Home,
    label: 'Property',
    labelRu: 'Жильё',
    path: '/property',
    iconColor: 'text-white',
    bgColor: 'bg-gradient-to-br from-teal-400 to-emerald-600',
  },
  {
    id: 'education',
    icon: GraduationCap,
    label: 'Education',
    labelRu: 'Обучение',
    path: '/education',
    iconColor: 'text-white',
    bgColor: 'bg-gradient-to-br from-violet-400 to-purple-600',
  },
  {
    id: 'medical',
    icon: Stethoscope,
    label: 'Medical',
    labelRu: 'Медицина',
    path: '/medical',
    iconColor: 'text-white',
    bgColor: 'bg-gradient-to-br from-emerald-400 to-green-600',
  },
  {
    id: 'legal',
    icon: Scale,
    label: 'Legal',
    labelRu: 'Юрист',
    path: '/legal',
    iconColor: 'text-white',
    bgColor: 'bg-gradient-to-br from-indigo-400 to-blue-600',
  },
  {
    id: 'insurance',
    icon: Shield,
    label: 'Insurance',
    labelRu: 'Страховка',
    path: '/insurance',
    iconColor: 'text-white',
    bgColor: 'bg-gradient-to-br from-sky-400 to-cyan-600',
  },
  {
    id: 'banking',
    icon: Banknote,
    label: 'Banking',
    labelRu: 'Банки',
    path: '/banking',
    iconColor: 'text-white',
    bgColor: 'bg-gradient-to-br from-green-400 to-emerald-600',
  },
];

// Owner-focused actions (property management)
const OWNER_ACTIONS: QuickAction[] = [
  {
    id: 'services',
    icon: Wrench,
    label: 'Services',
    labelRu: 'Сервис',
    path: '/services',
    iconColor: 'text-white',
    bgColor: 'bg-gradient-to-br from-amber-400 to-orange-600',
  },
  {
    id: 'property-management',
    icon: Building2,
    label: 'Management',
    labelRu: 'УК',
    path: '/services?category=property-management',
    iconColor: 'text-white',
    bgColor: 'bg-gradient-to-br from-indigo-400 to-purple-600',
  },
  {
    id: 'rental',
    icon: Key,
    label: 'Rental',
    labelRu: 'Аренда',
    path: '/property',
    iconColor: 'text-white',
    bgColor: 'bg-gradient-to-br from-teal-400 to-emerald-600',
  },
  {
    id: 'legal',
    icon: Scale,
    label: 'Legal',
    labelRu: 'Юрист',
    path: '/legal',
    iconColor: 'text-white',
    bgColor: 'bg-gradient-to-br from-slate-400 to-gray-600',
  },
  {
    id: 'insurance',
    icon: Shield,
    label: 'Insurance',
    labelRu: 'Страховка',
    path: '/insurance',
    iconColor: 'text-white',
    bgColor: 'bg-gradient-to-br from-sky-400 to-cyan-600',
  },
  {
    id: 'cleaning',
    icon: Sparkles,
    label: 'Cleaning',
    labelRu: 'Клининг',
    path: '/cleaning',
    iconColor: 'text-white',
    bgColor: 'bg-gradient-to-br from-pink-400 to-rose-600',
  },
];

// Investor-focused actions
const INVESTOR_ACTIONS: QuickAction[] = [
  {
    id: 'invest',
    icon: Banknote,
    label: 'Invest',
    labelRu: 'Инвестиции',
    path: '/invest',
    iconColor: 'text-white',
    bgColor: 'bg-gradient-to-br from-purple-400 to-violet-600',
    badge: 'ROI 12%',
    badgeRu: 'ROI 12%',
  },
  {
    id: 'offplan',
    icon: Building2,
    label: 'Off-Plan',
    labelRu: 'Новостройки',
    path: '/offplan',
    iconColor: 'text-white',
    bgColor: 'bg-gradient-to-br from-amber-400 to-orange-600',
  },
  {
    id: 'property-buy',
    icon: Home,
    label: 'Buy Property',
    labelRu: 'Купить',
    path: '/property?mode=buy',
    iconColor: 'text-white',
    bgColor: 'bg-gradient-to-br from-emerald-400 to-teal-600',
  },
  {
    id: 'legal',
    icon: Scale,
    label: 'Legal',
    labelRu: 'Юрист',
    path: '/legal',
    iconColor: 'text-white',
    bgColor: 'bg-gradient-to-br from-slate-400 to-gray-600',
  },
  {
    id: 'banking',
    icon: Briefcase,
    label: 'Banking',
    labelRu: 'Банкинг',
    path: '/banking',
    iconColor: 'text-white',
    bgColor: 'bg-gradient-to-br from-blue-400 to-indigo-600',
  },
  {
    id: 'insurance',
    icon: Shield,
    label: 'Insurance',
    labelRu: 'Страховка',
    path: '/insurance',
    iconColor: 'text-white',
    bgColor: 'bg-gradient-to-br from-sky-400 to-cyan-600',
  },
];

// Vendor-focused actions (service provider tools)
const VENDOR_ACTIONS: QuickAction[] = [
  {
    id: 'vendor-dashboard',
    icon: Building2,
    label: 'Dashboard',
    labelRu: 'Панель',
    path: '/vendor',
    iconColor: 'text-white',
    bgColor: 'bg-gradient-to-br from-purple-400 to-indigo-600',
  },
  {
    id: 'vendor-orders',
    icon: ShoppingBag,
    label: 'Orders',
    labelRu: 'Заказы',
    path: '/vendor/orders',
    iconColor: 'text-white',
    bgColor: 'bg-gradient-to-br from-blue-400 to-indigo-600',
  },
  {
    id: 'vendor-services',
    icon: Wrench,
    label: 'Services',
    labelRu: 'Услуги',
    path: '/vendor/services',
    iconColor: 'text-white',
    bgColor: 'bg-gradient-to-br from-amber-400 to-orange-600',
  },
  {
    id: 'vendor-calendar',
    icon: Calendar,
    label: 'Calendar',
    labelRu: 'Календарь',
    path: '/vendor/calendar',
    iconColor: 'text-white',
    bgColor: 'bg-gradient-to-br from-teal-400 to-emerald-600',
  },
  {
    id: 'market',
    icon: ShoppingBag,
    label: 'Market',
    labelRu: 'Маркет',
    path: '/market',
    iconColor: 'text-white',
    bgColor: 'bg-gradient-to-br from-violet-400 to-purple-600',
  },
  {
    id: 'banking',
    icon: Banknote,
    label: 'Banking',
    labelRu: 'Банки',
    path: '/banking',
    iconColor: 'text-white',
    bgColor: 'bg-gradient-to-br from-green-400 to-emerald-600',
  },
];

// Admin/Staff/Team-focused actions (platform management)
const ADMIN_ACTIONS: QuickAction[] = [
  {
    id: 'admin-dashboard',
    icon: Shield,
    label: 'Admin',
    labelRu: 'Админ',
    path: '/admin',
    iconColor: 'text-white',
    bgColor: 'bg-gradient-to-br from-red-400 to-rose-600',
  },
  {
    id: 'team-dashboard',
    icon: Building2,
    label: 'Team',
    labelRu: 'Команда',
    path: '/team',
    iconColor: 'text-white',
    bgColor: 'bg-gradient-to-br from-emerald-400 to-green-600',
  },
  {
    id: 'services',
    icon: Wrench,
    label: 'Services',
    labelRu: 'Сервисы',
    path: '/services',
    iconColor: 'text-white',
    bgColor: 'bg-gradient-to-br from-amber-400 to-orange-600',
  },
  {
    id: 'property',
    icon: Home,
    label: 'Property',
    labelRu: 'Жильё',
    path: '/property',
    iconColor: 'text-white',
    bgColor: 'bg-gradient-to-br from-teal-400 to-emerald-600',
  },
  {
    id: 'market',
    icon: ShoppingBag,
    label: 'Market',
    labelRu: 'Маркет',
    path: '/market',
    iconColor: 'text-white',
    bgColor: 'bg-gradient-to-br from-violet-400 to-purple-600',
  },
  {
    id: 'legal',
    icon: Scale,
    label: 'Legal',
    labelRu: 'Юрист',
    path: '/legal',
    iconColor: 'text-white',
    bgColor: 'bg-gradient-to-br from-indigo-400 to-blue-600',
  },
];

// "More" button - path is determined dynamically based on contentMode
const getMoreAction = (contentMode: 'services' | 'products'): QuickAction => ({
  id: 'more',
  icon: MoreHorizontal,
  label: 'More',
  labelRu: 'Ещё',
  path: contentMode === 'products' ? '/market' : '/discover',
  iconColor: 'text-muted-foreground',
  bgColor: 'bg-muted',
});

// Default actions for guests (not logged in) - TOURIST PRIORITY: Property, Transfer, Flowers, Transport
const DEFAULT_ACTIONS: QuickAction[] = [
  {
    id: 'property',
    icon: Home,
    label: 'Property',
    labelRu: 'Жильё',
    path: '/property',
    iconColor: 'text-white',
    bgColor: 'bg-gradient-to-br from-teal-400 to-emerald-600',
  },
  {
    id: 'transfer',
    icon: Plane,
    label: 'Transfer',
    labelRu: 'Трансфер',
    path: '/transport/airport-transfer',
    iconColor: 'text-white',
    bgColor: 'bg-gradient-to-br from-indigo-400 to-purple-600',
  },
  {
    id: 'flowers',
    icon: Flower2,
    label: 'Flowers',
    labelRu: 'Цветы',
    path: '/flowers',
    iconColor: 'text-white',
    bgColor: 'bg-gradient-to-br from-rose-400 to-pink-600',
  },
  {
    id: 'transport',
    icon: Car,
    label: 'Transport',
    labelRu: 'Транспорт',
    path: '/transport',
    iconColor: 'text-white',
    bgColor: 'bg-gradient-to-br from-blue-400 to-indigo-600',
  },
  {
    id: 'experiences',
    icon: Compass,
    label: 'Experiences',
    labelRu: 'Впечатления',
    path: '/experiences',
    iconColor: 'text-white',
    bgColor: 'bg-gradient-to-br from-amber-400 to-orange-600',
  },
  {
    id: 'restaurants',
    icon: Utensils,
    label: 'Food',
    labelRu: 'Еда',
    path: '/restaurants',
    iconColor: 'text-white',
    bgColor: 'bg-gradient-to-br from-orange-400 to-red-500',
  },
  {
    id: 'beauty',
    icon: Sparkles,
    label: 'Beauty',
    labelRu: 'Красота',
    path: '/beauty',
    iconColor: 'text-white',
    bgColor: 'bg-gradient-to-br from-pink-400 to-rose-600',
  },
  {
    id: 'medical',
    icon: Stethoscope,
    label: 'Medical',
    labelRu: 'Медицина',
    path: '/medical',
    iconColor: 'text-white',
    bgColor: 'bg-gradient-to-br from-emerald-400 to-green-600',
  },
];

// Map personas to actions - personas take priority over user_type
function getActionsForPersonas(personas: UserPersona[]): QuickAction[] {
  if (personas.length === 0) {
    return DEFAULT_ACTIONS;
  }

  // Collect actions from all active personas, track frequency
  const actionScores: Record<string, { action: QuickAction; score: number }> = {};
  
  const personaToActions: Record<UserPersona, QuickAction[]> = {
    tourist: TOURIST_ACTIONS,
    resident: RESIDENT_ACTIONS,
    property_owner: OWNER_ACTIONS,
    investor: INVESTOR_ACTIONS,
  };

  for (const persona of personas) {
    const actions = personaToActions[persona] || [];
    actions.forEach((action, index) => {
      const existing = actionScores[action.id];
      // Score: higher for earlier position + bonus for appearing in multiple personas
      const positionScore = actions.length - index;
      if (existing) {
        existing.score += positionScore + 5; // bonus for overlap
      } else {
        actionScores[action.id] = { action, score: positionScore };
      }
    });
  }

  // Sort by score and return top 8
  return Object.values(actionScores)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map(item => item.action);
}

function getActionsForUserType(userType: UserType | null | undefined): QuickAction[] {
  switch (userType) {
    case 'tourist':
      return TOURIST_ACTIONS;
    case 'resident':
      return RESIDENT_ACTIONS;
    case 'owner':
      return OWNER_ACTIONS;
    case 'vendor':
    case 'admin':
    case 'uno_team':
      return RESIDENT_ACTIONS; // Business users see resident view
    default:
      return DEFAULT_ACTIONS;
  }
}

/**
 * Map AppRole (from context switcher) to QuickActions
 * This takes priority when user switches role via RoleContextSwitcher
 */
function getActionsForRole(role: AppRole): QuickAction[] {
  switch (role) {
    case 'owner':
      return OWNER_ACTIONS;
    case 'vendor':
      return VENDOR_ACTIONS;
    case 'admin':
    case 'staff':
    case 'uno_team':
      return ADMIN_ACTIONS;
    case 'user':
    default:
      return DEFAULT_ACTIONS;
  }
}

interface QuickActionsGridProps {
  contentMode?: 'services' | 'products';
}

export const QuickActionsGrid = memo(function QuickActionsGrid({ 
  contentMode = 'services' 
}: QuickActionsGridProps) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { profile } = useProfile();
  const { personas } = useUserPersonas();
  const { activeRole, isLoading: roleLoading } = useUserContext();
  const queryClient = useQueryClient();

  // Get personalized actions: activeRole > personas > user_type
  const quickActions = useMemo(() => {
    let userActions: QuickAction[];
    
    // Priority 1: If user has explicitly switched role (not default 'user'), use role-based actions
    if (!roleLoading && activeRole && activeRole !== 'user') {
      userActions = getActionsForRole(activeRole);
    }
    // Priority 2: Use persona-based actions when user has selected personas
    else if (personas.length > 0) {
      userActions = getActionsForPersonas(personas);
    } 
    // Priority 3: Fallback to profile user_type
    else {
      userActions = getActionsForUserType(profile?.user_type);
    }
    
    // Limit to 5 actions + dynamic "More" button based on contentMode
    const moreAction = getMoreAction(contentMode);
    return [...userActions.slice(0, 5), moreAction];
  }, [activeRole, roleLoading, personas, profile?.user_type, contentMode]);

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
    <div className="grid grid-cols-3 gap-2">
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
            
            {/* Icon Container - vibrant gradient style */}
            <div className={cn(
              "w-14 h-14 rounded-2xl flex items-center justify-center mb-1.5 shadow-lg ring-2 ring-white/20",
              action.bgColor,
              "group-hover:scale-110 group-hover:shadow-xl transition-all duration-200"
            )}>
              <Icon className={cn("w-6 h-6", action.iconColor)} />
            </div>
            
            {/* Label - emphasized */}
            <span className={cn(
              "text-[11px] font-semibold text-center leading-tight truncate w-full",
              "text-foreground"
            )}>
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
});
