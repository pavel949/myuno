/**
 * ImageQualityTips - AI-powered quality analysis and tips
 * Airbnb-style smart suggestions
 */

import { useState, useEffect } from 'react';
import { 
  AlertCircle, 
  CheckCircle, 
  Sun, 
  Camera, 
  ZoomIn, 
  Lightbulb,
  Image,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface QualityIssue {
  type: 'error' | 'warning' | 'success' | 'tip';
  icon: React.ReactNode;
  message: string;
  messageRu: string;
}

interface ImageQualityTipsProps {
  imageUrl?: string;
  imageCount: number;
  className?: string;
}

// Analyze image quality (simplified client-side version)
async function analyzeImageQuality(imageUrl: string): Promise<QualityIssue[]> {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      const issues: QualityIssue[] = [];
      
      // Check resolution
      if (img.width < 800 || img.height < 600) {
        issues.push({
          type: 'warning',
          icon: <ZoomIn className="h-4 w-4" />,
          message: 'Low resolution',
          messageRu: 'Низкое разрешение — фото может выглядеть размыто'
        });
      }
      
      // Check aspect ratio (too square or too wide)
      const ratio = img.width / img.height;
      if (ratio > 3 || ratio < 0.33) {
        issues.push({
          type: 'warning',
          icon: <Image className="h-4 w-4" />,
          message: 'Unusual aspect ratio',
          messageRu: 'Необычные пропорции — рассмотрите обрезку'
        });
      }
      
      // Analyze brightness (basic)
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const size = 50; // Sample size
        canvas.width = size;
        canvas.height = size;
        ctx.drawImage(img, 0, 0, size, size);
        
        try {
          const imageData = ctx.getImageData(0, 0, size, size);
          let brightness = 0;
          
          for (let i = 0; i < imageData.data.length; i += 4) {
            brightness += (imageData.data[i] + imageData.data[i + 1] + imageData.data[i + 2]) / 3;
          }
          
          brightness = brightness / (size * size);
          
          if (brightness < 50) {
            issues.push({
              type: 'warning',
              icon: <Sun className="h-4 w-4" />,
              message: 'Image too dark',
              messageRu: 'Фото слишком тёмное — попробуйте AI улучшение'
            });
          } else if (brightness > 230) {
            issues.push({
              type: 'warning',
              icon: <Sun className="h-4 w-4" />,
              message: 'Image overexposed',
              messageRu: 'Фото слишком светлое — детали могут быть потеряны'
            });
          }
        } catch (e) {
          // CORS issues, skip brightness analysis
        }
      }
      
      // If no issues, add success
      if (issues.length === 0) {
        issues.push({
          type: 'success',
          icon: <CheckCircle className="h-4 w-4" />,
          message: 'Great photo!',
          messageRu: 'Отличное фото!'
        });
      }
      
      resolve(issues);
    };
    
    img.onerror = () => {
      resolve([]);
    };
    
    img.src = imageUrl;
  });
}

// Tips based on photo count
function getPhotoCountTips(count: number): QualityIssue | null {
  if (count === 0) {
    return {
      type: 'tip',
      icon: <Camera className="h-4 w-4" />,
      message: 'Add at least 5 photos',
      messageRu: 'Добавьте минимум 5 фото для лучшего отклика'
    };
  }
  
  if (count < 5) {
    return {
      type: 'tip',
      icon: <Lightbulb className="h-4 w-4" />,
      message: 'More photos = more bookings',
      messageRu: `Ещё ${5 - count} фото — объявления с 5+ фото получают на 40% больше просмотров`
    };
  }
  
  if (count >= 10) {
    return {
      type: 'success',
      icon: <Sparkles className="h-4 w-4" />,
      message: 'Excellent coverage!',
      messageRu: 'Отличный набор фото!'
    };
  }
  
  return null;
}

export function ImageQualityTips({ 
  imageUrl, 
  imageCount, 
  className 
}: ImageQualityTipsProps) {
  const [issues, setIssues] = useState<QualityIssue[]>([]);
  const [countTip, setCountTip] = useState<QualityIssue | null>(null);

  // Analyze current image
  useEffect(() => {
    if (imageUrl) {
      analyzeImageQuality(imageUrl).then(setIssues);
    } else {
      setIssues([]);
    }
  }, [imageUrl]);

  // Update count tip
  useEffect(() => {
    setCountTip(getPhotoCountTips(imageCount));
  }, [imageCount]);

  const allTips = [...issues, ...(countTip ? [countTip] : [])];

  if (allTips.length === 0) return null;

  return (
    <div className={cn("space-y-2", className)}>
      <AnimatePresence mode="popLayout">
        {allTips.map((tip, index) => (
          <motion.div
            key={`${tip.messageRu}-${index}`}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className={cn(
              "flex items-start gap-3 p-3 rounded-lg text-sm",
              tip.type === 'error' && "bg-destructive/10 text-destructive",
              tip.type === 'warning' && "bg-warning/10 text-warning",
              tip.type === 'success' && "bg-success/10 text-success",
              tip.type === 'tip' && "bg-primary/10 text-primary"
            )}
          >
            <span className="shrink-0 mt-0.5">{tip.icon}</span>
            <span>{tip.messageRu}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
