import React from 'react';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useIntakeConfigs } from '@/hooks/useIntakeConfigs';
import { cn } from '@/lib/utils';
import { resolveIcon } from '@/lib/iconMap';

interface IntakeVerticalBadgeProps {
  verticalId: string;
  confidence?: number;
  size?: 'sm' | 'md';
}

export function IntakeVerticalBadge({ verticalId, confidence, size = 'md' }: IntakeVerticalBadgeProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { data: intakeConfigs } = useIntakeConfigs();
  
  const vertical = intakeConfigs?.find(v => v.id === verticalId);
  
  if (!vertical) {
    return (
      <Badge variant="outline" className="text-muted-foreground">
        {verticalId}
      </Badge>
    );
  }

  return (
    <Badge 
      variant="secondary"
      className={cn(
        "gap-1",
        size === 'sm' && "text-xs px-2 py-0.5"
      )}
    >
      {(() => { const Icon = resolveIcon(vertical.icon); return <Icon className="w-3.5 h-3.5" />; })()}
      <span>{isRu ? vertical.nameRu : vertical.nameEn}</span>
      {confidence !== undefined && (
        <span className="text-muted-foreground ml-1">
          {Math.round(confidence * 100)}%
        </span>
      )}
    </Badge>
  );
}
