/**
 * Manual Mode Badge Component
 * Displays LifeOS operational mode indicator
 */
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGovernanceConfig } from '@/hooks/useLifeOSGovernance';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Lock, Zap, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ManualModeBadgeProps {
  className?: string;
}

export function ManualModeBadge({ className }: ManualModeBadgeProps) {
  const { language } = useLanguage();
  const isRussian = language === 'ru';
  const { data: config } = useGovernanceConfig();

  const mode = config?.LIFEOS_MODE || 'MANUAL';
  const aiMode = config?.AI_MODE || 'OFF';
  const autoMapping = config?.AUTO_MAPPING || 'OFF';

  const modeConfig = {
    MANUAL: {
      icon: Lock,
      color: 'bg-amber-500/10 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-400',
      label: isRussian ? 'Ручной режим' : 'Manual Mode',
      tooltip: isRussian 
        ? 'AI и авто-маппинг отключены. Все изменения вносятся вручную.'
        : 'AI and auto-mapping are disabled. All changes are manual.',
    },
    AUTO: {
      icon: Zap,
      color: 'bg-blue-500/10 text-blue-700 border-blue-200',
      label: isRussian ? 'Авто режим' : 'Auto Mode',
      tooltip: isRussian 
        ? 'Авто-маппинг включён.'
        : 'Auto-mapping is enabled.',
    },
    AI: {
      icon: Bot,
      color: 'bg-purple-500/10 text-purple-700 border-purple-200',
      label: isRussian ? 'AI режим' : 'AI Mode',
      tooltip: isRussian 
        ? 'AI-оркестрация включена.'
        : 'AI orchestration is enabled.',
    },
  };

  const currentMode = modeConfig[mode as keyof typeof modeConfig] || modeConfig.MANUAL;
  const Icon = currentMode.icon;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="outline" 
            className={cn(
              "gap-1.5 cursor-help font-medium",
              currentMode.color,
              className
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            {currentMode.label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <p>{currentMode.tooltip}</p>
          <div className="mt-2 pt-2 border-t border-border/50 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">AI:</span>
              <span className={aiMode === 'OFF' ? 'text-muted-foreground' : 'text-green-600'}>{aiMode}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Auto-mapping:</span>
              <span className={autoMapping === 'OFF' ? 'text-muted-foreground' : 'text-green-600'}>{autoMapping}</span>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
