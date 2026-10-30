import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Building2, Search } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { ResponsiveModal } from '@/components/ui/responsive-modal';

interface Props {
  projectId: string;
}

const UNIT_TYPES = ['Studio', '1BR', '2BR', '3BR', 'Penthouse', 'Duplex'] as const;
const UNIT_STATUSES = [
  { value: 'active', labelEn: 'Active', labelRu: 'Активен', color: 'bg-success' },
  { value: 'inactive', labelEn: 'Inactive', labelRu: 'Неактивен', color: 'bg-muted' },
] as const;

export function ProjectUnitsTab({ projectId }: Props) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    unit_id: '', unit_type: '1BR', floor: '', area_sqm: '', price: '', status: 'inactive',
    view: '', bedrooms: '1', bathrooms: '1',
  });

  const { data: units = [], isLoading, error, refetch } = useQuery({
    queryKey: ['admin-project-properties', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('id, title_en, title_ru, property_type, bedrooms, bathrooms, area_sqm, sale_price, price, listing_type, is_active, floor, internal_name')
        .eq('project_id', projectId)
        .order('internal_name');
      if (error) throw error;
      return data || [];
    },
  });

  const addUnit = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('properties').insert({
        project_id: projectId,
        title_en: `Unit ${form.unit_id} — ${form.unit_type}`,
        title_ru: `Юнит ${form.unit_id} — ${form.unit_type}`,
        internal_name: form.unit_id,
        property_type: 'condo',
        listing_type: 'sale',
        bedrooms: form.bedrooms === '' ? null : Number(form.bedrooms),
        bathrooms: form.bathrooms === '' ? null : Number(form.bathrooms),
        area_sqm: Number(form.area_sqm) || null,
        sale_price: Number(form.price) || null,
        floor: form.floor === '' ? null : Number(form.floor),
        is_active: form.status === 'active',
        approval_status: 'pending',
      } as any).select('id').single();
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-project-properties', projectId] });
      setShowAdd(false);
      setForm({ unit_id: '', unit_type: '1BR', floor: '', area_sqm: '', price: '', status: 'inactive', view: '', bedrooms: '1', bathrooms: '1' });
      toast.success(isRu ? 'Юнит добавлен' : 'Unit added');
    },
    onError: (err: Error) => { toast.error(err.message || 'Failed to add unit'); },
  });

  const filtered = units.filter((u: any) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (u.title_en || '').toLowerCase().includes(s) || (u.internal_name || '').toLowerCase().includes(s);
  });

  const stats = {
    total: units.length,
    active: units.filter((u: any) => u.is_active).length,
    inactive: units.filter((u: any) => !u.is_active).length,
  };

  if (error) return <div role="alert" className="space-y-3"><p>{isRu ? 'Не удалось загрузить объекты проекта' : 'Could not load project properties'}</p><Button onClick={() => refetch()}>{isRu ? 'Повторить' : 'Retry'}</Button></div>;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="flex items-center gap-4 text-sm">
        <Badge variant="outline">{isRu ? 'Всего' : 'Total'}: {stats.total}</Badge>
        <Badge className="bg-success/10 text-success border-success/30">{isRu ? 'Активно' : 'Active'}: {stats.active}</Badge>
        <Badge className="bg-destructive/10 text-destructive border-destructive/30">{isRu ? 'Неактивно' : 'Inactive'}: {stats.inactive}</Badge>
      </div>

      {/* Search + Add */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder={isRu ? 'Поиск юнитов...' : 'Search units...'}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Button size="sm" onClick={() => setShowAdd(true)}>
          <Plus className="h-4 w-4 mr-1" />
          {isRu ? 'Юнит' : 'Unit'}
        </Button>
      </div>

      {/* Units List */}
      {isLoading ? (
        <p className="text-sm text-muted-foreground text-center py-8">Loading...</p>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Building2 className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              {isRu ? 'Нет юнитов в этом проекте' : 'No units in this project'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="border rounded-none overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-2 font-medium">{isRu ? 'Юнит' : 'Unit'}</th>
                <th className="text-left p-2 font-medium">{isRu ? 'Тип' : 'Type'}</th>
                <th className="text-right p-2 font-medium">m²</th>
                <th className="text-right p-2 font-medium">{isRu ? 'Этаж' : 'Floor'}</th>
                <th className="text-right p-2 font-medium">{isRu ? 'Цена' : 'Price'}</th>
                <th className="text-center p-2 font-medium">{isRu ? 'Активность объявления' : 'Listing activity'}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((unit: any) => (
                <tr key={unit.id} className="border-t hover:bg-muted/30">
                  <td className="p-2 font-medium">{unit.internal_name || unit.title_en}</td>
                  <td className="p-2 text-muted-foreground">{unit.bedrooms}BR</td>
                  <td className="p-2 text-right">{unit.area_sqm || '—'}</td>
                  <td className="p-2 text-right">{unit.floor ?? '—'}</td>
                  <td className="p-2 text-right font-mono">
                    {unit.sale_price ? `฿${(unit.sale_price / 1e6).toFixed(1)}M` : unit.price ? `฿${unit.price}` : '—'}
                  </td>
                  <td className="p-2 text-center">
                    <Badge variant="outline" className={unit.is_active ? 'text-success border-success/30' : 'text-destructive border-destructive/30'}>
                      {unit.is_active ? (isRu ? 'Активен' : 'Active') : (isRu ? 'Неактивен' : 'Inactive')}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Unit Modal */}
      <ResponsiveModal open={showAdd} onOpenChange={setShowAdd} title={isRu ? 'Добавить юнит' : 'Add Unit'} size="md"
        footer={
          <Button onClick={() => addUnit.mutate()} disabled={addUnit.isPending || !form.unit_id}>
            {addUnit.isPending ? '...' : (isRu ? 'Добавить' : 'Add Unit')}
          </Button>
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Unit ID *</Label><Input value={form.unit_id} onChange={e => setForm(f => ({ ...f, unit_id: e.target.value }))} placeholder="A-101" /></div>
          <div>
            <Label>{isRu ? 'Тип' : 'Type'}</Label>
            <Select value={form.unit_type} onValueChange={v => setForm(f => ({ ...f, unit_type: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{UNIT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>{isRu ? 'Этаж' : 'Floor'}</Label><Input type="number" value={form.floor} onChange={e => setForm(f => ({ ...f, floor: e.target.value }))} /></div>
          <div><Label>{isRu ? 'Площадь (м²)' : 'Area (sqm)'}</Label><Input type="number" value={form.area_sqm} onChange={e => setForm(f => ({ ...f, area_sqm: e.target.value }))} /></div>
          <div><Label>{isRu ? 'Цена (THB)' : 'Price (THB)'}</Label><Input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} /></div>
          <div>
            <Label>{isRu ? 'Активность объявления' : 'Listing activity'}</Label>
            <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {UNIT_STATUSES.map(s => (
                  <SelectItem key={s.value} value={s.value}>{isRu ? s.labelRu : s.labelEn}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div><Label>{isRu ? 'Спальни' : 'Bedrooms'}</Label><Input type="number" value={form.bedrooms} onChange={e => setForm(f => ({ ...f, bedrooms: e.target.value }))} /></div>
          <div><Label>{isRu ? 'Ванные' : 'Bathrooms'}</Label><Input type="number" value={form.bathrooms} onChange={e => setForm(f => ({ ...f, bathrooms: e.target.value }))} /></div>
        </div>
      </ResponsiveModal>
    </div>
  );
}
