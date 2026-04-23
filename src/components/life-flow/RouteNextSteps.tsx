/**
 * RouteNextSteps - "After this, you may need..." continuity links
 * Links to next likely pain, not features
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLifeSituations } from '@/hooks/useLifeOS';
import { DynamicIcon } from '@/components/ui/dynamic-icon';

interface RouteNextStepsProps {
  nextRoutes: string[];
  labels: string[];
  currentLabel: string;
}

export function RouteNextSteps({ nextRoutes, labels, currentLabel }: RouteNextStepsProps) {
  const navigate = useNavigate();
  const { data: situations } = useLifeSituations();

  if (!nextRoutes.length) return null;


  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.55 }}
      className="space-y-3"
    >
      <div className="flex items-center gap-2">
        <div className="h-px flex-1 bg-border" />
        <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground px-2 whitespace-nowrap">
          {currentLabel}
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <div className="space-y-2">
        {nextRoutes.map((routeCode, i) => {
          const situation = situations?.find(s => s.code === routeCode);
          if (!situation) return null;

          return (
            <button
              key={routeCode}
              onClick={() => navigate(`/life/${routeCode}`)}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-none",
                "border bg-card hover:bg-accent/50 hover:border-primary/30",
                "transition-all duration-200 text-left group"
              )}
            >
              <div
                className="w-9 h-9 rounded-none flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${situation.color}15` }}
              >
                <DynamicIcon name={situation.icon} className="w-4.5 h-4.5" style={{ color: situation.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-tight">
                  {labels[i] || (situation.title_en)}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}
