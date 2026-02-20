import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMyProperties } from '@/hooks/useMyProperties';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ClipboardCheck, Camera, Check, AlertTriangle, X, Plus, History } from 'lucide-react';
import { toast } from 'sonner';
import { UnifiedMediaUploader } from '@/components/upload/UnifiedMediaUploader';
import { format } from 'date-fns';

type InspectionStatus = 'ok' | 'damaged' | 'missing';

interface InspectionItem {
  item_id: string;
  item_name: string;
  status: InspectionStatus;
  notes: string;
  photos: string[];
}

const STATUS_CONFIG: Record<InspectionStatus, { label: { en: string; ru: string }; icon: typeof Check; color: string }> = {
  ok: { label: { en: 'OK', ru: 'ОК' }, icon: Check, color: 'text-green-600' },
  damaged: { label: { en: 'Damaged', ru: 'Повреждено' }, icon: AlertTriangle, color: 'text-amber-600' },
  missing: { label: { en: 'Missing', ru: 'Отсутствует' }, icon: X, color: 'text-destructive' },
};

export default function InspectionChecklist() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isRu = language === 'ru';
  const queryClient = useQueryClient();
  const { allProperties } = useMyProperties();

  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [inspectionType, setInspectionType] = useState<'check_in' | 'check_out'>('check_in');
  const [checklist, setChecklist] = useState<InspectionItem[]>([]);
  const [notes, setNotes] = useState('');
  const [mode, setMode] = useState<'history' | 'new'>('history');

  // Fetch inventory for selected property
  const { data: inventoryItems, isLoading: invLoading } = useQuery({
    queryKey: ['inventory-for-inspection', selectedPropertyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('property_inventory_items')
        .select('*')
        .eq('property_id', selectedPropertyId)
        .eq('is_active', true)
        .order('category');
      if (error) throw error;
      return data;
    },
    enabled: !!selectedPropertyId && mode === 'new',
  });

  // Fetch past inspections
  const { data: inspections, isLoading: histLoading } = useQuery({
    queryKey: ['inspections-history', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory_inspections')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
    enabled: !!user && mode === 'history',
  });

  const generateChecklist = () => {
    if (!inventoryItems?.length) return;
    setChecklist(
      inventoryItems
        .filter(i => ['furniture', 'electronics', 'kitchen', 'linens'].includes(i.category))
        .map(i => ({
          item_id: i.id,
          item_name: isRu && i.name_ru ? i.name_ru : i.name,
          status: 'ok' as InspectionStatus,
          notes: '',
          photos: [],
        }))
    );
  };

  const updateItemStatus = (idx: number, status: InspectionStatus) => {
    setChecklist(prev => prev.map((item, i) => i === idx ? { ...item, status } : item));
  };

  const updateItemNotes = (idx: number, notes: string) => {
    setChecklist(prev => prev.map((item, i) => i === idx ? { ...item, notes } : item));
  };

  const updateItemPhotos = (idx: number, photos: string[]) => {
    setChecklist(prev => prev.map((item, i) => i === idx ? { ...item, photos } : item));
  };

  const saveInspection = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('inventory_inspections').insert({
        property_id: selectedPropertyId,
        inspector_id: user!.id,
        inspection_type: inspectionType,
        items: checklist as any,
        notes: notes || null,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspections-history'] });
      toast.success(isRu ? 'Инспекция сохранена' : 'Inspection saved');
      setMode('history');
      setChecklist([]);
      setNotes('');
    },
    onError: (e: any) => toast.error(e.message),
  });

  const damagedCount = checklist.filter(i => i.status === 'damaged').length;
  const missingCount = checklist.filter(i => i.status === 'missing').length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button size="sm" variant={mode === 'history' ? 'default' : 'outline'} onClick={() => setMode('history')}>
            <History className="h-3.5 w-3.5 mr-1" />
            {isRu ? 'История' : 'History'}
          </Button>
          <Button size="sm" variant={mode === 'new' ? 'default' : 'outline'} onClick={() => setMode('new')}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            {isRu ? 'Новая' : 'New'}
          </Button>
        </div>
      </div>

      {mode === 'history' ? (
        <div className="space-y-3">
          {histLoading ? (
            [1, 2, 3].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)
          ) : !inspections?.length ? (
            <Card className="p-8 text-center">
              <ClipboardCheck className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground">{isRu ? 'Нет инспекций' : 'No inspections yet'}</p>
            </Card>
          ) : (
            inspections.map(ins => {
              const insItems = (ins.items as any as InspectionItem[]) || [];
              const dmg = insItems.filter(i => i.status === 'damaged').length;
              const miss = insItems.filter(i => i.status === 'missing').length;
              const propName = allProperties.find(p => p.property_id === ins.property_id);
              return (
                <Card key={ins.id} className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">
                        {propName ? (isRu ? propName.title_ru : propName.title) : '—'}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        <Badge variant="outline" className="text-[10px]">
                          {ins.inspection_type === 'check_in' ? (isRu ? 'Заезд' : 'Check-in') : (isRu ? 'Выезд' : 'Check-out')}
                        </Badge>
                        <span>{format(new Date(ins.created_at), 'dd.MM.yyyy HH:mm')}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-green-600 font-medium">{insItems.length - dmg - miss} ✓</span>
                      {dmg > 0 && <span className="text-amber-600 font-medium">{dmg} ⚠</span>}
                      {miss > 0 && <span className="text-destructive font-medium">{miss} ✗</span>}
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{isRu ? 'Объект' : 'Property'}</Label>
              <Select value={selectedPropertyId} onValueChange={(v) => { setSelectedPropertyId(v); setChecklist([]); }}>
                <SelectTrigger><SelectValue placeholder={isRu ? 'Выбрать' : 'Select'} /></SelectTrigger>
                <SelectContent>
                  {allProperties.map(p => (
                    <SelectItem key={p.property_id} value={p.property_id}>
                      {isRu ? p.title_ru : p.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{isRu ? 'Тип' : 'Type'}</Label>
              <Select value={inspectionType} onValueChange={(v: any) => setInspectionType(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="check_in">{isRu ? 'Заезд' : 'Check-in'}</SelectItem>
                  <SelectItem value="check_out">{isRu ? 'Выезд' : 'Check-out'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedPropertyId && !checklist.length && (
            <Button variant="outline" className="w-full" onClick={generateChecklist} disabled={invLoading}>
              <ClipboardCheck className="h-4 w-4 mr-2" />
              {invLoading
                ? (isRu ? 'Загрузка...' : 'Loading...')
                : (isRu ? 'Сгенерировать чек-лист' : 'Generate Checklist')}
            </Button>
          )}

          {checklist.length > 0 && (
            <>
              <div className="flex items-center gap-3 text-xs">
                <span className="text-muted-foreground">{isRu ? 'Итого:' : 'Total:'} {checklist.length}</span>
                {damagedCount > 0 && <Badge variant="outline" className="text-amber-600 border-amber-300">⚠ {damagedCount}</Badge>}
                {missingCount > 0 && <Badge variant="outline" className="text-destructive border-destructive/30">✗ {missingCount}</Badge>}
              </div>

              <div className="space-y-3">
                {checklist.map((item, idx) => {
                  const cfg = STATUS_CONFIG[item.status];
                  const Icon = cfg.icon;
                  return (
                    <Card key={item.item_id} className="p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium flex-1">{item.item_name}</p>
                        <div className="flex gap-1">
                          {(Object.keys(STATUS_CONFIG) as InspectionStatus[]).map(s => {
                            const sc = STATUS_CONFIG[s];
                            const SIcon = sc.icon;
                            return (
                              <Button
                                key={s}
                                size="icon"
                                variant={item.status === s ? 'default' : 'outline'}
                                className={`h-7 w-7 ${item.status === s ? '' : sc.color}`}
                                onClick={() => updateItemStatus(idx, s)}
                              >
                                <SIcon className="h-3.5 w-3.5" />
                              </Button>
                            );
                          })}
                        </div>
                      </div>
                      {item.status !== 'ok' && (
                        <div className="space-y-2">
                          <Textarea
                            placeholder={isRu ? 'Опишите проблему...' : 'Describe the issue...'}
                            value={item.notes}
                            onChange={e => updateItemNotes(idx, e.target.value)}
                            rows={2}
                            className="text-xs"
                          />
                          <div>
                            <Label className="text-xs flex items-center gap-1 mb-1">
                              <Camera className="h-3 w-3" /> {isRu ? 'Фото' : 'Photos'}
                            </Label>
                            <UnifiedMediaUploader
                              mode="gallery"
                              value={item.photos}
                              onChange={(v) => updateItemPhotos(idx, Array.isArray(v) ? v : [v])}
                              folder="inspections"
                              bucket="owner-vault"
                              maxItems={3}
                              enableCloudImport={false}
                              enableUrlImport={false}
                            />
                          </div>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>

              <div>
                <Label>{isRu ? 'Общие замечания' : 'General Notes'}</Label>
                <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
              </div>

              <Button className="w-full" onClick={() => saveInspection.mutate()} disabled={saveInspection.isPending}>
                <Check className="h-4 w-4 mr-2" />
                {isRu ? 'Сохранить инспекцию' : 'Save Inspection'}
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
