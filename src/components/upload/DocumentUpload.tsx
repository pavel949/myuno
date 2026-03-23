import { useState, useCallback, useRef, useEffect } from 'react';
import { logger } from '@/lib/logger';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Camera, Upload, X, Loader2, FileText, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface DocumentUploadProps {
  value?: string;
  onChange: (url: string) => void;
  folder?: string;
  className?: string;
  placeholder?: string;
  showCamera?: boolean;
  accept?: string;
}

export function DocumentUpload({ 
  value, 
  onChange, 
  folder = 'documents',
  className = '',
  placeholder = 'Upload document',
  showCamera = false,
  accept = 'image/jpeg,image/png,image/webp,application/pdf'
}: DocumentUploadProps) {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
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

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Файл слишком большой (макс. 10MB)');
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Неподдерживаемый формат файла');
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}.${fileExt}`;
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
        toast.success('Файл загружен');
      }
    } catch (error) {
      logger.error('Upload error:', error);
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

  const isPdf = value?.toLowerCase().endsWith('.pdf');
  const isImage = value && !isPdf;

  return (
    <div className={cn('relative', className)}>
      {value ? (
        <div className="relative group">
          {isPdf ? (
            <div className="w-full h-32 rounded-lg border border-border bg-muted/50 flex flex-col items-center justify-center gap-2">
              <FileText className="h-10 w-10 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">PDF Document</span>
            </div>
          ) : (
            <img 
              src={value} 
              alt="Uploaded" 
              className="w-full h-32 object-cover rounded-lg border border-border"
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
        <div className="space-y-2">
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
                variant="outline"
                className="w-full h-14 gap-2"
                onClick={() => cameraInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <Camera className="h-5 w-5" />
                    {placeholder}
                  </>
                )}
              </Button>
            </>
          )}
          
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
                {showCamera ? 'Или выбрать из галереи' : placeholder}
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
