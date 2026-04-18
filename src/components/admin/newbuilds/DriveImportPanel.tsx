/**
 * DriveImportPanel
 * UI для импорта файлов проекта из Google Drive папки.
 * - URL + выбор режима (public / connector)
 * - Кнопка "Sync now" + чекбокс "Auto-sync daily"
 * - Live progress по drive_import_jobs (через realtime)
 */
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { CloudDownload, Loader2, RefreshCw, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react';
import {
  useDriveSources, useDriveJobs, useStartDriveImport,
  useToggleDriveWatch, useDeleteDriveSource,
} from '@/hooks/useDriveImport';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

interface Props {
  projectId: string;
}

export function DriveImportPanel({ projectId }: Props) {
  const [url, setUrl] = useState('');
  const [accessMode, setAccessMode] = useState<'public' | 'connector'>('public');

  const { data: sources = [] } = useDriveSources(projectId);
  const { data: jobs = [] } = useDriveJobs(projectId, 5);
  const startImport = useStartDriveImport();
  const toggleWatch = useToggleDriveWatch();
  const deleteSource = useDeleteDriveSource();

  const activeJob = jobs.find(j => j.status === 'running' || j.status === 'queued');

  const handleStart = () => {
    if (!url.trim()) return;
    startImport.mutate({ projectId, driveUrl: url.trim(), accessMode }, {
      onSuccess: () => setUrl(''),
    });
  };

  return (
    <Card className="p-5 space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <CloudDownload className="w-5 h-5 text-primary" />
            Импорт из Google Drive
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            AI классифицирует файлы по категориям ClearView и складывает в vault проекта.
          </p>
        </div>
      </div>

      {/* New source form */}
      <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
        <div className="space-y-1.5">
          <Label htmlFor="drive-url" className="text-sm">Ссылка на папку</Label>
          <Input
            id="drive-url"
            placeholder="https://drive.google.com/drive/folders/..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
          <div className="space-y-1.5 sm:w-48">
            <Label className="text-sm">Доступ</Label>
            <Select value={accessMode} onValueChange={(v: any) => setAccessMode(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Публичная ссылка</SelectItem>
                <SelectItem value="connector">Через мой Drive (connector)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={handleStart}
            disabled={!url.trim() || startImport.isPending}
            className="sm:ml-auto"
          >
            {startImport.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CloudDownload className="w-4 h-4" />}
            Импортировать
          </Button>
        </div>
        {accessMode === 'connector' && (
          <p className="text-xs text-warning flex items-start gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            Connector-режим в разработке. Пока используй публичные ссылки (Anyone with the link).
          </p>
        )}
      </div>

      {/* Active job progress */}
      {activeJob && (
        <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              Импорт в процессе…
            </span>
            <span className="text-muted-foreground">
              {activeJob.files_processed} / {activeJob.files_total || '?'}
            </span>
          </div>
          <Progress
            value={activeJob.files_total > 0 ? (activeJob.files_processed / activeJob.files_total) * 100 : 0}
            className="h-2"
          />
          {activeJob.files_failed > 0 && (
            <p className="text-xs text-destructive">Ошибок: {activeJob.files_failed}</p>
          )}
        </div>
      )}

      {/* Saved sources */}
      {sources.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm">Подключённые папки</Label>
          {sources.map((src) => (
            <div key={src.id} className="flex items-center gap-3 p-3 bg-card border rounded-lg">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <span className="truncate">{src.folder_id}</span>
                  <Badge variant="outline" className="text-xs">
                    {src.access_mode === 'public' ? 'Public' : 'Connector'}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {src.last_sync_at
                    ? `Синк ${formatDistanceToNow(new Date(src.last_sync_at), { addSuffix: true, locale: ru })} · ${src.file_count} файлов`
                    : 'Ещё не синхронизировано'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <Switch
                    checked={src.watch_enabled}
                    onCheckedChange={(v) => toggleWatch.mutate({ sourceId: src.id, projectId, enabled: v })}
                  />
                  <span className="text-xs text-muted-foreground">Авто-синк</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => startImport.mutate({
                    projectId, driveUrl: src.drive_url, accessMode: src.access_mode, sourceId: src.id,
                  })}
                  disabled={!!activeJob}
                  title="Запустить синк"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteSource.mutate({ sourceId: src.id, projectId })}
                  title="Удалить"
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recent jobs (history) */}
      {jobs.length > 0 && (
        <div className="space-y-1.5">
          <Label className="text-sm">Последние импорты</Label>
          <div className="space-y-1">
            {jobs.slice(0, 3).map((job) => (
              <div key={job.id} className="flex items-center gap-2 text-xs text-muted-foreground py-1">
                {job.status === 'completed' && <CheckCircle2 className="w-3.5 h-3.5 text-success" />}
                {job.status === 'failed' && <AlertCircle className="w-3.5 h-3.5 text-destructive" />}
                {job.status === 'partial' && <AlertCircle className="w-3.5 h-3.5 text-warning" />}
                {(job.status === 'running' || job.status === 'queued') && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>
                  {formatDistanceToNow(new Date(job.created_at), { addSuffix: true, locale: ru })} ·
                  {' '}{job.files_processed}/{job.files_total} обработано
                  {job.files_failed > 0 && `, ${job.files_failed} ошибок`}
                  {job.files_skipped > 0 && `, ${job.files_skipped} пропущено`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
