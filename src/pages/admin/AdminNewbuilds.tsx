/**
 * Admin — Newbuilds management (projects, developers, featured, leads)
 * Inline editing for key fields, featured control, offplan_catalog
 */
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { toast } from 'sonner';

type Project = Database['public']['Tables']['property_projects']['Row'];
type ProjectUpdate = Database['public']['Tables']['property_projects']['Update'];
type Developer = Database['public']['Tables']['developers']['Row'];
type DeveloperUpdate = Database['public']['Tables']['developers']['Update'];

type CatalogShape = { rec?: string; type?: string; beach?: string } & Record<string, unknown>;
type ProjectEdits = Partial<ProjectUpdate> & {
  _catalogRec?: string;
  _catalogType?: string;
  _catalogBeach?: string;
};
import { Check, X, Star, StarOff, Shield, ShieldOff, Search, Edit2, Save, ExternalLink, ChevronDown, ChevronUp, CheckSquare, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NbProjectStatusBadge } from '@/components/newbuilds/NbProjectStatusBadge';
import { NbPriceDisplay } from '@/components/newbuilds/NbPriceDisplay';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';

export default function AdminNewbuilds() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const clearSelection = () => setSelectedIds(new Set());

  // All projects
  const { data: projects = [] } = useQuery({
    queryKey: ['admin-nb-projects'],
    queryFn: async () => {
      const { data, error } = await supabase.from('property_projects').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // All developers
  const { data: developers = [] } = useQuery({
    queryKey: ['admin-nb-developers'],
    queryFn: async () => {
      const { data, error } = await supabase.from('developers').select('*').order('name_en');
      if (error) throw error;
      return data || [];
    },
  });

  const updateProject = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: ProjectUpdate }) => {
      const { error } = await supabase.from('property_projects').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-nb-projects'] });
      toast.success('Обновлено');
    },
  });

  const updateDeveloper = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: DeveloperUpdate }) => {
      const { error } = await supabase.from('developers').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-nb-developers'] });
      toast.success('Обновлено');
    },
  });

  const bulkUpdateProjects = useMutation({
    mutationFn: async ({ ids, updates }: { ids: string[]; updates: ProjectUpdate }) => {
      const { error } = await supabase.from('property_projects').update(updates).in('id', ids);
      if (error) throw error;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['admin-nb-projects'] });
      clearSelection();
      toast.success(`Обновлено ${vars.ids.length} проектов`);
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : 'Ошибка'),
  });

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      if (statusFilter !== 'all' && p.project_status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (p.name_en || '').toLowerCase().includes(q) || (p.developer_name || '').toLowerCase().includes(q) || (p.district || '').toLowerCase().includes(q);
      }
      return true;
    });
  }, [projects, search, statusFilter]);

  const pending = projects.filter((p) => !p.is_approved);
  const featured = projects.filter((p) => p.is_featured);

  const stats = useMemo(() => ({
    total: projects.length,
    approved: projects.filter((p) => p.is_approved).length,
    withCatalog: projects.filter((p) => p.offplan_catalog).length,
    featured: featured.length,
    offplan: projects.filter((p) => p.project_status === 'offplan').length,
    construction: projects.filter((p) => p.project_status === 'under_construction').length,
    completed: projects.filter((p) => p.project_status === 'completed').length,
  }), [projects, featured]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Новостройки — Управление</h1>
        <div className="flex gap-2 text-xs text-muted-foreground">
          <span className="px-2 py-1 rounded-none bg-muted">{stats.total} всего</span>
          <span className="px-2 py-1 rounded-none bg-success/10 text-success">{stats.approved} одобрено</span>
          <span className="px-2 py-1 rounded-none bg-accent/10 text-accent">{stats.withCatalog} с каталогом</span>
          <span className="px-2 py-1 rounded-none bg-primary/10 text-primary">{stats.featured} featured</span>
        </div>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">Все ({stats.total})</TabsTrigger>
          <TabsTrigger value="pending">На проверке ({pending.length})</TabsTrigger>
          <TabsTrigger value="featured">Featured ({stats.featured})</TabsTrigger>
          <TabsTrigger value="developers">Девелоперы ({developers.length})</TabsTrigger>
        </TabsList>

        {/* Search + Filter bar */}
        <div className="flex gap-3 mt-4 mb-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Поиск..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все статусы</SelectItem>
              <SelectItem value="offplan">Off-plan</SelectItem>
              <SelectItem value="under_construction">Строится</SelectItem>
              <SelectItem value="completed">Сдан</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* ALL PROJECTS */}
        <TabsContent value="all" className="mt-2">
          <div className="overflow-x-auto border rounded-none">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left p-3 font-medium w-8">#</th>
                  <th className="text-left p-3 font-medium">Проект</th>
                  <th className="text-left p-3 font-medium">Девелопер</th>
                  <th className="text-left p-3 font-medium">Район</th>
                  <th className="text-left p-3 font-medium">Статус</th>
                  <th className="text-left p-3 font-medium">Тип</th>
                  <th className="text-left p-3 font-medium">Цена</th>
                  <th className="text-left p-3 font-medium">Score</th>
                  <th className="text-left p-3 font-medium w-32">Действия</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 100).map((p, i) => (
                  <ProjectRow
                    key={p.id}
                    project={p}
                    index={i + 1}
                    isEditing={editingId === p.id}
                    onEdit={() => setEditingId(editingId === p.id ? null : p.id)}
                    onUpdate={(updates) => updateProject.mutate({ id: p.id, updates })}
                  />
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length > 100 && (
            <p className="text-xs text-muted-foreground mt-2">Показано 100 из {filtered.length}</p>
          )}
        </TabsContent>

        {/* PENDING — with bulk actions */}
        <TabsContent value="pending" className="space-y-3 mt-4">
          {pending.length === 0 ? (
            <p className="text-muted-foreground">Нет проектов на проверке</p>
          ) : (
            <>
              <div className="sticky top-0 z-10 flex items-center justify-between gap-2 p-3 mb-3 rounded-none border bg-card shadow-sm">
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={selectedIds.size > 0 && pending.every((p) => selectedIds.has(p.id))}
                    onCheckedChange={(v) => {
                      if (v) setSelectedIds(new Set(pending.map((p) => p.id)));
                      else clearSelection();
                    }}
                    aria-label="Выбрать все"
                  />
                  <span className="text-sm text-muted-foreground">
                    {selectedIds.size > 0
                      ? `Выбрано: ${selectedIds.size} из ${pending.length}`
                      : `На проверке: ${pending.length}`}
                  </span>
                </div>
                {selectedIds.size > 0 && (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => bulkUpdateProjects.mutate({ ids: Array.from(selectedIds), updates: { is_approved: true } })} disabled={bulkUpdateProjects.isPending}>
                      <Check className="w-4 h-4 mr-1" /> Одобрить ({selectedIds.size})
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => bulkUpdateProjects.mutate({ ids: Array.from(selectedIds), updates: { is_active: false } })} disabled={bulkUpdateProjects.isPending}>
                      <X className="w-4 h-4 mr-1" /> Отклонить ({selectedIds.size})
                    </Button>
                    <Button size="sm" variant="ghost" onClick={clearSelection}>Сбросить</Button>
                  </div>
                )}
              </div>
              {pending.map((p) => (
                <div key={p.id} className="border rounded-none p-4 flex items-center gap-4">
                  <Checkbox checked={selectedIds.has(p.id)} onCheckedChange={() => toggleSelect(p.id)} aria-label={`Выбрать ${p.name_en}`} />
                  {p.cover_image && <img src={p.cover_image} className="w-16 h-16 rounded-none object-cover" alt={p.name_en} />}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{p.name_en}</h3>
                    <p className="text-sm text-muted-foreground">{p.developer_name} · {p.district || p.location_area}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => updateProject.mutate({ id: p.id, updates: { is_approved: true } })}>
                      <Check className="w-4 h-4 mr-1" /> Одобрить
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => updateProject.mutate({ id: p.id, updates: { is_active: false } })}>
                      <X className="w-4 h-4 mr-1" /> Отклонить
                    </Button>
                  </div>
                </div>
              ))}
            </>
          )}
        </TabsContent>

        {/* FEATURED */}
        <TabsContent value="featured" className="mt-4">
          <p className="text-sm text-muted-foreground mb-3">
            Перетаскивайте или меняйте ранг. Featured проекты отображаются первыми в каталоге.
          </p>
          <div className="space-y-2">
            {featured
              .sort((a, b) => (a.featured_rank || 99) - (b.featured_rank || 99))
              .map((p) => (
                <FeaturedRow
                  key={p.id}
                  project={p}
                  onUpdate={(updates) => updateProject.mutate({ id: p.id, updates })}
                  onRemove={() => updateProject.mutate({ id: p.id, updates: { is_featured: false, featured_rank: null, featured_label: null } })}
                />
              ))}
            {featured.length === 0 && (
              <p className="text-muted-foreground text-sm">Нет featured проектов. Отметьте звёздочкой в таблице.</p>
            )}
          </div>
        </TabsContent>

        {/* DEVELOPERS */}
        <TabsContent value="developers" className="mt-4 space-y-3">
          {developers.map((d) => (
            <DeveloperRow
              key={d.id}
              developer={d}
              projectCount={projects.filter((p) => p.developer_id === d.id || p.developer_name === d.name_en).length}
              onUpdate={(updates) => updateDeveloper.mutate({ id: d.id, updates })}
            />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ─── Inline editable project row ─── */
function ProjectRow({ project: p, index, isEditing, onEdit, onUpdate }: {
  project: Project;
  index: number;
  isEditing: boolean;
  onEdit: () => void;
  onUpdate: (updates: ProjectUpdate) => void;
}) {
  const [edits, setEdits] = useState<ProjectEdits>({});
  const catalog = (p.offplan_catalog as CatalogShape | null) || {};

  const handleSave = () => {
    const { _catalogRec, _catalogType, _catalogBeach, ...rest } = edits;
    const updates: ProjectUpdate = { ...rest };
    if (_catalogRec !== undefined || _catalogType !== undefined || _catalogBeach !== undefined) {
      updates.offplan_catalog = {
        ...catalog,
        ...(_catalogRec !== undefined ? { rec: _catalogRec } : {}),
        ...(_catalogType !== undefined ? { type: _catalogType } : {}),
        ...(_catalogBeach !== undefined ? { beach: _catalogBeach } : {}),
      };
    }
    onUpdate(updates);
    setEdits({});
    onEdit();
  };

  return (
    <>
      <tr className={`border-b hover:bg-muted/50 ${isEditing ? 'bg-primary/10' : ''}`}>
        <td className="p-3 text-xs text-muted-foreground">{index}</td>
        <td className="p-3">
          <div className="flex items-center gap-2">
            {p.cover_image && <img src={p.cover_image} className="w-8 h-8 rounded-none object-cover" />}
            <span className="font-medium truncate max-w-[200px]">{p.name_en}</span>
          </div>
        </td>
        <td className="p-3 text-muted-foreground text-xs">{p.developer_name || '—'}</td>
        <td className="p-3 text-muted-foreground text-xs">{p.district || p.location_area || '—'}</td>
        <td className="p-3"><NbProjectStatusBadge status={p.project_status || 'under_construction'} /></td>
        <td className="p-3 text-xs">{catalog.type || '—'}</td>
        <td className="p-3 text-xs">{p.price_from ? `฿${(p.price_from / 1e6).toFixed(1)}M` : '—'}</td>
        <td className="p-3 text-xs font-mono">{p.muuno_score || '—'}</td>
        <td className="p-3">
          <div className="flex gap-1">
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={onEdit}>
              <Edit2 className="w-3.5 h-3.5" />
            </Button>
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => onUpdate({ is_featured: !p.is_featured })}>
              {p.is_featured ? <Star className="w-3.5 h-3.5 text-accent fill-accent" /> : <StarOff className="w-3.5 h-3.5 text-muted-foreground" />}
            </Button>
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => onUpdate({ is_approved: !p.is_approved })}>
              {p.is_approved ? <Check className="w-3.5 h-3.5 text-success" /> : <X className="w-3.5 h-3.5 text-red-400" />}
            </Button>
          </div>
        </td>
      </tr>
      {isEditing && (
        <tr className="bg-primary/10">
          <td colSpan={9} className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div>
                <Label className="text-xs">Район</Label>
                <Input size={1} value={edits.district ?? p.district ?? ''} onChange={e => setEdits({ ...edits, district: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Девелопер</Label>
                <Input size={1} value={edits.developer_name ?? p.developer_name ?? ''} onChange={e => setEdits({ ...edits, developer_name: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Цена от (THB)</Label>
                <Input type="number" value={edits.price_from ?? p.price_from ?? ''} onChange={e => setEdits({ ...edits, price_from: Number(e.target.value) || null })} />
              </div>
              <div>
                <Label className="text-xs">MuUNO Score</Label>
                <Input type="number" value={edits.muuno_score ?? p.muuno_score ?? ''} onChange={e => setEdits({ ...edits, muuno_score: Number(e.target.value) || null })} />
              </div>
              <div>
                <Label className="text-xs">Статус</Label>
                <Select value={edits.project_status ?? p.project_status ?? 'offplan'} onValueChange={v => setEdits({ ...edits, project_status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="offplan">Off-plan</SelectItem>
                    <SelectItem value="under_construction">Строится</SelectItem>
                    <SelectItem value="completed">Сдан</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Тип (condo/villa/house)</Label>
                <Input value={edits._catalogType ?? catalog.type ?? ''} onChange={e => setEdits({ ...edits, _catalogType: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Рек. (BUY/WATCH/AVOID)</Label>
                <Select value={edits._catalogRec ?? catalog.rec ?? ''} onValueChange={v => setEdits({ ...edits, _catalogRec: v })}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BUY">BUY</SelectItem>
                    <SelectItem value="WATCH">WATCH</SelectItem>
                    <SelectItem value="AVOID">AVOID</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Risk Level</Label>
                <Input value={edits.risk_level ?? p.risk_level ?? ''} onChange={e => setEdits({ ...edits, risk_level: e.target.value })} />
              </div>
              <div className="col-span-2">
                <Label className="text-xs">Featured Label</Label>
                <Input value={edits.featured_label ?? p.featured_label ?? ''} onChange={e => setEdits({ ...edits, featured_label: e.target.value })} placeholder="e.g. Editor's Pick" />
              </div>
              <div>
                <Label className="text-xs">Featured Rank</Label>
                <Input type="number" value={edits.featured_rank ?? p.featured_rank ?? ''} onChange={e => setEdits({ ...edits, featured_rank: Number(e.target.value) || null })} />
              </div>
              <div className="flex items-end">
                <div className="flex gap-2">
                  <div className="flex items-center gap-2">
                    <Switch checked={edits.is_active ?? p.is_active ?? true} onCheckedChange={v => setEdits({ ...edits, is_active: v })} />
                    <Label className="text-xs">Active</Label>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end mt-3 gap-2">
              <Button size="sm" variant="outline" onClick={onEdit}>Отмена</Button>
              <Button size="sm" onClick={handleSave} disabled={Object.keys(edits).length === 0}>
                <Save className="w-3.5 h-3.5 mr-1" /> Сохранить
              </Button>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

/* ─── Featured row with rank/label editing ─── */
function FeaturedRow({ project: p, onUpdate, onRemove }: { project: Project; onUpdate: (u: ProjectUpdate) => void; onRemove: () => void }) {
  return (
    <div className="border rounded-none p-4 flex items-center gap-4">
      <div className="flex items-center gap-2 w-12">
        <Input
          type="number"
          className="w-12 h-8 text-center text-sm"
          value={p.featured_rank || ''}
          onChange={e => onUpdate({ featured_rank: Number(e.target.value) || null })}
          placeholder="#"
        />
      </div>
      {p.cover_image && <img src={p.cover_image} className="w-14 h-10 rounded-none object-cover" />}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-sm truncate">{p.name_en}</h3>
        <p className="text-xs text-muted-foreground">{p.developer_name} · Score: {p.muuno_score || '—'}</p>
      </div>
      <Input
        className="w-40 h-8 text-xs"
        value={p.featured_label || ''}
        onChange={e => onUpdate({ featured_label: e.target.value })}
        placeholder="Label (e.g. Best ROI)"
      />
      <Button size="sm" variant="ghost" onClick={onRemove}>
        <X className="w-4 h-4 text-muted-foreground" />
      </Button>
    </div>
  );
}

/* ─── Developer row with inline editing ─── */
function DeveloperRow({ developer: d, projectCount, onUpdate }: { developer: any; projectCount: number; onUpdate: (u: any) => void }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border rounded-none">
      <div className="p-4 flex items-center gap-4">
        {d.logo_url && <img src={d.logo_url} className="w-12 h-12 rounded-full object-cover" />}
        <div className="flex-1">
          <h3 className="font-semibold">{d.name_en}</h3>
          <p className="text-sm text-muted-foreground">{projectCount} проектов · {d.email || d.website || '—'}</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => onUpdate({ is_verified: !d.is_verified })}>
          {d.is_verified ? <Shield className="w-4 h-4 text-success mr-1" /> : <ShieldOff className="w-4 h-4 text-muted-foreground mr-1" />}
          {d.is_verified ? 'Верифицирован' : 'Верифицировать'}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setExpanded(!expanded)}>
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </Button>
      </div>
      {expanded && (
        <div className="px-4 pb-4 grid grid-cols-2 md:grid-cols-3 gap-3 border-t pt-3">
          <div>
            <Label className="text-xs">Email</Label>
            <Input size={1} defaultValue={d.email || ''} onBlur={e => e.target.value !== (d.email || '') && onUpdate({ email: e.target.value })} />
          </div>
          <div>
            <Label className="text-xs">Website</Label>
            <Input size={1} defaultValue={d.website || ''} onBlur={e => e.target.value !== (d.website || '') && onUpdate({ website: e.target.value })} />
          </div>
          <div>
            <Label className="text-xs">Телефон</Label>
            <Input size={1} defaultValue={d.phone || ''} onBlur={e => e.target.value !== (d.phone || '') && onUpdate({ phone: e.target.value })} />
          </div>
          <div>
            <Label className="text-xs">WhatsApp</Label>
            <Input size={1} defaultValue={d.whatsapp || ''} onBlur={e => e.target.value !== (d.whatsapp || '') && onUpdate({ whatsapp: e.target.value })} />
          </div>
          <div>
            <Label className="text-xs">Score</Label>
            <Input type="number" defaultValue={d.muuno_score || ''} onBlur={e => { const v = Number(e.target.value) || null; if (v !== d.muuno_score) onUpdate({ muuno_score: v }); }} />
          </div>
          <div className="flex items-end">
            <div className="flex items-center gap-2">
              <Switch checked={d.is_active ?? true} onCheckedChange={v => onUpdate({ is_active: v })} />
              <Label className="text-xs">Active</Label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
