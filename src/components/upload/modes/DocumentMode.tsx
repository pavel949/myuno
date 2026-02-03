/**
 * DocumentMode - Document upload with camera support, PDF preview, and quality tips
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import imageCompression from 'browser-image-compression';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Camera, Upload, X, Loader2, FileText, Eye, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { DocumentQualityTips, type DocumentType } from '../shared/DocumentQualityTips';
import type { CompressionConfig } from '../shared/ImageCompressor';

interface DocumentModeProps {
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  bucket?: string;
  documentType?: DocumentType;
  showCamera?: boolean;
  customTips?: string[];
  placeholder?: string;
  compressionConfig?: Partial<CompressionConfig>;
  className?: string;
  disabled?: boolean;
}

export function DocumentMode({
  value,
  onChange,
  folder = 'documents',
  bucket = 'vendor-uploads',
  documentType = 'other',
  showCamera = true,
  customTips,
  placeholder,
  compressionConfig = {},
  className,
  disabled = false,
}: DocumentModeProps) {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  const compressionOptions = {
    maxSizeMB: compressionConfig.maxSizeMB || 2,
    maxWidthOrHeight: compressionConfig.maxWidthOrHeight || 2400,
    useWebWorker: true,
    fileType: 'image/webp' as const,
    initialQuality: 0.9,
  };

  const uploadFile = useCallback(async (file: File) => {
    if (!user) {
      toast.error('Необходимо авторизоваться');
      return;
    }

    // Validate file
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Неподдерживаемый формат. Используйте JPG, PNG, WebP или PDF');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Файл слишком большой (макс. 10MB)');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      let fileToUpload: File | Blob = file;
      let contentType = file.type;
      let extension = file.name.split('.').pop() || 'jpg';

      // Compress images (not PDFs)
      if (file.type.startsWith('image/')) {
        setUploadProgress(10);
        
        const compressedFile = await imageCompression(file, {
          ...compressionOptions,
          onProgress: (progress) => {
            if (isMountedRef.current) {
              setUploadProgress(10 + Math.round(progress * 0.4));
            }
          }
        });
        
        fileToUpload = compressedFile;
        contentType = 'image/webp';
        extension = 'webp';
      }

      setUploadProgress(50);

      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${extension}`;
      const filePath = `${user.id}/${folder}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, fileToUpload, {
          contentType,
          cacheControl: '31536000'
        });

      if (uploadError) throw uploadError;

      setUploadProgress(90);

      const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(filePath);

      if (isMountedRef.current) {
        setUploadProgress(100);
        onChange(publicUrl);
        toast.success('Документ загружен');
      }
    } catch (error) {
      console.error('Upload error:', error);
      if (isMountedRef.current) {
        toast.error('Ошибка загрузки');
      }
    } finally {
      if (isMountedRef.current) {
        setIsUploading(false);
        setUploadProgress(0);
      }
    }
  }, [user, folder, bucket, compressionOptions, onChange]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    e.target.value = '';
  };

  const handleRemove = () => {
    onChange('');
  };

  const isPdf = value?.toLowerCase().endsWith('.pdf');
  const isImage = value && !isPdf;

  const documentTypeLabels: Record<DocumentType, string> = {
    passport: 'паспорт',
    driver_license: 'водительское удостоверение',
    insurance: 'страховку',
    visa: 'визу',
    other: 'документ',
  };

  const defaultPlaceholder = placeholder || `Сфотографируйте ${documentTypeLabels[documentType]}`;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Hidden inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        onChange={handleFileSelect}
        className="hidden"
        disabled={isUploading || disabled}
      />
      
      {showCamera && (
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileSelect}
          className="hidden"
          disabled={isUploading || disabled}
        />
      )}

      {/* Preview or Upload Zone */}
      {value ? (
        <div className="relative group">
          {isPdf ? (
            <div className="w-full h-48 rounded-xl border-2 border-border bg-muted/50 flex flex-col items-center justify-center gap-3">
              <FileText className="h-12 w-12 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">PDF документ</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => window.open(value, '_blank')}
              >
                <Eye className="h-4 w-4 mr-2" />
                Открыть
              </Button>
            </div>
          ) : (
            <div className="relative aspect-[4/3] rounded-xl overflow-hidden border-2 border-border">
              <img 
                src={value} 
                alt="Документ" 
                className="w-full h-full object-contain bg-muted"
              />
            </div>
          )}
          
          {/* Actions overlay */}
          <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            type="button"
            variant="secondary"
            size="icon"
            onClick={() => {
              if (showCamera && cameraInputRef.current) {
                cameraInputRef.current.click();
              } else {
                fileInputRef.current?.click();
              }
            }}
              disabled={disabled}
              className="h-8 w-8"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="icon"
              onClick={handleRemove}
              disabled={disabled}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Main camera button (mobile-first) */}
          {showCamera && (
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              disabled={isUploading || disabled}
              className={cn(
                "w-full py-10 rounded-xl border-2 border-dashed transition-all",
                "flex flex-col items-center justify-center gap-3",
                isUploading 
                  ? "border-primary bg-primary/5" 
                  : "border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/30"
              )}
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-10 w-10 text-primary animate-spin" />
                  <div className="w-32">
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all duration-300 rounded-full"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 text-center">{uploadProgress}%</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Camera className="h-8 w-8 text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="font-medium">{defaultPlaceholder}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Нажмите для открытия камеры
                    </p>
                  </div>
                </>
              )}
            </button>
          )}

          {/* Secondary file picker */}
          <Button
            type="button"
            variant="ghost"
            className="w-full h-12 text-muted-foreground gap-2"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || disabled}
          >
            <Upload className="h-4 w-4" />
            {showCamera ? 'Или выбрать из файлов' : defaultPlaceholder}
          </Button>

          {/* Format hints */}
          <div className="flex justify-center gap-3 text-xs text-muted-foreground">
            <span>JPG</span>
            <span>•</span>
            <span>PNG</span>
            <span>•</span>
            <span>PDF</span>
            <span>•</span>
            <span>до 10MB</span>
          </div>
        </div>
      )}

      {/* Quality Tips */}
      <DocumentQualityTips
        documentType={documentType}
        imageUrl={isImage ? value : undefined}
        customTips={customTips}
      />
    </div>
  );
}
