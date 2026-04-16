import { useMemo, useState } from 'react';
import Papa from 'papaparse';
import { Upload, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { ResponsiveModal } from '@/components/ui/responsive-modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { DEAL_TYPES, DEAL_TYPE_LABELS, type DealType } from '@/hooks/useAgentDeals';
import type { CrmOptionCategory } from '@/hooks/useCrmSettings';

type CsvRow = Record<string, string>;

interface OdooCrmSettingsImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  isRu: boolean;
}

function normalize(v: string): string {
  return (v || '').toLowerCase().replace(/[^a-zа-яё0-9]/gi, '');
}

function slugify(v: string): string {
  return (v || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-zа-яё0-9\s_-]/gi, '')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_');
}

function parseProbability(value: string): number {
  if (!value) return 0;
  const cleaned = value.replace('%', '').replace(',', '.').trim();
  const parsed = Number(cleaned);
  if (Number.isNaN(parsed)) return 0;
  const normalized = parsed > 1 ? parsed / 100 : parsed;
  return Math.max(0, Math.min(1, normalized));
}

function mapCategory(raw: string): CrmOptionCategory | null {
  const key = normalize(raw);
  const dict: Record<string, CrmOptionCategory> = {
    contacttype: 'contact_type',
    contacttypes: 'contact_type',
    typecontact: 'contact_type',
    типконтакта: 'contact_type',
    leadsource: 'lead_source',
    source: 'lead_source',
    источник: 'lead_source',
    dealtype: 'deal_type',
    типсделки: 'deal_type',
    tasktype: 'task_type',
    типзадачи: 'task_type',
    lostreason: 'lost_reason',
    reasonlost: 'lost_reason',
    причинапроигрыша: 'lost_reason',
    contact_type: 'contact_type',
    lead_source: 'lead_source',
    deal_type: 'deal_type',
    task_type: 'task_type',
    lost_reason: 'lost_reason',
    winreason: 'win_reason',
    reasonwon: 'win_reason',
    причинауспеха: 'win_reason',
    win_reason: 'win_reason',
  };
  return dict[key] || null;
}

function mapDealType(raw: string, fallback: DealType): DealType {
  const key = normalize(raw);
  const dict: Record<string, DealType> = {
    sale: 'sale',
    продажа: 'sale',
    rent: 'rent_long',
    rental: 'rent_long',
    аренда: 'rent_long',
    rent_short: 'rent_short',
    rent_long: 'rent_long',
    investment: 'investment',
    инвестиция: 'investment',
    management: 'management',
    управление: 'management',
    club_deal: 'club_deal',
    resale: 'resale',
    offplan: 'offplan',
  };
  return dict[key] || fallback;
}

function readCell(row: CsvRow, aliases: string[]): string {
  const normalizedAliases = aliases.map(normalize);
  for (const [rawKey, rawVal] of Object.entries(row)) {
    const key = normalize(rawKey);
    if (normalizedAliases.includes(key)) return String(rawVal || '').trim();
  }
  return '';
}

