/**
 * BulkLogoUploadModal — Drag&drop bulk upload of developer logos.
 * Files are uploaded to storage, then matched to developers by filename (fuzzy).
 * Admin reviews mapping and applies in one batch.
 */
import { useState, useMemo } from 'react';
import { Upload, Check, X, Loader2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { ResponsiveModal } from '@/components/ui/responsive-modal';
import { Button } from '@/components/ui/button';
import { UnifiedMediaUploader } from '@/components/upload/UnifiedMediaUploader';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import type { Developer } from '@/hooks/useAdminDevelopers';

interface BulkLogoUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  developers: Developer[];
}

interface FileMapping {
  url: string;
  filename: string;
  developerId: string | null;
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/\.(png|jpg|jpeg|webp|svg)$/i, '').replace(/[^a-z0-9]+/g, '');
}

function autoMatch(filename: string, developers: Developer[]): string | null {
  const norm = normalize(filename);
  if (!norm) return null;
  let best: { id: string; score: number } | null = null;
  for (const d of developers) {
    const ne = normalize(d.name_en);
    const nr = normalize(d.name_ru);
    let score = 0;
    if (ne && (norm.includes(ne) || ne.includes(norm))) score = Math.max(score, ne.length);
    if (nr && (norm.includes(nr) || nr.includes(norm))) score = Math.max(score, nr.length);
    if (score > 0 && (!best || score > best.score)) best = { id: d.id, score };
  }
  return best?.id ?? null;
}

export function BulkLogoUploadModal({ open, onOpenChange, developers }: BulkLogoUploadModalProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const queryClient = useQueryClient();
  const [urls, setUrls] = useState<string[]>([]);
  const [mappings, setMappings] = useState<FileMapping[]>([]);
  const [applying, setApplying] = useState(false);

  const handleUploadChange = (newUrls: string | string[]) => {
    const arr = Array.isArray(newUrls) ? newUrls : [newUrls];
    setUrls(arr);
    setMappings(
      arr.map((url) => {
        const filename = url.split('/').pop() || url;
        return {
          url,
          filename,
          developerId: autoMatch(filename, developers),
        };
      }),
    );
  };

  const matchedCount = useMemo(() => mappings.filter((m) => m.developerId).length, [mappings]);

  const handleApply = async () => {
    const toUpdate = mappings.filter((m) => m.developerId);
    if (toUpdate.length === 0) {
      toast.error(isRu ? 'Нет сопоставленных файлов' : 'No matched files');
      return;
    }
    setApplying(true);
    try {
      const results = await Promise.all(
        toUpdate.map((m) =>
          supabase.from('developers').update({ logo_url: m.url }).eq('id', m.developerId!),
        ),
      );
      const failed = results.filter((r) => r.error).length;
      if (failed > 0) {
        toast.error(isRu ? `Ошибок: ${failed}` : `${failed} failures`);
      } else {
        toast.success(
          isRu
            ? `Обновлено логотипов: ${toUpdate.length}`
            : `Updated ${toUpdate.length} logos`,
        );
        queryClient.invalidateQueries({ queryKey: ['admin-developers'] });
        setUrls([]);
        setMappings([]);
        onOpenChange(false);
      }
    } catch (e: any) {
      toast.error(e?.message || 'Failed');
    } finally {
      setApplying(false);
    }
  };

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      title={isRu ? 'Массовая загрузка логотипов' : 'Bulk Logo Upload'}
      description={
        isRu
          ? 'Перетащите файлы — мы сопоставим их с застройщиками по имени.'
          : 'Drop files — we will match them to developers by name.'
      }
      size="xl"
      icon={<Upload className="w-5 h-5 text-primary" />}
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={applying}>
            {isRu ? 'Отмена' : 'Cancel'}
          </Button>
          <Button onClick={handleApply} disabled={applying || matchedCount === 0}>
            {applying && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isRu ? `Применить (${matchedCount})` : `Apply (${matchedCount})`}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <UnifiedMediaUploader
          mode="gallery"
          value={urls}
          onChange={handleUploadChange}
          folder="developer-logos"
          bucket="vendor-uploads"
          maxItems={50}
          enableEditing={false}
          enableQualityTips={false}
        />

        {mappings.length > 0 && (
          <div className="border border-border rounded-none overflow-hidden">
            <div className="px-3 py-2 bg-muted/50 text-xs font-medium text-muted-foreground flex justify-between">
              <span>{isRu ? 'Сопоставление' : 'Mapping'}</span>
              <span>
                {matchedCount} / {mappings.length} {isRu ? 'сопоставлено' : 'matched'}
              </span>
            </div>
            <div className="divide-y divide-border max-h-[300px] overflow-y-auto">
              {mappings.map((m, i) => (
                <div key={m.url} className="flex items-center gap-3 p-2">
                  <img src={m.url} alt="" className="w-12 h-12 object-contain bg-muted rounded-none shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground truncate">{m.filename}</p>
                  </div>
                  <Select
                    value={m.developerId ?? '__none__'}
                    onValueChange={(v) => {
                      const next = [...mappings];
                      next[i] = { ...next[i], developerId: v === '__none__' ? null : v };
                      setMappings(next);
                    }}
                  >
                    <SelectTrigger className="w-[200px] h-9">
                      <SelectValue placeholder={isRu ? '— выбрать —' : '— select —'} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">
                        {isRu ? '— пропустить —' : '— skip —'}
                      </SelectItem>
                      {developers.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {isRu ? d.name_ru : d.name_en}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {m.developerId ? (
                    <Check className="w-4 h-4 text-success shrink-0" />
                  ) : (
                    <X className="w-4 h-4 text-muted-foreground shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </ResponsiveModal>
  );
}
