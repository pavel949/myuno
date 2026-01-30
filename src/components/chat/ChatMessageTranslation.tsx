import React, { useState, useCallback } from 'react';
import { Globe, Loader2, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAutoTranslate } from '@/hooks/useAutoTranslate';
import { cn } from '@/lib/utils';

interface ChatMessageTranslationProps {
  messageId: string;
  originalText: string;
  className?: string;
}

const TRANSLATION_CACHE_PREFIX = 'chat-translation-';

export const ChatMessageTranslation: React.FC<ChatMessageTranslationProps> = ({
  messageId,
  originalText,
  className,
}) => {
  const { language } = useLanguage();
  const { translate, isTranslating } = useAutoTranslate();
  const isRu = language === 'ru';
  
  // Get target language based on user's interface language
  const targetLang = language === 'ru' ? 'ru' : 'en';
  
  const [translation, setTranslation] = useState<string | null>(() => {
    // Check cache on mount
    const cached = localStorage.getItem(`${TRANSLATION_CACHE_PREFIX}${messageId}-${targetLang}`);
    return cached || null;
  });
  const [showTranslation, setShowTranslation] = useState(!!translation);
  const [error, setError] = useState(false);

  const handleTranslate = useCallback(async () => {
    if (translation) {
      setShowTranslation(!showTranslation);
      return;
    }

    setError(false);
    const result = await translate(originalText, targetLang);
    
    if (result.success && result.translated) {
      setTranslation(result.translated);
      setShowTranslation(true);
      // Cache the translation
      localStorage.setItem(`${TRANSLATION_CACHE_PREFIX}${messageId}-${targetLang}`, result.translated);
    } else {
      setError(true);
    }
  }, [translation, showTranslation, translate, originalText, targetLang, messageId]);

  // Don't show translate button if text is very short or already in target language
  if (originalText.length < 5) return null;

  // Simple language detection heuristics
  const hasRussian = /[а-яА-ЯёЁ]/.test(originalText);
  const hasThai = /[\u0E00-\u0E7F]/.test(originalText);
  const isLikelyEnglish = !hasRussian && !hasThai && /[a-zA-Z]/.test(originalText);
  
  // Skip if message is already in user's language
  if (targetLang === 'ru' && hasRussian && !hasThai) return null;
  if (targetLang === 'en' && isLikelyEnglish && !hasRussian && !hasThai) return null;

  return (
    <div className={cn("mt-1.5", className)}>
      {!showTranslation ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleTranslate}
          disabled={isTranslating}
          className="h-6 px-2 py-0 text-xs text-muted-foreground hover:text-primary gap-1"
        >
          {isTranslating ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin" />
              {isRu ? 'Перевожу...' : 'Translating...'}
            </>
          ) : error ? (
            <>
              <Globe className="w-3 h-3" />
              {isRu ? 'Ошибка. Попробовать ещё?' : 'Error. Try again?'}
            </>
          ) : (
            <>
              <Globe className="w-3 h-3" />
              {isRu ? 'Перевести' : 'Translate'}
            </>
          )}
        </Button>
      ) : (
        <div className="space-y-1">
          <div className="flex items-start gap-2 p-2 rounded-lg bg-muted/50 border border-border/50">
            <Check className="w-3 h-3 text-primary mt-0.5 flex-shrink-0" />
            <p className="text-xs text-foreground/90 whitespace-pre-wrap break-words">
              {translation}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowTranslation(false)}
            className="h-5 px-2 py-0 text-[10px] text-muted-foreground hover:text-primary gap-0.5"
          >
            <ChevronUp className="w-3 h-3" />
            {isRu ? 'Скрыть перевод' : 'Hide translation'}
          </Button>
        </div>
      )}
    </div>
  );
};

export default ChatMessageTranslation;
