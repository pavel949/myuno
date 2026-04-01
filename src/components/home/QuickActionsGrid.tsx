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
  Users, BarChart3, ClipboardList, Lock, ChevronRight
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
  accentColor?: string;
  requiresFullAccess?: boolean;
}

const TOURIST_ACTIONS: QuickAction[] = [
  { id: 'property', icon: Home, label: 'Housing', labelRu: 'Жильё', path: '/property', accentColor: '#00D68F' },
  { id: 'transfer', icon: Plane, label: 'Transfer', labelRu: 'Трансфер', path: '/transport/airport-transfer', accentColor: '#4E7BFF' },
  { id: 'flowers', icon: Flower2, label: 'Flowers', labelRu: 'Цветы', path: '/flowers', accentColor: '#F43F5E' },
  { id: 'delivery', icon: Droplets, label: 'Delivery', labelRu: 'Доставка', path: '/market?category=groceries', accentColor: '#06B6D4' },
  { id: 'transport', icon: Car, label: 'Transport', labelRu: 'Транспорт', path: '/transport', accentColor: '#F59E0B' },
  { id: 'experiences', icon: Compass, label: 'Experiences', labelRu: 'Впечатления', path: '/experiences', accentColor: '#A855F7' },
  { id: 'yachts', icon: Anchor, label: 'Charters', labelRu: 'Чартер', path: '/yachts', accentColor: '#4E7BFF' },
  { id: 'restaurants', icon: Utensils, label: 'Food', labelRu: 'Еда', path: '/restaurants', accentColor: '#F59E0B' },
];

const RESIDENT_ACTIONS: QuickAction[] = [
  { id: 'visa', icon: Briefcase, label: 'Visa', labelRu: 'Визы', path: '/visa', accentColor: '#4E7BFF' },
  { id: 'property', icon: Home, label: 'Property', labelRu: 'Жильё', path: '/property', accentColor: '#00D68F' },
  { id: 'education', icon: GraduationCap, label: 'Education', labelRu: 'Обучение', path: '/education', accentColor: '#F59E0B' },
  { id: 'medical', icon: Stethoscope, label: 'Medical', labelRu: 'Медицина', path: '/medical', accentColor: '#F43F5E' },
  { id: 'legal', icon: Scale, label: 'Legal', labelRu: 'Юрист', path: '/legal', accentColor: '#A855F7' },
  { id: 'insurance', icon: Shield, label: 'Insurance', labelRu: 'Страховка', path: '/insurance', accentColor: '#06B6D4' },
  { id: 'banking', icon: Banknote, label: 'Banking', labelRu: 'Банки', path: '/banking', accentColor: '#00D68F' },
];

const OWNER_ACTIONS: QuickAction[] = [
  { id: 'my-properties', icon: Key, label: 'My Properties', labelRu: 'Мои объекты', path: '/owner', accentColor: '#00D68F' },
  { id: 'owner-crm', icon: Users, label: 'CRM', labelRu: 'CRM', path: '/mc/crm-dashboard', accentColor: '#4E7BFF', requiresFullAccess: true },
  { id: 'owner-calendar', icon: Calendar, label: 'Calendar', labelRu: 'Календарь', path: '/mc/calendar', accentColor: '#06B6D4', requiresFullAccess: true },
  { id: 'owner-finance', icon: BarChart3, label: 'Finance', labelRu: 'Финансы', path: '/mc/finance', accentColor: '#00D68F', requiresFullAccess: true },
  { id: 'owner-tasks', icon: ClipboardList, label: 'Tasks', labelRu: 'Задачи', path: '/mc/tasks', accentColor: '#F59E0B', requiresFullAccess: true },
  { id: 'cleaning', icon: Sparkles, label: 'Cleaning', labelRu: 'Клининг', path: '/cleaning', accentColor: '#06B6D4' },
  { id: 'services', icon: Wrench, label: 'Services', labelRu: 'Сервис', path: '/services', accentColor: '#F59E0B' },
];

const INVESTOR_ACTIONS: QuickAction[] = [
  { id: 'invest', icon: TrendingUp, label: 'Investment', labelRu: 'Инвестиции', path: '/invest', accentColor: '#00D68F' },
  { id: 'offplan', icon: Building2, label: 'Off-Plan', labelRu: 'Новостройки', path: '/offplan', accentColor: '#06B6D4' },
  { id: 'property-buy', icon: Building, label: 'Buy Property', labelRu: 'Купить', path: '/property?mode=buy', accentColor: '#A855F7' },
  { id: 'legal', icon: Scale, label: 'Legal', labelRu: 'Юрист', path: '/legal', accentColor: '#F59E0B' },
  { id: 'banking', icon: Briefcase, label: 'Banking', labelRu: 'Банкинг', path: '/banking', accentColor: '#4E7BFF' },
  { id: 'insurance', icon: Shield, label: 'Insurance', labelRu: 'Страховка', path: '/insurance', accentColor: '#06B6D4' },
];

