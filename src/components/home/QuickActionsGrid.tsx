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
  isUrgent?: boolean;
  /** Semantic tint color for icon background */
  tint?: string;
}

const TOURIST_ACTIONS: QuickAction[] = [
  { id: 'property', icon: Home, label: 'Rent', labelRu: 'Аренда', path: '/property', tint: 'bg-emerald-500/10' },
  { id: 'transfer', icon: Plane, label: 'Transfer', labelRu: 'Трансфер', path: '/transport/airport-transfer', tint: 'bg-sky-500/10' },
  { id: 'flowers', icon: Flower2, label: 'Flowers', labelRu: 'Цветы', path: '/flowers', tint: 'bg-pink-500/10' },
  { id: 'delivery', icon: Droplets, label: 'Delivery', labelRu: 'Доставка', path: '/market?category=groceries', tint: 'bg-cyan-500/10' },
  { id: 'transport', icon: Car, label: 'Transport', labelRu: 'Транспорт', path: '/transport', tint: 'bg-amber-500/10' },
  { id: 'experiences', icon: Compass, label: 'Experiences', labelRu: 'Впечатления', path: '/experiences', tint: 'bg-violet-500/10' },
  { id: 'yachts', icon: Anchor, label: 'Charters', labelRu: 'Чартер', path: '/yachts', tint: 'bg-blue-500/10' },
  { id: 'restaurants', icon: Utensils, label: 'Food', labelRu: 'Еда', path: '/restaurants', tint: 'bg-orange-500/10' },
];

const RESIDENT_ACTIONS: QuickAction[] = [
  { id: 'visa', icon: Briefcase, label: 'Visa', labelRu: 'Визы', path: '/visa', tint: 'bg-indigo-500/10' },
  { id: 'property', icon: Home, label: 'Property', labelRu: 'Жильё', path: '/property', tint: 'bg-emerald-500/10' },
  { id: 'education', icon: GraduationCap, label: 'Education', labelRu: 'Обучение', path: '/education', tint: 'bg-amber-500/10' },
  { id: 'medical', icon: Stethoscope, label: 'Medical', labelRu: 'Медицина', path: '/medical', tint: 'bg-rose-500/10' },
  { id: 'legal', icon: Scale, label: 'Legal', labelRu: 'Юрист', path: '/legal', tint: 'bg-slate-500/10' },
  { id: 'insurance', icon: Shield, label: 'Insurance', labelRu: 'Страховка', path: '/insurance', tint: 'bg-sky-500/10' },
  { id: 'banking', icon: Banknote, label: 'Banking', labelRu: 'Банки', path: '/banking', tint: 'bg-green-500/10' },
];

const OWNER_ACTIONS: QuickAction[] = [
  { id: 'my-properties', icon: Home, label: 'My Properties', labelRu: 'Мои объекты', path: '/owner', tint: 'bg-emerald-500/10' },
  { id: 'owner-calendar', icon: Calendar, label: 'Calendar', labelRu: 'Календарь', path: '/owner/calendar', tint: 'bg-blue-500/10' },
  { id: 'services', icon: Wrench, label: 'Services', labelRu: 'Сервис', path: '/services', tint: 'bg-amber-500/10' },
  { id: 'rental', icon: Key, label: 'Rental', labelRu: 'Аренда', path: '/property', tint: 'bg-violet-500/10' },
  { id: 'legal', icon: Scale, label: 'Legal', labelRu: 'Юрист', path: '/legal', tint: 'bg-slate-500/10' },
  { id: 'cleaning', icon: Sparkles, label: 'Cleaning', labelRu: 'Клининг', path: '/cleaning', tint: 'bg-cyan-500/10' },
];

const INVESTOR_ACTIONS: QuickAction[] = [
  { id: 'invest', icon: Banknote, label: 'Invest', labelRu: 'Инвестиции', path: '/invest', tint: 'bg-green-500/10' },
  { id: 'offplan', icon: Building2, label: 'Off-Plan', labelRu: 'Новостройки', path: '/offplan', tint: 'bg-sky-500/10' },
  { id: 'property-buy', icon: Home, label: 'Buy Property', labelRu: 'Купить', path: '/property?mode=buy', tint: 'bg-emerald-500/10' },
  { id: 'legal', icon: Scale, label: 'Legal', labelRu: 'Юрист', path: '/legal', tint: 'bg-slate-500/10' },
  { id: 'banking', icon: Briefcase, label: 'Banking', labelRu: 'Банкинг', path: '/banking', tint: 'bg-indigo-500/10' },
  { id: 'insurance', icon: Shield, label: 'Insurance', labelRu: 'Страховка', path: '/insurance', tint: 'bg-blue-500/10' },
];

