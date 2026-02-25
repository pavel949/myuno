import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, FileText, Link, Upload, Check, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AIIntakeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityType: string;
  onComplete: (extractedData: any) => void;
}

export function AIIntakeDialog({ 
  open, 
  onOpenChange, 
  entityType,
  onComplete 
}: AIIntakeDialogProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const [inputMode, setInputMode] = useState<'text' | 'url'>('text');
  const [textInput, setTextInput] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleProcess = async () => {
    const input = inputMode === 'text' ? textInput : urlInput;
    
    if (!input.trim()) {
      toast.error(isRu ? 'Введите данные для обработки' : 'Enter data to process');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setExtractedData(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('ai-intake-extract', {
        body: {
          input: input.trim(),
          inputType: inputMode,
          entityType,
          language,
        },
      });

      if (fnError) throw fnError;

      if (data?.extracted) {
        setExtractedData(data.extracted);
        toast.success(isRu ? 'Данные извлечены!' : 'Data extracted!');
      } else {
        throw new Error('No data extracted');
      }
    } catch (err: any) {
      console.error('AI Intake error:', err);
      setError(err.message || 'Processing failed');
      toast.error(isRu ? 'Ошибка обработки' : 'Processing failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApply = () => {
    if (extractedData) {
      onComplete(extractedData);
      handleReset();
      onOpenChange(false);
    }
  };

  const handleReset = () => {
    setTextInput('');
    setUrlInput('');
    setExtractedData(null);
    setError(null);
  };

  const entityLabels: Record<string, { en: string; ru: string }> = {
    property_project: { en: 'Property Project', ru: 'Проект / ЖК' },
    property: { en: 'Property', ru: 'Недвижимость' },
    restaurant: { en: 'Restaurant', ru: 'Ресторан' },
    tour: { en: 'Tour', ru: 'Тур' },
  };

  const entityLabel = entityLabels[entityType] || { en: entityType, ru: entityType };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Intake: {isRu ? entityLabel.ru : entityLabel.en}
          </DialogTitle>
          <DialogDescription>
            {isRu 
              ? 'Вставьте текст или URL для автоматического извлечения данных'
              : 'Paste text or URL for automatic data extraction'
            }
          </DialogDescription>
        </DialogHeader>

        {!extractedData ? (
          <div className="space-y-4">
            <Tabs value={inputMode} onValueChange={(v) => setInputMode(v as 'text' | 'url')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="text" className="gap-2">
                  <FileText className="h-4 w-4" />
                  {isRu ? 'Текст' : 'Text'}
                </TabsTrigger>
                <TabsTrigger value="url" className="gap-2">
                  <Link className="h-4 w-4" />
                  URL
                </TabsTrigger>
              </TabsList>

              <TabsContent value="text" className="space-y-3 mt-4">
                <Label>
                  {isRu ? 'Вставьте описание, сообщение из WhatsApp, PDF текст...' : 'Paste description, WhatsApp message, PDF text...'}
                </Label>
                <Textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder={isRu 
                    ? 'Laguna Beach Resort 2, новый кондо в Банг Тао, 2 спальни, 80 кв.м, бассейн на крыше, 15 млн бат...'
                    : 'Laguna Beach Resort 2, new condo in Bang Tao, 2 bedrooms, 80 sqm, rooftop pool, 15M THB...'
                  }
                  rows={8}
                />
              </TabsContent>

              <TabsContent value="url" className="space-y-3 mt-4">
                <Label>
                  {isRu ? 'URL страницы с информацией' : 'URL of the page with information'}
                </Label>
                <Textarea
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://developer-website.com/project-name"
                  rows={2}
                />
                <p className="text-xs text-muted-foreground">
                  {isRu 
                    ? 'AI извлечёт данные со страницы автоматически'
                    : 'AI will extract data from the page automatically'
                  }
                </p>
              </TabsContent>
            </Tabs>

            {error && (
              <Card className="border-destructive bg-destructive/10">
                <CardContent className="p-3 flex items-center gap-2 text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">{error}</span>
                </CardContent>
              </Card>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                {isRu ? 'Отмена' : 'Cancel'}
              </Button>
              <Button onClick={handleProcess} disabled={isProcessing}>
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {isRu ? 'Обработка...' : 'Processing...'}
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    {isRu ? 'Извлечь данные' : 'Extract Data'}
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Card className="border-primary/50 bg-primary/5">
              <CardContent className="p-4">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Check className="h-4 w-4 text-success" />
                  {isRu ? 'Извлечённые данные' : 'Extracted Data'}
                </h4>
                <div className="space-y-2 text-sm">
                  {Object.entries(extractedData).map(([key, val]) => {
                    if (!val || (Array.isArray(val) && val.length === 0)) return null;
                    return (
                      <div key={key} className="flex gap-2">
                        <span className="text-muted-foreground min-w-[120px]">{key}:</span>
                        <span className="font-medium">
                          {Array.isArray(val) 
                            ? (val as string[]).slice(0, 5).join(', ') + (val.length > 5 ? '...' : '')
                            : String(val)
                          }
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button variant="outline" onClick={handleReset}>
                {isRu ? 'Ввести заново' : 'Start Over'}
              </Button>
              <Button onClick={handleApply}>
                <Check className="h-4 w-4 mr-2" />
                {isRu ? 'Применить данные' : 'Apply Data'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
