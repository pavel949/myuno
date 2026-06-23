/**
 * ServicesTab — owner CRUD for their catalogue. TH fields auto-translate to RU on save.
 */
import { useState } from 'react';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/contexts/LanguageContext';
import { useThaiBusinessServices, useSaveThaiService, useDeleteThaiService } from '@/hooks/thaiServices/useThaiServices';
import type { ThaiService, ThaiServiceType } from '@/types/thaiBusiness';

export function ServicesTab({ businessId }: { businessId: string }) {
  const { t, language } = useLanguage();
  const { data: services = [], isLoading } = useThaiBusinessServices(businessId);
  const save = useSaveThaiService();
  const del = useDeleteThaiService();
  const [editing, setEditing] = useState<Partial<ThaiService> | null>(null);

  const blank: Partial<ThaiService> = { name_th: '', description_th: '', price_thb: 0, type: 'one_time' };

  const onSave = async () => {
    if (!editing?.name_th?.trim()) { toast.error('Название (тайский) обязательно'); return; }
    try {
      await save.mutateAsync({ business_id: businessId, ...editing });
      toast.success(t('thai.owner.saved'));
      setEditing(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error');
    }
  };

  if (isLoading) return <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>;

  return (
    <div className="space-y-4 max-w-2xl">
      {!editing && (
        <Button onClick={() => setEditing(blank)}><Plus className="w-4 h-4 mr-1" />{t('thai.owner.addService')}</Button>
      )}

      {editing && (
        <div className="border border-border p-4 space-y-3">
          <div className="space-y-1.5"><Label>Название (тайский) *</Label><Input value={editing.name_th ?? ''} onChange={(e) => setEditing({ ...editing, name_th: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Описание (тайский)</Label><Textarea rows={3} value={editing.description_th ?? ''} onChange={(e) => setEditing({ ...editing, description_th: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Цена (฿)</Label><Input type="number" value={editing.price_thb ?? 0} onChange={(e) => setEditing({ ...editing, price_thb: Number(e.target.value) })} /></div>
            <div className="space-y-1.5">
              <Label>Тип</Label>
              <Select value={editing.type ?? 'one_time'} onValueChange={(v) => setEditing({ ...editing, type: v as ThaiServiceType })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="one_time">Разовая</SelectItem>
                  <SelectItem value="by_time">По времени</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {editing.type === 'by_time' && (
            <div className="space-y-1.5"><Label>Длительность (мин)</Label><Input type="number" value={editing.duration_minutes ?? 60} onChange={(e) => setEditing({ ...editing, duration_minutes: Number(e.target.value) })} /></div>
          )}
          <div className="flex gap-2">
            <Button onClick={onSave} disabled={save.isPending}>{save.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : t('thai.owner.save')}</Button>
            <Button variant="outline" onClick={() => setEditing(null)}>{t('thai.booking.back')}</Button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {services.map((s) => (
          <div key={s.id} className="flex items-center justify-between border border-border p-3">
            <div>
              <p className="text-foreground">{language === 'ru' ? s.name_ru || s.name_th : s.name_th}</p>
              <p className="text-xs text-muted-foreground font-mono">฿{s.price_thb.toLocaleString()}</p>
            </div>
            <div className="flex gap-1">
              <Button size="icon" variant="ghost" onClick={() => setEditing(s)}><Pencil className="w-4 h-4" /></Button>
              <Button size="icon" variant="ghost" onClick={() => del.mutate({ id: s.id, business_id: businessId })}><Trash2 className="w-4 h-4" /></Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
