/**
 * SingleImageMode - Single image upload for covers, banners, etc.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import imageCompression from 'browser-image-compression';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Upload, X, Loader2, Pencil, ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { ImageEditor } from '../ImageEditor';
import type { CompressionConfig } from '../shared/ImageCompressor';

interface SingleImageModeProps {
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  bucket?: string;
  aspectRatio?: number;
  placeholder?: string;
  enableEditing?: boolean;
  compressionConfig?: Partial<CompressionConfig>;
  className?: string;
  disabled?: boolean;
}

export function SingleImageMode({
  value,
  onChange,
  folder = 'images',
  bucket = 'vendor-uploads',
  aspectRatio = 16/9,
  placeholder = 'Загрузить изображение',
  enableEditing = true,
  compressionConfig = {},
  className,
  disabled = false,
}: SingleImageModeProps) {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showEditor, setShowEditor] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  const compressionOptions = {
    maxSizeMB: compressionConfig.maxSizeMB || 1,
    maxWidthOrHeight: compressionConfig.maxWidthOrHeight || 2048,
    useWebWorker: true,
    fileType: 'image/webp' as const,
    initialQuality: 0.85,
  };

  const uploadFile = useCallback(async (file: File) => {
    if (!user) {
      toast.error('Необходимо авторизоваться');
      return;
    }

    // Validate
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Неподдерживаемый формат файла');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Файл слишком большой (макс. 10MB)');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Compress
      const compressedFile = await imageCompression(file, {
        ...compressionOptions,
        onProgress: (progress) => {
          if (isMountedRef.current) {
            setUploadProgress(Math.round(progress * 0.5));
          }
        }
      });

      setUploadProgress(50);

      const fileName = `${Date.now()}-${crypto.randomUUID().slice(0, 12)}.webp`;
      const filePath = `${user.id}/${folder}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, compressedFile, {
          contentType: 'image/webp',
          cacheControl: '31536000'
        });

      if (uploadError) throw uploadError;

      setUploadProgress(100);

      const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(filePath);

      if (isMountedRef.current) {
        onChange(publicUrl);
        toast.success('Изображение загружено');
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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      uploadFile(file);
    }
  };

  const handleRemove = () => {
    onChange('');
  };

  const handleEditSave = (newUrl: string) => {
    onChange(newUrl);
    setShowEditor(false);
  };

  // Calculate aspect ratio styles
  const aspectPadding = aspectRatio ? `${(1 / aspectRatio) * 100}%` : undefined;

  return (
    <div className={cn("relative", className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileSelect}
        className="hidden"
        disabled={isUploading || disabled}
      />

      {value ? (
        <div 
          className="relative group rounded-xl overflow-hidden border-2 border-border"
          style={aspectRatio ? { paddingTop: aspectPadding } : undefined}
        >
          <img 
            src={value} 
            alt="Uploaded" 
            className={cn(
              "w-full object-cover",
              aspectRatio ? "absolute inset-0 h-full" : "h-40"
            )}
          />
          
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
            {enableEditing && (
              <Button
                type="button"
                variant="secondary"
                size="icon"
                onClick={() => setShowEditor(true)}
                disabled={disabled}
                className="h-10 w-10"
              >
                <Pencil className="h-5 w-5" />
              </Button>
            )}
            <Button
              type="button"
              variant="secondary"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              className="h-10 w-10"
            >
              <Upload className="h-5 w-5" />
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="icon"
              onClick={handleRemove}
              disabled={disabled}
              className="h-10 w-10"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          disabled={isUploading || disabled}
          className={cn(
            "w-full rounded-xl border-2 border-dashed transition-all",
            "flex flex-col items-center justify-center gap-3",
            disabled && "opacity-50 cursor-not-allowed",
            isDragOver 
              ? "border-primary bg-primary/5" 
              : "border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/30"
          )}
          style={aspectRatio ? { paddingTop: aspectPadding } : { padding: '3rem 0' }}
        >
          <div className={cn(
            "flex flex-col items-center justify-center gap-3",
            aspectRatio && "absolute inset-0"
          )}>
            {isUploading ? (
              <>
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                <div className="w-24">
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all duration-300 rounded-full"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <ImageIcon className="h-6 w-6 text-primary" />
                </div>
                <div className="text-center">
                  <p className="font-medium text-sm">{placeholder}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Перетащите или нажмите
                  </p>
                </div>
              </>
            )}
          </div>
        </button>
      )}

      {/* Image Editor */}
      {enableEditing && showEditor && value && (
        <ImageEditor
          open={showEditor}
          onOpenChange={setShowEditor}
          imageUrl={value}
          onSave={handleEditSave}
          userId={user?.id}
          folder={folder}
        />
      )}
    </div>
  );
}
