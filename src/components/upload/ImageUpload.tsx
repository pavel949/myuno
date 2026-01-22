import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Upload, X, Loader2, ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  folder?: string;
  className?: string;
  placeholder?: string;
}

export function ImageUpload({ 
  value, 
  onChange, 
  folder = 'images',
  className = '',
  placeholder = 'Загрузить фото'
}: ImageUploadProps) {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  const uploadFile = useCallback(async (file: File) => {
    if (!user) {
      toast.error('Необходимо авторизоваться');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Файл слишком большой (макс. 5MB)');
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Неподдерживаемый формат файла');
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${user.id}/${folder}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('vendor-uploads')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('vendor-uploads')
        .getPublicUrl(filePath);

      if (isMountedRef.current) {
        onChange(publicUrl);
        toast.success('Фото загружено');
      }
    } catch (error) {
      console.error('Upload error:', error);
      if (isMountedRef.current) {
        toast.error('Ошибка загрузки');
      }
    } finally {
      if (isMountedRef.current) {
        setIsUploading(false);
      }
    }
  }, [user, folder, onChange]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  };

  const handleRemove = () => {
    onChange('');
  };

  return (
    <div className={`relative ${className}`}>
      {value ? (
        <div className="relative group">
          <img 
            src={value} 
            alt="Uploaded" 
            className="w-full h-32 object-cover rounded-lg border border-border"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleFileSelect}
            className="hidden"
            disabled={isUploading}
          />
          {isUploading ? (
            <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
          ) : (
            <>
              <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
              <span className="text-sm text-muted-foreground">{placeholder}</span>
            </>
          )}
        </label>
      )}
    </div>
  );
}

interface MultiImageUploadProps {
  value: string[];
  onChange: (urls: string[]) => void;
  folder?: string;
  maxImages?: number;
  className?: string;
}

export function MultiImageUpload({
  value = [],
  onChange,
  folder = 'images',
  maxImages = 20,
  className = ''
}: MultiImageUploadProps) {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  const uploadFiles = useCallback(async (files: File[]) => {
    if (!user) {
      toast.error('Необходимо авторизоваться');
      return;
    }

    const remainingSlots = maxImages - value.length;
    if (remainingSlots <= 0) {
      toast.error(`Максимум ${maxImages} фото`);
      return;
    }

    // Filter and limit files
    const validFiles = files
      .filter(file => {
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name}: слишком большой (макс. 5MB)`);
          return false;
        }
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!allowedTypes.includes(file.type)) {
          toast.error(`${file.name}: неподдерживаемый формат`);
          return false;
        }
        return true;
      })
      .slice(0, remainingSlots);

    if (validFiles.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);
    const uploadedUrls: string[] = [];

    try {
      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${user.id}/${folder}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('vendor-uploads')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('vendor-uploads')
          .getPublicUrl(filePath);

        uploadedUrls.push(publicUrl);
        setUploadProgress(Math.round(((i + 1) / validFiles.length) * 100));
      }

      if (isMountedRef.current) {
        onChange([...value, ...uploadedUrls]);
        toast.success(`Загружено ${uploadedUrls.length} фото`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      if (isMountedRef.current) {
        // Still add successfully uploaded images
        if (uploadedUrls.length > 0) {
          onChange([...value, ...uploadedUrls]);
          toast.warning(`Загружено ${uploadedUrls.length} из ${validFiles.length} фото`);
        } else {
          toast.error('Ошибка загрузки');
        }
      }
    } finally {
      if (isMountedRef.current) {
        setIsUploading(false);
        setUploadProgress(0);
      }
    }
  }, [user, folder, value, onChange, maxImages]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      uploadFiles(files);
    }
    // Reset input to allow selecting same files again
    e.target.value = '';
  };

  const handleRemove = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const handleSetCover = (index: number) => {
    if (index === 0) return;
    const newValue = [...value];
    const [removed] = newValue.splice(index, 1);
    newValue.unshift(removed);
    onChange(newValue);
    toast.success('Обложка установлена');
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Upload area */}
      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleFileSelect}
          className="hidden"
          disabled={isUploading || value.length >= maxImages}
          multiple
        />
        {isUploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <span className="text-sm text-muted-foreground">
              Загрузка... {uploadProgress}%
            </span>
          </div>
        ) : value.length >= maxImages ? (
          <span className="text-sm text-muted-foreground">
            Максимум {maxImages} фото
          </span>
        ) : (
          <>
            <Upload className="h-8 w-8 text-muted-foreground mb-2" />
            <span className="text-sm text-muted-foreground">
              Выберите фото или перетащите сюда
            </span>
            <span className="text-xs text-muted-foreground mt-1">
              {value.length} / {maxImages} фото
            </span>
          </>
        )}
      </label>

      {/* Image grid */}
      {value.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {value.map((url, index) => (
            <div key={url} className="relative group aspect-square">
              <img 
                src={url} 
                alt={`Image ${index + 1}`}
                className="w-full h-full object-cover rounded-lg border border-border"
              />
              {index === 0 && (
                <span className="absolute bottom-1 left-1 text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded">
                  Обложка
                </span>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-1">
                {index !== 0 && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleSetCover(index)}
                    title="Сделать обложкой"
                  >
                    <ImageIcon className="h-3.5 w-3.5" />
                  </Button>
                )}
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => handleRemove(index)}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
