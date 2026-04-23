import { useState, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ImageUpload } from '@/components/upload/ImageUpload';
import { Loader2, Scan, Check, AlertCircle, Camera, Upload, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ReceiptMetadata {
  vendor?: string;
  date?: string;
  total?: number;
  currency?: string;
  items?: Array<{ name: string; amount: number }>;
  category?: string;
  confidence?: number;
}

interface ReceiptUploadWithOCRProps {
  onReceiptParsed: (data: {
    receipt_url: string;
    metadata: ReceiptMetadata;
    amount?: number;
    category?: string;
    vendor?: string;
    date?: string;
  }) => void;
  existingUrl?: string;
  disabled?: boolean;
}

export function ReceiptUploadWithOCR({ 
  onReceiptParsed, 
  existingUrl,
  disabled 
}: ReceiptUploadWithOCRProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  
  const [receiptUrl, setReceiptUrl] = useState(existingUrl || '');
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedData, setParsedData] = useState<ReceiptMetadata | null>(null);
  const [error, setError] = useState<string | null>(null);

  const parseReceiptWithAI = useCallback(async (imageUrl: string) => {
    setIsProcessing(true);
    setError(null);
    
    try {
      // Use Lovable AI via edge function for OCR
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/ocr-receipt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_url: imageUrl }),
      });

      if (!response.ok) {
        throw new Error('OCR processing failed');
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        setParsedData(result.data);
        onReceiptParsed({
          receipt_url: imageUrl,
          metadata: result.data,
          amount: result.data.total,
          category: result.data.category,
          vendor: result.data.vendor,
          date: result.data.date,
        });
        toast.success(isRu ? 'Чек распознан!' : 'Receipt parsed!');
      } else {
        throw new Error(result.error || 'Failed to parse receipt');
      }
    } catch (err) {
      console.error('OCR Error:', err);
      setError(isRu ? 'Не удалось распознать чек' : 'Failed to parse receipt');
      // Still save the image even if OCR fails
      onReceiptParsed({
        receipt_url: imageUrl,
        metadata: {},
      });
    } finally {
      setIsProcessing(false);
    }
  }, [isRu, onReceiptParsed]);

  const handleImageUpload = useCallback((url: string) => {
    setReceiptUrl(url);
    parseReceiptWithAI(url);
  }, [parseReceiptWithAI]);

  const handleSkipOCR = useCallback(() => {
    if (receiptUrl) {
      onReceiptParsed({
        receipt_url: receiptUrl,
        metadata: {},
      });
      toast.success(isRu ? 'Чек сохранён без распознавания' : 'Receipt saved without parsing');
    }
  }, [receiptUrl, onReceiptParsed, isRu]);

  return (
    <div className="space-y-4">
      {/* Upload Zone */}
      {!receiptUrl ? (
        <div className="border-2 border-dashed border-muted-foreground/25 rounded-none p-6 text-center hover:border-primary/50 transition-colors">
          <ImageUpload
            value=""
            onChange={handleImageUpload}
            folder="receipts"
          />
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Camera className="h-5 w-5" />
              <span className="text-sm">
                {isRu ? 'Сфотографируйте чек' : 'Take a photo of receipt'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {isRu 
                ? 'AI автоматически извлечёт сумму, дату и поставщика' 
                : 'AI will automatically extract amount, date and vendor'}
            </p>
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="p-4 space-y-4">
            {/* Image Preview */}
            <div className="relative">
              <img 
                src={receiptUrl} 
                alt="Receipt" 
                className="w-full max-h-48 object-contain rounded-none bg-muted"
              />
              {isProcessing && (
                <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-none">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="text-sm font-medium">
                      {isRu ? 'Распознаём...' : 'Processing...'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* OCR Status */}
            {parsedData && !isProcessing && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-success">
                  <Check className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    {isRu ? 'Успешно распознано' : 'Successfully parsed'}
                  </span>
                  {parsedData.confidence && (
                    <Badge variant="secondary" className="text-xs">
                      {Math.round(parsedData.confidence * 100)}%
                    </Badge>
                  )}
                </div>

                {/* Extracted Fields */}
                <div className="grid grid-cols-2 gap-3 p-3 bg-muted/50 rounded-none">
                  {parsedData.vendor && (
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        {isRu ? 'Поставщик' : 'Vendor'}
                      </Label>
                      <p className="font-medium text-sm">{parsedData.vendor}</p>
                    </div>
                  )}
                  {parsedData.date && (
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        {isRu ? 'Дата' : 'Date'}
                      </Label>
                      <p className="font-medium text-sm">{parsedData.date}</p>
                    </div>
                  )}
                  {parsedData.total && (
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        {isRu ? 'Сумма' : 'Amount'}
                      </Label>
                      <p className="font-medium text-sm">
                        {parsedData.total.toLocaleString()} {parsedData.currency || 'THB'}
                      </p>
                    </div>
                  )}
                  {parsedData.category && (
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        {isRu ? 'Категория' : 'Category'}
                      </Label>
                      <p className="font-medium text-sm">{parsedData.category}</p>
                    </div>
                  )}
                </div>

                {/* Line Items */}
                {parsedData.items && parsedData.items.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">
                      {isRu ? 'Позиции' : 'Items'}
                    </Label>
                    <div className="space-y-1">
                      {parsedData.items.slice(0, 5).map((item, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span className="text-muted-foreground truncate">{item.name}</span>
                          <span className="font-medium">{item.amount.toLocaleString()}</span>
                        </div>
                      ))}
                      {parsedData.items.length > 5 && (
                        <p className="text-xs text-muted-foreground">
                          +{parsedData.items.length - 5} {isRu ? 'ещё' : 'more'}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Error State */}
            {error && !isProcessing && (
              <div className="flex items-center gap-2 text-warning p-3 bg-warning/10 rounded-none">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{error}</p>
                  <p className="text-xs text-muted-foreground">
                    {isRu 
                      ? 'Чек сохранён, но данные нужно ввести вручную' 
                      : 'Receipt saved, but data needs manual entry'}
                  </p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setReceiptUrl('');
                  setParsedData(null);
                  setError(null);
                }}
                disabled={disabled || isProcessing}
              >
                {isRu ? 'Заменить' : 'Replace'}
              </Button>
              {!parsedData && !isProcessing && receiptUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => parseReceiptWithAI(receiptUrl)}
                >
                  <Scan className="h-4 w-4 mr-1" />
                  {isRu ? 'Распознать заново' : 'Retry OCR'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Badge */}
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <Sparkles className="h-3 w-3" />
        <span>{isRu ? 'AI-распознавание через Lovable Cloud' : 'AI parsing via Lovable Cloud'}</span>
      </div>
    </div>
  );
}