const VENDOR_ACTIONS: QuickAction[] = [
  { id: 'vendor-dashboard', icon: Building2, label: 'Dashboard', labelRu: 'Панель', path: '/vendor', tint: 'bg-indigo-500/10' },
  { id: 'vendor-orders', icon: ShoppingBag, label: 'Orders', labelRu: 'Заказы', path: '/vendor/orders', tint: 'bg-orange-500/10' },
  { id: 'vendor-services', icon: Wrench, label: 'Services', labelRu: 'Услуги', path: '/vendor/services', tint: 'bg-amber-500/10' },
  { id: 'vendor-calendar', icon: Calendar, label: 'Calendar', labelRu: 'Календарь', path: '/vendor/calendar', tint: 'bg-blue-500/10' },
  { id: 'market', icon: ShoppingBag, label: 'Market', labelRu: 'Маркет', path: '/market', tint: 'bg-pink-500/10' },
  { id: 'banking', icon: Banknote, label: 'Banking', labelRu: 'Банкинг', path: '/banking', tint: 'bg-green-500/10' },
];

const ADMIN_ACTIONS: QuickAction[] = [
  { id: 'admin-dashboard', icon: Shield, label: 'Admin', labelRu: 'Админ', path: '/admin', tint: 'bg-indigo-500/10' },
  { id: 'team-dashboard', icon: Building2, label: 'Team', labelRu: 'Команда', path: '/team', tint: 'bg-sky-500/10' },
  { id: 'services', icon: Wrench, label: 'Services', labelRu: 'Сервисы', path: '/services', tint: 'bg-amber-500/10' },
  { id: 'property', icon: Home, label: 'Property', labelRu: 'Жильё', path: '/property', tint: 'bg-emerald-500/10' },
  { id: 'market', icon: ShoppingBag, label: 'Market', labelRu: 'Маркет', path: '/market', tint: 'bg-pink-500/10' },
  { id: 'legal', icon: Scale, label: 'Legal', labelRu: 'Юрист', path: '/legal', tint: 'bg-slate-500/10' },
];

const getMoreAction = (contentMode: 'services' | 'products'): QuickAction => ({
  id: 'more', icon: MoreHorizontal, label: 'More', labelRu: 'Ещё',
  path: contentMode === 'products' ? '/market' : '/discover',
  tint: 'bg-muted/60',
});

const DEFAULT_ACTIONS: QuickAction[] = [
  { id: 'property', icon: Home, label: 'Property', labelRu: 'Жильё', path: '/property', tint: 'bg-emerald-500/10' },
  { id: 'transfer', icon: Plane, label: 'Transfer', labelRu: 'Трансфер', path: '/transport/airport-transfer', tint: 'bg-sky-500/10' },
  { id: 'flowers', icon: Flower2, label: 'Flowers', labelRu: 'Цветы', path: '/flowers', tint: 'bg-pink-500/10' },
  { id: 'transport', icon: Car, label: 'Transport', labelRu: 'Транспорт', path: '/transport', tint: 'bg-amber-500/10' },
  { id: 'experiences', icon: Compass, label: 'Experiences', labelRu: 'Впечатления', path: '/experiences', tint: 'bg-violet-500/10' },
  { id: 'restaurants', icon: Utensils, label: 'Food', labelRu: 'Еда', path: '/restaurants', tint: 'bg-orange-500/10' },
  { id: 'beauty', icon: Sparkles, label: 'Beauty', labelRu: 'Красота', path: '/beauty', tint: 'bg-rose-500/10' },
  { id: 'medical', icon: Stethoscope, label: 'Medical', labelRu: 'Медицина', path: '/medical', tint: 'bg-red-500/10' },
];

