import { useState, useCallback, useMemo, useRef, memo } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Languages, Loader2, Pencil, Check, X, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface TranslatableTextareaProps {
  label: string;
  value: string;
  translatedValue: string;
  onChange: (value: string) => void;
  onTranslatedChange: (value: string) => void;
  placeholder?: string;
  translatedPlaceholder?: string;
  rows?: number;
  className?: string;
  disabled?: boolean;
}

export const TranslatableTextarea = memo(function TranslatableTextarea({
  label,
  value,
  translatedValue,
  onChange,
  onTranslatedChange,
  placeholder,
  translatedPlaceholder,
  rows = 4,
  className,
  disabled = false,
}: TranslatableTextareaProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  
  const [isTranslating, setIsTranslating] = useState(false);
  const [isAutoTranslated, setIsAutoTranslated] = useState(false);
  const [isEditingTranslation, setIsEditingTranslation] = useState(false);
  const [editedTranslation, setEditedTranslation] = useState('');
  const translatedFromRef = useRef('');

  const targetLang = isRu ? 'en' : 'ru';
  const sourceLangLabel = isRu ? 'RU' : 'EN';
  const targetLangLabel = isRu ? 'EN' : 'RU';
  const translateActionLabel = isRu ? `Перевести в ${targetLangLabel}` : `Translate to ${targetLangLabel}`;

  const needsTranslationOffer = useMemo(() => {
    const trimmedValue = value.trim();
    if (!trimmedValue) return false;

    return !translatedValue.trim() || translatedFromRef.current !== trimmedValue;
  }, [translatedValue, value]);

  const handleTranslate = useCallback(async () => {
    if (!value.trim()) {
      toast.error(isRu ? 'Введите текст для перевода' : 'Enter text to translate');
      return;
    }

    setIsTranslating(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-translate', {
        body: {
          text: value,
          targetLang,
        },
      });

      if (error) throw error;
      
      if (data?.translated) {
        onTranslatedChange(data.translated);
        translatedFromRef.current = value.trim();
        setIsAutoTranslated(true);
        toast.success(isRu ? 'Переведено!' : 'Translated!');
      }
    } catch (error) {
      console.error('Translation error:', error);
      toast.error(isRu ? 'Ошибка перевода' : 'Translation failed');
    } finally {
      setIsTranslating(false);
    }
  }, [value, targetLang, onTranslatedChange, isRu]);

  const handleStartEditTranslation = () => {
    setEditedTranslation(translatedValue);
    setIsEditingTranslation(true);
  };

  const handleSaveEditedTranslation = () => {
    onTranslatedChange(editedTranslation);
    setIsEditingTranslation(false);
    setIsAutoTranslated(false);
  };

  const handleCancelEdit = () => {
    setIsEditingTranslation(false);
    setEditedTranslation('');
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Source textarea */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2">
            {label}
            <span className="text-xs px-1.5 py-0.5 bg-primary/10 text-primary rounded">
              {sourceLangLabel}
            </span>
          </Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleTranslate}
            disabled={isTranslating || !value.trim() || disabled}
            className="h-7 gap-1.5 text-xs"
          >
            {isTranslating ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                {isRu ? 'Перевод...' : 'Translating...'}
              </>
            ) : (
              <>
                <Sparkles className="h-3 w-3" />
                {translateActionLabel}
              </>
            )}
          </Button>
        </div>
        <Textarea
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsAutoTranslated(false);
          }}
          placeholder={placeholder}
          rows={rows}
          disabled={disabled}
        />
        {needsTranslationOffer && (
          <div className="flex justify-end pt-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleTranslate}
              disabled={isTranslating || disabled}
              className="h-7 gap-1.5 text-xs text-primary"
            >
              <Sparkles className="h-3 w-3" />
              {translateActionLabel}
            </Button>
          </div>
        )}
      </div>

      {/* Translated textarea */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2">
            {label}
            <span className="text-xs px-1.5 py-0.5 bg-muted text-muted-foreground rounded">
              {targetLangLabel}
            </span>
            {isAutoTranslated && !isEditingTranslation && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Languages className="h-3 w-3" />
                {isRu ? 'AI перевод' : 'AI translated'}
              </span>
            )}
          </Label>
          {translatedValue && !isEditingTranslation && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleStartEditTranslation}
              className="h-7 gap-1.5 text-xs"
              disabled={disabled}
            >
              <Pencil className="h-3 w-3" />
              {isRu ? 'Редактировать' : 'Edit'}
            </Button>
          )}
        </div>
        
        {isEditingTranslation ? (
          <div className="space-y-2">
            <Textarea
              value={editedTranslation}
              onChange={(e) => setEditedTranslation(e.target.value)}
              rows={rows}
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleCancelEdit}
              >
                <X className="h-4 w-4 mr-1" />
                {isRu ? 'Отмена' : 'Cancel'}
              </Button>
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={handleSaveEditedTranslation}
              >
                <Check className="h-4 w-4 mr-1" />
                {isRu ? 'Сохранить' : 'Save'}
              </Button>
            </div>
          </div>
        ) : (
          <Textarea
            value={translatedValue}
            onChange={(e) => {
              onTranslatedChange(e.target.value);
              setIsAutoTranslated(false);
            }}
            placeholder={translatedPlaceholder || placeholder}
            rows={rows}
            disabled={disabled}
            className={cn(
              translatedValue ? '' : 'text-muted-foreground',
              isAutoTranslated && 'border-primary/30 bg-primary/5'
            )}
          />
        )}
      </div>
    </div>
  );
});
