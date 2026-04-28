/**
 * AdminMasterCatalog — CRUD UI for Master Taxonomy v1.0
 *
 * Manages `category_groups` (surfaces) → `categories` (categories) → services
 * with JTBD cluster tags (A..J) and persona codes (P01..P25).
 *
 * Reads from DB (live), writes via supabase upsert. Admin-only (RLS enforces).
 */
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageContainer } from '@/components/uno/PageContainer';
import { SectionHeader } from '@/components/ds';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter,
} from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronRight, Edit2, Layers, Loader2, Plus, Tag, Save } from 'lucide-react';
import { toast } from 'sonner';
import { JTBD_CLUSTERS, PERSONAS, type JtbdClusterId, type PersonaCode } from '@/lib/taxonomies/master';

interface DBCategory {
  id: string;
  slug: string;
  name_en: string;
  name_ru: string;
  parent_id: string | null;
  group_id: string | null;
  sort_order: number;
  app_path: string | null;
  status: string | null;
  jtbd_clusters: string[] | null;
  persona_codes: string[] | null;
  is_active: boolean;
  color: string | null;
  icon: string | null;
}

interface DBGroup {
  id: string;
  slug: string;
  name_en: string;
  name_ru: string;
  surface_id: string | null;
  is_surface: boolean;
  sort_order: number;
  is_active: boolean;
}

const STATUS_OPTIONS = ['available', 'soon', 'pro', 'beta'] as const;

