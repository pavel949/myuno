/**
 * AITranslateButton - Universal AI translation button for bilingual forms
 * 
 * Features:
 * - One-click translation between RU/EN/TH
 * - Supports single field or batch translation
 * - Visual loading states
 * - Error handling with toast notifications
 */
import React, { useState } from 'react';
import { logger } from '@/lib/logger';
import { Button } from '@/components/ui/button';
import { Languages, Loader2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type SupportedLang = 'ru' | 'en' | 'th';

interface AITranslateButtonProps {
  /** Source text to translate */
  sourceText: string;
  /** Callback when translation is complete */
  onTranslate: (translatedText: string) => void;
  /** Target language (defaults to auto-detect based on source) */
  targetLang?: SupportedLang;
  /** Source language hint for auto-detection */
  sourceLang?: SupportedLang;
  /** Button size variant */
  size?: 'sm' | 'default' | 'icon';
  /** Additional className */
  className?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Show language selector dropdown */
  showLangSelector?: boolean;
}

const LANG_LABELS: Record<SupportedLang, string> = {
  ru: 'RU',
  en: 'EN',
  th: 'TH',
};

const LANG_NAMES: Record<SupportedLang, string> = {
  ru: 'Русский',
  en: 'English',
  th: 'ไทย',
};

/**
 * Detect if text is primarily Russian (Cyrillic)
 */
function detectLanguage(text: string): SupportedLang {
  const cyrillicCount = (text.match(/[а-яё]/gi) || []).length;
  const latinCount = (text.match(/[a-z]/gi) || []).length;
  const thaiCount = (text.match(/[\u0E00-\u0E7F]/g) || []).length;
  
  if (thaiCount > cyrillicCount && thaiCount > latinCount) return 'th';
  if (cyrillicCount > latinCount) return 'ru';
  return 'en';
}

export function AITranslateButton({
  sourceText,
  onTranslate,
  targetLang,
  sourceLang,
  size = 'icon',
  className,
  disabled,
  showLangSelector = false,
}: AITranslateButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLang, setSelectedLang] = useState<SupportedLang | null>(null);

  const handleTranslate = async (lang?: SupportedLang) => {
    if (!sourceText?.trim()) {
      toast.error('Введите текст для перевода');
      return;
    }

    setIsLoading(true);
    
    try {
      // Auto-detect source language if not provided
      const detectedSource = sourceLang || detectLanguage(sourceText);
      
      // Determine target language
      let target = lang || targetLang || selectedLang;
      if (!target) {
        // Auto-select opposite language
        target = detectedSource === 'ru' ? 'en' : 'ru';
      }

      const { data, error } = await supabase.functions.invoke('ai-translate', {
        body: { text: sourceText, targetLang: target },
      });

      if (error) throw error;
      
      if (data?.translated) {
        onTranslate(data.translated);
        toast.success(`Переведено на ${LANG_NAMES[target]}`);
      } else if (data?.error) {
        throw new Error(data.error);
      }
    } catch (error) {
      logger.error('Translation error:', error);
      const message = error instanceof Error ? error.message : 'Ошибка перевода';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const buttonContent = (
    <>
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Languages className="h-4 w-4" />
      )}
      {size !== 'icon' && <span className="ml-1">AI</span>}
    </>
  );

  if (showLangSelector) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size={size}
            className={cn('text-muted-foreground hover:text-primary', className)}
            disabled={disabled || isLoading || !sourceText?.trim()}
          >
            {buttonContent}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-popover z-50">
          {(['ru', 'en', 'th'] as SupportedLang[]).map((lang) => (
            <DropdownMenuItem
              key={lang}
              onClick={() => handleTranslate(lang)}
              className="cursor-pointer"
            >
              <Sparkles className="h-3 w-3 mr-2 text-primary" />
              Перевести на {LANG_NAMES[lang]}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size={size}
            className={cn('text-muted-foreground hover:text-primary', className)}
            disabled={disabled || isLoading || !sourceText?.trim()}
            onClick={() => handleTranslate()}
          >
            {buttonContent}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>AI перевод</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * BilingualFieldWithAI - Input field with integrated AI translation
 */
interface BilingualFieldWithAIProps {
  /** Label for the field */
  label: string;
  /** Value for primary language (usually RU) */
  valuePrimary: string;
  /** Value for secondary language (usually EN) */
  valueSecondary: string;
  /** Callback when primary value changes */
  onChangePrimary: (value: string) => void;
  /** Callback when secondary value changes */
  onChangeSecondary: (value: string) => void;
  /** Primary language */
  primaryLang?: SupportedLang;
  /** Secondary language */
  secondaryLang?: SupportedLang;
  /** Placeholder for primary field */
  placeholderPrimary?: string;
  /** Placeholder for secondary field */
  placeholderSecondary?: string;
  /** Use textarea instead of input */
  multiline?: boolean;
  /** Required field */
  required?: boolean;
  /** Maximum length */
  maxLength?: number;
  /** Additional className */
  className?: string;
}

export function BilingualFieldWithAI({
  label,
  valuePrimary,
  valueSecondary,
  onChangePrimary,
  onChangeSecondary,
  primaryLang = 'ru',
  secondaryLang = 'en',
  placeholderPrimary,
  placeholderSecondary,
  multiline = false,
  required = false,
  maxLength,
  className,
}: BilingualFieldWithAIProps) {
  const InputComponent = multiline ? 'textarea' : 'input';
  
  return (
    <div className={cn('space-y-3', className)}>
      <label className="text-sm font-medium">
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      
      {/* Primary Language Field */}
      <div className="relative">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium text-muted-foreground uppercase">
            {LANG_LABELS[primaryLang]}
          </span>
          {valueSecondary && (
            <AITranslateButton
              sourceText={valueSecondary}
              sourceLang={secondaryLang}
              targetLang={primaryLang}
              onTranslate={onChangePrimary}
              size="icon"
              className="h-5 w-5"
            />
          )}
        </div>
        <InputComponent
          value={valuePrimary}
          onChange={(e) => onChangePrimary(e.target.value)}
          placeholder={placeholderPrimary || `Введите на ${LANG_NAMES[primaryLang]}`}
          maxLength={maxLength}
          className={cn(
            'w-full px-3 py-2 border rounded-lg bg-background',
            'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
            multiline && 'min-h-[100px] resize-y'
          )}
        />
      </div>
      
      {/* Secondary Language Field */}
      <div className="relative">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium text-muted-foreground uppercase">
            {LANG_LABELS[secondaryLang]}
          </span>
          {valuePrimary && (
            <AITranslateButton
              sourceText={valuePrimary}
              sourceLang={primaryLang}
              targetLang={secondaryLang}
              onTranslate={onChangeSecondary}
              size="icon"
              className="h-5 w-5"
            />
          )}
        </div>
        <InputComponent
          value={valueSecondary}
          onChange={(e) => onChangeSecondary(e.target.value)}
          placeholder={placeholderSecondary || `Enter in ${LANG_NAMES[secondaryLang]}`}
          maxLength={maxLength}
          className={cn(
            'w-full px-3 py-2 border rounded-lg bg-background',
            'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
            multiline && 'min-h-[100px] resize-y'
          )}
        />
      </div>
      
      {maxLength && (
        <p className="text-xs text-muted-foreground text-right">
          {Math.max(valuePrimary.length, valueSecondary.length)}/{maxLength}
        </p>
      )}
    </div>
  );
}

export default AITranslateButton;
