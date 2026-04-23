import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProjectUnitsGrid, useCreateProjectUnit, useUpdateProjectUnit, useDeleteProjectUnit, ProjectUnit } from '@/hooks/useProjectUnitsGrid';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ResponsiveModal } from '@/components/ui/responsive-modal';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Pencil, Building2, Eye, Upload } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { ProjectUnitsBulkImport } from './ProjectUnitsBulkImport';

interface Props {
  projectId: string;
}

const UNIT_TYPES = ['studio', '1br', '2br', '3br', 'penthouse', 'villa', 'townhouse', 'duplex'];

const STATUS_COLORS: Record<string, string> = {
  available: 'bg-success/10 text-success border-success/40',
  reserved: 'bg-accent/10 text-accent border-accent/40',
  sold: 'bg-red-500/10 text-red-600 border-red-200',
  held: 'bg-primary/10 text-primary border-primary/40',
};

const STATUS_LABELS: Record<string, { en: string; ru: string }> = {
  available: { en: 'Available', ru: 'Свободен' },
  reserved: { en: 'Reserved', ru: 'Забронирован' },
  sold: { en: 'Sold', ru: 'Продан' },
  held: { en: 'Held', ru: 'Удержан' },
};

export function ProjectUnitsGrid({ projectId }: Props) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const { data: units = [], isLoading } = useProjectUnitsGrid(projectId);
  const createUnit = useCreateProjectUnit();
  const updateUnit = useUpdateProjectUnit();
  const deleteUnit = useDeleteProjectUnit();
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [form, setForm] = useState({ unit_code: '', unit_type: 'studio', floor: '', area_sqm: '', bedrooms: '', bathrooms: '', price: '', view_type: '' });

  const handleCreate = () => {
    createUnit.mutate({
      project_id: projectId,
      unit_code: form.unit_code || null,
      unit_type: form.unit_type,
      floor: form.floor ? Number(form.floor) : null,
      area_sqm: form.area_sqm ? Number(form.area_sqm) : null,
      bedrooms: form.bedrooms ? Number(form.bedrooms) : null,
      bathrooms: form.bathrooms ? Number(form.bathrooms) : null,
      price: form.price ? Number(form.price) : null,
      price_per_sqm: form.area_sqm && form.price ? Number(form.price) / Number(form.area_sqm) : null,
      view_type: form.view_type || null,
      status: 'available',
      currency: 'THB',
      created_by: user?.id || null,
    } as any, {
      onSuccess: () => {
        setShowAdd(false);
        setForm({ unit_code: '', unit_type: 'studio', floor: '', area_sqm: '', bedrooms: '', bathrooms: '', price: '', view_type: '' });
      }
    });
  };

  const handleStatusChange = (unit: ProjectUnit, newStatus: string) => {
    updateUnit.mutate({ id: unit.id, projectId, status: newStatus } as any);
  };

  // Stats
  const stats = {
    total: units.length,
    available: units.filter(u => u.status === 'available').length,
    reserved: units.filter(u => u.status === 'reserved').length,
    sold: units.filter(u => u.status === 'sold').length,
  };

  if (isLoading) return <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="flex items-center gap-3 flex-wrap">
        <Badge variant="outline" className="text-xs">{isRu ? 'Всего' : 'Total'}: {stats.total}</Badge>
        <Badge className={STATUS_COLORS.available + ' text-xs'}>{stats.available} {isRu ? 'свободно' : 'available'}</Badge>
        <Badge className={STATUS_COLORS.reserved + ' text-xs'}>{stats.reserved} {isRu ? 'бронь' : 'reserved'}</Badge>
        <Badge className={STATUS_COLORS.sold + ' text-xs'}>{stats.sold} {isRu ? 'продано' : 'sold'}</Badge>
        <div className="ml-auto flex gap-2">
          {isAdmin && (
            <Button size="sm" variant="outline" onClick={() => setShowImport(true)}>
              <Upload className="h-3.5 w-3.5 mr-1" />{isRu ? 'CSV-импорт' : 'CSV Import'}
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => setShowAdd(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" />{isRu ? 'Добавить юнит' : 'Add Unit'}
          </Button>
        </div>
      </div>

      {/* Units grid */}
      {units.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Building2 className="h-8 w-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">{isRu ? 'Нет юнитов. Добавьте первый юнит.' : 'No units yet. Add the first unit.'}</p>
        </div>
      ) : (
        <div className="border rounded-none overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b">
                  <th className="text-left px-3 py-2 font-medium">{isRu ? 'Код' : 'Code'}</th>
                  <th className="text-left px-3 py-2 font-medium">{isRu ? 'Тип' : 'Type'}</th>
                  <th className="text-center px-3 py-2 font-medium">{isRu ? 'Этаж' : 'Floor'}</th>
                  <th className="text-right px-3 py-2 font-medium">{isRu ? 'Площадь' : 'Area'}</th>
                  <th className="text-right px-3 py-2 font-medium">{isRu ? 'Цена' : 'Price'}</th>
                  <th className="text-center px-3 py-2 font-medium">{isRu ? 'Статус' : 'Status'}</th>
                  <th className="text-center px-3 py-2 font-medium w-10"></th>
                </tr>
              </thead>
              <tbody>
                {units.map(unit => (
                  <tr key={unit.id} className="border-b last:border-0 hover:bg-accent/30 transition-colors">
                    <td className="px-3 py-2 font-mono text-xs">{unit.unit_code || '—'}</td>
                    <td className="px-3 py-2">
                      <Badge variant="outline" className="text-[10px] h-5">{unit.unit_type}</Badge>
                    </td>
                    <td className="px-3 py-2 text-center">{unit.floor ?? '—'}</td>
                    <td className="px-3 py-2 text-right">{unit.area_sqm ? `${unit.area_sqm} m²` : '—'}</td>
                    <td className="px-3 py-2 text-right font-medium">
                      {unit.price ? `฿${Number(unit.price).toLocaleString()}` : '—'}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <Select value={unit.status} onValueChange={v => handleStatusChange(unit, v)}>
                        <SelectTrigger className={`h-6 text-[10px] px-2 w-[100px] mx-auto border ${STATUS_COLORS[unit.status] || ''}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(STATUS_LABELS).map(([k, v]) => (
                            <SelectItem key={k} value={k} className="text-xs">{isRu ? v.ru : v.en}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <Button
                        variant="ghost" size="icon" className="h-6 w-6"
                        onClick={() => deleteUnit.mutate({ id: unit.id, projectId })}
                      >
                        <Trash2 className="h-3 w-3 text-muted-foreground" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Unit Modal */}
      <ResponsiveModal open={showAdd} onOpenChange={setShowAdd} title={isRu ? 'Добавить юнит' : 'Add Unit'}>
        <div className="space-y-3 p-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">{isRu ? 'Код юнита' : 'Unit Code'}</Label>
              <Input placeholder="A-301" value={form.unit_code} onChange={e => setForm(f => ({ ...f, unit_code: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs">{isRu ? 'Тип' : 'Type'}</Label>
              <Select value={form.unit_type} onValueChange={v => setForm(f => ({ ...f, unit_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {UNIT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">{isRu ? 'Этаж' : 'Floor'}</Label>
              <Input type="number" value={form.floor} onChange={e => setForm(f => ({ ...f, floor: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs">{isRu ? 'Площадь (м²)' : 'Area (m²)'}</Label>
              <Input type="number" value={form.area_sqm} onChange={e => setForm(f => ({ ...f, area_sqm: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs">{isRu ? 'Вид' : 'View'}</Label>
              <Input placeholder="Sea view" value={form.view_type} onChange={e => setForm(f => ({ ...f, view_type: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">{isRu ? 'Спальни' : 'Bedrooms'}</Label>
              <Input type="number" value={form.bedrooms} onChange={e => setForm(f => ({ ...f, bedrooms: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs">{isRu ? 'Ванные' : 'Bathrooms'}</Label>
              <Input type="number" value={form.bathrooms} onChange={e => setForm(f => ({ ...f, bathrooms: e.target.value }))} />
            </div>
          </div>
          <div>
            <Label className="text-xs">{isRu ? 'Цена (THB)' : 'Price (THB)'}</Label>
            <Input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
          </div>
          <Button className="w-full" onClick={handleCreate} disabled={createUnit.isPending}>
            {isRu ? 'Добавить' : 'Add Unit'}
          </Button>
        </div>
      </ResponsiveModal>

      {/* Bulk CSV import (admin only) */}
      <ProjectUnitsBulkImport projectId={projectId} open={showImport} onOpenChange={setShowImport} />
    </div>
  );
}
