import React from 'react';
import { cn } from '@/lib/utils';
import { getLeadTemperature, getTemperatureColor } from '@/hooks/useCrmLeadScoring';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useLanguage } from '@/contexts/LanguageContext';

interface Props {
  score: number;
  showNumber?: boolean;
  size?: 'sm' | 'md';
}

export function LeadScoreBadge({ score, showNumber = true, size = 'sm' }: Props) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const temp = getLeadTemperature(score);
  const style = getTemperatureColor(temp);

  const tempLabel = {
    hot: isRu ? 'Горячий' : 'Hot',
    warm: isRu ? 'Тёплый' : 'Warm',
    cold: isRu ? 'Холодный' : 'Cold',
  }[temp];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={cn(
            'inline-flex items-center gap-1 font-medium rounded-full',
            style.bg, style.text,
            size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-1',
          )}>
            {style.icon}
            {showNumber && <span>{score}</span>}
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tempLabel} — {isRu ? 'Скоринг' : 'Score'}: {score}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
