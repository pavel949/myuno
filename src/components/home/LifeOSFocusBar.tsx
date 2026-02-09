/**
 * LifeOS Focus Bar - Contextual active route on Home screen
 * Shows the most relevant route as a calm, decisive banner
 * Philosophy: "Here's what you need right now" — not a menu
 */
import React, { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLifeSituations } from '@/hooks/useLifeOS';
import { useLifeOSRoute } from '@/hooks/useLifeOSRoutes';
import { cn } from '@/lib/utils';
import * as LucideIcons from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface LifeOSFocusBarProps {
  className?: string;
}

/**
 * For now, selects the highest-priority active situation.
 * Future: use geolocation, time-of-day, user history to auto-resolve.
 */
export const LifeOSFocusBar = memo(function LifeOSFocusBar({ className }: LifeOSFocusBarProps) {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isRu = language === 'ru';
  const { data: situations } = useLifeSituations();

  // Pick top-priority situation (lowest priority number = highest priority)
  const topSituation = situations?.[0];

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

          <div className="p-3.5 flex items-start gap-3">
            {/* Icon */}
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{
                background: `linear-gradient(135deg, ${topSituation.color}25, ${topSituation.color}10)`,
              }}
            >
              <Icon className="w-5 h-5" style={{ color: topSituation.color }} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                {isRu ? '🧭 Ваш маршрут' : '🧭 Your path'}
              </p>
              <p className="text-[13px] font-medium leading-snug line-clamp-2">
                {shortRecognition}
              </p>
              <span
                className="inline-flex items-center gap-1 text-xs font-semibold mt-1"
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
