/**
 * PropertyTimeline — Visual chronological timeline of property events.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
  Home, Wrench, Shield, UserCheck, FileText, Calendar, Plus, Clock
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

const EVENT_TYPES = [
  { value: 'purchase', labelEn: 'Purchase', labelRu: 'Покупка', icon: Home, color: 'text-info' },
  { value: 'renovation', labelEn: 'Renovation', labelRu: 'Ремонт', icon: Wrench, color: 'text-accent-amber' },
  { value: 'insurance', labelEn: 'Insurance', labelRu: 'Страховка', icon: Shield, color: 'text-success' },
  { value: 'manager_change', labelEn: 'Manager Change', labelRu: 'Смена менеджера', icon: UserCheck, color: 'text-accent-purple' },
  { value: 'inspection', labelEn: 'Inspection', labelRu: 'Инспекция', icon: FileText, color: 'text-accent-cyan' },
  { value: 'contract', labelEn: 'Contract', labelRu: 'Договор', icon: FileText, color: 'text-primary' },
  { value: 'other', labelEn: 'Other', labelRu: 'Другое', icon: Calendar, color: 'text-muted-foreground' },
];

interface PassportEvent {
  id: string;
  property_id: string;
  event_type: string;
  event_date: string;
  title: string;
  description: string | null;
  created_at: string;
}

export function PropertyTimeline({ propertyId }: { propertyId: string }) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const qc = useQueryClient();
  const isRu = language === 'ru';
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ event_type: 'other', event_date: '', title: '', description: '' });

  const { data: events, isLoading } = useQuery({
    queryKey: ['passport-events', propertyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('property_passport_events')
        .select('*')
        .eq('property_id', propertyId)
        .order('event_date', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as PassportEvent[];
    },
    enabled: !!propertyId && !!user,
  });

  const addEvent = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('property_passport_events')
        .insert({
          property_id: propertyId,
          event_type: form.event_type,
          event_date: form.event_date,
          title: form.title,
          description: form.description || null,
          created_by: user?.id,
        } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['passport-events', propertyId] });
      setDialogOpen(false);
      setForm({ event_type: 'other', event_date: '', title: '', description: '' });
      toast(isRu ? 'Готово' : 'Done');
    },
    onError: (err: any) => {
      toast.error(isRu ? 'Ошибка' : 'Error');
    },
  });

  const getEventConfig = (type: string) => EVENT_TYPES.find(e => e.value === type) || EVENT_TYPES[EVENT_TYPES.length - 1];

  if (isLoading) {
    return (
      <Card>
        <CardHeader><Skeleton className="h-5 w-40" /></CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex gap-3">
              <Skeleton className="w-8 h-8 rounded-full" />
              <div className="space-y-1 flex-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            {isRu ? 'Паспорт объекта' : 'Property Passport'}
          </CardTitle>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="h-7 text-xs">
                <Plus className="w-3 h-3 mr-1" />
                {isRu ? 'Добавить' : 'Add'}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{isRu ? 'Новое событие' : 'New Event'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <Select value={form.event_type} onValueChange={v => setForm(f => ({ ...f, event_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {EVENT_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>
                        {isRu ? t.labelRu : t.labelEn}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="date"
                  value={form.event_date}
                  onChange={e => setForm(f => ({ ...f, event_date: e.target.value }))}
                  placeholder={isRu ? 'Дата' : 'Date'}
                />
                <Input
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder={isRu ? 'Заголовок' : 'Title'}
                />
                <Textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder={isRu ? 'Описание (необязательно)' : 'Description (optional)'}
                  rows={3}
                />
                <Button
                  className="w-full"
                  onClick={() => addEvent.mutate()}
                  disabled={!form.title || !form.event_date || addEvent.isPending}
                >
                  {addEvent.isPending
                    ? (isRu ? 'Сохранение...' : 'Saving...')
                    : (isRu ? 'Сохранить' : 'Save')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {(!events || events.length === 0) ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            {isRu ? 'Нет событий. Добавьте первое!' : 'No events yet. Add the first one!'}
          </p>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />

            <div className="space-y-4">
              {events.map((event, idx) => {
                const config = getEventConfig(event.event_type);
                const Icon = config.icon;
                return (
                  <div key={event.id} className="relative flex gap-3 pl-1">
                    <div className={`w-8 h-8 rounded-full border-2 border-background bg-muted flex items-center justify-center z-10 flex-shrink-0 ${config.color}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 pb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{event.title}</span>
                        <Badge variant="outline" className="text-[10px] h-4">
                          {isRu ? config.labelRu : config.labelEn}
                        </Badge>
                      </div>
                      {event.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{event.description}</p>
                      )}
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(event.event_date).toLocaleDateString(isRu ? 'ru-RU' : 'en-US', {
                          year: 'numeric', month: 'short', day: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
