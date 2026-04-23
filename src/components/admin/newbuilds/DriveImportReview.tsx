/**
 * DriveImportReview
 * Модалка для ревью данных, извлечённых AI из импорта.
 * Показывает:
 *   - Patch для property_projects (description, district, completion_date, ...)
 *   - Извлечённые юниты для project_units (с возможностью отметить, какие применить)
 * Действия: Apply / Discard.
 */
import { useState, useMemo } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, Building2, Home, Loader2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { DriveJob } from '@/hooks/useDriveImport';

interface Props {
  job: DriveJob & { ai_project_patch?: any; ai_extracted_units?: any[] };
  projectId: string;
  open: boolean;
  onClose: () => void;
}

export function DriveImportReview({ job, projectId, open, onClose }: Props) {
  const qc = useQueryClient();
  const projectPatch = job.ai_project_patch || null;
  const extractedUnits = job.ai_extracted_units || [];

  const projectFields = useMemo(() => {
    if (!projectPatch) return [];
    return Object.entries(projectPatch)
      .filter(([_, v]) => v !== null && v !== undefined && (Array.isArray(v) ? v.length > 0 : v !== ''));
  }, [projectPatch]);

  const [selectedUnits, setSelectedUnits] = useState<Set<number>>(
    () => new Set(extractedUnits.map((_, i) => i))
  );
  const [applyProject, setApplyProject] = useState(true);

  const apply = useMutation({
    mutationFn: async () => {
      // Patch проекта
      if (applyProject && projectPatch && projectFields.length > 0) {
        const patch: Record<string, any> = {};
        for (const [k, v] of projectFields) patch[k] = v;
        const { error } = await supabase
          .from('property_projects')
          .update(patch)
          .eq('id', projectId);
        if (error) throw error;
      }
      // Юниты
      const unitsToInsert = extractedUnits
        .filter((_, i) => selectedUnits.has(i))
        .map(u => ({
          project_id: projectId,
          unit_code: u.unit_code || null,
          unit_type: u.unit_type || 'unknown',
          bedrooms: u.bedrooms ?? null,
          bathrooms: u.bathrooms ?? null,
          area_sqm: u.area_sqm ?? null,
          floor: u.floor ?? null,
          price: u.price ?? null,
          currency: u.currency || 'THB',
          view_type: u.view_type || null,
          status: u.status || 'available',
        }));
      if (unitsToInsert.length > 0) {
        const { error } = await supabase.from('project_units').insert(unitsToInsert as any);
        if (error) throw error;
      }
      // Помечаем job как обработанный
      await supabase
        .from('drive_import_jobs' as any)
        .update({ review_status: 'approved', reviewed_at: new Date().toISOString() })
        .eq('id', job.id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['drive-jobs', projectId] });
      qc.invalidateQueries({ queryKey: ['admin-project-meta', projectId] });
      qc.invalidateQueries({ queryKey: ['project-units-grid', projectId] });
      toast.success('Данные применены');
      onClose();
    },
    onError: (e: any) => toast.error(e.message || 'Не удалось применить'),
  });

  const discard = useMutation({
    mutationFn: async () => {
      await supabase
        .from('drive_import_jobs' as any)
        .update({ review_status: 'discarded', reviewed_at: new Date().toISOString() })
        .eq('id', job.id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['drive-jobs', projectId] });
      toast.success('Данные отброшены');
      onClose();
    },
  });

  const hasAnything = projectFields.length > 0 || extractedUnits.length > 0;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            AI-извлечённые данные для ревью
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          {!hasAnything && (
            <p className="text-sm text-muted-foreground py-8 text-center">
              AI не нашёл данных для извлечения в импортированных файлах.
            </p>
          )}

          {projectFields.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Checkbox checked={applyProject} onCheckedChange={(v) => setApplyProject(!!v)} />
                <Building2 className="w-4 h-4 text-primary" />
                <span className="font-medium text-sm">Поля проекта ({projectFields.length})</span>
              </div>
              <div className="space-y-1.5 pl-6 text-sm">
                {projectFields.map(([key, value]) => (
                  <div key={key} className="flex gap-2">
                    <span className="text-muted-foreground min-w-[140px]">{key}:</span>
                    <span className="text-foreground break-words">
                      {Array.isArray(value) ? value.join(', ') : String(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {extractedUnits.length > 0 && (
            <div className="space-y-3 mt-6">
              <div className="flex items-center gap-2">
                <Home className="w-4 h-4 text-primary" />
                <span className="font-medium text-sm">
                  Юниты ({selectedUnits.size}/{extractedUnits.length} выбрано)
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto h-7 text-xs"
                  onClick={() => setSelectedUnits(
                    selectedUnits.size === extractedUnits.length
                      ? new Set()
                      : new Set(extractedUnits.map((_, i) => i))
                  )}
                >
                  {selectedUnits.size === extractedUnits.length ? 'Снять все' : 'Выбрать все'}
                </Button>
              </div>
              <div className="space-y-1.5">
                {extractedUnits.map((u, i) => (
                  <label
                    key={i}
                    className="flex items-center gap-3 p-2.5 bg-muted/30 rounded-none cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    <Checkbox
                      checked={selectedUnits.has(i)}
                      onCheckedChange={(v) => {
                        const next = new Set(selectedUnits);
                        if (v) next.add(i); else next.delete(i);
                        setSelectedUnits(next);
                      }}
                    />
                    <div className="flex-1 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{u.unit_code || `#${i + 1}`}</span>
                        <Badge variant="outline" className="text-xs">{u.unit_type}</Badge>
                        {u.bedrooms != null && <span className="text-muted-foreground text-xs">{u.bedrooms}BR</span>}
                        {u.area_sqm != null && <span className="text-muted-foreground text-xs">{u.area_sqm}m²</span>}
                      </div>
                      {u.price != null && (
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {u.price.toLocaleString()} {u.currency || 'THB'}
                          {u.view_type && ` · ${u.view_type}`}
                        </div>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}
        </ScrollArea>

        <DialogFooter>
          <Button variant="ghost" onClick={() => discard.mutate()} disabled={discard.isPending || apply.isPending}>
            Отбросить
          </Button>
          <Button
            onClick={() => apply.mutate()}
            disabled={!hasAnything || apply.isPending || discard.isPending}
          >
            {apply.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Применить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
