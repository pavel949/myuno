/**
 * Bulk-link properties to a canonical `property_projects` row.
 *
 * Part of the unit-table consolidation (see
 * docs/canonical/architecture/UNIT_TABLE_MIGRATION.md): every unit-level
 * listing must resolve its developer through a project, so `properties.project_id`
 * has to be filled. Selection is saved with a single UPDATE ... IN (...) call.
 */
import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Link2, Loader2, Search } from 'lucide-react';

interface PropertyRow {
  id: string;
  title: string | null;
  district: string | null;
  project_id: string | null;
}

interface ProjectRow {
  id: string;
  name_en: string | null;
  name_ru: string | null;
  district: string | null;
}

export function PropertyProjectBulkLinkPanel() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const t = (ru: string, en: string) => (isRu ? ru : en);
  const queryClient = useQueryClient();

  const [projectId, setProjectId] = useState('');
  const [search, setSearch] = useState('');
  const [showLinked, setShowLinked] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);

  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ['admin-bulk-link-projects'],
    queryFn: async (): Promise<ProjectRow[]> => {
      const { data, error } = await supabase
        .from('property_projects')
        .select('id, name_en, name_ru, district')
        .order('name_en', { ascending: true })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as ProjectRow[];
    },
    staleTime: 5 * 60_000,
  });

  const { data: properties, isLoading: propsLoading } = useQuery({
    queryKey: ['admin-bulk-link-properties', showLinked],
    queryFn: async (): Promise<PropertyRow[]> => {
      let query = supabase
        .from('properties')
        .select('id, title, district, project_id')
        .order('created_at', { ascending: false })
        .limit(500);
      if (!showLinked) query = query.is('project_id', null);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as PropertyRow[];
    },
    staleTime: 60_000,
  });

  const projectLabel = (p: ProjectRow) =>
    (isRu ? p.name_ru || p.name_en : p.name_en || p.name_ru) || p.id.slice(0, 8);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return properties ?? [];
    return (properties ?? []).filter(
      (p) =>
        (p.title ?? '').toLowerCase().includes(q) ||
        (p.district ?? '').toLowerCase().includes(q),
    );
  }, [properties, search]);

  const allVisibleSelected = visible.length > 0 && visible.every((p) => selected.includes(p.id));

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('properties')
        .update({ project_id: projectId })
        .in('id', selected);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(
        t(`Привязано объектов: ${selected.length}`, `Linked ${selected.length} properties`),
      );
      setSelected([]);
      queryClient.invalidateQueries({ queryKey: ['admin-bulk-link-properties'] });
      queryClient.invalidateQueries({ queryKey: ['real-estate-domain-coverage'] });
      queryClient.invalidateQueries({ queryKey: ['real-estate-domain-chain'] });
      queryClient.invalidateQueries({ queryKey: ['admin-properties'] });
    },
    onError: (e: unknown) => {
      toast.error(
        t('Не удалось сохранить привязку', 'Could not save the linkage'),
        { description: e instanceof Error ? e.message : undefined },
      );
    },
  });

  const canSave = !!projectId && selected.length > 0 && !save.isPending;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Link2 className="h-4 w-4 text-muted-foreground" />
          {t('Массовая привязка к проектам', 'Bulk link to projects')}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {t(
            'Выберите проект и объекты — привязка сохраняется одной операцией.',
            'Pick a project and the properties — the linkage is saved in one operation.',
          )}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Select value={projectId} onValueChange={setProjectId} disabled={projectsLoading}>
            <SelectTrigger>
              <SelectValue placeholder={t('Проект', 'Project')} />
            </SelectTrigger>
            <SelectContent>
              {(projects ?? []).map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {projectLabel(p)}
                  {p.district ? ` · ${p.district}` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('Поиск объекта', 'Search a property')}
              className="pl-9"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={allVisibleSelected}
              onCheckedChange={(v) =>
                setSelected(v ? visible.map((p) => p.id) : [])
              }
              aria-label={t('Выбрать все', 'Select all')}
            />
            {t('Выбрать все показанные', 'Select all shown')}
            <Badge variant="secondary">{selected.length}</Badge>
          </label>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <Checkbox
                checked={showLinked}
                onCheckedChange={(v) => {
                  setShowLinked(Boolean(v));
                  setSelected([]);
                }}
                aria-label={t('Показать привязанные', 'Show linked')}
              />
              {t('Показать уже привязанные', 'Show already linked')}
            </label>
            <Button onClick={() => save.mutate()} disabled={!canSave}>
              {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('Сохранить привязку', 'Save linkage')}
            </Button>
          </div>
        </div>

        {propsLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : visible.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {t('Все объекты привязаны к проектам.', 'Every property is linked to a project.')}
          </p>
        ) : (
          <div className="max-h-72 divide-y divide-border overflow-y-auto border border-border">
            {visible.map((p) => (
              <label
                key={p.id}
                className="flex cursor-pointer items-center gap-3 px-3 py-2 text-sm hover:bg-muted/50"
              >
                <Checkbox
                  checked={selected.includes(p.id)}
                  onCheckedChange={(v) =>
                    setSelected((prev) =>
                      v ? [...prev, p.id] : prev.filter((id) => id !== p.id),
                    )
                  }
                />
                <span className="min-w-0 flex-1 truncate">
                  {p.title || p.id.slice(0, 8)}
                </span>
                {p.district && (
                  <span className="shrink-0 text-xs text-muted-foreground">{p.district}</span>
                )}
                {p.project_id && (
                  <Badge variant="outline" className="shrink-0 text-[10px]">
                    {t('привязан', 'linked')}
                  </Badge>
                )}
              </label>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