const VENDOR_ACTIONS: QuickAction[] = [
  { id: 'vendor-dashboard', icon: Building2, label: 'Dashboard', labelRu: 'Панель', path: '/vendor', accentColor: '#4E7BFF' },
  { id: 'vendor-orders', icon: ShoppingBag, label: 'Orders', labelRu: 'Заказы', path: '/vendor/orders', accentColor: '#F59E0B' },
  { id: 'vendor-services', icon: Wrench, label: 'Services', labelRu: 'Услуги', path: '/vendor/services', accentColor: '#F59E0B' },
  { id: 'vendor-calendar', icon: Calendar, label: 'Calendar', labelRu: 'Календарь', path: '/vendor/calendar', accentColor: '#06B6D4' },
  { id: 'market', icon: ShoppingBag, label: 'Market', labelRu: 'Маркет', path: '/market', accentColor: '#F43F5E' },
  { id: 'banking', icon: Banknote, label: 'Banking', labelRu: 'Банкинг', path: '/banking', accentColor: '#00D68F' },
];

const ADMIN_ACTIONS: QuickAction[] = [
  { id: 'admin-dashboard', icon: Shield, label: 'Admin', labelRu: 'Админ', path: '/admin', accentColor: '#4E7BFF' },
  { id: 'team-dashboard', icon: Building2, label: 'Team', labelRu: 'Команда', path: '/team', accentColor: '#06B6D4' },
  { id: 'services', icon: Wrench, label: 'Services', labelRu: 'Сервисы', path: '/services', accentColor: '#F59E0B' },
  { id: 'property', icon: Home, label: 'Property', labelRu: 'Жильё', path: '/property', accentColor: '#00D68F' },
  { id: 'market', icon: ShoppingBag, label: 'Market', labelRu: 'Маркет', path: '/market', accentColor: '#F43F5E' },
  { id: 'legal', icon: Scale, label: 'Legal', labelRu: 'Юрист', path: '/legal', accentColor: '#A855F7' },
];

const getMoreAction = (contentMode: 'services' | 'products'): QuickAction => ({
  id: 'more', icon: MoreHorizontal, label: 'More', labelRu: 'Ещё',
  path: contentMode === 'products' ? '/market' : '/discover',
  accentColor: '#7A8FA6',
});

const DEFAULT_ACTIONS: QuickAction[] = [
  { id: 'property', icon: Home, label: 'Property', labelRu: 'Жильё', path: '/property', accentColor: '#00D68F' },
  { id: 'transfer', icon: Plane, label: 'Transfer', labelRu: 'Трансфер', path: '/transport/airport-transfer', accentColor: '#4E7BFF' },
  { id: 'flowers', icon: Flower2, label: 'Flowers', labelRu: 'Цветы', path: '/flowers', accentColor: '#F43F5E' },
  { id: 'transport', icon: Car, label: 'Transport', labelRu: 'Транспорт', path: '/transport', accentColor: '#F59E0B' },
  { id: 'experiences', icon: Compass, label: 'Experiences', labelRu: 'Впечатления', path: '/experiences', accentColor: '#A855F7' },
  { id: 'restaurants', icon: Utensils, label: 'Food', labelRu: 'Еда', path: '/restaurants', accentColor: '#F59E0B' },
  { id: 'beauty', icon: Sparkles, label: 'Beauty', labelRu: 'Красота', path: '/beauty', accentColor: '#F43F5E' },
  { id: 'medical', icon: Stethoscope, label: 'Medical', labelRu: 'Медицина', path: '/medical', accentColor: '#06B6D4' },
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

  const quickActions = useMemo(() => {
    let userActions: QuickAction[];
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

  const actionsKey = useMemo(() => quickActions.map(a => a.id).join(','), [quickActions]);

  return (
    <motion.div
      key={actionsKey}
      className="grid grid-cols-4 gap-3 lg:flex lg:items-start lg:justify-evenly lg:gap-4"
      variants={staggerContainerVariants}
      initial="initial"
      animate="animate"
    >
      {quickActions.map((action) => {
        const Icon = action.icon;
        const label = language === 'ru' ? action.labelRu : action.label;
        const color = action.accentColor || '#00D68F';
        const isLocked = action.requiresFullAccess && !hasFullAccess;
        
        return (
          <motion.button
            key={action.id}
            variants={staggerItemVariants}
            onClick={(e) => handleClick(action, e)}
            onMouseEnter={() => handlePrefetch(action.path)}
            onTouchStart={() => handlePrefetch(action.path)}
            className={cn(
              "relative flex flex-col items-center gap-2 p-2 rounded-[var(--radius-md)]",
              "transition-all group active:scale-[0.95]",
              "lg:px-5 lg:py-3",
              isLocked && "opacity-50",
            )}
          >
            {/* Icon container */}
            <div 
              className="relative w-14 h-14 lg:w-16 lg:h-16 rounded-[var(--radius-md)] flex items-center justify-center transition-transform duration-200 group-hover:scale-105 group-active:scale-95"
              style={{
                background: color + '1A',
                border: `1px solid ${color}20`,
              }}
            >
              <Icon 
                className="lg:!w-7 lg:!h-7 drop-shadow-sm"
                style={{ width: 24, height: 24, color }}
                strokeWidth={2}
              />
              {isLocked && (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ background: 'hsl(var(--muted))', border: '2px solid hsl(var(--background))' }}
                >
                  <Lock className="w-2.5 h-2.5 text-muted-foreground" />
                </div>
              )}
            </div>
            
            <span className="text-[11px] lg:text-[13px] font-semibold text-center leading-tight text-foreground">
              {label}
            </span>
          </motion.button>
        );
      })}
    </motion.div>
  );
});
