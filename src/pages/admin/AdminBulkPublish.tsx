/**
 * Admin Bulk Publish — quickly approve & activate content across:
 *  - events
 *  - marketplace_products
 *  - listings (vertical = bouquet)
 *
 * Single action: set is_active=true + approval_status='approved' for selected rows.
 * Also supports reject (approval_status='rejected') and deactivate (is_active=false).
 */
import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { CheckCircle2, XCircle, Power, Image as ImageIcon } from 'lucide-react';

type DatasetKey = 'events' | 'products' | 'bouquets';

interface Row {
  id: string;
  title: string;
  subtitle?: string | null;
  image?: string | null;
  is_active: boolean;
  approval_status: string | null;
}

interface DatasetConfig {
  key: DatasetKey;
  label: { ru: string; en: string };
  table: 'events' | 'marketplace_products' | 'listings';
  extraFilter?: { column: string; value: string };
  hasApprovalStatus: boolean;
  toRow: (raw: Record<string, unknown>, lang: 'ru' | 'en') => Row;
  selectCols: string;
}

const DATASETS: DatasetConfig[] = [
  {
    key: 'events',
    label: { ru: 'События', en: 'Events' },
    table: 'events',
    hasApprovalStatus: true,
    selectCols: 'id, title_en, title_ru, location_name, cover_image, is_active, approval_status',
    toRow: (r, lang) => ({
      id: r.id as string,
      title: (lang === 'ru' ? r.title_ru : r.title_en) as string,
      subtitle: r.location_name as string | null,
      image: r.cover_image as string | null,
      is_active: !!r.is_active,
      approval_status: (r.approval_status as string) ?? null,
    }),
  },
  {
    key: 'products',
    label: { ru: 'Товары', en: 'Products' },
    table: 'marketplace_products',
    hasApprovalStatus: false,
    selectCols: 'id, name_en, name_ru, vendor_name, cover_image, is_active',
    toRow: (r, lang) => ({
      id: r.id as string,
      title: (lang === 'ru' ? r.name_ru : r.name_en) as string,
      subtitle: r.vendor_name as string | null,
      image: r.cover_image as string | null,
      is_active: !!r.is_active,
      approval_status: null,
    }),
  },
  {
    key: 'bouquets',
    label: { ru: 'Букеты (listings)', en: 'Bouquets (listings)' },
    table: 'listings',
    extraFilter: { column: 'vertical', value: 'bouquet' },
    hasApprovalStatus: true,
    selectCols: 'id, name_en, name_ru, district, cover_image, is_active, approval_status',
    toRow: (r, lang) => ({
      id: r.id as string,
      title: (lang === 'ru' ? r.name_ru : r.name_en) as string,
      subtitle: r.district as string | null,
      image: r.cover_image as string | null,
      is_active: !!r.is_active,
      approval_status: (r.approval_status as string) ?? null,
    }),
  },
];

function useDataset(cfg: DatasetConfig) {
  const { language } = useLanguage();
  return useQuery({
    queryKey: ['admin-bulk', cfg.key],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let q = (supabase.from as any)(cfg.table).select(cfg.selectCols).order('created_at', { ascending: false }).limit(200);
      if (cfg.extraFilter) q = q.eq(cfg.extraFilter.column, cfg.extraFilter.value);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []).map((r: Record<string, unknown>) => cfg.toRow(r, language as 'ru' | 'en'));
    },
  });
}

