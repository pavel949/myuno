import React, { useCallback, memo, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { staggerContainerVariants, staggerItemVariants } from '@/lib/motionPresets';
import { 
  Anchor, Plane, Flower2, Home, Utensils, Compass,
  Stethoscope, ShoppingBag, MoreHorizontal, Scale, Shield,
  Sparkles, Car, GraduationCap, Briefcase, Banknote,
  Calendar, Wrench, Building2, Building, Key, Droplets, TrendingUp,
  Users, BarChart3, ClipboardList, Lock
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUserPersonas, UserPersona } from '@/hooks/useUserPersonas';
import { useUserContext, type AppRole } from '@/hooks/useUserContext';
import { useOwnerAccess } from '@/hooks/useOwnerAccess';
import { cn } from '@/lib/utils';
import { triggerRipple } from '@/hooks/useRipple';
import { triggerHaptic } from '@/hooks/useHapticFeedback';
import { playSound } from '@/hooks/useSoundEffects';
import { getFeedbackSettings } from '@/hooks/useFeedbackSettings';
import { prefetchRoute } from '@/lib/routePrefetch';
import { toast } from 'sonner';


interface QuickAction {
  id: string;
  icon: React.ElementType;
  label: string;
  labelRu: string;
  path: string;
  isUrgent?: boolean;
  /** Semantic tint color for icon background */
  tint?: string;
  /** Requires verified MC with at least 1 property */
  requiresFullAccess?: boolean;
}

const TOURIST_ACTIONS: QuickAction[] = [
  { id: 'property', icon: Home, label: 'Housing', labelRu: 'Жильё', path: '/property', tint: 'bg-success/15' },
  { id: 'transfer', icon: Plane, label: 'Transfer', labelRu: 'Трансфер', path: '/transport/airport-transfer', tint: 'bg-accent-cyan/15' },
  { id: 'flowers', icon: Flower2, label: 'Flowers', labelRu: 'Цветы', path: '/flowers', tint: 'bg-accent-coral/15' },
  { id: 'delivery', icon: Droplets, label: 'Delivery', labelRu: 'Доставка', path: '/market?category=groceries', tint: 'bg-accent-cyan/15' },
  { id: 'transport', icon: Car, label: 'Transport', labelRu: 'Транспорт', path: '/transport', tint: 'bg-warning/15' },
  { id: 'experiences', icon: Compass, label: 'Experiences', labelRu: 'Впечатления', path: '/experiences', tint: 'bg-accent-purple/15' },
  { id: 'yachts', icon: Anchor, label: 'Charters', labelRu: 'Чартер', path: '/yachts', tint: 'bg-info/15' },
  { id: 'restaurants', icon: Utensils, label: 'Food', labelRu: 'Еда', path: '/restaurants', tint: 'bg-accent-amber/15' },
];

const RESIDENT_ACTIONS: QuickAction[] = [
  { id: 'visa', icon: Briefcase, label: 'Visa', labelRu: 'Визы', path: '/visa', tint: 'bg-primary/15' },
  { id: 'property', icon: Home, label: 'Property', labelRu: 'Жильё', path: '/property', tint: 'bg-success/15' },
  { id: 'education', icon: GraduationCap, label: 'Education', labelRu: 'Обучение', path: '/education', tint: 'bg-warning/15' },
  { id: 'medical', icon: Stethoscope, label: 'Medical', labelRu: 'Медицина', path: '/medical', tint: 'bg-accent-coral/15' },
  { id: 'legal', icon: Scale, label: 'Legal', labelRu: 'Юрист', path: '/legal', tint: 'bg-muted' },
  { id: 'insurance', icon: Shield, label: 'Insurance', labelRu: 'Страховка', path: '/insurance', tint: 'bg-accent-cyan/15' },
  { id: 'banking', icon: Banknote, label: 'Banking', labelRu: 'Банки', path: '/banking', tint: 'bg-success/15' },
];

const OWNER_ACTIONS: QuickAction[] = [
  { id: 'my-properties', icon: Key, label: 'My Properties', labelRu: 'Мои объекты', path: '/owner', tint: 'bg-success/15' },
  { id: 'owner-crm', icon: Users, label: 'CRM', labelRu: 'CRM', path: '/mc/crm-dashboard', tint: 'bg-primary/15', requiresFullAccess: true },
  { id: 'owner-calendar', icon: Calendar, label: 'Calendar', labelRu: 'Календарь', path: '/mc/calendar', tint: 'bg-info/15', requiresFullAccess: true },
  { id: 'owner-finance', icon: BarChart3, label: 'Finance', labelRu: 'Финансы', path: '/mc/finance', tint: 'bg-success/15', requiresFullAccess: true },
  { id: 'owner-tasks', icon: ClipboardList, label: 'Tasks', labelRu: 'Задачи', path: '/mc/tasks', tint: 'bg-warning/15', requiresFullAccess: true },
  { id: 'cleaning', icon: Sparkles, label: 'Cleaning', labelRu: 'Клининг', path: '/cleaning', tint: 'bg-accent-cyan/15' },
  { id: 'services', icon: Wrench, label: 'Services', labelRu: 'Сервис', path: '/services', tint: 'bg-accent-amber/15' },
];

const INVESTOR_ACTIONS: QuickAction[] = [
  { id: 'invest', icon: TrendingUp, label: 'Investment', labelRu: 'Инвестиции', path: '/invest', tint: 'bg-success/15' },
  { id: 'offplan', icon: Building2, label: 'Off-Plan', labelRu: 'Новостройки', path: '/offplan', tint: 'bg-accent-cyan/15' },
  { id: 'property-buy', icon: Building, label: 'Buy Property', labelRu: 'Купить', path: '/property?mode=buy', tint: 'bg-success/15' },
  { id: 'legal', icon: Scale, label: 'Legal', labelRu: 'Юрист', path: '/legal', tint: 'bg-muted' },
  { id: 'banking', icon: Briefcase, label: 'Banking', labelRu: 'Банкинг', path: '/banking', tint: 'bg-primary/15' },
  { id: 'insurance', icon: Shield, label: 'Insurance', labelRu: 'Страховка', path: '/insurance', tint: 'bg-info/15' },
];

const VENDOR_ACTIONS: QuickAction[] = [
  { id: 'vendor-dashboard', icon: Building2, label: 'Dashboard', labelRu: 'Панель', path: '/vendor', tint: 'bg-primary/15' },
  { id: 'vendor-orders', icon: ShoppingBag, label: 'Orders', labelRu: 'Заказы', path: '/vendor/orders', tint: 'bg-accent-amber/15' },
  { id: 'vendor-services', icon: Wrench, label: 'Services', labelRu: 'Услуги', path: '/vendor/services', tint: 'bg-warning/15' },
  { id: 'vendor-calendar', icon: Calendar, label: 'Calendar', labelRu: 'Календарь', path: '/vendor/calendar', tint: 'bg-info/15' },
  { id: 'market', icon: ShoppingBag, label: 'Market', labelRu: 'Маркет', path: '/market', tint: 'bg-accent-coral/15' },
  { id: 'banking', icon: Banknote, label: 'Banking', labelRu: 'Банкинг', path: '/banking', tint: 'bg-success/15' },
];

const ADMIN_ACTIONS: QuickAction[] = [
  { id: 'admin-dashboard', icon: Shield, label: 'Admin', labelRu: 'Админ', path: '/admin', tint: 'bg-primary/15' },
  { id: 'team-dashboard', icon: Building2, label: 'Team', labelRu: 'Команда', path: '/team', tint: 'bg-accent-cyan/15' },
  { id: 'services', icon: Wrench, label: 'Services', labelRu: 'Сервисы', path: '/services', tint: 'bg-warning/15' },
  { id: 'property', icon: Home, label: 'Property', labelRu: 'Жильё', path: '/property', tint: 'bg-success/15' },
  { id: 'market', icon: ShoppingBag, label: 'Market', labelRu: 'Маркет', path: '/market', tint: 'bg-accent-coral/15' },
  { id: 'legal', icon: Scale, label: 'Legal', labelRu: 'Юрист', path: '/legal', tint: 'bg-muted' },
];

const getMoreAction = (contentMode: 'services' | 'products'): QuickAction => ({
  id: 'more', icon: MoreHorizontal, label: 'More', labelRu: 'Ещё',
  path: contentMode === 'products' ? '/market' : '/discover',
  tint: 'bg-muted/60',
});

const DEFAULT_ACTIONS: QuickAction[] = [
  { id: 'property', icon: Home, label: 'Property', labelRu: 'Жильё', path: '/property', tint: 'bg-success/15' },
  { id: 'transfer', icon: Plane, label: 'Transfer', labelRu: 'Трансфер', path: '/transport/airport-transfer', tint: 'bg-accent-cyan/15' },
  { id: 'flowers', icon: Flower2, label: 'Flowers', labelRu: 'Цветы', path: '/flowers', tint: 'bg-accent-coral/15' },
  { id: 'transport', icon: Car, label: 'Transport', labelRu: 'Транспорт', path: '/transport', tint: 'bg-warning/15' },
  { id: 'experiences', icon: Compass, label: 'Experiences', labelRu: 'Впечатления', path: '/experiences', tint: 'bg-accent-purple/15' },
  { id: 'restaurants', icon: Utensils, label: 'Food', labelRu: 'Еда', path: '/restaurants', tint: 'bg-accent-amber/15' },
  { id: 'beauty', icon: Sparkles, label: 'Beauty', labelRu: 'Красота', path: '/beauty', tint: 'bg-accent-coral/15' },
  { id: 'medical', icon: Stethoscope, label: 'Medical', labelRu: 'Медицина', path: '/medical', tint: 'bg-destructive/15' },
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
  'bg-success/15': 'text-success',
  'bg-accent-cyan/15': 'text-accent-cyan',
  'bg-accent-coral/15': 'text-accent-coral',
  'bg-warning/15': 'text-warning',
  'bg-accent-purple/15': 'text-accent-purple',
  'bg-info/15': 'text-info',
  'bg-accent-amber/15': 'text-accent-amber',
  'bg-destructive/15': 'text-destructive',
  'bg-primary/15': 'text-primary',
  'bg-muted': 'text-muted-foreground',
  'bg-muted/60': 'text-muted-foreground',
};

export const QuickActionsGrid = memo(function QuickActionsGrid({ 
  contentMode = 'services' 
}: QuickActionsGridProps) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  
  const { personas, isLoading: personasLoading } = useUserPersonas();
  const { activeRole, isLoading: roleLoading } = useUserContext();
  const { hasFullAccess } = useOwnerAccess();
  const queryClient = useQueryClient();

  const isOwnerPersona = useMemo(() => {
    return personas.includes('property_owner') || activeRole === 'owner';
  }, [personas, activeRole]);

  const quickActions = useMemo(() => {
    let userActions: QuickAction[];

    // Home quick actions are primarily driven by selected persona
    if (!personasLoading && personas.length > 0) {
      userActions = getActionsForPersonas(personas);
    } else if (!roleLoading && activeRole && activeRole !== 'user') {
      userActions = getActionsForRole(activeRole);
    } else {
      userActions = DEFAULT_ACTIONS;
    }
    const moreAction = getMoreAction(contentMode);
    return [...userActions.slice(0, 7), moreAction];
  }, [activeRole, roleLoading, personas, personasLoading, contentMode]);

  const handleClick = useCallback((action: QuickAction, e: React.MouseEvent<HTMLButtonElement>) => {
    triggerRipple(e);
    const settings = getFeedbackSettings();
    if (settings.hapticEnabled) triggerHaptic(action.isUrgent ? 'medium' : 'light');
    if (settings.soundEnabled) playSound('click');

    // Gate restricted actions behind verification
    if (action.requiresFullAccess && !hasFullAccess) {
      toast.error(
        isRu 
          ? 'Доступно после верификации УК и добавления объекта' 
          : 'Available after MC verification and adding a property',
        { duration: 4000 }
      );
      return;
    }

    navigate(action.path);
  }, [navigate, hasFullAccess, isRu]);

  const handlePrefetch = useCallback((path: string) => {
    prefetchRoute(path, queryClient);
  }, [queryClient]);

  // Stable key that changes when actions change, forcing re-animation
  const actionsKey = useMemo(() => quickActions.map(a => a.id).join(','), [quickActions]);

  return (
    <motion.div
      key={actionsKey}
      className={cn(
        "grid grid-cols-4 gap-y-3 gap-x-2",
        "lg:flex lg:items-start lg:justify-evenly lg:gap-3"
      )}
      variants={staggerContainerVariants}
      initial="initial"
      animate="animate"
    >
      {quickActions.map((action) => {
        const Icon = action.icon;
        const label = language === 'ru' ? action.labelRu : action.label;
        const isMore = action.id === 'more';
        const tint = action.tint || 'bg-primary/[0.07]';
        const iconColor = ICON_TINT_COLORS[tint] || 'text-primary';
        const isLocked = action.requiresFullAccess && !hasFullAccess;
        
        return (
          <motion.button
            key={action.id}
            variants={staggerItemVariants}
            onClick={(e) => handleClick(action, e)}
            onMouseEnter={() => handlePrefetch(action.path)}
            onTouchStart={() => handlePrefetch(action.path)}
            className={cn(
              "relative flex flex-col items-center gap-1.5 p-1 rounded-2xl",
              "transition-all group active:scale-[0.95]",
              "lg:px-5 lg:py-3 lg:hover:bg-muted/40",
              isLocked && "opacity-60",
            )}
          >
            {/* Icon container — saturated tint with subtle gradient */}
            <div className={cn(
              "relative w-14 h-14 rounded-2xl flex items-center justify-center",
              "transition-all duration-200 group-hover:scale-105 group-active:scale-95",
              "shadow-md ring-1 ring-black/[0.04] dark:ring-white/[0.06]",
              tint,
              "lg:w-16 lg:h-16"
            )}>
              <Icon 
                className={cn(
                  isMore ? "text-muted-foreground" : iconColor,
                  "lg:!w-7 lg:!h-7 drop-shadow-sm"
                )}
                style={{ width: 26, height: 26 }}
                strokeWidth={2.2}
              />
              {isLocked && (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                  <Lock className="w-2.5 h-2.5 text-muted-foreground" />
                </div>
              )}
            </div>
            
            <span className={cn(
              "text-[11px] font-semibold text-center leading-tight text-foreground/90",
              "lg:text-[13px]"
            )}>
              {label}
            </span>
          </motion.button>
        );
      })}
    </motion.div>
  );
});
