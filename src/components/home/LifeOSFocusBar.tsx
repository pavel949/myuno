/**
 * LifeOS Focus Bar - Contextual active route on Home screen
 * Shows the most relevant route as a calm, decisive banner
 * Philosophy: "Here's what you need right now" — not a menu
 */
import React, { memo, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLifeSituations } from '@/hooks/useLifeOS';
import { useLifeSituationContext } from '@/contexts/LifeSituationContext';
import { useLifeOSRoute } from '@/hooks/useLifeOSRoutes';
import { useUserPersonas, type UserPersona } from '@/hooks/useUserPersonas';
import { cn } from '@/lib/utils';
import * as LucideIcons from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// Map persona to preferred situation code
const PERSONA_SITUATION_MAP: Record<UserPersona, string> = {
  tourist: 'arrival',
  resident: 'living',
  property_owner: 'property',
  investor: 'property',
};

interface LifeOSFocusBarProps {
  className?: string;
}

export const LifeOSFocusBar = memo(function LifeOSFocusBar({ className }: LifeOSFocusBarProps) {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isRu = language === 'ru';
  const { data: situations } = useLifeSituations();
  const { activeCode } = useLifeSituationContext();
  const { personas } = useUserPersonas();

  // Resolve best situation: activeCode > persona-based > first by priority
  const topSituation = useMemo(() => {
    if (!situations || situations.length === 0) return null;
    
    // 1. If user has an active context, use it
    if (activeCode) {
      return situations.find(s => s.code === activeCode) || null;
    }
    
    // 2. Match by persona
    const primaryPersona = personas[0];
    if (primaryPersona) {
      const preferredCode = PERSONA_SITUATION_MAP[primaryPersona];
      const match = situations.find(s => s.code === preferredCode);
      if (match) return match;
    }
    
    // 3. Default to first by priority
    return situations[0];
  }, [situations, activeCode, personas]);

  const { data: route } = useLifeOSRoute(topSituation?.id || null);

  const [dismissed, setDismissed] = React.useState(false);

  const getIcon = (iconName: string): LucideIcon => {
    const icons = LucideIcons as unknown as Record<string, LucideIcon>;
    return icons[iconName] || LucideIcons.Compass;
  };

  if (!topSituation || !route || dismissed) return null;

  const Icon = getIcon(topSituation.icon);
  const recognition = isRu ? route.recognition_ru : route.recognition_en;
  const ctaText = isRu ? route.cta_text_ru : route.cta_text_en;

  // Truncate recognition to first sentence for the bar
  const shortRecognition = recognition.split(/[.!?]/)[0] + '.';

  return (
    <AnimatePresence>
      <motion.div
        key="lifeos-focus-bar"
        initial={{ opacity: 0, y: -8, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.98 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className={cn("relative", className)}
      >
        <button
          onClick={() => navigate(`/life-flow/${topSituation.code}`)}
          className={cn(
            "w-full text-left rounded-2xl overflow-hidden",
            "border transition-all duration-200",
            "hover:shadow-md hover:-translate-y-0.5 group",
            "bg-card"
          )}
          style={{
            borderColor: `${topSituation.color}30`,
          }}
        >
          {/* Accent gradient strip */}
          <div
            className="h-1 w-full"
            style={{
              background: `linear-gradient(90deg, ${topSituation.color}, ${topSituation.color}60)`,
            }}
          />

          <div className="p-3.5 lg:p-5 flex items-start gap-3">
            {/* Icon */}
            <div
              className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center shrink-0"
              style={{
                background: `linear-gradient(135deg, ${topSituation.color}25, ${topSituation.color}10)`,
              }}
            >
              <Icon className="w-5 h-5" style={{ color: topSituation.color }} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                {isRu ? 'Следующий шаг' : 'Your next step'}
              </p>
              <p className="text-[13px] lg:text-[15px] font-medium leading-snug line-clamp-2">
                {shortRecognition}
              </p>
              <span
                className="inline-flex items-center gap-1 text-xs lg:text-sm font-semibold mt-1"
                style={{ color: topSituation.color }}
              >
                {ctaText}
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
          </div>
        </button>

        {/* Dismiss */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setDismissed(true);
          }}
          className="absolute top-3 right-3 p-1 rounded-full bg-muted/80 hover:bg-muted text-muted-foreground transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
});
