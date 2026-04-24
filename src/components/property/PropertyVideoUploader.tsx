/**
 * PropertyVideoUploader — uploads a video tour file to the `property-videos` Supabase bucket
 * OR accepts a YouTube/Vimeo URL. Writes the resulting URL into `video_url` form field.
 *
 * - Max file size: 500 MB (matches bucket policy)
 * - Accepts: mp4, mov, webm, m4v
 * - Public bucket → returns getPublicUrl
 */

import React, { useState, useRef } from 'react';
import { Upload, Video, X, Link as LinkIcon, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/components/ui/sonner';
import { cn } from '@/lib/utils';

const MAX_BYTES = 500 * 1024 * 1024; // 500 MB
const ACCEPTED_MIME = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-m4v'];
const BUCKET = 'property-videos';

export interface PropertyVideoUploaderProps {
  value?: string | null;
  onChange: (url: string | null) => void;
  /** Property id used in storage path (fallback to anon path) */
  propertyId?: string | null;
  ownerId?: string | null;
  isRu: boolean;
  className?: string;
}

function isHttpUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

export function PropertyVideoUploader({
  value,
  onChange,
  propertyId,
  ownerId,
  isRu,
  className,
}: PropertyVideoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [urlInput, setUrlInput] = useState(value && !value.includes(BUCKET) ? value : '');

  const isUploadedFile = !!value && value.includes(`/storage/v1/object/public/${BUCKET}/`);

  const handlePickFile = () => inputRef.current?.click();

  const handleFile = async (file: File) => {
    if (!ACCEPTED_MIME.includes(file.type)) {
      toast.error(isRu ? 'Поддерживаются: mp4, mov, webm, m4v' : 'Supported: mp4, mov, webm, m4v');
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error(isRu ? 'Максимальный размер 500 МБ' : 'Max size 500 MB');
      return;
    }
    setUploading(true);
    setProgress(10);
    try {
      const ext = file.name.split('.').pop() || 'mp4';
      const folder = ownerId || 'anon';
      const fname = `${propertyId || crypto.randomUUID()}-${Date.now()}.${ext}`;
      const path = `${folder}/${fname}`;

      setProgress(30);
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { contentType: file.type, upsert: true });
      if (upErr) throw upErr;

      setProgress(80);
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      const publicUrl = data?.publicUrl;
      if (!publicUrl) throw new Error('No public URL');

      setProgress(100);
      onChange(publicUrl);
      toast.success(isRu ? 'Видео загружено' : 'Video uploaded');
    } catch (err) {
      console.error('[PropertyVideoUploader] upload failed', err);
      toast.error(isRu ? 'Ошибка загрузки видео' : 'Failed to upload video');
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 800);
    }
  };

  const handleRemove = () => {
    onChange(null);
    setUrlInput('');
  };

  const handleSetUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) {
      onChange(null);
      return;
    }
    if (!isHttpUrl(trimmed)) {
      toast.error(isRu ? 'Некорректная ссылка' : 'Invalid URL');
      return;
    }
    onChange(trimmed);
    toast.success(isRu ? 'Ссылка сохранена' : 'Link saved');
  };

  return (
    <Card className={cn('rounded-none', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Video className="h-4 w-4" />
          {isRu ? 'Видео-тур объекта' : 'Property video tour'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current value preview */}
        {value && (
          <div className="flex items-center justify-between gap-2 p-2.5 border border-border/60 bg-muted/30">
            <div className="flex items-center gap-2 min-w-0">
              {isUploadedFile ? (
                <Video className="h-4 w-4 text-primary shrink-0" />
              ) : (
                <LinkIcon className="h-4 w-4 text-primary shrink-0" />
              )}
              <span className="text-sm truncate font-mono">{value}</span>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={handleRemove} aria-label={isRu ? 'Удалить' : 'Remove'}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Upload file */}
        <div>
          <Label className="text-sm text-muted-foreground mb-1.5 block">
            {isRu ? 'Загрузить файл (до 500 МБ)' : 'Upload file (up to 500 MB)'}
          </Label>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_MIME.join(',')}
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleFile(f);
              e.target.value = '';
            }}
          />
          <Button
            type="button"
            variant="outline"
            onClick={handlePickFile}
            disabled={uploading}
            className="w-full rounded-none"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {isRu ? 'Загрузка…' : 'Uploading…'}
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                {isRu ? 'Выбрать видео-файл' : 'Choose video file'}
              </>
            )}
          </Button>
          {uploading && progress > 0 && <Progress value={progress} className="mt-2 h-1" />}
        </div>

        {/* OR YouTube/Vimeo URL */}
        <div>
          <Label className="text-sm text-muted-foreground mb-1.5 block">
            {isRu ? 'Или ссылка на YouTube / Vimeo' : 'Or YouTube / Vimeo link'}
          </Label>
          <div className="flex gap-2">
            <Input
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="rounded-none"
            />
            <Button type="button" variant="outline" onClick={handleSetUrl} className="rounded-none shrink-0">
              {isRu ? 'Сохранить' : 'Save'}
            </Button>
          </div>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          {isRu
            ? 'Видео-тур значительно повышает доверие и конверсию. Снимайте 1–3 минуты в горизонтальной ориентации.'
            : 'A video tour materially boosts trust and conversion. Record 1–3 minutes in landscape orientation.'}
        </p>
      </CardContent>
    </Card>
  );
}

export default PropertyVideoUploader;
