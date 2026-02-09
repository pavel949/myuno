import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, Upload, Loader2, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import browserImageCompression from 'browser-image-compression';

export interface ScannedProviderData {
  name: string;
  business_category: string;
  description_en: string;
  description_ru: string;
  phone: string;
  email: string;
  website: string;
  address: string;
}

interface BusinessCardScanButtonProps {
  onDataExtracted: (data: ScannedProviderData) => void;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export function BusinessCardScanButton({
  onDataExtracted,
  variant = 'outline',
  size = 'default',
  className,
}: BusinessCardScanButtonProps) {
  const { language } = useLanguage();
  const { toast } = useToast();
  const isRu = language === 'ru';

  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // CRITICAL: Sync video element with stream when both are ready
  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(console.error);
    }
  }, [stream, isCameraActive]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraActive(false);
  }, [stream]);

  const resetState = useCallback(() => {
    setImagePreview(null);
    setIsProcessing(false);
    stopCamera();
  }, [stopCamera]);

  const handleClose = useCallback(() => {
    resetState();
    setIsOpen(false);
  }, [resetState]);

  const processImage = useCallback(async (base64Image: string) => {
    setIsProcessing(true);

    try {
      const { data, error } = await supabase.functions.invoke('scan-business-card', {
        body: { imageBase64: base64Image }
      });

      if (error) throw error;

      // Map extracted data to form fields
      const formData: ScannedProviderData = {
        name: data.company_name || '',
        business_category: data.vertical || 'other',
        description_en: data.description || '',
        description_ru: data.description || '',
        phone: data.phone?.[0] || '',
        email: data.email || '',
        website: data.website || '',
        address: data.address || '',
      };

      onDataExtracted(formData);

      toast({
        title: isRu ? 'Данные извлечены' : 'Data Extracted',
        description: isRu
          ? `Уверенность: ${data.confidence}%. Проверьте и сохраните.`
          : `Confidence: ${data.confidence}%. Review and save.`,
      });

      handleClose();
    } catch (err) {
      console.error('Scan error:', err);
      toast({
        title: isRu ? 'Ошибка сканирования' : 'Scan Error',
        description: isRu ? 'Не удалось распознать карточку' : 'Failed to scan card',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  }, [isRu, toast, onDataExtracted, handleClose]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await browserImageCompression(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      });

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setImagePreview(base64);
        processImage(base64);
      };
      reader.readAsDataURL(compressed);
    } catch (err) {
      console.error('Error processing file:', err);
      toast({
        title: isRu ? 'Ошибка' : 'Error',
        description: isRu ? 'Не удалось обработать изображение' : 'Failed to process image',
        variant: 'destructive',
      });
    }
  }, [isRu, toast, processImage]);

  // CRITICAL: getUserMedia called directly in click handler for gesture context
  const startCamera = useCallback(async () => {
    try {
      // First set camera active to render the video element
      setIsCameraActive(true);
      
      // Then request camera access - directly in click handler
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment', 
          width: { ideal: 1920 }, 
          height: { ideal: 1080 } 
        }
      });
      
      setStream(mediaStream);
    } catch (err: any) {
      console.error('Camera access error:', err);
      setIsCameraActive(false);
      
      if (err.name === 'NotAllowedError') {
        toast({
          title: isRu ? 'Доступ запрещён' : 'Access Denied',
          description: isRu 
            ? 'Разрешите доступ к камере в настройках браузера' 
            : 'Please allow camera access in browser settings',
          variant: 'destructive',
        });
      } else {
        toast({
          title: isRu ? 'Ошибка камеры' : 'Camera Error',
          description: isRu ? 'Не удалось получить доступ к камере' : 'Failed to access camera',
          variant: 'destructive',
        });
      }
    }
  }, [isRu, toast]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(videoRef.current, 0, 0);
    const base64 = canvas.toDataURL('image/jpeg', 0.85);

    setImagePreview(base64);
    stopCamera();
    processImage(base64);
  }, [stopCamera, processImage]);

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        className={className}
        onClick={() => setIsOpen(true)}
        title={isRu ? 'Сканировать визитку' : 'Scan Business Card'}
      >
        <Sparkles className={size === 'icon' ? 'h-4 w-4' : 'h-4 w-4 mr-2'} />
        {size !== 'icon' && (isRu ? 'Сканировать визитку' : 'Scan Business Card')}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              {isRu ? 'Сканировать визитку' : 'Scan Business Card'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Camera/Upload Buttons */}
            {!imagePreview && !isCameraActive && (
              <div className="flex gap-3">
                <Button
                  onClick={startCamera}
                  className="flex-1 h-20 flex-col gap-2"
                >
                  <Camera className="h-6 w-6" />
                  <span className="text-xs">{isRu ? 'Камера' : 'Camera'}</span>
                </Button>

                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 h-20 flex-col gap-2"
                >
                  <Upload className="h-6 w-6" />
                  <span className="text-xs">{isRu ? 'Загрузить' : 'Upload'}</span>
                </Button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            )}

            {/* Camera View */}
            {isCameraActive && (
              <div className="relative aspect-[4/3] bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="border-2 border-white/50 border-dashed rounded-lg w-[85%] h-[65%]" />
                </div>
                <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-3">
                  <Button size="sm" variant="secondary" onClick={stopCamera}>
                    <X className="h-4 w-4 mr-1" />
                    {isRu ? 'Отмена' : 'Cancel'}
                  </Button>
                  <Button size="sm" onClick={capturePhoto}>
                    <Camera className="h-4 w-4 mr-1" />
                    {isRu ? 'Снять' : 'Capture'}
                  </Button>
                </div>
              </div>
            )}

            {/* Image Preview with Processing */}
            {imagePreview && (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Business card"
                  className="w-full max-h-48 object-contain rounded-lg border bg-muted"
                />
                {isProcessing && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-lg">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <span className="text-sm font-medium">
                        {isRu ? 'AI анализирует...' : 'AI analyzing...'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Hint */}
            {!imagePreview && !isCameraActive && (
              <p className="text-xs text-muted-foreground text-center">
                {isRu
                  ? 'Сфотографируйте визитку — AI заполнит форму автоматически'
                  : 'Take a photo of a business card — AI will auto-fill the form'}
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
