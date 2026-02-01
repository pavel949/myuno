import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, X, Loader2, ImageIcon, Link, Check } from 'lucide-react';
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
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlValue, setUrlValue] = useState('');
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

  const handleUrlSubmit = () => {
    const trimmed = urlValue.trim();
    if (!trimmed) {
      toast.error('Введите URL');
      return;
    }
    
    // Basic URL validation
    try {
      new URL(trimmed);
    } catch {
      toast.error('Некорректный URL');
      return;
    }

    onChange(trimmed);
    setUrlValue('');
    setShowUrlInput(false);
    toast.success('Фото добавлено по URL');
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
      ) : showUrlInput ? (
        <div className="flex flex-col gap-2 p-4 border-2 border-dashed border-border rounded-lg">
          <div className="flex gap-2">
            <Input
              type="url"
              placeholder="https://example.com/image.jpg"
              value={urlValue}
              onChange={(e) => setUrlValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleUrlSubmit())}
              className="flex-1"
              autoFocus
            />
            <Button type="button" size="icon" onClick={handleUrlSubmit}>
              <Check className="h-4 w-4" />
            </Button>
            <Button type="button" size="icon" variant="ghost" onClick={() => setShowUrlInput(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <span className="text-xs text-muted-foreground">Вставьте ссылку на изображение</span>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
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
                <ImageIcon className="h-6 w-6 text-muted-foreground mb-1" />
                <span className="text-sm text-muted-foreground">{placeholder}</span>
              </>
            )}
          </label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => setShowUrlInput(true)}
          >
            <Link className="h-4 w-4 mr-2" />
            Добавить по ссылке
          </Button>
        </div>
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

  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlValue, setUrlValue] = useState('');

  const handleUrlSubmit = () => {
    const trimmed = urlValue.trim();
    if (!trimmed) {
      toast.error('Введите URL');
      return;
    }
    
    // Basic URL validation
    try {
      new URL(trimmed);
    } catch {
      toast.error('Некорректный URL');
      return;
    }

    if (value.length >= maxImages) {
      toast.error(`Максимум ${maxImages} фото`);
      return;
    }

    onChange([...value, trimmed]);
    setUrlValue('');
    toast.success('Фото добавлено по URL');
  };

  const handleMultipleUrls = (text: string) => {
    // Split by newlines or commas and extract URLs
    const urls = text
      .split(/[\n,]+/)
      .map(s => s.trim())
      .filter(s => {
        try {
          new URL(s);
          return true;
        } catch {
          return false;
        }
      });
    
    if (urls.length === 0) {
      toast.error('Не найдено валидных URL');
      return;
    }

    const remainingSlots = maxImages - value.length;
    const urlsToAdd = urls.slice(0, remainingSlots);
    
    onChange([...value, ...urlsToAdd]);
    setUrlValue('');
    toast.success(`Добавлено ${urlsToAdd.length} фото по URL`);
    
    if (urls.length > urlsToAdd.length) {
      toast.warning(`${urls.length - urlsToAdd.length} URL пропущено (лимит ${maxImages})`);
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* URL input mode */}
      {showUrlInput ? (
        <div className="p-4 border-2 border-dashed border-border rounded-lg space-y-3">
          <div className="flex gap-2">
            <Input
              type="url"
              placeholder="https://example.com/image.jpg"
              value={urlValue}
              onChange={(e) => setUrlValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleUrlSubmit())}
              className="flex-1"
              autoFocus
            />
            <Button type="button" size="icon" onClick={handleUrlSubmit} disabled={!urlValue.trim()}>
              <Check className="h-4 w-4" />
            </Button>
            <Button type="button" size="icon" variant="ghost" onClick={() => setShowUrlInput(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="text-xs text-muted-foreground">
            Вставьте ссылку на изображение. Можно несколько URL через запятую или с новой строки.
          </div>
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            className="w-full"
            onClick={() => {
              if (urlValue.includes(',') || urlValue.includes('\n')) {
                handleMultipleUrls(urlValue);
              } else {
                handleUrlSubmit();
              }
            }}
            disabled={!urlValue.trim()}
          >
            Добавить все URL
          </Button>
        </div>
      ) : (
        <>
          {/* Upload area */}
          <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
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
                <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                <span className="text-sm text-muted-foreground">
                  Выберите фото или перетащите
                </span>
                <span className="text-xs text-muted-foreground">
                  {value.length} / {maxImages}
                </span>
              </>
            )}
          </label>

          {/* URL button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => setShowUrlInput(true)}
            disabled={value.length >= maxImages}
          >
            <Link className="h-4 w-4 mr-2" />
            Добавить по ссылке
          </Button>
        </>
      )}

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