export default function AdminMasterCatalog() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const t = (en: string, ru: string) => (isRu ? ru : en);
  const qc = useQueryClient();

  const [editing, setEditing] = useState<DBCategory | null>(null);
  const [activeSurface, setActiveSurface] = useState<string>('all');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-master-catalog'],
    queryFn: async () => {
      const [groupsRes, catsRes] = await Promise.all([
        supabase
          .from('category_groups')
          .select('id, slug, name_en, name_ru, surface_id, is_surface, sort_order, is_active')
          .eq('is_surface', true)
          .order('sort_order'),
        supabase
          .from('categories')
          .select('id, slug, name_en, name_ru, parent_id, group_id, sort_order, app_path, status, jtbd_clusters, persona_codes, is_active, color, icon')
          .order('sort_order'),
      ]);
      if (groupsRes.error) throw groupsRes.error;
      if (catsRes.error) throw catsRes.error;
      return {
        groups: (groupsRes.data ?? []) as DBGroup[],
        categories: (catsRes.data ?? []) as DBCategory[],
      };
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (patch: Partial<DBCategory> & { id: string }) => {
      const { error } = await supabase
        .from('categories')
        .update({
          name_en: patch.name_en,
          name_ru: patch.name_ru,
          status: patch.status,
          sort_order: patch.sort_order,
          app_path: patch.app_path,
          jtbd_clusters: (patch.jtbd_clusters ?? []) as never,
          persona_codes: (patch.persona_codes ?? []) as never,
          is_active: patch.is_active,
        })
        .eq('id', patch.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t('Saved', 'Сохранено'));
      qc.invalidateQueries({ queryKey: ['admin-master-catalog'] });
      qc.invalidateQueries({ queryKey: ['catalog', 'master-taxonomy', 'v1'] });
      setEditing(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const groupedBySurface = useMemo(() => {
    if (!data) return [];
    const groupsById = new Map(data.groups.map((g) => [g.id, g] as const));
    const visibleGroups = activeSurface === 'all'
      ? data.groups
      : data.groups.filter((g) => g.surface_id === activeSurface);
    return visibleGroups.map((g) => {
      const cats = data.categories
        .filter((c) => c.group_id === g.id && !c.parent_id)
        .map((parent) => ({
          ...parent,
          services: data.categories.filter((c) => c.parent_id === parent.id),
        }));
      return { group: g, categories: cats };
    });
  }, [data, activeSurface]);

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <SectionHeader
        title={t('Master Catalog', 'Мастер-каталог')}
        subtitle={t(
          'Surfaces · Categories · Services · JTBD · Personas (Master Taxonomy v1.0)',
          'Поверхности · Категории · Сервисы · JTBD · Персоны (Master Taxonomy v1.0)',
        )}
        icon={Layers}
        size="md"
      />

      <Tabs value={activeSurface} onValueChange={setActiveSurface} className="mt-4">
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="all">{t('All', 'Все')}</TabsTrigger>
          {data?.groups.map((g) => (
            <TabsTrigger key={g.id} value={g.surface_id ?? g.slug}>
              {isRu ? g.name_ru : g.name_en}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="space-y-6 mt-4">
        {groupedBySurface.map(({ group, categories }) => (
          <Card key={group.id}>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <span className="text-xs uppercase text-muted-foreground">
                  {group.surface_id}
                </span>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                {isRu ? group.name_ru : group.name_en}
                <Badge variant="secondary" className="ml-auto">
                  {categories.length} {t('categories', 'категорий')}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {categories.map((cat) => (
                <div key={cat.id} className="border border-border rounded-sm p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium text-sm">
                      {isRu ? cat.name_ru : cat.name_en}
                    </span>
                    <code className="text-[10px] text-muted-foreground">{cat.slug}</code>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="ml-auto h-7 px-2"
                      onClick={() => setEditing(cat)}
                    >
                      <Edit2 className="h-3 w-3 mr-1" /> {t('Edit', 'Изм.')}
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                    {cat.services.map((svc) => (
                      <button
                        key={svc.id}
                        onClick={() => setEditing(svc)}
                        className="text-left p-2 rounded-sm border border-border/40 hover:border-primary/50 hover:bg-muted/30 transition-colors"
                      >
                        <div className="text-xs font-medium truncate">
                          {isRu ? svc.name_ru : svc.name_en}
                        </div>
                        <div className="flex items-center gap-1 mt-1 flex-wrap">
                          {svc.status && svc.status !== 'available' && (
                            <Badge variant="outline" className="text-[9px] h-4 px-1">
                              {svc.status}
                            </Badge>
                          )}
                          {(svc.jtbd_clusters ?? []).slice(0, 3).map((j) => (
                            <Badge key={j} variant="secondary" className="text-[9px] h-4 px-1">
                              {j}
                            </Badge>
                          ))}
                          {(svc.persona_codes ?? []).length > 0 && (
                            <Badge variant="outline" className="text-[9px] h-4 px-1">
                              <Tag className="h-2 w-2 mr-0.5" />
                              {(svc.persona_codes ?? []).length}P
                            </Badge>
                          )}
                        </div>
                      </button>
                    ))}
                    {cat.services.length === 0 && (
                      <div className="text-xs text-muted-foreground col-span-full">
                        {t('No services', 'Нет сервисов')}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      <EditSheet
        item={editing}
        onClose={() => setEditing(null)}
        onSave={(patch) => updateMutation.mutate(patch)}
        saving={updateMutation.isPending}
        isRu={isRu}
      />
    </PageContainer>
  );
}

interface EditSheetProps {
  item: DBCategory | null;
  onClose: () => void;
  onSave: (patch: Partial<DBCategory> & { id: string }) => void;
  saving: boolean;
  isRu: boolean;
}

function EditSheet({ item, onClose, onSave, saving, isRu }: EditSheetProps) {
  const t = (en: string, ru: string) => (isRu ? ru : en);
  const [draft, setDraft] = useState<DBCategory | null>(item);

  // Reset draft on item change
  useMemo(() => setDraft(item), [item]);

  if (!item || !draft) return null;

  const toggleJtbd = (j: JtbdClusterId) => {
    const cur = new Set(draft.jtbd_clusters ?? []);
    if (cur.has(j)) cur.delete(j); else cur.add(j);
    setDraft({ ...draft, jtbd_clusters: Array.from(cur) });
  };
  const togglePersona = (p: PersonaCode) => {
    const cur = new Set(draft.persona_codes ?? []);
    if (cur.has(p)) cur.delete(p); else cur.add(p);
    setDraft({ ...draft, persona_codes: Array.from(cur) });
  };

  return (
    <Sheet open={!!item} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {t('Edit', 'Редактировать')}: <code className="text-xs">{draft.slug}</code>
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">EN name</Label>
              <Input
                value={draft.name_en}
                onChange={(e) => setDraft({ ...draft, name_en: e.target.value })}
              />
            </div>
            <div>
              <Label className="text-xs">RU name</Label>
              <Input
                value={draft.name_ru}
                onChange={(e) => setDraft({ ...draft, name_ru: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">{t('Status', 'Статус')}</Label>
              <Select
                value={draft.status ?? 'available'}
                onValueChange={(v) => setDraft({ ...draft, status: v })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">{t('Sort order', 'Сортировка')}</Label>
              <Input
                type="number"
                value={draft.sort_order ?? 0}
                onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) })}
              />
            </div>
          </div>

          <div>
            <Label className="text-xs">App path</Label>
            <Input
              placeholder="/services/cleaning"
              value={draft.app_path ?? ''}
              onChange={(e) => setDraft({ ...draft, app_path: e.target.value || null })}
            />
          </div>

          <div className="flex items-center gap-2">
            <Switch
              checked={draft.is_active}
              onCheckedChange={(v) => setDraft({ ...draft, is_active: v })}
            />
            <Label className="text-xs">{t('Active (visible to users)', 'Активно (видно)')}</Label>
          </div>

          {/* JTBD tags */}
          <div>
            <Label className="text-xs mb-2 block">
              JTBD ({(draft.jtbd_clusters ?? []).length}/10)
            </Label>
            <div className="flex flex-wrap gap-1">
              {JTBD_CLUSTERS.map((j) => {
                const active = (draft.jtbd_clusters ?? []).includes(j.id);
                return (
                  <button
                    key={j.id}
                    type="button"
                    onClick={() => toggleJtbd(j.id)}
                    className={`text-[10px] px-2 py-1 rounded-sm border ${
                      active
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border text-muted-foreground hover:border-primary/40'
                    }`}
                  >
                    {j.id} · {isRu ? j.shortRu : j.shortEn}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Persona tags */}
          <div>
            <Label className="text-xs mb-2 block">
              {t('Personas', 'Персоны')} ({(draft.persona_codes ?? []).length}/25)
            </Label>
            <div className="flex flex-wrap gap-1 max-h-48 overflow-y-auto">
              {Object.values(PERSONAS).map((p) => {
                const active = (draft.persona_codes ?? []).includes(p.code);
                return (
                  <button
                    key={p.code}
                    type="button"
                    onClick={() => togglePersona(p.code)}
                    className={`text-[10px] px-2 py-1 rounded-sm border ${
                      active
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border text-muted-foreground hover:border-primary/40'
                    }`}
                  >
                    {p.shortCode} · {isRu ? p.labelRu : p.labelEn}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <SheetFooter className="mt-6 gap-2">
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            {t('Cancel', 'Отмена')}
          </Button>
          <Button
            onClick={() => onSave(draft)}
            disabled={saving}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {t('Save', 'Сохранить')}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
