import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMyProperties } from '@/hooks/useMyProperties';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { format, differenceInDays } from 'date-fns';
import { ru } from 'date-fns/locale';
import {
  Plus, Calendar, DollarSign, Moon, Edit2, Trash2, ChevronLeft,
} from 'lucide-react';

interface RateSeason {
  id: string;
  property_id: string;
  name_en: string;
  name_ru: string | null;
  start_date: string;
  end_date: string;
  nightly_rate: number;
  weekly_rate: number | null;
  monthly_rate: number | null;
  min_stay_nights: number;
  currency: string;
  is_active: boolean;
  notes: string | null;
}

export default function RateManagementPage() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isRu = language === 'ru';
  const { allProperties } = useMyProperties();
  const [selectedProperty, setSelectedProperty] = useState<string>('all');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingRate, setEditingRate] = useState<RateSeason | null>(null);

  const propertyIds = allProperties.map(p => p.property_id);

  const { data: rates, isLoading } = useQuery({
    queryKey: ['rate-seasons', user?.id, selectedProperty],
    queryFn: async () => {
      let q = supabase
        .from('property_rate_seasons')
        .select('*')
        .eq('owner_id', user!.id)
        .order('start_date', { ascending: true });
      if (selectedProperty !== 'all') {
        q = q.eq('property_id', selectedProperty);
      }
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as RateSeason[];
    },
    enabled: !!user?.id,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('property_rate_seasons').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rate-seasons'] });
      toast.success(isRu ? 'Сезон удалён' : 'Season deleted');
    },
  });

  const activeRates = rates?.filter(r => r.is_active) || [];
  const inactiveRates = rates?.filter(r => !r.is_active) || [];

  return (
    <div className="px-4 md:px-6 lg:px-8 pt-6 pb-24 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/owner')}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-semibold">{isRu ? 'Управление тарифами' : 'Rate Management'}</h1>
          <p className="text-sm text-muted-foreground">
            {isRu ? 'Сезонные ставки и динамическое ценообразование' : 'Seasonal rates & dynamic pricing'}
          </p>
        </div>
        <Button onClick={() => { setEditingRate(null); setSheetOpen(true); }}>
          <Plus className="h-4 w-4 mr-1" />
          {isRu ? 'Сезон' : 'Season'}
        </Button>
      </div>

      {allProperties.length > 1 && (
        <Select value={selectedProperty} onValueChange={setSelectedProperty}>
          <SelectTrigger className="w-full md:w-64">
            <SelectValue placeholder={isRu ? 'Все объекты' : 'All properties'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isRu ? 'Все объекты' : 'All Properties'}</SelectItem>
            {allProperties.map(p => (
              <SelectItem key={p.property_id} value={p.property_id}>
                {p.title || p.property_id.slice(0, 8)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
        </div>
      ) : activeRates.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Calendar className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-medium">{isRu ? 'Нет сезонов' : 'No Rate Seasons'}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {isRu ? 'Добавьте сезонные тарифы для ваших объектов' : 'Add seasonal rates for your properties'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {activeRates.map(rate => {
            const property = allProperties.find(p => p.property_id === rate.property_id);
            const today = new Date();
            const start = new Date(rate.start_date);
            const end = new Date(rate.end_date);
            const isCurrentSeason = today >= start && today <= end;
            const daysUntil = differenceInDays(start, today);

            return (
              <Card key={rate.id} className={isCurrentSeason ? 'border-primary/50 bg-primary/3' : ''}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{isRu ? (rate.name_ru || rate.name_en) : rate.name_en}</h3>
                        {isCurrentSeason && (
                          <Badge className="text-[10px]">{isRu ? 'Активен' : 'Active'}</Badge>
                        )}
                        {!isCurrentSeason && daysUntil > 0 && daysUntil <= 30 && (
                          <Badge variant="outline" className="text-[10px]">
                            {isRu ? `через ${daysUntil} дн.` : `in ${daysUntil}d`}
                          </Badge>
                        )}
                      </div>
                      {property && (
                        <p className="text-xs text-muted-foreground">{property.title}</p>
                      )}
                      <div className="flex items-center gap-3 text-sm">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(start, 'dd MMM', { locale: isRu ? ru : undefined })} — {format(end, 'dd MMM yyyy', { locale: isRu ? ru : undefined })}
                        </span>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="flex items-center gap-1 justify-end">
                        <Moon className="h-3 w-3 text-muted-foreground" />
                        <span className="font-semibold">฿{rate.nightly_rate.toLocaleString()}</span>
                        <span className="text-xs text-muted-foreground">/{isRu ? 'ночь' : 'night'}</span>
                      </div>
                      {rate.weekly_rate && (
                        <p className="text-xs text-muted-foreground">฿{rate.weekly_rate.toLocaleString()}/{isRu ? 'нед' : 'week'}</p>
                      )}
                      {rate.monthly_rate && (
                        <p className="text-xs text-muted-foreground">฿{rate.monthly_rate.toLocaleString()}/{isRu ? 'мес' : 'month'}</p>
                      )}
                      {rate.min_stay_nights > 1 && (
                        <p className="text-[10px] text-muted-foreground">min {rate.min_stay_nights} {isRu ? 'ночей' : 'nights'}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button variant="ghost" size="sm" onClick={() => { setEditingRate(rate); setSheetOpen(true); }}>
                      <Edit2 className="h-3 w-3 mr-1" />{isRu ? 'Изменить' : 'Edit'}
                    </Button>
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteMutation.mutate(rate.id)}>
                      <Trash2 className="h-3 w-3 mr-1" />{isRu ? 'Удалить' : 'Delete'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <RateSeasonSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        editingRate={editingRate}
        properties={allProperties}
        ownerId={user?.id || ''}
      />
    </div>
  );
}

function RateSeasonSheet({
  open, onOpenChange, editingRate, properties, ownerId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editingRate: RateSeason | null;
  properties: any[];
  ownerId: string;
}) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    property_id: '',
    name_en: '',
    name_ru: '',
    start_date: '',
    end_date: '',
    nightly_rate: '',
    weekly_rate: '',
    monthly_rate: '',
    min_stay_nights: '1',
  });

  useEffect(() => {
    if (editingRate) {
      setForm({
        property_id: editingRate.property_id,
        name_en: editingRate.name_en,
        name_ru: editingRate.name_ru || '',
        start_date: editingRate.start_date,
        end_date: editingRate.end_date,
        nightly_rate: String(editingRate.nightly_rate),
        weekly_rate: editingRate.weekly_rate ? String(editingRate.weekly_rate) : '',
        monthly_rate: editingRate.monthly_rate ? String(editingRate.monthly_rate) : '',
        min_stay_nights: String(editingRate.min_stay_nights),
      });
    } else {
      setForm({
        property_id: properties[0]?.property_id || '',
        name_en: '', name_ru: '', start_date: '', end_date: '',
        nightly_rate: '', weekly_rate: '', monthly_rate: '', min_stay_nights: '1',
      });
    }
  }, [editingRate, open]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        property_id: form.property_id,
        owner_id: ownerId,
        name_en: form.name_en,
        name_ru: form.name_ru || null,
        start_date: form.start_date,
        end_date: form.end_date,
        nightly_rate: Number(form.nightly_rate) || 0,
        weekly_rate: form.weekly_rate ? Number(form.weekly_rate) : null,
        monthly_rate: form.monthly_rate ? Number(form.monthly_rate) : null,
        min_stay_nights: Number(form.min_stay_nights) || 1,
      };
      if (editingRate) {
        const { error } = await supabase.from('property_rate_seasons').update(payload).eq('id', editingRate.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('property_rate_seasons').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rate-seasons'] });
      toast.success(isRu ? 'Сохранено' : 'Saved');
      onOpenChange(false);
    },
    onError: () => toast.error(isRu ? 'Ошибка сохранения' : 'Save failed'),
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{editingRate ? (isRu ? 'Редактировать сезон' : 'Edit Season') : (isRu ? 'Новый сезон' : 'New Season')}</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 mt-4">
          <div>
            <Label>{isRu ? 'Объект' : 'Property'}</Label>
            <Select value={form.property_id} onValueChange={v => setForm(f => ({ ...f, property_id: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {properties.map(p => (
                  <SelectItem key={p.property_id} value={p.property_id}>
                    {p.title || p.property_id.slice(0, 8)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{isRu ? 'Название (EN)' : 'Name (EN)'}</Label>
              <Input value={form.name_en} onChange={e => setForm(f => ({ ...f, name_en: e.target.value }))} placeholder="High Season" />
            </div>
            <div>
              <Label>{isRu ? 'Название (RU)' : 'Name (RU)'}</Label>
              <Input value={form.name_ru} onChange={e => setForm(f => ({ ...f, name_ru: e.target.value }))} placeholder="Высокий сезон" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{isRu ? 'Начало' : 'Start Date'}</Label>
              <Input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
            </div>
            <div>
              <Label>{isRu ? 'Конец' : 'End Date'}</Label>
              <Input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} />
            </div>
          </div>
          <div>
            <Label>{isRu ? 'Цена за ночь (฿)' : 'Nightly Rate (฿)'}</Label>
            <Input type="number" value={form.nightly_rate} onChange={e => setForm(f => ({ ...f, nightly_rate: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{isRu ? 'Недельная (฿)' : 'Weekly (฿)'}</Label>
              <Input type="number" value={form.weekly_rate} onChange={e => setForm(f => ({ ...f, weekly_rate: e.target.value }))} placeholder={isRu ? 'Опционально' : 'Optional'} />
            </div>
            <div>
              <Label>{isRu ? 'Месячная (฿)' : 'Monthly (฿)'}</Label>
              <Input type="number" value={form.monthly_rate} onChange={e => setForm(f => ({ ...f, monthly_rate: e.target.value }))} placeholder={isRu ? 'Опционально' : 'Optional'} />
            </div>
          </div>
          <div>
            <Label>{isRu ? 'Мин. ночей' : 'Min Stay (nights)'}</Label>
            <Input type="number" value={form.min_stay_nights} onChange={e => setForm(f => ({ ...f, min_stay_nights: e.target.value }))} />
          </div>
          <Button className="w-full" onClick={() => saveMutation.mutate()} disabled={!form.name_en || !form.start_date || !form.end_date || !form.nightly_rate}>
            {isRu ? 'Сохранить' : 'Save'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
