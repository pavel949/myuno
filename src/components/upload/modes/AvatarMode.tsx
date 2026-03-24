/**
 * AvatarMode - Circular avatar upload with cropping and initials fallback
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import imageCompression from 'browser-image-compression';
import { supabase } from '@/integrations/supabase/client';
import { Camera, User, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import type { CompressionConfig } from '../shared/ImageCompressor';

interface AvatarModeProps {
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  bucket?: string;
  name?: string;
  compressionConfig?: Partial<CompressionConfig>;
  className?: string;
  disabled?: boolean;
}

export function AvatarMode({
  value,
  onChange,
  folder = 'avatars',
  bucket = 'vendor-uploads',
  name,
  compressionConfig = {},
  className,
  disabled = false,
}: AvatarModeProps) {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  const compressionOptions = {
    maxSizeMB: compressionConfig.maxSizeMB || 0.5,
    maxWidthOrHeight: compressionConfig.maxWidthOrHeight || 512,
    useWebWorker: true,
    fileType: 'image/webp' as const,
    initialQuality: 0.85,
  };

  const getInitials = (fullName: string | undefined) => {
    if (!fullName) return '';
    return fullName
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Пожалуйста, выберите изображение');
      return;
    }

    // Validate file size (max 5MB before compression)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Размер файла не должен превышать 5MB');
      return;
    }

    if (!user) {
      toast.error('Необходимо авторизоваться');
      return;
    }

    setIsUploading(true);

    try {
      // Compress image
      const compressedFile = await imageCompression(file, compressionOptions);

      const fileName = `avatar-${Date.now()}.webp`;
      const filePath = `${user.id}/${folder}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, compressedFile, {
          contentType: 'image/webp',
          cacheControl: '31536000'
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(filePath);

      if (isMountedRef.current) {
        onChange(publicUrl);
        toast.success('Аватар загружен');
      }
    } catch (error) {
      console.error('Upload error:', error);
      if (isMountedRef.current) {
        toast.error('Ошибка загрузки аватара');
      }
    } finally {
      if (isMountedRef.current) {
        setIsUploading(false);
      }
    }
    
    // Reset input
    e.target.value = '';
  }, [user, folder, bucket, compressionOptions, onChange]);

  return (
    <div className={cn('flex flex-col items-center gap-3', className)}>
      <div className="relative">
        <div className={cn(
          "w-24 h-24 rounded-full overflow-hidden bg-muted border-2 border-border flex items-center justify-center",
          "transition-all duration-200",
          disabled && "opacity-50"
        )}>
          {value ? (
            <img
              src={value}
              alt="Avatar"
              className="w-full h-full object-cover"
            />
          ) : name ? (
            <span className="text-2xl font-semibold text-muted-foreground">
              {getInitials(name)}
            </span>
          ) : (
            <User className="w-10 h-10 text-muted-foreground" />
          )}
        </div>

        <label
          className={cn(
            'absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-primary-foreground',
            'flex items-center justify-center cursor-pointer shadow-md',
            'hover:bg-primary/90 transition-colors',
            (isUploading || disabled) && 'pointer-events-none opacity-50'
          )}
        >
          {isUploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Camera className="w-4 h-4" />
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            disabled={isUploading || disabled}
          />
        </label>
      </div>

      <p className="text-xs text-muted-foreground">
        Нажмите на камеру для загрузки
      </p>
    </div>
  );
}
