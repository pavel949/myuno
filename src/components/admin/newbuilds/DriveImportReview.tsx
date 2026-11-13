import { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, Building2, Home, Loader2, AlertCircle, ExternalLink } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useDriveImportFacts, type DriveJob } from '@/hooks/useDriveImport';
import { initiallySelectableUnit } from '@/lib/offplan/priceListVersions';
import { invalidateProjectPriceReaders } from '@/lib/real-estate/invalidateProjectPriceReaders';
import { useLanguage } from '@/contexts/LanguageContext';

interface ExtractedUnit {
  unit_code?: string | null;
  unit_type?: string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  area_sqm?: number | null;
  floor?: number | null;
  price?: number | null;
  currency?: string | null;
  view_type?: string | null;
  status?: 'available' | 'reserved' | 'sold' | 'held' | 'unknown' | null;
  needs_review?: boolean;
  review_reasons?: string[];
  _source_file_name?: string | null;
  _source_file_url?: string | null;
  [key: string]: unknown;
}

function renderPatchValue(key: string, value: unknown) {
  if ((key === 'gallery_urls' || key === 'marketing_materials') && Array.isArray(value)) {
    return (
      <span className="flex flex-wrap gap-1.5">
        {value.filter((item): item is string => typeof item === 'string').slice(0, 12).map(url => (
          <img key={url} src={url} alt="" loading="lazy" className="h-14 w-20 border border-border object-cover" />
        ))}
        {value.length > 12 && <span className="text-xs text-muted-foreground">+{value.length - 12}</span>}
      </span>
    );
  }
  if (key === 'payment_plan' && Array.isArray(value)) {
    return value.map((step, index) => {
      const entry = step as { stage?: string; percent?: number | null; amount_thb?: number | null };
      const amount = entry.percent != null ? `${entry.percent}%` : entry.amount_thb != null ? `${entry.amount_thb.toLocaleString('ru-RU')} ฿` : '—';
      return <span key={index} className="block">{entry.stage ?? `#${index + 1}`}: {amount}</span>;
    });
  }
  if (Array.isArray(value)) return value.map(item => typeof item === 'object' ? JSON.stringify(item) : String(item)).join(', ');
  if (value && typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

const REASON_LABELS: Record<string, { en: string; ru: string }> = {
  missing_status: { en: 'Status is absent in the source', ru: 'Статус отсутствует в источнике' },
  unrecognized_status: { en: 'Source status is not recognized', ru: 'Статус в источнике не распознан' },
  missing_unit_code: { en: 'Unit code is required for matching', ru: 'Для сопоставления нужен код юнита' },
  duplicate_unit_code: { en: 'Duplicate unit code in this import', ru: 'Код юнита повторяется в импорте' },
  missing_unit_type: { en: 'Unit type is absent', ru: 'Тип юнита отсутствует' },
  missing_or_invalid_currency: { en: 'Price needs an explicit supported currency', ru: 'Для цены нужна явно указанная валюта' },
  currency_without_price: { en: 'Currency without a price needs review', ru: 'Валюта без цены требует проверки' },
};

interface Props {
  job: DriveJob & { ai_project_patch?: Record<string, unknown> | null; ai_extracted_units?: ExtractedUnit[] };
  projectId: string;
  open: boolean;
  onClose: () => void;
}

export function DriveImportReview({ job, projectId, open, onClose }: Props) {
  const qc = useQueryClient();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const t = (en: string, ru: string) => isRu ? ru : en;
  const projectPatch = job.ai_project_patch || null;
  const extractedUnits: ExtractedUnit[] = (job.ai_extracted_units as ExtractedUnit[] | undefined) || [];
  const { data: facts = [] } = useDriveImportFacts(job.id);
  const factByProjectField = useMemo(
    () => new Map(facts.filter(fact => fact.entity_type === 'project').map(fact => [fact.field_key, fact])),
    [facts],
  );

  const projectFields = useMemo(() => {
    if (!projectPatch) return [];
    return Object.entries(projectPatch).filter(([, value]) =>
      value !== null && value !== undefined && (Array.isArray(value) ? value.length > 0 : value !== ''));
  }, [projectPatch]);

  const [selectedUnits, setSelectedUnits] = useState<Set<number>>(
    () => new Set(extractedUnits.flatMap((unit, index) => initiallySelectableUnit(unit) ? [index] : [])),
  );
  const [applyProject, setApplyProject] = useState(true);

  const invalidate = async () => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: ['drive-jobs', projectId] }),
      qc.invalidateQueries({ queryKey: ['admin-project-meta', projectId] }),
      qc.invalidateQueries({ queryKey: ['project-units-grid', projectId] }),
      qc.invalidateQueries({ queryKey: ['project-units-editor', projectId] }),
      qc.invalidateQueries({ queryKey: ['project-units', projectId] }),
      qc.invalidateQueries({ queryKey: ['price-list-versions', projectId] }),
      qc.invalidateQueries({ queryKey: ['project-fact-assertions'] }),
      invalidateProjectPriceReaders(qc),
    ]);
  };

  const apply = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('apply_drive_import_review', {
        p_job_id: job.id,
        p_apply_project: applyProject && projectFields.length > 0,
        p_unit_indexes: [...selectedUnits].sort((a, b) => a - b),
      });
      if (error) throw error;
      if (!data) throw new Error(t('No confirmation returned', 'Сервер не подтвердил применение'));
      return data;
    },
    onSuccess: async () => {
      await invalidate();
      toast.success(t('Reviewed data applied with source history', 'Проверенные данные применены, источники сохранены'));
      onClose();
    },
    onError: error => toast.error(error instanceof Error ? error.message : t('Could not apply review', 'Не удалось применить данные')),
  });

  const discard = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('discard_drive_import_review', { p_job_id: job.id });
      if (error) throw error;
    },
    onSuccess: async () => {
      await invalidate();
      toast.success(t('Import discarded; source evidence retained', 'Импорт отклонён, источники сохранены'));
      onClose();
    },
    onError: error => toast.error(error instanceof Error ? error.message : t('Could not discard import', 'Не удалось отклонить импорт')),
  });

  const hasAnything = projectFields.length > 0 || extractedUnits.length > 0;
  const canApply = (applyProject && projectFields.length > 0) || selectedUnits.size > 0;
  const safeIndexes = extractedUnits.flatMap((unit, index) => initiallySelectableUnit(unit) ? [index] : []);

  return (
    <Dialog open={open} onOpenChange={value => !value && onClose()}>
      <DialogContent className="flex max-h-[85vh] max-w-2xl flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {t('Review imported facts and sources', 'Проверка извлечённых фактов и источников')}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="-mx-6 flex-1 px-6">
          {!hasAnything && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {t('No facts were extracted from the imported files.', 'В импортированных файлах не найдено данных для проверки.')}
            </p>
          )}

          {projectFields.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Checkbox checked={applyProject} onCheckedChange={value => setApplyProject(!!value)} aria-label={t('Apply project fields', 'Применить поля проекта')} />
                <Building2 className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">{t('Project fields', 'Поля проекта')} ({projectFields.length})</span>
              </div>
              <div className="space-y-3 pl-6 text-sm">
                {projectFields.map(([key, value]) => {
                  const source = factByProjectField.get(key);
                  return (
                    <div key={key} className="space-y-1">
                      <div className="flex flex-col gap-1 sm:flex-row sm:gap-2">
                        <span className="min-w-[140px] text-muted-foreground">{key}:</span>
                        <span className="break-words text-foreground">{renderPatchValue(key, value)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {t('Source', 'Источник')}: {source?.source_file_name ?? t('Recorded with the import job', 'Связан с заданием импорта')}
                        {source?.source_file_url && (
                          <a href={source.source_file_url} target="_blank" rel="noreferrer" className="ml-1 inline-flex items-center gap-0.5 underline">
                            {t('Open', 'Открыть')}<ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {extractedUnits.length > 0 && (
            <div className="mt-6 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Home className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">
                  {t('Units', 'Юниты')} ({selectedUnits.size}/{extractedUnits.length})
                </span>
                <Button
                  variant="ghost" size="sm" className="ml-auto h-7 text-xs"
                  onClick={() => setSelectedUnits(selectedUnits.size ? new Set() : new Set(safeIndexes))}
                >
                  {selectedUnits.size ? t('Clear selection', 'Снять выбор') : t('Select unambiguous rows', 'Выбрать однозначные строки')}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {t('Rows with unknown status or ambiguous identity require individual selection after checking the source.', 'Строки с неизвестным статусом или неоднозначным кодом нужно выбирать отдельно после проверки источника.')}
              </p>
              <div className="space-y-1.5">
                {extractedUnits.map((unit, index) => {
                  const needsReview = unit.needs_review === true || !unit.status || unit.status === 'unknown';
                  const reasons = unit.review_reasons?.length ? unit.review_reasons : needsReview ? ['missing_status'] : [];
                  return (
                    <label key={index} className="flex cursor-pointer items-start gap-3 bg-muted/30 p-2.5">
                      <Checkbox
                        checked={selectedUnits.has(index)}
                        onCheckedChange={value => {
                          const next = new Set(selectedUnits);
                          if (value) next.add(index); else next.delete(index);
                          setSelectedUnits(next);
                        }}
                        aria-label={`${t('Select unit', 'Выбрать юнит')} ${unit.unit_code || index + 1}`}
                        className="mt-1"
                      />
                      <div className="min-w-0 flex-1 text-sm">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">{unit.unit_code || `#${index + 1}`}</span>
                          <Badge variant="outline" className="text-xs">{unit.unit_type || 'unknown'}</Badge>
                          <Badge variant={needsReview ? 'secondary' : 'outline'} className="text-xs">
                            {unit.status === 'unknown' || !unit.status ? t('Unknown', 'Неизвестно') : unit.status}
                          </Badge>
                          {unit.bedrooms != null && <span className="text-xs text-muted-foreground">{unit.bedrooms}BR</span>}
                          {unit.area_sqm != null && <span className="text-xs text-muted-foreground">{unit.area_sqm}m²</span>}
                        </div>
                        {unit.price != null && (
                          <div className="mt-0.5 text-xs text-muted-foreground">
                            {unit.price.toLocaleString()} {unit.currency || t('currency unknown', 'валюта неизвестна')}
                            {unit.view_type && ` · ${unit.view_type}`}
                          </div>
                        )}
                        {needsReview && (
                          <div className="mt-1 flex items-start gap-1 text-xs text-warning">
                            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                            <span>{reasons.map(reason => {
                              const label = REASON_LABELS[reason];
                              return label ? t(label.en, label.ru) : reason;
                            }).join(' · ')}</span>
                          </div>
                        )}
                        <p className="mt-1 break-words text-xs text-muted-foreground">
                          {t('Source', 'Источник')}: {unit._source_file_name || t('Not recorded — review required', 'Не записан — требуется проверка')}
                          {unit._source_file_url && (
                            <a href={unit._source_file_url} target="_blank" rel="noreferrer" className="ml-1 inline-flex items-center gap-0.5 underline">
                              {t('Open', 'Открыть')}<ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </ScrollArea>

        <DialogFooter>
          <Button variant="ghost" onClick={() => discard.mutate()} disabled={discard.isPending || apply.isPending}>
            {discard.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {t('Discard', 'Отклонить')}
          </Button>
          <Button onClick={() => apply.mutate()} disabled={!hasAnything || !canApply || apply.isPending || discard.isPending}>
            {apply.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {t('Apply reviewed facts', 'Применить проверенные факты')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
