import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useIntakeAgent } from '@/hooks/useIntakeAgent';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Bot, Sparkles, Loader2, ChevronDown, Wand2 } from 'lucide-react';
import { toast } from 'sonner';

interface AIIntakePanelProps {
  onDataExtracted: (data: Record<string, any>) => void;
}

export function AIIntakePanel({ onDataExtracted }: AIIntakePanelProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { isProcessing, analyze } = useIntakeAgent();
  const [text, setText] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const handleParse = async () => {
    if (!text.trim()) {
      toast.error(isRu ? 'Введите описание объекта' : 'Enter property description');
      return;
    }

    const result = await analyze({
      mode: 'single',
      rawText: text,
      forceVertical: 'properties',
    });

    if (result && result.items.length > 0) {
      const item = result.items[0];
      const fields = item.extractedFields;

      const extractedData = {
        title: item.suggestedTitle?.en || fields.name_en?.value,
        title_ru: item.suggestedTitle?.ru || fields.name_ru?.value,
        description: item.suggestedDescription?.en || fields.description_en?.value,
        description_ru: item.suggestedDescription?.ru || fields.description_ru?.value,
        bedrooms: fields.bedrooms?.value,
        bathrooms: fields.bathrooms?.value,
        max_guests: fields.max_guests?.value,
        price_per_night: fields.price_per_night?.value?.toString(),
        district: fields.district?.value,
        address: fields.address?.value,
        property_type: fields.property_type?.value,
        area_sqm: fields.area_sqm?.value?.toString(),
      };

      onDataExtracted(extractedData);
      setText('');
      setIsOpen(false);
      toast.success(isRu ? 'AI извлёк данные и заполнил форму!' : 'AI extracted data and filled the form!');
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border-dashed border-primary/30 bg-primary/5">
        <CollapsibleTrigger asChild>
          <CardContent className="p-4 cursor-pointer hover:bg-primary/10 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/10">
                  <Bot className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium flex items-center gap-2">
                    {isRu ? 'Быстрый ввод с AI' : 'Quick AI Input'}
                    <Sparkles className="h-4 w-4 text-primary" />
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {isRu 
                      ? 'Вставьте описание из WhatsApp или сайта — AI заполнит форму' 
                      : 'Paste description from WhatsApp or website — AI will fill the form'}
                  </p>
                </div>
              </div>
              <ChevronDown className={`h-5 w-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>
          </CardContent>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="pt-0 px-4 pb-4 space-y-3">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={isRu 
                ? 'Вставьте сюда описание объекта из любого источника...\n\nНапример:\n"Современная вилла 3 спальни, 4 ванных, бассейн, 250 м², район Банг Тао, 8500 бат/ночь..."' 
                : 'Paste property description from any source...\n\nFor example:\n"Modern villa 3 bedrooms, 4 bathrooms, pool, 250 sqm, Bang Tao area, 8500 baht/night..."'}
              className="min-h-[120px] resize-none"
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setText('');
                  setIsOpen(false);
                }}
              >
                {isRu ? 'Отмена' : 'Cancel'}
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleParse}
                disabled={isProcessing || !text.trim()}
                className="gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {isRu ? 'Анализ...' : 'Analyzing...'}
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4" />
                    {isRu ? 'Заполнить форму' : 'Fill Form'}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
