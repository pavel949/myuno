import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Camera, Upload, X, Loader2, FileText, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface DragDropReceiptUploadProps {
  value?: string;
  onChange: (url: string) => void;
  folder?: string;
  className?: string;
  placeholder?: string;
  showCamera?: boolean;
  accept?: string;
}

export function DragDropReceiptUpload({ 
  value, 
  onChange, 
  folder = 'receipts',
  className = '',
  placeholder,
  showCamera = true,
  accept = 'image/jpeg,image/png,image/webp,application/pdf'
}: DragDropReceiptUploadProps) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const isMountedRef = useRef(true);
  const dragCounterRef = useRef(0);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  const uploadFile = useCallback(async (file: File) => {
    if (!user) {
      toast.error(isRu ? 'Необходимо авторизоваться' : 'Please sign in');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error(isRu ? 'Файл слишком большой (макс. 10MB)' : 'File too large (max 10MB)');
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast.error(isRu ? 'Неподдерживаемый формат файла' : 'Unsupported file format');
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${crypto.randomUUID().slice(0, 12)}.${fileExt}`;
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
        toast.success(isRu ? 'Файл загружен' : 'File uploaded');
      }
    } catch (error) {
      console.error('Upload error:', error);
      if (isMountedRef.current) {
        toast.error(isRu ? 'Ошибка загрузки' : 'Upload failed');
      }
    } finally {
      if (isMountedRef.current) {
        setIsUploading(false);
      }
    }
  }, [user, folder, onChange, isRu]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounterRef.current = 0;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      uploadFile(file);
    }
  };

  const handleRemove = () => {
    onChange('');
  };

  const isPdf = value?.toLowerCase().endsWith('.pdf');

  const defaultPlaceholder = isRu ? 'Сфотографировать чек' : 'Take receipt photo';

  return (
    <div className={cn('relative', className)}>
      {value ? (
        <div className="relative group">
          {isPdf ? (
            <div className="w-full h-32 rounded-none border border-border bg-muted/50 flex flex-col items-center justify-center gap-2">
              <FileText className="h-10 w-10 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">PDF Document</span>
            </div>
          ) : (
            <img 
              src={value} 
              alt="Uploaded" 
              className="w-full h-32 object-cover rounded-none border border-border"
            />
          )}
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div 
          className="space-y-2"
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {/* Drag & Drop Zone */}
          <div 
            className={cn(
              'relative border-2 border-dashed rounded-none transition-all duration-200',
              isDragging 
                ? 'border-primary bg-primary/10 scale-[1.02]' 
                : 'border-muted-foreground/30 hover:border-muted-foreground/50',
              isUploading && 'opacity-50 pointer-events-none'
            )}
          >
            {isDragging && (
              <div className="absolute inset-0 flex items-center justify-center bg-primary/5 rounded-none z-10">
                <div className="text-center">
                  <div className="flex justify-center gap-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <div 
                        key={i} 
                        className="w-2 h-2 rounded-full bg-primary animate-pulse"
                        style={{ animationDelay: `${i * 0.1}s` }}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium text-primary">
                    {isRu ? 'Отпустите файл' : 'Drop file here'}
                  </span>
                </div>
              </div>
            )}

            {showCamera && (
              <>
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={isUploading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  className={cn(
                    'w-full h-20 gap-3 flex-col',
                    isDragging && 'opacity-0'
                  )}
                  onClick={() => cameraInputRef.current?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    <>
                      <Camera className="h-6 w-6 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {placeholder || defaultPlaceholder}
                      </span>
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
          
          {/* File picker fallback */}
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileSelect}
            className="hidden"
            disabled={isUploading}
          />
          
          <Button
            type="button"
            variant="ghost"
            className="w-full h-10 text-muted-foreground gap-2"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading && !showCamera ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Upload className="h-4 w-4" />
                {isRu ? 'Или выбрать из галереи' : 'Or choose from gallery'}
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
