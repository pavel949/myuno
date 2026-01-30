import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Loader2, FileText, Check } from 'lucide-react';
import { toast } from 'sonner';

interface TargetField {
  name: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'array';
}

interface ExtractedData {
  [key: string]: any;
}

interface AITextExtractorProps {
  context: 'property' | 'product' | 'service';
  targetFields: TargetField[];
  onDataExtracted: (data: ExtractedData, confidence: Record<string, number>) => void;
  placeholder?: string;
}

export function AITextExtractor({
  context,
  targetFields,
  onDataExtracted,
  placeholder,
}: AITextExtractorProps) {
  const { language } = useLanguage();
  const [text, setText] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [lastExtraction, setLastExtraction] = useState<{
    data: ExtractedData;
    confidence: Record<string, number>;
    notes?: string;
  } | null>(null);

  const handleExtract = async () => {
    if (!text.trim()) return;
    
    setIsExtracting(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-smart-data', {
        body: {
          type: 'text-extraction',
          text,
          targetFields,
          context,
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      const result = data.result;
      setLastExtraction({
        data: result.extractedData,
        confidence: result.confidence,
        notes: result.notes,
      });
      
      onDataExtracted(result.extractedData, result.confidence);
      
      const extractedCount = Object.keys(result.extractedData).length;
      toast.success(
        language === 'ru'
          ? `Извлечено ${extractedCount} полей`
          : `Extracted ${extractedCount} fields`
      );
    } catch (err) {
      console.error('AI extraction error:', err);
      toast.error(
        language === 'ru'
          ? 'Ошибка извлечения данных'
          : 'Data extraction failed'
      );
    } finally {
      setIsExtracting(false);
    }
  };

  const defaultPlaceholder = language === 'ru'
    ? 'Вставьте описание недвижимости, товара или услуги...\n\nПример:\n2-комнатная квартира в районе Патонг, 65 кв.м., полностью меблирована, бассейн, тренажерный зал. Аренда 35,000 бат/месяц.'
    : 'Paste a property, product, or service description...\n\nExample:\n2-bedroom apartment in Patong, 65 sqm, fully furnished, pool, gym. Rent 35,000 THB/month.';

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="h-4 w-4" />
          {language === 'ru' ? 'AI Извлечение данных' : 'AI Data Extraction'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder || defaultPlaceholder}
          rows={5}
          className="resize-none"
        />
        
        <Button
          onClick={handleExtract}
          disabled={isExtracting || !text.trim()}
          className="w-full gap-2"
        >
          {isExtracting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {language === 'ru' ? 'Извлечь данные' : 'Extract Data'}
        </Button>

        {lastExtraction && (
          <div className="space-y-2 pt-2 border-t">
            <p className="text-xs font-medium text-muted-foreground">
              {language === 'ru' ? 'Извлечённые данные:' : 'Extracted data:'}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(lastExtraction.data).map(([key, value]) => {
                const confidence = lastExtraction.confidence[key] || 0;
                const field = targetFields.find(f => f.name === key);
                return (
                  <div
                    key={key}
                    className="flex items-center justify-between p-2 bg-muted/50 rounded text-xs"
                  >
                    <div>
                      <span className="font-medium">{field?.label || key}:</span>
                      <span className="ml-1 text-muted-foreground">
                        {Array.isArray(value) ? value.join(', ') : String(value)}
                      </span>
                    </div>
                    <Badge
                      variant={confidence >= 0.8 ? 'default' : 'secondary'}
                      className="text-[9px] px-1"
                    >
                      {confidence >= 0.8 && <Check className="h-2 w-2 mr-0.5" />}
                      {Math.round(confidence * 100)}%
                    </Badge>
                  </div>
                );
              })}
            </div>
            {lastExtraction.notes && (
              <p className="text-xs text-muted-foreground italic">
                {lastExtraction.notes}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
