/**
 * QuickActionsGrid — mobile 2x2 compact + secondary pills row; grouped rows for investor/business primary persona.
 */
import React, { useCallback, memo, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { staggerContainerVariants, staggerItemVariants } from '@/lib/motionPresets';
import { Lock, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUserPersonas } from '@/hooks/useUserPersonas';
import { useUserContext, type AppRole } from '@/hooks/useUserContext';
import { useOwnerAccess } from '@/hooks/useOwnerAccess';
import { useIsDesktop } from '@/hooks/use-desktop';
import { cn } from '@/lib/utils';
import { triggerRipple } from '@/hooks/useRipple';
import { triggerHaptic } from '@/hooks/useHapticFeedback';
import { playSound } from '@/hooks/useSoundEffects';
import { getFeedbackSettings } from '@/hooks/useFeedbackSettings';
import { prefetchRoute } from '@/lib/routePrefetch';
import { toast } from 'sonner';
import {
  selectActionsForPersonas,
  getMoreAction,
  GROUP_LABELS,
  DEFAULT_ACTIONS,
  OWNER_ACTIONS,
  VENDOR_ACTIONS,
  ADMIN_ACTIONS,
  type CatalogQuickAction,
} from '@/lib/home/quickActionsCatalog';

function getActionsForRole(role: AppRole): CatalogQuickAction[] {
  switch (role) {
    case 'owner':
      return OWNER_ACTIONS;
    case 'vendor':
      return VENDOR_ACTIONS;
    case 'admin':
    case 'staff':
    case 'uno_team':
      return ADMIN_ACTIONS;
    default:
      return DEFAULT_ACTIONS;
  }
}

interface QuickActionsGridProps {
  contentMode?: 'services' | 'products';
}

export const QuickActionsGrid = memo(function QuickActionsGrid({
  contentMode = 'services',
}: QuickActionsGridProps) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const isDesktop = useIsDesktop();

  const { personas, isLoading: personasLoading } = useUserPersonas();
  const { activeRole, isLoading: roleLoading } = useUserContext();
  const { hasFullAccess } = useOwnerAccess();
  const queryClient = useQueryClient();

  const selection = useMemo(() => {
    if (personasLoading) return null;
    return selectActionsForPersonas(personas);
  }, [personas, personasLoading]);

  const quickActions = useMemo(() => {
    let userActions: CatalogQuickAction[];
    if (selection) {
      userActions = selection.actions;
    } else if (!roleLoading && activeRole && activeRole !== 'user') {
      userActions = getActionsForRole(activeRole).slice(0, 7);
    } else {
      userActions = DEFAULT_ACTIONS.slice(0, 7);
    }
    const moreAction = getMoreAction(contentMode);
    return [...userActions, moreAction];
  }, [activeRole, roleLoading, contentMode, selection]);

  const showGroupedLayout = selection?.showGroupedLayout ?? false;
  const groupedSections = selection?.groupedSections ?? null;

  const handleClick = useCallback(
    (action: CatalogQuickAction, e: React.MouseEvent<HTMLButtonElement>) => {
      triggerRipple(e);
      const settings = getFeedbackSettings();
      if (settings.hapticEnabled) triggerHaptic(action.isUrgent ? 'medium' : 'light');
      if (settings.soundEnabled) playSound('click');

      if (action.requiresFullAccess && !hasFullAccess) {
        toast.error(
          isRu
            ? 'Доступно после верификации УК и добавления объекта'
            : 'Available after MC verification and adding a property',
          { duration: 4000 },
        );
        return;
      }

      navigate(action.path);
    },
    [navigate, hasFullAccess, isRu],
  );

  const handlePrefetch = useCallback(
    (path: string) => {
      prefetchRoute(path, queryClient);
    },
    [queryClient],
  );

  const actionsKey = useMemo(() => quickActions.map((a) => a.id).join(','), [quickActions]);

  const primaryActions = quickActions.slice(0, 4);
  const secondaryActions = quickActions.slice(4);

  const renderDesktopTile = (action: CatalogQuickAction) => {
    const Icon = action.icon;
    const label = isRu ? action.labelRu : action.label;
    const color = action.accentColor || '#00D68F';
    const isLocked = action.requiresFullAccess && !hasFullAccess;
    return (
      <motion.button
        key={action.id}
        variants={staggerItemVariants}
        onClick={(e) => handleClick(action, e)}
        onMouseEnter={() => handlePrefetch(action.path)}
        className={cn(
          'relative flex flex-col items-center gap-2 p-2 rounded-[var(--radius-md)]',
          'transition-all group active:scale-[0.95] lg:px-5 lg:py-3',
          isLocked && 'opacity-50',
        )}
      >
        <div
          className="relative w-16 h-16 rounded-[var(--radius-md)] flex items-center justify-center transition-transform duration-200 group-hover:scale-105 group-active:scale-95"
          style={{ background: `${color}1A`, border: `1px solid ${color}20` }}
        >
          <Icon className="!w-7 !h-7 drop-shadow-sm" style={{ width: 28, height: 28, color }} strokeWidth={2} />
          {isLocked && (
            <div
              className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
              style={{ background: 'hsl(var(--muted))', border: '2px solid hsl(var(--background))' }}
            >
              <Lock className="w-2.5 h-2.5 text-muted-foreground" />
            </div>
          )}
        </div>
        <span className="text-[11px] font-semibold text-center leading-tight text-foreground line-clamp-2 w-full">
          {label}
        </span>
      </motion.button>
    );
  };

  const renderMobileCard = (action: CatalogQuickAction, i: number) => {
    const Icon = action.icon;
    const label = isRu ? action.labelRu : action.label;
    const color = action.accentColor || '#00D68F';
    const isLocked = action.requiresFullAccess && !hasFullAccess;
    const animClass = `anim-qa-${i + 1}`;
    return (
      <button
        key={action.id}
        onClick={(e) => handleClick(action, e)}
        onTouchStart={() => handlePrefetch(action.path)}
        aria-label={label}
        aria-disabled={isLocked || undefined}
        className={cn(
          animClass,
          'relative flex items-center gap-3 p-3 rounded-[var(--radius-md)] min-h-[64px] text-left bg-card border border-border shadow-[var(--shadow-card)]',
          'transition-all duration-150 active:scale-[0.97]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          isLocked && 'opacity-50',
        )}
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: `${color}1A` }}
        >
          <Icon style={{ width: 20, height: 20, color }} strokeWidth={2} />
        </div>
        <span className="flex-1 min-w-0 text-[13px] font-semibold text-foreground leading-tight line-clamp-2">
          {label}
        </span>
        {isLocked ? (
          <Lock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-muted-foreground/60 shrink-0" />
        )}
      </button>
    );
  };

  const renderPill = (action: CatalogQuickAction) => {
    const Icon = action.icon;
    const color = action.accentColor || '#00D68F';
    return (
      <button
        key={action.id}
        onClick={(e) => handleClick(action, e)}
        onTouchStart={() => handlePrefetch(action.path)}
        aria-label={isRu ? action.labelRu : action.label}
        className="flex items-center gap-2 h-11 px-3.5 rounded-[var(--radius-full)] shrink-0 snap-start whitespace-nowrap transition-all active:scale-[0.95] bg-[hsl(var(--bg-elevated))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <Icon style={{ width: 16, height: 16, color }} strokeWidth={2} aria-hidden />
        <span className="text-[11px] font-medium text-muted-foreground">{isRu ? action.labelRu : action.label}</span>
      </button>
    );
  };

  if (showGroupedLayout && groupedSections) {
    const moreAction = quickActions[quickActions.length - 1];
    const sectionKeys = groupedSections.map((s) => s.groupId).join('-');

    return (
      <div className="space-y-4">
        <div key={`${actionsKey}-${sectionKeys}`} className="space-y-4">
          {groupedSections.map((section, sectionIdx) => {
            const label = isRu ? GROUP_LABELS[section.groupId].ru : GROUP_LABELS[section.groupId].en;
            let offset = 0;
            for (let s = 0; s < sectionIdx; s += 1) {
              offset += groupedSections[s].actions.length;
            }
            return (
              <div key={section.groupId} className="space-y-1.5">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground px-0.5">{label}</p>
                <motion.div
                  className={cn('grid gap-3', isDesktop ? 'grid-cols-4' : 'grid-cols-2')}
                  variants={staggerContainerVariants}
                  initial="initial"
                  animate="animate"
                >
                  {section.actions.map((action, i) =>
                    isDesktop ? renderDesktopTile(action) : renderMobileCard(action, offset + i),
                  )}
                </motion.div>
              </div>
            );
          })}
        </div>

        {isDesktop ? (
          <motion.div
            key={`more-${moreAction.id}`}
            className="grid gap-3 grid-cols-4 lg:grid-cols-8 pt-1 border-t border-border/40"
            variants={staggerContainerVariants}
            initial="initial"
            animate="animate"
          >
            {renderDesktopTile(moreAction)}
          </motion.div>
        ) : (
          <div className="flex gap-2 overflow-x-auto scrollbar-hide snap-x snap-mandatory -mx-4 px-4 pt-1">
            {renderPill(moreAction)}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <motion.div
        key={actionsKey}
        className={cn('grid gap-3', isDesktop ? 'grid-cols-4 lg:grid-cols-8' : 'grid-cols-2')}
        variants={staggerContainerVariants}
        initial="initial"
        animate="animate"
      >
        {(isDesktop ? quickActions : primaryActions).map((action, i) =>
          isDesktop ? renderDesktopTile(action) : renderMobileCard(action, i),
        )}
      </motion.div>

      {!isDesktop && secondaryActions.length > 0 && (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide snap-x snap-mandatory -mx-4 px-4">
          {secondaryActions.map((action) => renderPill(action))}
        </div>
      )}
    </div>
  );
});
