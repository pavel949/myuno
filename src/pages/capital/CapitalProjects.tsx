import { useState } from 'react';
import { useCapitalProjects } from '@/hooks/capital';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Plus, X } from 'lucide-react';
import {
  BUYER_TYPE_LABELS, CONSTRUCTION_STATUS_LABELS,
  type ConstructionStatus, type BuyerType,
} from '@/types/capital';

const EMPTY_FORM = {
  name: '', developer: '', location_area: '',
  price_from: '', price_to: '', currency: 'THB',
  completion_date: '', construction_status: '' as ConstructionStatus | '',
  target_buyer_types: [] as string[],
  selling_points: [''] as string[],
  commission_pct: '', materials_url: '',
  units_total: '', units_available: '', notes: '',
};

export default function CapitalProjects() {
  const { projects, isLoading, createProject, updateProject, toggleActive, deleteProject } = useCapitalProjects();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  const resetForm = () => { setForm({ ...EMPTY_FORM }); setEditId(null); };

  const openEdit = (p: typeof projects[0]) => {
    setEditId(p.id);
    setForm({
      name: p.name, developer: p.developer || '', location_area: p.location_area || '',
      price_from: p.price_from?.toString() || '', price_to: p.price_to?.toString() || '',
      currency: p.currency, completion_date: p.completion_date || '',
      construction_status: p.construction_status || '',
      target_buyer_types: p.target_buyer_types || [],
      selling_points: p.selling_points?.length ? p.selling_points as string[] : [''],
      commission_pct: p.commission_pct?.toString() || '',
      materials_url: p.materials_url || '',
      units_total: p.units_total?.toString() || '',
      units_available: p.units_available?.toString() || '',
      notes: p.notes || '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Введите название проекта'); return; }
    const payload = {
      name: form.name,
      developer: form.developer || null,
      location_area: form.location_area || null,
      price_from: form.price_from ? Number(form.price_from) : null,
      price_to: form.price_to ? Number(form.price_to) : null,
      currency: form.currency,
      completion_date: form.completion_date || null,
      construction_status: (form.construction_status as ConstructionStatus) || null,
      target_buyer_types: form.target_buyer_types,
      selling_points: form.selling_points.filter(Boolean),
      commission_pct: form.commission_pct ? Number(form.commission_pct) : null,
      is_active: true,
      materials_url: form.materials_url || null,
      units_total: form.units_total ? Number(form.units_total) : null,
      units_available: form.units_available ? Number(form.units_available) : null,
      notes: form.notes || null,
    };

    try {
      if (editId) {
        await updateProject.mutateAsync({ id: editId, ...payload });
        toast.success('Проект обновлён');
      } else {
        await createProject.mutateAsync(payload);
        toast.success('Проект создан');
      }
      setDialogOpen(false);
      resetForm();
    } catch {
      toast.error('Ошибка сохранения');
    }
  };

  const toggleBuyerType = (bt: string) => {
    setForm((f) => ({
      ...f,
      target_buyer_types: f.target_buyer_types.includes(bt)
        ? f.target_buyer_types.filter((t) => t !== bt)
        : [...f.target_buyer_types, bt],
    }));
  };

  const addSellingPoint = () => setForm((f) => ({ ...f, selling_points: [...f.selling_points, ''] }));
  const removeSellingPoint = (idx: number) => setForm((f) => ({ ...f, selling_points: f.selling_points.filter((_, i) => i !== idx) }));
  const updateSellingPoint = (idx: number, val: string) =>
    setForm((f) => ({ ...f, selling_points: f.selling_points.map((s, i) => (i === idx ? val : s)) }));

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Проекты</h1>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-success hover:bg-success">
              <Plus className="w-4 h-4 mr-1" /> Добавить
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editId ? 'Редактировать проект' : 'Новый проект'}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-3 py-2">
              <div><Label>Название *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Застройщик</Label><Input value={form.developer} onChange={(e) => setForm({ ...form, developer: e.target.value })} /></div>
                <div><Label>Район</Label><Input value={form.location_area} onChange={(e) => setForm({ ...form, location_area: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><Label>Цена от</Label><Input type="number" value={form.price_from} onChange={(e) => setForm({ ...form, price_from: e.target.value })} /></div>
                <div><Label>Цена до</Label><Input type="number" value={form.price_to} onChange={(e) => setForm({ ...form, price_to: e.target.value })} /></div>
                <div>
                  <Label>Валюта</Label>
                  <Select value={form.currency} onValueChange={(v) => setForm({ ...form, currency: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="THB">THB</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Сдача</Label><Input type="date" value={form.completion_date} onChange={(e) => setForm({ ...form, completion_date: e.target.value })} /></div>
                <div>
                  <Label>Статус</Label>
                  <Select value={form.construction_status} onValueChange={(v) => setForm({ ...form, construction_status: v as ConstructionStatus })}>
                    <SelectTrigger><SelectValue placeholder="Выберите" /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(CONSTRUCTION_STATUS_LABELS).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Целевые типы покупателей</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {Object.entries(BUYER_TYPE_LABELS).map(([k, v]) => (
                    <label key={k} className="flex items-center gap-1.5 text-sm cursor-pointer">
                      <Checkbox checked={form.target_buyer_types.includes(k)} onCheckedChange={() => toggleBuyerType(k)} />
                      {v}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <Label>Selling points</Label>
                {form.selling_points.map((sp, idx) => (
                  <div key={idx} className="flex gap-2 mt-1">
                    <Input value={sp} onChange={(e) => updateSellingPoint(idx, e.target.value)} placeholder="Преимущество..." />
                    {form.selling_points.length > 1 && (
                      <Button variant="ghost" size="icon" onClick={() => removeSellingPoint(idx)}><X className="w-4 h-4" /></Button>
                    )}
                  </div>
                ))}
                <Button variant="ghost" size="sm" className="mt-1" onClick={addSellingPoint}>+ Добавить</Button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><Label>Комиссия %</Label><Input type="number" step="0.1" value={form.commission_pct} onChange={(e) => setForm({ ...form, commission_pct: e.target.value })} /></div>
                <div><Label>Юнитов всего</Label><Input type="number" value={form.units_total} onChange={(e) => setForm({ ...form, units_total: e.target.value })} /></div>
                <div><Label>Доступно</Label><Input type="number" value={form.units_available} onChange={(e) => setForm({ ...form, units_available: e.target.value })} /></div>
              </div>
              <div><Label>Заметки</Label><Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
              <Button onClick={handleSave} className="bg-success hover:bg-success">
                {editId ? 'Сохранить' : 'Создать'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48" />)}
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">Проектов пока нет</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => (
            <div
              key={p.id}
              className="rounded-none border border-border/50 p-4 space-y-2 hover:border-success/40 transition-colors cursor-pointer"
              onClick={() => openEdit(p)}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{p.name}</h3>
                  <p className="text-xs text-muted-foreground">{p.developer} &middot; {p.location_area}</p>
                </div>
                <div onClick={(e) => e.stopPropagation()}>
                  <Switch
                    checked={p.is_active}
                    onCheckedChange={(checked) => toggleActive.mutate({ id: p.id, is_active: checked })}
                  />
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                {p.construction_status && (
                  <Badge variant="outline" className="text-xs">
                    {CONSTRUCTION_STATUS_LABELS[p.construction_status as ConstructionStatus]}
                  </Badge>
                )}
                {p.commission_pct && <Badge className="bg-success/20 text-success text-xs">{p.commission_pct}%</Badge>}
              </div>
              <p className="text-sm">
                {p.price_from?.toLocaleString()}–{p.price_to?.toLocaleString()} {p.currency}
              </p>
              {p.units_available != null && p.units_total != null && (
                <p className="text-xs text-muted-foreground">
                  Доступно: {p.units_available} из {p.units_total}
                </p>
              )}
              {(p.selling_points as string[])?.length > 0 && (
                <div className="flex gap-1 flex-wrap">
                  {(p.selling_points as string[]).slice(0, 3).map((sp, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">{sp}</Badge>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
