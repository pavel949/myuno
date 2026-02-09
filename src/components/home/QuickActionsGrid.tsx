import React, { useCallback, memo, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { 
  Anchor, Plane, Flower2, Home, Utensils, Compass,
  Stethoscope, ShoppingBag, MoreHorizontal, Scale, Shield,
  Sparkles, Car, GraduationCap, Briefcase, Banknote,
  Calendar, Wrench, Building2, Key, Droplets
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
// ACTIONS BY USER TYPE — Calm flat tokens
// ============================================

const TOURIST_ACTIONS: QuickAction[] = [
  { id: 'property', icon: Home, label: 'Rent', labelRu: 'Аренда', path: '/property', iconColor: 'text-teal-600 dark:text-teal-400', bgColor: 'bg-teal-500/12' },
  { id: 'transfer', icon: Plane, label: 'Transfer', labelRu: 'Трансфер', path: '/transport/airport-transfer', iconColor: 'text-indigo-600 dark:text-indigo-400', bgColor: 'bg-indigo-500/12' },
  { id: 'flowers', icon: Flower2, label: 'Flowers', labelRu: 'Цветы', path: '/flowers', iconColor: 'text-rose-600 dark:text-rose-400', bgColor: 'bg-rose-500/12' },
  { id: 'delivery', icon: Droplets, label: 'Delivery', labelRu: 'Доставка', path: '/market?category=groceries', iconColor: 'text-sky-600 dark:text-sky-400', bgColor: 'bg-sky-500/12', badge: 'Water', badgeRu: 'Вода' },
  { id: 'transport', icon: Car, label: 'Transport', labelRu: 'Транспорт', path: '/transport', iconColor: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-500/12' },
  { id: 'experiences', icon: Compass, label: 'Experiences', labelRu: 'Впечатления', path: '/experiences', iconColor: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-500/12' },
  { id: 'yachts', icon: Anchor, label: 'Charters', labelRu: 'Чартер', path: '/yachts', iconColor: 'text-cyan-600 dark:text-cyan-400', bgColor: 'bg-cyan-500/12' },
  { id: 'restaurants', icon: Utensils, label: 'Food', labelRu: 'Еда', path: '/restaurants', iconColor: 'text-orange-600 dark:text-orange-400', bgColor: 'bg-orange-500/12' },
];

const RESIDENT_ACTIONS: QuickAction[] = [
  { id: 'visa', icon: Briefcase, label: 'Visa', labelRu: 'Визы', path: '/visa', iconColor: 'text-purple-600 dark:text-purple-400', bgColor: 'bg-purple-500/12' },
  { id: 'property', icon: Home, label: 'Property', labelRu: 'Жильё', path: '/property', iconColor: 'text-teal-600 dark:text-teal-400', bgColor: 'bg-teal-500/12' },
  { id: 'education', icon: GraduationCap, label: 'Education', labelRu: 'Обучение', path: '/education', iconColor: 'text-violet-600 dark:text-violet-400', bgColor: 'bg-violet-500/12' },
  { id: 'medical', icon: Stethoscope, label: 'Medical', labelRu: 'Медицина', path: '/medical', iconColor: 'text-emerald-600 dark:text-emerald-400', bgColor: 'bg-emerald-500/12' },
  { id: 'legal', icon: Scale, label: 'Legal', labelRu: 'Юрист', path: '/legal', iconColor: 'text-indigo-600 dark:text-indigo-400', bgColor: 'bg-indigo-500/12' },
  { id: 'insurance', icon: Shield, label: 'Insurance', labelRu: 'Страховка', path: '/insurance', iconColor: 'text-sky-600 dark:text-sky-400', bgColor: 'bg-sky-500/12' },
  { id: 'banking', icon: Banknote, label: 'Banking', labelRu: 'Банки', path: '/banking', iconColor: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-500/12' },
];

const OWNER_ACTIONS: QuickAction[] = [
  { id: 'my-properties', icon: Home, label: 'My Properties', labelRu: 'Мои объекты', path: '/owner', iconColor: 'text-teal-600 dark:text-teal-400', bgColor: 'bg-teal-500/12' },
  { id: 'owner-calendar', icon: Calendar, label: 'Calendar', labelRu: 'Календарь', path: '/owner/calendar', iconColor: 'text-indigo-600 dark:text-indigo-400', bgColor: 'bg-indigo-500/12' },
  { id: 'services', icon: Wrench, label: 'Services', labelRu: 'Сервис', path: '/services', iconColor: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-500/12' },
  { id: 'rental', icon: Key, label: 'Rental', labelRu: 'Аренда', path: '/property', iconColor: 'text-teal-600 dark:text-teal-400', bgColor: 'bg-teal-500/12' },
  { id: 'legal', icon: Scale, label: 'Legal', labelRu: 'Юрист', path: '/legal', iconColor: 'text-slate-600 dark:text-slate-400', bgColor: 'bg-slate-500/12' },
  { id: 'cleaning', icon: Sparkles, label: 'Cleaning', labelRu: 'Клининг', path: '/cleaning', iconColor: 'text-pink-600 dark:text-pink-400', bgColor: 'bg-pink-500/12' },
];

const INVESTOR_ACTIONS: QuickAction[] = [
  { id: 'invest', icon: Banknote, label: 'Invest', labelRu: 'Инвестиции', path: '/invest', iconColor: 'text-purple-600 dark:text-purple-400', bgColor: 'bg-purple-500/12', badge: 'ROI 12%', badgeRu: 'ROI 12%' },
  { id: 'offplan', icon: Building2, label: 'Off-Plan', labelRu: 'Новостройки', path: '/offplan', iconColor: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-500/12' },
  { id: 'property-buy', icon: Home, label: 'Buy Property', labelRu: 'Купить', path: '/property?mode=buy', iconColor: 'text-emerald-600 dark:text-emerald-400', bgColor: 'bg-emerald-500/12' },
  { id: 'legal', icon: Scale, label: 'Legal', labelRu: 'Юрист', path: '/legal', iconColor: 'text-slate-600 dark:text-slate-400', bgColor: 'bg-slate-500/12' },
  { id: 'banking', icon: Briefcase, label: 'Banking', labelRu: 'Банкинг', path: '/banking', iconColor: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-500/12' },
  { id: 'insurance', icon: Shield, label: 'Insurance', labelRu: 'Страховка', path: '/insurance', iconColor: 'text-sky-600 dark:text-sky-400', bgColor: 'bg-sky-500/12' },
];

const VENDOR_ACTIONS: QuickAction[] = [
  { id: 'vendor-dashboard', icon: Building2, label: 'Dashboard', labelRu: 'Панель', path: '/vendor', iconColor: 'text-purple-600 dark:text-purple-400', bgColor: 'bg-purple-500/12' },
  { id: 'vendor-orders', icon: ShoppingBag, label: 'Orders', labelRu: 'Заказы', path: '/vendor/orders', iconColor: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-500/12' },
  { id: 'vendor-services', icon: Wrench, label: 'Services', labelRu: 'Услуги', path: '/vendor/services', iconColor: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-500/12' },
  { id: 'vendor-calendar', icon: Calendar, label: 'Calendar', labelRu: 'Календарь', path: '/vendor/calendar', iconColor: 'text-teal-600 dark:text-teal-400', bgColor: 'bg-teal-500/12' },
  { id: 'market', icon: ShoppingBag, label: 'Market', labelRu: 'Маркет', path: '/market', iconColor: 'text-violet-600 dark:text-violet-400', bgColor: 'bg-violet-500/12' },
  { id: 'banking', icon: Banknote, label: 'Banking', labelRu: 'Банки', path: '/banking', iconColor: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-500/12' },
];

const ADMIN_ACTIONS: QuickAction[] = [
  { id: 'admin-dashboard', icon: Shield, label: 'Admin', labelRu: 'Админ', path: '/admin', iconColor: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-500/12' },
  { id: 'team-dashboard', icon: Building2, label: 'Team', labelRu: 'Команда', path: '/team', iconColor: 'text-emerald-600 dark:text-emerald-400', bgColor: 'bg-emerald-500/12' },
  { id: 'services', icon: Wrench, label: 'Services', labelRu: 'Сервисы', path: '/services', iconColor: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-500/12' },
  { id: 'property', icon: Home, label: 'Property', labelRu: 'Жильё', path: '/property', iconColor: 'text-teal-600 dark:text-teal-400', bgColor: 'bg-teal-500/12' },
  { id: 'market', icon: ShoppingBag, label: 'Market', labelRu: 'Маркет', path: '/market', iconColor: 'text-violet-600 dark:text-violet-400', bgColor: 'bg-violet-500/12' },
  { id: 'legal', icon: Scale, label: 'Legal', labelRu: 'Юрист', path: '/legal', iconColor: 'text-indigo-600 dark:text-indigo-400', bgColor: 'bg-indigo-500/12' },
];

const getMoreAction = (contentMode: 'services' | 'products'): QuickAction => ({
  id: 'more',
  icon: MoreHorizontal,
  label: 'More',
  labelRu: 'Ещё',
  path: contentMode === 'products' ? '/market' : '/discover',
  iconColor: 'text-muted-foreground',
  bgColor: 'bg-muted',
});

const DEFAULT_ACTIONS: QuickAction[] = [
  { id: 'property', icon: Home, label: 'Property', labelRu: 'Жильё', path: '/property', iconColor: 'text-teal-600 dark:text-teal-400', bgColor: 'bg-teal-500/12' },
  { id: 'transfer', icon: Plane, label: 'Transfer', labelRu: 'Трансфер', path: '/transport/airport-transfer', iconColor: 'text-indigo-600 dark:text-indigo-400', bgColor: 'bg-indigo-500/12' },
  { id: 'flowers', icon: Flower2, label: 'Flowers', labelRu: 'Цветы', path: '/flowers', iconColor: 'text-rose-600 dark:text-rose-400', bgColor: 'bg-rose-500/12' },
  { id: 'transport', icon: Car, label: 'Transport', labelRu: 'Транспорт', path: '/transport', iconColor: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-500/12' },
  { id: 'experiences', icon: Compass, label: 'Experiences', labelRu: 'Впечатления', path: '/experiences', iconColor: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-500/12' },
  { id: 'restaurants', icon: Utensils, label: 'Food', labelRu: 'Еда', path: '/restaurants', iconColor: 'text-orange-600 dark:text-orange-400', bgColor: 'bg-orange-500/12' },
  { id: 'beauty', icon: Sparkles, label: 'Beauty', labelRu: 'Красота', path: '/beauty', iconColor: 'text-pink-600 dark:text-pink-400', bgColor: 'bg-pink-500/12' },
  { id: 'medical', icon: Stethoscope, label: 'Medical', labelRu: 'Медицина', path: '/medical', iconColor: 'text-emerald-600 dark:text-emerald-400', bgColor: 'bg-emerald-500/12' },
];

// Map personas to actions
function getActionsForPersonas(personas: UserPersona[]): QuickAction[] {
  if (personas.length === 0) return DEFAULT_ACTIONS;

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
      const positionScore = actions.length - index;
      const existing = actionScores[action.id];
      if (existing) {
        existing.score += positionScore + 5;
      } else {
        actionScores[action.id] = { action, score: positionScore };
      }
    });
  }

  return Object.values(actionScores)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map(item => item.action);
}

function getActionsForUserType(userType: UserType | null | undefined): QuickAction[] {
  switch (userType) {
    case 'tourist': return TOURIST_ACTIONS;
    case 'resident': return RESIDENT_ACTIONS;
    case 'owner': return OWNER_ACTIONS;
    case 'vendor':
    case 'admin':
    case 'uno_team': return RESIDENT_ACTIONS;
    default: return DEFAULT_ACTIONS;
  }
}

function getActionsForRole(role: AppRole): QuickAction[] {
  switch (role) {
    case 'owner': return OWNER_ACTIONS;
    case 'vendor': return VENDOR_ACTIONS;
    case 'admin':
    case 'staff':
    case 'uno_team': return ADMIN_ACTIONS;
    case 'user':
    default: return DEFAULT_ACTIONS;
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

  const quickActions = useMemo(() => {
    let userActions: QuickAction[];
    
    if (!roleLoading && activeRole && activeRole !== 'user') {
      userActions = getActionsForRole(activeRole);
    } else if (personas.length > 0) {
      userActions = getActionsForPersonas(personas);
    } else {
      userActions = getActionsForUserType(profile?.user_type);
    }
    
    const moreAction = getMoreAction(contentMode);
    const maxItems = 5;
    return [...userActions.slice(0, maxItems), moreAction];
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
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-1.5 md:gap-3">
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
              "hover:bg-card/80 transition-all group active:scale-[0.97]",
              action.isUrgent && "ring-1 ring-red-500/30"
            )}
          >
            {badge && (
              <Badge className="absolute -top-1 -right-1 text-[8px] px-1.5 py-0.5 border-0 z-10 bg-red-500 text-white animate-pulse">
                {badge}
              </Badge>
            )}
            
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center mb-1.5",
              action.bgColor,
              "group-hover:scale-105 transition-transform duration-150"
            )}>
              <Icon className={cn("w-5 h-5", action.iconColor)} />
            </div>
            
            <span className="text-[11px] font-medium text-center leading-tight truncate w-full text-foreground">
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
});