function getActionsForPersonas(personas: UserPersona[]): QuickAction[] {
  if (personas.length === 0) return DEFAULT_ACTIONS;
  const actionScores: Record<string, { action: QuickAction; score: number }> = {};
  const personaToActions: Record<UserPersona, QuickAction[]> = {
    tourist: TOURIST_ACTIONS, resident: RESIDENT_ACTIONS,
    property_owner: OWNER_ACTIONS, investor: INVESTOR_ACTIONS,
  };
  for (const persona of personas) {
    const actions = personaToActions[persona] || [];
    actions.forEach((action, index) => {
      const positionScore = actions.length - index;
      const existing = actionScores[action.id];
      if (existing) { existing.score += positionScore + 5; }
      else { actionScores[action.id] = { action, score: positionScore }; }
    });
  }
  return Object.values(actionScores).sort((a, b) => b.score - a.score).slice(0, 8).map(item => item.action);
}

function getActionsForUserType(userType: UserType | null | undefined): QuickAction[] {
  switch (userType) {
    case 'tourist': return TOURIST_ACTIONS;
    case 'resident': return RESIDENT_ACTIONS;
    case 'owner': return OWNER_ACTIONS;
    case 'vendor': case 'admin': case 'uno_team': return RESIDENT_ACTIONS;
    default: return DEFAULT_ACTIONS;
  }
}

function getActionsForRole(role: AppRole): QuickAction[] {
  switch (role) {
    case 'owner': return OWNER_ACTIONS;
    case 'vendor': return VENDOR_ACTIONS;
    case 'admin': case 'staff': case 'uno_team': return ADMIN_ACTIONS;
    default: return DEFAULT_ACTIONS;
  }
}

interface QuickActionsGridProps {
  contentMode?: 'services' | 'products';
}

/** Icon tint color mapping */
const ICON_TINT_COLORS: Record<string, string> = {
  'bg-emerald-500/10': 'text-emerald-600 dark:text-emerald-400',
  'bg-sky-500/10': 'text-sky-600 dark:text-sky-400',
  'bg-pink-500/10': 'text-pink-600 dark:text-pink-400',
  'bg-cyan-500/10': 'text-cyan-600 dark:text-cyan-400',
  'bg-amber-500/10': 'text-amber-600 dark:text-amber-400',
  'bg-violet-500/10': 'text-violet-600 dark:text-violet-400',
  'bg-blue-500/10': 'text-blue-600 dark:text-blue-400',
  'bg-orange-500/10': 'text-orange-600 dark:text-orange-400',
  'bg-rose-500/10': 'text-rose-600 dark:text-rose-400',
  'bg-red-500/10': 'text-red-600 dark:text-red-400',
  'bg-indigo-500/10': 'text-indigo-600 dark:text-indigo-400',
  'bg-slate-500/10': 'text-slate-600 dark:text-slate-400',
  'bg-green-500/10': 'text-green-600 dark:text-green-400',
  'bg-muted/60': 'text-muted-foreground',
};

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
    return [...userActions.slice(0, 7), moreAction];
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
    <div className={cn(
      "grid grid-cols-4 gap-y-3 gap-x-2",
      "lg:flex lg:items-start lg:justify-evenly lg:gap-3"
    )}>
      {quickActions.map((action) => {
        const Icon = action.icon;
        const label = language === 'ru' ? action.labelRu : action.label;
        const isMore = action.id === 'more';
        const tint = action.tint || 'bg-primary/[0.07]';
        const iconColor = ICON_TINT_COLORS[tint] || 'text-primary';
        
        return (
          <button
            key={action.id}
            onClick={(e) => handleClick(action, e)}
            onMouseEnter={() => handlePrefetch(action.path)}
            onTouchStart={() => handlePrefetch(action.path)}
            className={cn(
              "relative flex flex-col items-center gap-1.5 p-1 rounded-2xl",
              "transition-all group active:scale-[0.95]",
              "lg:px-5 lg:py-3 lg:hover:bg-muted/40",
            )}
          >
            {/* Icon container — semantic tint background */}
            <div className={cn(
              "w-14 h-14 rounded-2xl flex items-center justify-center",
              "transition-transform duration-200 group-hover:scale-105",
              tint,
              "lg:w-16 lg:h-16"
            )}>
              <Icon 
                className={cn(
                  isMore ? "text-muted-foreground" : iconColor,
                  "lg:!w-7 lg:!h-7"
                )}
                style={{ width: 24, height: 24 }}
                strokeWidth={1.6}
              />
            </div>
            
            <span className={cn(
              "text-[11px] font-medium text-center leading-tight text-foreground/80",
              "lg:text-[13px]"
            )}>
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
});
