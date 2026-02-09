/**
 * LifeSituationGate — P0.2 Enforcement
 * Blocks access to vertical routes without active Life Situation context.
 * Shows life situation selection with "I know what I need" bypass.
 */
import React, { memo } from 'react';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLifeSituationContext } from '@/contexts/LifeSituationContext';
import { useLifeSituations } from '@/hooks/useLifeOS';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Compass, ArrowRight, HelpCircle } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface LifeSituationGateProps {
  /** Content to render when a life situation is active */
  children: React.ReactNode;
  /** Optional: allow bypass with "I know what I need" */
  allowBypass?: boolean;
}

export const LifeSituationGate = memo(function LifeSituationGate({
  children,
  allowBypass = true,
}: LifeSituationGateProps) {
  const { activeCode } = useLifeSituationContext();

  // If context is active, render children
  if (activeCode) {
    return <>{children}</>;
  }

  return <LifeSituationSelector allowBypass={allowBypass} />;
});

/** Full-screen life situation selector shown when no context is active */
const LifeSituationSelector = memo(function LifeSituationSelector({
  allowBypass,
}: {
  allowBypass: boolean;
}) {
  const { language } = useLanguage();
  const location = useLocation();
  const { setLifeSituation } = useLifeSituationContext();
  const { data: situations, isLoading } = useLifeSituations();
  const isRu = language === 'ru';

  const getIcon = (iconName: string): LucideIcon => {
    const icons = LucideIcons as unknown as Record<string, LucideIcon>;
    return icons[iconName] || Compass;
  };

  const handleSelect = (situation: {
    code: string;
    title_en: string;
    title_ru: string;
    color: string;
  }) => {
    const title = isRu ? situation.title_ru : situation.title_en;
    setLifeSituation(situation.code, title, situation.color);
    // Stay on current page — context is now set, children will render
  };

  const handleBypass = () => {
    // Set a generic "browsing" context to allow access
    setLifeSituation('browsing', isRu ? 'Свободный поиск' : 'Free browsing', 'hsl(var(--primary))');
  };

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-6 text-center"
      >
        {/* Icon */}
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
          <Compass className="w-8 h-8 text-primary" />
        </div>

        {/* Heading */}
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-foreground">
            {isRu ? 'Что происходит в вашей жизни?' : 'What\'s happening in your life?'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {isRu
              ? 'Выберите ситуацию — мы покажем именно то, что вам нужно'
              : 'Choose a situation — we\'ll show exactly what you need'}
          </p>
        </div>

        {/* Situations grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {situations?.slice(0, 8).map((situation) => {
              const Icon = getIcon(situation.icon);
              return (
                <motion.button
                  key={situation.id}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleSelect(situation)}
                  className={cn(
                    "flex flex-col items-center justify-center gap-2 p-4 rounded-xl border",
                    "bg-card hover:shadow-md transition-all duration-200",
                    "text-center"
                  )}
                  style={{
                    borderColor: `${situation.color}30`,
                  }}
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${situation.color}15` }}
                  >
                    <Icon className="w-6 h-6" style={{ color: situation.color }} />
                  </div>
                  <span className="text-xs font-medium leading-tight line-clamp-2">
                    {isRu ? situation.title_ru : situation.title_en}
                  </span>
                </motion.button>
              );
            })}
          </div>
        )}

        {/* Bypass option */}
        {allowBypass && (
          <div className="pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBypass}
              className="text-muted-foreground hover:text-foreground text-xs gap-1.5"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              {isRu ? 'Я знаю, что мне нужно' : 'I know exactly what I need'}
              <ArrowRight className="w-3 h-3" />
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
});

export default LifeSituationGate;
