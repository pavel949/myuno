import React, { memo } from 'react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  SUPPORTED_LANGUAGES,
  MACHINE_TRANSLATION,
  normalizeLanguages,
  getLanguageInfo,
} from '@/lib/languageConfig';

export type LanguageIndicatorVariant = 'compact' | 'full' | 'minimal';

export interface LanguageIndicatorProps {
  /** Array of language codes (will be normalized) */
  languages: string[];
  /** Show machine translation indicator */
  hasMachineTranslation?: boolean;
  /** Display variant */
  variant?: LanguageIndicatorVariant;
  /** Max languages to display before showing +N */
  maxDisplay?: number;
  /** Additional className */
  className?: string;
}

/**
 * Unified language indicator component
 * Displays languages supported by a provider/service
 */
export const LanguageIndicator = memo(function LanguageIndicator({
  languages,
  hasMachineTranslation = false,
  variant = 'compact',
  maxDisplay = 3,
  className,
}: LanguageIndicatorProps) {
  const { language: appLanguage } = useLanguage();
  
  // Normalize and filter valid languages
  const normalizedLanguages = normalizeLanguages(languages);
  
  if (normalizedLanguages.length === 0 && !hasMachineTranslation) {
    return null;
  }
  
  const displayLanguages = normalizedLanguages.slice(0, maxDisplay);
  const remainingCount = normalizedLanguages.length - maxDisplay;
  
  if (variant === 'minimal') {
    return (
      <div className={cn('flex items-center gap-0.5', className)}>
        {displayLanguages.map(code => {
          const info = getLanguageInfo(code);
          if (!info) return null;
          return (
            <span key={code} className="text-sm" title={appLanguage === 'ru' ? info.nameRu : info.nameEn}>
              {info.flag}
            </span>
          );
        })}
        {hasMachineTranslation && (
          <span className="text-sm" title={appLanguage === 'ru' ? MACHINE_TRANSLATION.nameRu : MACHINE_TRANSLATION.nameEn}>
            {MACHINE_TRANSLATION.flag}
          </span>
        )}
        {remainingCount > 0 && (
          <span className="text-[10px] text-muted-foreground">+{remainingCount}</span>
        )}
      </div>
    );
  }
  
  if (variant === 'full') {
    return (
      <div className={cn('flex flex-wrap items-center gap-2', className)}>
        {displayLanguages.map((code, index) => {
          const info = getLanguageInfo(code);
          if (!info) return null;
          return (
            <React.Fragment key={code}>
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <span>{info.flag}</span>
                <span>{appLanguage === 'ru' ? info.nameRu : info.nameEn}</span>
              </span>
              {index < displayLanguages.length - 1 && (
                <span className="text-muted-foreground/50">·</span>
              )}
            </React.Fragment>
          );
        })}
        {hasMachineTranslation && (
          <>
            {displayLanguages.length > 0 && <span className="text-muted-foreground/50">·</span>}
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <span>{MACHINE_TRANSLATION.flag}</span>
              <span>{appLanguage === 'ru' ? MACHINE_TRANSLATION.nameRu : MACHINE_TRANSLATION.nameEn}</span>
            </span>
          </>
        )}
        {remainingCount > 0 && (
          <span className="text-xs text-muted-foreground">+{remainingCount}</span>
        )}
      </div>
    );
  }
  
  // Default: compact variant
  return (
    <div className={cn('flex flex-wrap items-center gap-1', className)}>
      {displayLanguages.map(code => {
        const info = getLanguageInfo(code);
        if (!info) return null;
        return (
          <LanguageBadge
            key={code}
            flag={info.flag}
            code={info.code.toUpperCase()}
            color={info.color}
            title={appLanguage === 'ru' ? info.nameRu : info.nameEn}
          />
        );
      })}
      {hasMachineTranslation && (
        <LanguageBadge
          flag={MACHINE_TRANSLATION.flag}
          code="MT"
          color={MACHINE_TRANSLATION.color}
          title={appLanguage === 'ru' ? MACHINE_TRANSLATION.nameRu : MACHINE_TRANSLATION.nameEn}
        />
      )}
      {remainingCount > 0 && (
        <span className="text-[10px] px-1 py-0.5 rounded-none bg-muted text-muted-foreground">
          +{remainingCount}
        </span>
      )}
    </div>
  );
});

interface LanguageBadgeProps {
  flag: string;
  code: string;
  color: string;
  title: string;
}

const LanguageBadge = memo(function LanguageBadge({ flag, code, color, title }: LanguageBadgeProps) {
  // Map color to semantic background classes
  const colorClasses: Record<string, string> = {
    blue: 'bg-info/10 text-info',
    red: 'bg-destructive/10 text-destructive',
    purple: 'bg-accent-purple/10 text-accent-purple',
    amber: 'bg-warning/10 text-warning',
    emerald: 'bg-success/10 text-success',
    pink: 'bg-accent-coral/10 text-accent-coral',
    yellow: 'bg-warning/10 text-warning',
    indigo: 'bg-primary/10 text-primary',
    orange: 'bg-accent-amber/10 text-accent-amber',
    green: 'bg-success/10 text-success',
    rose: 'bg-accent-coral/10 text-accent-coral',
    gray: 'bg-muted text-muted-foreground',
  };
  
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-none text-[10px] font-medium',
        colorClasses[color] || colorClasses.gray
      )}
      title={title}
    >
      <span>{flag}</span>
      <span>{code}</span>
    </span>
  );
});

export default LanguageIndicator;
