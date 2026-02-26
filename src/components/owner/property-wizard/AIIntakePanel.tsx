import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useIntakeAgent } from '@/hooks/useIntakeAgent';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Bot, Sparkles, Loader2, Wand2 } from 'lucide-react';
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
    <>
      {/* Trigger card */}
      <Card
        className="border-dashed border-primary/30 bg-primary/5 cursor-pointer hover:bg-primary/10 transition-colors"
        onClick={() => setIsOpen(true)}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <Bot className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
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
        </CardContent>
      </Card>

      {/* Sheet overlay — always on top */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[80vh]">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              {isRu ? 'Быстрый ввод с AI' : 'Quick AI Input'}
            </SheetTitle>
            <SheetDescription>
              {isRu
                ? 'Вставьте описание объекта из любого источника — AI заполнит форму автоматически'
                : 'Paste a property description from any source — AI will fill the form automatically'}
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-4 mt-4">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={isRu
                ? 'Вставьте сюда описание объекта...\n\nНапример:\n"Современная вилла 3 спальни, 4 ванных, бассейн, 250 м², район Банг Тао, 8500 бат/ночь..."'
                : 'Paste property description here...\n\nFor example:\n"Modern villa 3 bedrooms, 4 bathrooms, pool, 250 sqm, Bang Tao area, 8500 baht/night..."'}
              className="min-h-[160px] resize-none text-base"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setText('');
                  setIsOpen(false);
                }}
              >
                {isRu ? 'Отмена' : 'Cancel'}
              </Button>
              <Button
                type="button"
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
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
