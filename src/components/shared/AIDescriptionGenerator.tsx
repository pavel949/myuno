import React, { useState } from 'react';
import { logger } from '@/lib/logger';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Sparkles, Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

interface AIDescriptionGeneratorProps {
  type: 'product' | 'service' | 'property';
  name: string;
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  details?: {
    category?: string;
    price?: number;
    features?: string[];
    duration?: string;
    benefits?: string[];
    propertyType?: string;
    listingType?: string;
    bedrooms?: number;
    bathrooms?: number;
    area?: number;
    district?: string;
    amenities?: string[];
    price_period?: string;
  };
  disabled?: boolean;
}

export function AIDescriptionGenerator({
  type,
  name,
  value,
  onChange,
  label,
  placeholder,
  details,
  disabled = false,
}: AIDescriptionGeneratorProps) {
  const { language } = useLanguage();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!name.trim()) {
      toast.error(language === 'ru' ? 'Сначала введите название' : 'Please enter a name first');
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-generate-description', {
        body: {
          type,
          name,
          language,
          details,
        },
      });

      if (error) throw error;

      if (data?.description) {
        onChange(data.description);
        toast.success(language === 'ru' ? 'Описание сгенерировано' : 'Description generated');
      }
    } catch (err: unknown) {
      logger.error('Generation error:', err);
      if (err instanceof Error && err.message?.includes('429')) {
        toast.error(language === 'ru' ? 'Слишком много запросов. Попробуйте позже.' : 'Too many requests. Try again later.');
      } else {
        toast.error(language === 'ru' ? 'Не удалось сгенерировать описание' : 'Failed to generate description');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const typeLabels = {
    product: { en: 'Product Description', ru: 'Описание товара' },
    service: { en: 'Service Description', ru: 'Описание услуги' },
    property: { en: 'Property Description', ru: 'Описание объекта' },
  };

  const defaultLabel = typeLabels[type][language === 'ru' ? 'ru' : 'en'];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>{label || defaultLabel}</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleGenerate}
          disabled={disabled || isGenerating || !name.trim()}
          className="gap-1.5"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {language === 'ru' ? 'Генерация...' : 'Generating...'}
            </>
          ) : value ? (
            <>
              <RefreshCw className="h-3.5 w-3.5" />
              {language === 'ru' ? 'Перегенерировать' : 'Regenerate'}
            </>
          ) : (
            <>
              <Sparkles className="h-3.5 w-3.5" />
              {language === 'ru' ? 'AI описание' : 'AI Generate'}
            </>
          )}
        </Button>
      </div>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || (language === 'ru' ? 'Введите описание или сгенерируйте с помощью AI...' : 'Enter description or generate with AI...')}
        rows={5}
        disabled={disabled}
        className="resize-none"
      />
      {!name.trim() && (
        <p className="text-xs text-muted-foreground">
          {language === 'ru' 
            ? '💡 Введите название, чтобы использовать AI генерацию' 
            : '💡 Enter a name to enable AI generation'}
        </p>
      )}
    </div>
  );
}
