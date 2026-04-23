/**
 * DocumentQualityTips - Quality tips for document uploads
 */

import { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Info, Camera, Sun, CropIcon, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getImageDimensions } from './ImageCompressor';

export type DocumentType = 'passport' | 'driver_license' | 'insurance' | 'visa' | 'other';

interface DocumentQualityTipsProps {
  documentType?: DocumentType;
  imageUrl?: string;
  customTips?: string[];
  className?: string;
}

interface TipItem {
  id: string;
  icon: typeof CheckCircle;
  text: string;
  status: 'success' | 'warning' | 'info';
}

const DOCUMENT_TIPS: Record<DocumentType, string[]> = {
  passport: [
    'Откройте разворот с фотографией',
    'Уберите обложку паспорта',
    'Убедитесь, что все данные читаемы',
    'Избегайте бликов от вспышки',
  ],
  driver_license: [
    'Сфотографируйте обе стороны',
    'Убедитесь, что номер читаем',
    'Фото должно быть чётким',
  ],
  insurance: [
    'Полис должен быть полностью виден',
    'Проверьте читаемость всех данных',
    'Укажите срок действия',
  ],
  visa: [
    'Сфотографируйте страницу с визой',
    'Убедитесь в читаемости дат',
    'Фото должно быть без бликов',
  ],
  other: [
    'Документ должен быть полностью виден',
    'Проверьте читаемость текста',
  ],
};

export function DocumentQualityTips({
  documentType = 'other',
  imageUrl,
  customTips,
  className,
}: DocumentQualityTipsProps) {
  const [tips, setTips] = useState<TipItem[]>([]);
  const [imageAnalysis, setImageAnalysis] = useState<{
    resolution: 'good' | 'low' | 'unknown';
    aspectRatio: 'portrait' | 'landscape' | 'square' | 'unknown';
  }>({ resolution: 'unknown', aspectRatio: 'unknown' });

  // Analyze image when URL changes
  useEffect(() => {
    if (!imageUrl) {
      setImageAnalysis({ resolution: 'unknown', aspectRatio: 'unknown' });
      return;
    }

    const analyzeImage = async () => {
      try {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const file = new File([blob], 'document.jpg', { type: blob.type });
        const dimensions = await getImageDimensions(file);
        
        const resolution = dimensions.width >= 1000 && dimensions.height >= 700 ? 'good' : 'low';
        const ratio = dimensions.width / dimensions.height;
        const aspectRatio = ratio > 1.2 ? 'landscape' : ratio < 0.8 ? 'portrait' : 'square';
        
        setImageAnalysis({ resolution, aspectRatio });
      } catch {
        setImageAnalysis({ resolution: 'unknown', aspectRatio: 'unknown' });
      }
    };

    analyzeImage();
  }, [imageUrl]);

  // Build tips based on document type and analysis
  useEffect(() => {
    const docTips = customTips || DOCUMENT_TIPS[documentType];
    
    const tipItems: TipItem[] = [
      // Static tips from document type
      ...docTips.map((text, i) => ({
        id: `tip-${i}`,
        icon: Info,
        text,
        status: 'info' as const,
      })),
    ];

    // Add analysis-based tips
    if (imageUrl) {
      if (imageAnalysis.resolution === 'good') {
        tipItems.unshift({
          id: 'resolution',
          icon: CheckCircle,
          text: 'Хорошее разрешение',
          status: 'success',
        });
      } else if (imageAnalysis.resolution === 'low') {
        tipItems.unshift({
          id: 'resolution',
          icon: AlertCircle,
          text: 'Низкое разрешение — попробуйте переснять',
          status: 'warning',
        });
      }
    }

    setTips(tipItems);
  }, [documentType, customTips, imageUrl, imageAnalysis]);

  if (tips.length === 0) return null;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
        <Camera className="h-4 w-4" />
        Советы для качественного фото
      </div>
      
      <div className="space-y-1.5">
        {tips.map((tip) => (
          <div 
            key={tip.id}
            className={cn(
              "flex items-start gap-2 text-sm p-2 rounded-none",
              tip.status === 'success' && "bg-success/10 text-success dark:text-success",
              tip.status === 'warning' && "bg-accent/10 text-accent dark:text-accent",
              tip.status === 'info' && "bg-muted text-muted-foreground"
            )}
          >
            <tip.icon className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>{tip.text}</span>
          </div>
        ))}
      </div>

      {/* Quick tips icons */}
      <div className="flex items-center gap-4 pt-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Sun className="h-3.5 w-3.5" />
          <span>Хорошее освещение</span>
        </div>
        <div className="flex items-center gap-1">
          <CropIcon className="h-3.5 w-3.5" />
          <span>Весь документ</span>
        </div>
        <div className="flex items-center gap-1">
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Правильный поворот</span>
        </div>
      </div>
    </div>
  );
}