export function OdooCrmSettingsImportModal({
  open,
  onOpenChange,
  companyId,
  isRu,
}: OdooCrmSettingsImportModalProps) {
  const qc = useQueryClient();
  const [rows, setRows] = useState<CsvRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [defaultDealType, setDefaultDealType] = useState<DealType>('sale');

  const parsed = useMemo(() => {
    const options: Array<{
      category: CrmOptionCategory;
      value: string;
      label_en: string;
      label_ru: string;
      color: string | null;
      sort_order: number;
    }> = [];

    const stages: Array<{
      deal_type: DealType;
      stage_key: string;
      name_en: string;
      name_ru: string;
      short_label: string;
      color: string;
      probability: number;
      sort_order: number;
    }> = [];

    const optionSeen = new Set<string>();
    const stageSeen = new Set<string>();

    rows.forEach((row, idx) => {
      const categoryRaw = readCell(row, ['category', 'категория', 'setting_category']);
      const category = mapCategory(categoryRaw);

      if (category) {
        const labelEn = readCell(row, ['label_en', 'name_en', 'name', 'title']) || `Option ${idx + 1}`;
        const labelRu = readCell(row, ['label_ru', 'name_ru', 'name', 'title']) || labelEn;
        const value = slugify(readCell(row, ['value', 'key', 'code']) || labelEn);
        if (!value) return;

        const dedupe = `${category}:${value}`;
        if (optionSeen.has(dedupe)) return;
        optionSeen.add(dedupe);

        options.push({
          category,
          value,
          label_en: labelEn,
          label_ru: labelRu,
          color: readCell(row, ['color', 'colour']) || null,
          sort_order: Number(readCell(row, ['sort_order', 'sequence', 'order'])) || options.length + 1,
        });
        return;
      }

      const stageName = readCell(row, ['name', 'stage', 'stage_name', 'этап']);
      const stageKey = slugify(readCell(row, ['stage_key', 'key']) || stageName);
      const probabilityRaw = readCell(row, ['probability', 'вероятность', 'probability_percent', '%']);

      if (!stageName && !stageKey) return;

      const dealType = mapDealType(readCell(row, ['deal_type', 'pipeline_type', 'тип_сделки']), defaultDealType);
      const finalKey = stageKey || `stage_${idx + 1}`;
      const dedupe = `${dealType}:${finalKey}`;
      if (stageSeen.has(dedupe)) return;
      stageSeen.add(dedupe);

      const nameEn = readCell(row, ['name_en']) || stageName;
      const nameRu = readCell(row, ['name_ru']) || stageName || nameEn;

      stages.push({
        deal_type: dealType,
        stage_key: finalKey,
        name_en: nameEn || finalKey,
        name_ru: nameRu || nameEn || finalKey,
        short_label: (readCell(row, ['short_label', 'short']) || nameEn || finalKey).slice(0, 8),
        color: readCell(row, ['color', 'colour']) || 'hsl(var(--primary))',
        probability: parseProbability(probabilityRaw),
        sort_order: Number(readCell(row, ['sort_order', 'sequence', 'order'])) || stages.length + 1,
      });
    });

    return { options, stages };
  }, [rows, defaultDealType]);

  const reset = () => {
    setRows([]);
    setFileName('');
    setDefaultDealType('sale');
  };

  const handleFile = (file: File) => {
    setParsing(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        setRows((result.data as CsvRow[]) || []);
        setFileName(file.name);
        setParsing(false);
      },
      error: () => {
        setParsing(false);
        toast.error(isRu ? 'Не удалось прочитать CSV' : 'Failed to read CSV');
      },
    });
  };

  const handleImport = async () => {
    if (parsed.options.length === 0 && parsed.stages.length === 0) {
      toast.error(isRu ? 'В файле не найдены поддерживаемые настройки CRM' : 'No supported CRM settings found in file');
      return;
    }

    setImporting(true);

    try {
      const { data: existingOptions, error: optionsErr } = await supabase
        .from('crm_custom_options')
        .select('id, category, value')
        .eq('company_id', companyId);
      if (optionsErr) throw optionsErr;

      const optionMap = new Map((existingOptions || []).map(o => [`${o.category}:${o.value}`, o.id]));

      let insertedOptions = 0;
      let updatedOptions = 0;

      for (const opt of parsed.options) {
        const key = `${opt.category}:${opt.value}`;
        const existingId = optionMap.get(key);

        if (existingId) {
          const { error } = await supabase
            .from('crm_custom_options')
            .update({
              label_en: opt.label_en,
              label_ru: opt.label_ru,
              color: opt.color,
              sort_order: opt.sort_order,
              is_active: true,
            } as any)
            .eq('id', existingId);
          if (error) throw error;
          updatedOptions += 1;
        } else {
          const { error } = await supabase
            .from('crm_custom_options')
            .insert({
              company_id: companyId,
              category: opt.category,
              value: opt.value,
              label_en: opt.label_en,
              label_ru: opt.label_ru,
              color: opt.color,
              icon: null,
              short_en: null,
              short_ru: null,
              probability: null,
              is_system: false,
              is_active: true,
              sort_order: opt.sort_order,
            } as any);
          if (error) throw error;
          insertedOptions += 1;
        }
      }

      const { data: existingStages, error: stagesErr } = await supabase
        .from('deal_pipeline_stages')
        .select('id, deal_type, stage_key')
        .eq('company_id', companyId);
      if (stagesErr) throw stagesErr;

      const stageMap = new Map((existingStages || []).map(s => [`${s.deal_type}:${s.stage_key}`, s.id]));

      let insertedStages = 0;
      let updatedStages = 0;

      for (const stage of parsed.stages) {
        const key = `${stage.deal_type}:${stage.stage_key}`;
        const existingId = stageMap.get(key);

        if (existingId) {
          const { error } = await supabase
            .from('deal_pipeline_stages')
            .update({
              name_en: stage.name_en,
              name_ru: stage.name_ru,
              short_label: stage.short_label,
              color: stage.color,
              probability: stage.probability,
              sort_order: stage.sort_order,
              is_active: true,
            } as any)
            .eq('id', existingId);
          if (error) throw error;
          updatedStages += 1;
        } else {
          const { error } = await supabase
            .from('deal_pipeline_stages')
            .insert({
              company_id: companyId,
              deal_type: stage.deal_type,
              stage_key: stage.stage_key,
              name_en: stage.name_en,
              name_ru: stage.name_ru,
              short_label: stage.short_label,
              color: stage.color,
              probability: stage.probability,
              sort_order: stage.sort_order,
              is_system: false,
              is_active: true,
            } as any);
          if (error) throw error;
          insertedStages += 1;
        }
      }

      qc.invalidateQueries({ queryKey: ['crm-custom-options'] });
      qc.invalidateQueries({ queryKey: ['pipeline-stages'] });
      qc.invalidateQueries({ queryKey: ['pipeline-stages-all'] });

      toast.success(
        isRu
          ? `Готово: +${insertedOptions} / обновлено ${updatedOptions} опций, +${insertedStages} / обновлено ${updatedStages} этапов`
          : `Done: +${insertedOptions} / updated ${updatedOptions} options, +${insertedStages} / updated ${updatedStages} stages`
      );

      onOpenChange(false);
      reset();
    } catch (error: unknown) {
      toast.error((error instanceof Error ? error.message : '') || (isRu ? 'Ошибка импорта' : 'Import error'));
    } finally {
      setImporting(false);
    }
  };

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
      title={isRu ? 'Импорт CRM из ODOO' : 'Import CRM from ODOO'}
      icon={<Upload className="h-5 w-5 text-primary" />}
      size="lg"
    >
      <div className="space-y-4">
        <div className="rounded-xl border border-border/60 p-4 bg-card">
          <p className="text-sm font-medium mb-2">{isRu ? 'Загрузите CSV из ODOO' : 'Upload CSV export from ODOO'}</p>
          <p className="text-xs text-muted-foreground mb-3">
            {isRu
              ? 'Поддерживаются этапы сделок и справочники CRM (тип контакта, источник, тип сделки, тип задачи, причины проигрыша).'
              : 'Supports deal stages and CRM dictionaries (contact type, lead source, deal type, task type, lost reasons).'}
          </p>
          <div
            className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = '.csv';
              input.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) handleFile(file);
              };
              input.click();
            }}
          >
            {parsing ? (
              <Loader2 className="h-6 w-6 mx-auto animate-spin text-muted-foreground" />
            ) : (
              <Upload className="h-6 w-6 mx-auto text-muted-foreground" />
            )}
            <p className="text-sm mt-2">{fileName || (isRu ? 'Нажмите, чтобы выбрать CSV' : 'Click to choose CSV')}</p>
          </div>
        </div>

        {rows.length > 0 && (
          <div className="rounded-xl border border-border/60 p-4 space-y-3 bg-card">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{isRu ? `Строк: ${rows.length}` : `Rows: ${rows.length}`}</Badge>
              <Badge variant="secondary">{isRu ? `Опции: ${parsed.options.length}` : `Options: ${parsed.options.length}`}</Badge>
              <Badge variant="secondary">{isRu ? `Этапы: ${parsed.stages.length}` : `Stages: ${parsed.stages.length}`}</Badge>
            </div>

            <div className="space-y-1">
              <Label>{isRu ? 'Тип сделки по умолчанию (если не указан в CSV)' : 'Default deal type (if not set in CSV)'}</Label>
              <Select value={defaultDealType} onValueChange={(v) => setDefaultDealType(v as DealType)}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEAL_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {isRu ? DEAL_TYPE_LABELS[type].ru : DEAL_TYPE_LABELS[type].en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {isRu ? 'Отмена' : 'Cancel'}
          </Button>
          <Button onClick={handleImport} disabled={rows.length === 0 || importing}>
            {importing ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <FileText className="h-4 w-4 mr-1" />}
            {isRu ? 'Импортировать настройки' : 'Import settings'}
          </Button>
        </div>
      </div>
    </ResponsiveModal>
  );
}
