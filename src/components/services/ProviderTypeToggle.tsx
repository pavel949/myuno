import React from 'react';
import { cn } from '@/lib/utils';
import { resolveIcon } from '@/lib/iconMap';
import { PROVIDER_TYPE_OPTIONS, type ProviderType } from '@/lib/taxonomies';
import { useLanguage } from '@/contexts/LanguageContext';

interface ProviderTypeToggleProps {
  selectedType: ProviderType | 'all';
  onTypeChange: (type: ProviderType | 'all') => void;
  className?: string;
}

export function ProviderTypeToggle({ selectedType, onTypeChange, className }: ProviderTypeToggleProps) {
  const { language } = useLanguage();

  return (
    <div className={cn("flex gap-1 p-1 bg-muted rounded-none", className)}>
      {PROVIDER_TYPE_OPTIONS.map((option) => {
        const isSelected = selectedType === option.id;
        const label = language === 'ru' ? option.labelRu : option.labelEn;
        
        return (
          <button
            key={option.id}
            onClick={() => onTypeChange(option.id as ProviderType | 'all')}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-none text-sm font-medium transition-all flex-1",
              isSelected
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {(() => { const Icon = resolveIcon(option.icon); return <Icon className="w-4 h-4" />; })()}
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