function useBulkUpdate(cfg: DatasetConfig) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ ids, patch }: { ids: string[]; patch: Record<string, unknown> }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from as any)(cfg.table).update(patch).in('id', ids);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      toast.success(`Обновлено: ${vars.ids.length}`);
      qc.invalidateQueries({ queryKey: ['admin-bulk', cfg.key] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

function DatasetPanel({ cfg }: { cfg: DatasetConfig }) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { data: rows = [], isLoading } = useDataset(cfg);
  const mutation = useBulkUpdate(cfg);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const allSelected = rows.length > 0 && selected.size === rows.length;
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(rows.map((r) => r.id)));
  const toggleOne = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const runBulk = (patch: Record<string, unknown>) => {
    if (!selected.size) {
      toast.error(isRu ? 'Ничего не выбрано' : 'Nothing selected');
      return;
    }
    mutation.mutate(
      { ids: Array.from(selected), patch },
      { onSuccess: () => setSelected(new Set()) },
    );
  };

  const counts = useMemo(() => {
    const visible = rows.filter((r) => r.is_active && (!cfg.hasApprovalStatus || r.approval_status === 'approved')).length;
    return { total: rows.length, visible };
  }, [rows, cfg.hasApprovalStatus]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 sticky top-0 z-10 bg-background py-2 border-b border-border">
        <Checkbox checked={allSelected} onCheckedChange={toggleAll} aria-label="select all" />
        <span className="text-sm text-muted-foreground">
          {isRu ? 'Выбрано' : 'Selected'}: <strong>{selected.size}</strong> / {rows.length}
          {' · '}
          {isRu ? 'видимых' : 'visible'}: <strong>{counts.visible}</strong>
        </span>
        <div className="ml-auto flex flex-wrap gap-2">
          <Button
            size="sm"
            onClick={() => runBulk(cfg.hasApprovalStatus ? { is_active: true, approval_status: 'approved' } : { is_active: true })}
            disabled={!selected.size || mutation.isPending}
          >
            <CheckCircle2 className="w-4 h-4 mr-1" />
            {isRu ? 'Опубликовать' : 'Publish'}
          </Button>
          {cfg.hasApprovalStatus && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => runBulk({ approval_status: 'rejected' })}
              disabled={!selected.size || mutation.isPending}
            >
              <XCircle className="w-4 h-4 mr-1" />
              {isRu ? 'Отклонить' : 'Reject'}
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => runBulk({ is_active: false })}
            disabled={!selected.size || mutation.isPending}
          >
            <Power className="w-4 h-4 mr-1" />
            {isRu ? 'Деактивировать' : 'Deactivate'}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
        </div>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">{isRu ? 'Записей нет' : 'No records'}</p>
      ) : (
        <div className="space-y-1">
          {rows.map((r) => {
            const isVisible = r.is_active && (!cfg.hasApprovalStatus || r.approval_status === 'approved');
            return (
              <Card key={r.id} className="flex items-center gap-3 p-2">
                <Checkbox checked={selected.has(r.id)} onCheckedChange={() => toggleOne(r.id)} />
                {r.image ? (
                  <img src={r.image} alt="" className="w-10 h-10 object-cover" />
                ) : (
                  <div className="w-10 h-10 flex items-center justify-center bg-muted">
                    <ImageIcon className="w-4 h-4 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{r.title || '—'}</p>
                  {r.subtitle && <p className="text-xs text-muted-foreground truncate">{r.subtitle}</p>}
                </div>
                <div className="flex gap-1">
                  <Badge variant={r.is_active ? 'default' : 'secondary'} className="text-[10px]">
                    {r.is_active ? 'active' : 'inactive'}
                  </Badge>
                  {cfg.hasApprovalStatus && (
                    <Badge
                      variant={r.approval_status === 'approved' ? 'default' : 'outline'}
                      className="text-[10px]"
                    >
                      {r.approval_status ?? '—'}
                    </Badge>
                  )}
                  <Badge variant={isVisible ? 'default' : 'outline'} className="text-[10px]">
                    {isVisible ? '👁 visible' : 'hidden'}
                  </Badge>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function AdminBulkPublish() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  return (
    <PageContainer>
      <PageHeader
        title={isRu ? 'Массовая публикация' : 'Bulk Publish'}
        subtitle={isRu
          ? 'Одним кликом включить is_active и approved для выбранных записей'
          : 'Toggle is_active and approval_status in bulk'}
      />
      <Tabs defaultValue="events" className="mt-4">
        <TabsList>
          {DATASETS.map((d) => (
            <TabsTrigger key={d.key} value={d.key}>{d.label[isRu ? 'ru' : 'en']}</TabsTrigger>
          ))}
        </TabsList>
        {DATASETS.map((d) => (
          <TabsContent key={d.key} value={d.key} className="mt-4">
            <DatasetPanel cfg={d} />
          </TabsContent>
        ))}
      </Tabs>
    </PageContainer>
  );
}
