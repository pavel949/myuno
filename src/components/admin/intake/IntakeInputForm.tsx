import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Bot, Loader2, Sparkles } from 'lucide-react';
import { IntakeMode } from './IntakeModeSelector';
import { INTAKE_VERTICALS } from '@/lib/intakeVerticals';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface IntakeInputFormProps {
  mode: IntakeMode;
  onAnalyze: (options: {
    mode: IntakeMode;
    rawText?: string;
    urls?: string[];
    forceVertical?: string;
  }) => Promise<void>;
  isProcessing: boolean;
}

export function IntakeInputForm({ mode, onAnalyze, isProcessing }: IntakeInputFormProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  
  const [rawText, setRawText] = useState('');
  const [forceVertical, setForceVertical] = useState<string>('');

  const handleSubmit = async () => {
    if (!rawText.trim()) return;
    
    let urls: string[] | undefined;
    
    if (mode === 'bulk_urls') {
      // Extract URLs from text
      const urlRegex = /https?:\/\/[^\s<>"{}|\\^`[\]]+/gi;
      urls = rawText.match(urlRegex) || [];
      if (urls.length === 0) {
        return;
      }
    }
    
    await onAnalyze({
      mode,
      rawText: mode !== 'bulk_urls' ? rawText : undefined,
      urls,
      forceVertical: forceVertical || undefined,
    });
  };

  const getPlaceholder = () => {
    if (mode === 'single') {
      return isRu 
        ? 'Вставьте описание объекта...\n\nПример:\nЯхта Azimut 55, 2020 год\n16 метров, 8 гостей\nЦена: $2,500/день\nКонтакт: +66 89 123 4567'
        : 'Paste listing description...\n\nExample:\nYacht Azimut 55, 2020\n16 meters, 8 guests\nPrice: $2,500/day\nContact: +66 89 123 4567';
    }
    if (mode === 'bulk_text') {
      return isRu
        ? 'Вставьте несколько объектов, разделённых ---\n\n---\nОбъект 1: Яхта Princess 52...\n---\nОбъект 2: Вилла в Равай...\n---'
        : 'Paste multiple items separated by ---\n\n---\nItem 1: Princess 52 yacht...\n---\nItem 2: Villa in Rawai...\n---';
    }
    return isRu
      ? 'Вставьте ссылки (каждая с новой строки):\n\nhttps://yacht-charter.com/azimut-55\nhttps://phuket-villas.com/oceanview\nhttps://tour-phuket.com/island-trip'
      : 'Paste URLs (one per line):\n\nhttps://yacht-charter.com/azimut-55\nhttps://phuket-villas.com/oceanview\nhttps://tour-phuket.com/island-trip';
  };

  const getHint = () => {
    if (mode === 'bulk_urls') {
      const urlCount = (rawText.match(/https?:\/\/[^\s<>"{}|\\^`[\]]+/gi) || []).length;
      return isRu 
        ? `Найдено ${urlCount} ссылок` 
        : `Found ${urlCount} URLs`;
    }
    if (mode === 'bulk_text') {
      const itemCount = rawText.split(/^---+$/m).filter(s => s.trim()).length;
      return isRu 
        ? `Найдено ${itemCount} объектов` 
        : `Found ${itemCount} items`;
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          {isRu ? 'Данные для анализа' : 'Data to Analyze'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Force vertical selector */}
        <div className="space-y-2">
          <Label>{isRu ? 'Категория (опционально)' : 'Category (optional)'}</Label>
          <Select value={forceVertical} onValueChange={setForceVertical}>
            <SelectTrigger>
              <SelectValue placeholder={isRu ? 'Авто-определение' : 'Auto-detect'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">
                {isRu ? '🤖 Авто-определение' : '🤖 Auto-detect'}
              </SelectItem>
              {INTAKE_VERTICALS.map(v => (
                <SelectItem key={v.id} value={v.id}>
                  {v.icon} {isRu ? v.nameRu : v.nameEn}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Main textarea */}
        <div className="space-y-2">
          <Label>{isRu ? 'Исходные данные' : 'Source Data'}</Label>
          <Textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder={getPlaceholder()}
            className="min-h-[200px] font-mono text-sm"
            disabled={isProcessing}
          />
          {getHint() && (
            <p className="text-sm text-muted-foreground">{getHint()}</p>
          )}
        </div>

        {/* Submit button */}
        <Button 
          onClick={handleSubmit}
          disabled={!rawText.trim() || isProcessing}
          className="w-full"
          size="lg"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {isRu ? 'Анализирую...' : 'Analyzing...'}
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              {isRu ? 'AI Анализ' : 'AI Analyze'}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
