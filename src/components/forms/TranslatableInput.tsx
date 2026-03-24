import { useState, useCallback, useMemo, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Languages, Loader2, Pencil, Check, X, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface TranslatableInputProps {
  label: string;
  value: string;
  translatedValue: string;
  onChange: (value: string) => void;
  onTranslatedChange: (value: string) => void;
  placeholder?: string;
  translatedPlaceholder?: string;
  multiline?: boolean;
  rows?: number;
  className?: string;
  disabled?: boolean;
}

export function TranslatableInput({
  label,
  value,
  translatedValue,
  onChange,
  onTranslatedChange,
  placeholder,
  translatedPlaceholder,
  multiline = false,
  rows = 4,
  className,
  disabled = false,
}: TranslatableInputProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  
  const [isTranslating, setIsTranslating] = useState(false);
  const [isAutoTranslated, setIsAutoTranslated] = useState(false);
  const [isEditingTranslation, setIsEditingTranslation] = useState(false);
  const [editedTranslation, setEditedTranslation] = useState('');
  const translatedFromRef = useRef('');

  // Source language is the current UI language, target is the other one
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
        body: { text: value, targetLang }
      });

      if (error) throw error;
      if (data?.error) {
        if (data.error.includes('Rate limit')) {
          toast.error(isRu ? 'Превышен лимит запросов. Попробуйте позже.' : 'Rate limit exceeded. Try again later.');
        } else {
          throw new Error(data.error);
        }
        return;
      }

      const translated = data?.translated || '';
      onTranslatedChange(translated);
      translatedFromRef.current = value.trim();
      setIsAutoTranslated(true);
      toast.success(isRu ? 'Перевод выполнен' : 'Translation complete');
    } catch (error) {
      console.error('Translation error:', error);
      toast.error(isRu ? 'Ошибка перевода' : 'Translation failed');
    } finally {
      setIsTranslating(false);
    }
  }, [value, targetLang, onTranslatedChange, isRu]);

  const startEditingTranslation = () => {
    setEditedTranslation(translatedValue);
    setIsEditingTranslation(true);
  };

  const saveEditedTranslation = () => {
    onTranslatedChange(editedTranslation);
    setIsEditingTranslation(false);
    setIsAutoTranslated(false); // Mark as manually edited
  };

  const cancelEditingTranslation = () => {
    setEditedTranslation('');
    setIsEditingTranslation(false);
  };

  // Track if the auto-translated content is stale (source changed after translation)
  // This is intentionally a no-op effect kept for potential future enhancement

  const InputComponent = multiline ? Textarea : Input;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Source language input */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2">
            {label}
            <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium">
              {sourceLangLabel}
            </span>
          </Label>
        </div>
        <InputComponent
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsAutoTranslated(false);
          }}
          placeholder={placeholder}
          disabled={disabled}
          {...(multiline && { rows })}
        />
        {needsTranslationOffer && (
          <div className="flex justify-end pt-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleTranslate}
              disabled={isTranslating || disabled}
              className="h-7 px-2 text-xs text-primary"
            >
              <Sparkles className="h-3 w-3 mr-1" />
              {translateActionLabel}
            </Button>
          </div>
        )}
      </div>

      {/* Translation section */}
      <div className="space-y-2">
      <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2">
            {isRu ? 'Перевод' : 'Translation'}
            <span className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded font-medium">
              {targetLangLabel}
            </span>
            {isAutoTranslated && translatedValue && (
              <span className="text-xs text-primary flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                {isRu ? 'Авто' : 'Auto'}
              </span>
            )}
          </Label>
          <div className="flex items-center gap-2">
            {translatedValue && !isEditingTranslation && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={startEditingTranslation}
                className="h-7 px-2 text-xs"
              >
                <Pencil className="h-3 w-3 mr-1" />
                {isRu ? 'Редактировать' : 'Edit'}
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleTranslate}
              disabled={isTranslating || !value.trim() || disabled}
              className="h-7 px-2 text-xs"
            >
              {isTranslating ? (
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
              ) : (
                <Languages className="h-3 w-3 mr-1" />
              )}
              {translateActionLabel}
            </Button>
          </div>
        </div>

        {isEditingTranslation ? (
          <div className="space-y-2">
            <InputComponent
              value={editedTranslation}
              onChange={(e) => setEditedTranslation(e.target.value)}
              placeholder={translatedPlaceholder}
              {...(multiline && { rows })}
              className="border-primary"
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={cancelEditingTranslation}
                className="h-7"
              >
                <X className="h-3 w-3 mr-1" />
                {isRu ? 'Отмена' : 'Cancel'}
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={saveEditedTranslation}
                className="h-7"
              >
                <Check className="h-3 w-3 mr-1" />
                {isRu ? 'Сохранить' : 'Save'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="relative">
            <InputComponent
              value={translatedValue}
              onChange={(e) => {
                onTranslatedChange(e.target.value);
                setIsAutoTranslated(false);
              }}
              placeholder={translatedPlaceholder || (isRu ? 'Нажмите "Перевести" или введите вручную' : 'Click "Translate" or enter manually')}
              disabled={disabled}
              {...(multiline && { rows })}
              className={cn(
                isAutoTranslated && translatedValue && "bg-primary/5 border-primary/20"
              )}
            />
          </div>
        )}
      </div>
    </div>
  );
}
