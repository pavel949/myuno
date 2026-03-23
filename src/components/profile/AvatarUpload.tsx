import React, { useState, useRef, useEffect } from 'react';
import { logger } from '@/lib/logger';
import { supabase } from '@/integrations/supabase/client';
import { Camera, User, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface AvatarUploadProps {
  value: string | null;
  onChange: (url: string) => void;
  name?: string;
  className?: string;
}

export function AvatarUpload({ value, onChange, name, className }: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  const getInitials = (fullName: string | undefined) => {
    if (!fullName) return '';
    return fullName
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Пожалуйста, выберите изображение');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Размер файла не должен превышать 5MB');
      return;
    }

    setIsUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `avatar-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('vendor-uploads')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('vendor-uploads')
        .getPublicUrl(filePath);

      if (isMountedRef.current) {
        onChange(urlData.publicUrl);
        toast.success('Аватар загружен');
      }
    } catch (error) {
      logger.error('Upload error:', error);
      if (isMountedRef.current) {
        toast.error('Ошибка загрузки аватара');
      }
    } finally {
      if (isMountedRef.current) {
        setIsUploading(false);
      }
    }
  };

  return (
    <div className={cn('flex flex-col items-center gap-3', className)}>
      <div className="relative">
        <div className="w-24 h-24 rounded-full overflow-hidden bg-muted border-2 border-border flex items-center justify-center">
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
            isUploading && 'pointer-events-none'
          )}
        >
          {isUploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Camera className="w-4 h-4" />
          )}
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            disabled={isUploading}
          />
        </label>
      </div>

      <p className="text-xs text-muted-foreground">
        Нажмите на камеру для загрузки
      </p>
    </div>
  );
}
