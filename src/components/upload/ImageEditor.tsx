/**
 * ImageEditor - Rotate, Crop, and AI Enhance
 * Airbnb-style photo editing tools
 */

import { useState, useRef, useCallback, lazy, Suspense } from 'react';
import type { CropperRef } from 'react-advanced-cropper';

// Lazy-load react-advanced-cropper (~40KB) — only needed when user enters crop mode
const Cropper = lazy(() =>
  import('react-advanced-cropper').then(mod => {
    // Also load the CSS side-effect
    import('react-advanced-cropper/dist/style.css');
    return { default: mod.Cropper };
  })
);
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  RotateCw, 
  Crop, 
  Sparkles, 
  Check, 
  X, 
  Loader2,
  Sun,
  Contrast,
  ZoomIn,
  ZoomOut,
  Undo2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface ImageEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  onSave: (newUrl: string) => void;
  userId?: string;
  folder?: string;
}

type EditMode = 'view' | 'crop';

export function ImageEditor({
  open,
  onOpenChange,
  imageUrl,
  onSave,
  userId,
  folder = 'images'
}: ImageEditorProps) {
  const [mode, setMode] = useState<EditMode>('view');
  const [rotation, setRotation] = useState(0);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentImage, setCurrentImage] = useState(imageUrl);
  const [history, setHistory] = useState<string[]>([imageUrl]);
  const cropperRef = useRef<CropperRef>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Reset state when dialog opens
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setCurrentImage(imageUrl);
      setHistory([imageUrl]);
      setRotation(0);
      setMode('view');
    }
    onOpenChange(newOpen);
  };

  // Rotate image 90 degrees
  const handleRotate = useCallback(async () => {
    const newRotation = (rotation + 90) % 360;
    setRotation(newRotation);
    
    // Apply rotation using canvas
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      const canvas = canvasRef.current || document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Swap dimensions for 90/270 degree rotations
      if (newRotation === 90 || newRotation === 270) {
        canvas.width = img.height;
        canvas.height = img.width;
      } else {
        canvas.width = img.width;
        canvas.height = img.height;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((newRotation * Math.PI) / 180);
      
      if (newRotation === 90 || newRotation === 270) {
        ctx.drawImage(img, -img.width / 2, -img.height / 2);
      } else {
        ctx.drawImage(img, -img.width / 2, -img.height / 2);
      }
      
      ctx.restore();

      const rotatedUrl = canvas.toDataURL('image/webp', 0.9);
      setCurrentImage(rotatedUrl);
      setHistory(prev => [...prev, rotatedUrl]);
    };
    
    img.src = currentImage.startsWith('data:') ? currentImage : `${currentImage}?t=${Date.now()}`;
  }, [currentImage, rotation]);

  // Apply crop
  const handleApplyCrop = useCallback(() => {
    if (!cropperRef.current) return;
    
    const canvas = cropperRef.current.getCanvas();
    if (!canvas) return;

    const croppedUrl = canvas.toDataURL('image/webp', 0.9);
    setCurrentImage(croppedUrl);
    setHistory(prev => [...prev, croppedUrl]);
    setMode('view');
    setRotation(0);
    toast.success('Обрезка применена');
  }, []);

  // AI Enhance via edge function
  const handleAIEnhance = useCallback(async () => {
    setIsEnhancing(true);
    
    try {
      // Call edge function for AI enhancement
      const { data, error } = await supabase.functions.invoke('ai-image-enhance', {
        body: { 
          imageUrl: currentImage,
          enhancement: 'auto' // auto, brightness, contrast
        }
      });

      if (error) throw error;
      
      if (data?.enhancedUrl) {
        setCurrentImage(data.enhancedUrl);
        setHistory(prev => [...prev, data.enhancedUrl]);
        toast.success('Фото улучшено!');
      }
    } catch (error) {
      console.error('AI enhance error:', error);
      toast.error('Не удалось улучшить фото');
    } finally {
      setIsEnhancing(false);
    }
  }, [currentImage]);

  // Undo last action
  const handleUndo = useCallback(() => {
    if (history.length <= 1) return;
    
    const newHistory = history.slice(0, -1);
    setHistory(newHistory);
    setCurrentImage(newHistory[newHistory.length - 1]);
    setRotation(0);
  }, [history]);

  // Save changes
  const handleSave = useCallback(async () => {
    if (currentImage === imageUrl) {
      onOpenChange(false);
      return;
    }

    setIsSaving(true);
    
    try {
      // Convert data URL to blob
      const response = await fetch(currentImage);
      const blob = await response.blob();
      
      // Upload to Supabase
      const fileName = `${Date.now()}-edited.webp`;
      const filePath = `${userId}/${folder}/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('vendor-uploads')
        .upload(filePath, blob, {
          contentType: 'image/webp',
          cacheControl: '31536000'
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('vendor-uploads')
        .getPublicUrl(filePath);

      onSave(publicUrl);
      onOpenChange(false);
      toast.success('Изменения сохранены');
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Ошибка сохранения');
    } finally {
      setIsSaving(false);
    }
  }, [currentImage, imageUrl, userId, folder, onSave, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="flex items-center justify-between">
            <span>Редактирование фото</span>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleUndo}
                disabled={history.length <= 1 || isSaving}
              >
                <Undo2 className="h-4 w-4 mr-1" />
                Отменить
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        {/* Image Area */}
        <div className="relative flex-1 bg-black/95 min-h-[400px] max-h-[60vh] overflow-hidden">
          {mode === 'view' ? (
            <div className="w-full h-full flex items-center justify-center p-4">
              <img
                src={currentImage}
                alt="Preview"
                className="max-w-full max-h-full object-contain"
                style={{ transform: `rotate(${rotation}deg)` }}
              />
            </div>
          ) : (
            <Suspense fallback={<div className="w-full h-full flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
              <Cropper
                ref={cropperRef}
                src={currentImage}
                className="w-full h-full"
                stencilProps={{
                  aspectRatio: undefined,
                  movable: true,
                  resizable: true,
                }}
              />
            </Suspense>
          )}
          
          {/* AI Enhance overlay */}
          {isEnhancing && (
            <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
              <span className="text-white font-medium">AI улучшает фото...</span>
            </div>
          )}
        </div>

        {/* Tools */}
        <div className="p-4 border-t bg-muted/30">
          <div className="flex items-center justify-center gap-2">
            {mode === 'view' ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRotate}
                  disabled={isSaving || isEnhancing}
                  className="gap-2"
                >
                  <RotateCw className="h-4 w-4" />
                  Повернуть
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setMode('crop')}
                  disabled={isSaving || isEnhancing}
                  className="gap-2"
                >
                  <Crop className="h-4 w-4" />
                  Обрезать
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAIEnhance}
                  disabled={isSaving || isEnhancing}
                  className="gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  AI Улучшение
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMode('view')}
                  className="gap-2"
                >
                  <X className="h-4 w-4" />
                  Отмена
                </Button>
                
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleApplyCrop}
                  className="gap-2"
                >
                  <Check className="h-4 w-4" />
                  Применить обрезку
                </Button>
              </>
            )}
          </div>
        </div>

        <DialogFooter className="p-4 border-t">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Отмена
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || isEnhancing}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Сохранение...
              </>
            ) : (
              'Сохранить'
            )}
          </Button>
        </DialogFooter>
        
        {/* Hidden canvas for rotation */}
        <canvas ref={canvasRef} className="hidden" />
      </DialogContent>
    </Dialog>
  );
}
