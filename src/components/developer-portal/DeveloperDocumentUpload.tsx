/**
 * DeveloperDocumentUpload — uploads a single project document to the
 * private `developer-documents` bucket.
 *
 * Path convention:  <developer_id>/<project_id>/<timestamp>-<file>
 *
 * Returns a SIGNED URL (1 year) since the bucket is private.
 * Files are visible only to the developer team and platform admins.
 */
import { useCallback, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Upload, Loader2, FileText, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface DeveloperDocumentUploadProps {
  developerId: string;
  projectId: string;
  onUploaded: (signedUrl: string, fileName: string, storagePath: string) => void;
  className?: string;
  accept?: string;
  /** Max file size in MB (default 25) */
  maxSizeMB?: number;
}

export function DeveloperDocumentUpload({
  developerId,
  projectId,
  onUploaded,
  className,
  accept = 'application/pdf,image/jpeg,image/png,image/webp,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword',
  maxSizeMB = 25,
}: DeveloperDocumentUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      if (file.size > maxSizeMB * 1024 * 1024) {
        toast.error(`Файл слишком большой (макс. ${maxSizeMB}MB)`);
        return;
      }

      setIsUploading(true);
      try {
        const ext = file.name.split('.').pop() ?? 'bin';
        const safeName = file.name.replace(/[^\w.\-]/g, '_').slice(0, 80);
        const storagePath = `${developerId}/${projectId}/${Date.now()}-${safeName}`;

        const { error: upErr } = await supabase.storage
          .from('developer-documents')
          .upload(storagePath, file, {
            contentType: file.type || `application/${ext}`,
            upsert: false,
          });
        if (upErr) throw upErr;

        // Signed URL valid for 1 year (refresh on read by the doc viewer).
        const { data: signed, error: signErr } = await supabase.storage
          .from('developer-documents')
          .createSignedUrl(storagePath, 60 * 60 * 24 * 365);
        if (signErr || !signed) throw signErr ?? new Error('Не удалось получить URL');

        onUploaded(signed.signedUrl, file.name, storagePath);
        toast.success('Документ загружен (приватный)');
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Ошибка загрузки';
        toast.error(msg);
      } finally {
        setIsUploading(false);
        if (inputRef.current) inputRef.current.value = '';
      }
    },
    [developerId, projectId, maxSizeMB, onUploaded]
  );

  return (
    <div className={cn('space-y-2', className)}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
        className="hidden"
        disabled={isUploading}
      />
      <Button
        type="button"
        variant="outline"
        className="w-full h-14 gap-2 border-dashed"
        onClick={() => inputRef.current?.click()}
        disabled={isUploading}
      >
        {isUploading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Загрузка…
          </>
        ) : (
          <>
            <Upload className="h-5 w-5" />
            <FileText className="h-4 w-4" />
            <span>Загрузить документ</span>
            <Lock className="h-3.5 w-3.5 opacity-60 ml-1" />
          </>
        )}
      </Button>
      <p className="text-xs text-muted-foreground flex items-center gap-1">
        <Lock className="h-3 w-3" />
        Приватный bucket · доступ только команде застройщика и администраторам · до {maxSizeMB}MB
      </p>
    </div>
  );
}
