import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/hooks/useLanguage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Mail, Bell, Clock, Pencil, ArrowRight, Plane, Sun, Home, LogOut, Star } from 'lucide-react';

const STAGES = [
  { key: 'pre_arrival', icon: Plane, color: 'bg-blue-500', labelEn: 'Pre-Arrival', labelRu: 'До заезда', desc: '-24h before check-in' },
  { key: 'check_in', icon: Home, color: 'bg-green-500', labelEn: 'Check-in Day', labelRu: 'День заезда', desc: 'At check-in time' },
  { key: 'mid_stay', icon: Sun, color: 'bg-amber-500', labelEn: 'Mid-Stay', labelRu: 'Середина', desc: '+72h after check-in' },
  { key: 'pre_checkout', icon: LogOut, color: 'bg-orange-500', labelEn: 'Pre-Checkout', labelRu: 'До выезда', desc: '-24h before check-out' },
  { key: 'post_stay', icon: Star, color: 'bg-purple-500', labelEn: 'Post-Stay', labelRu: 'После выезда', desc: '+24h after check-out' },
];

interface Template {
  id: string;
  stage: string;
  trigger_type: string;
  channel: string;
  title_en: string;
  title_ru: string;
  body_en: string;
  body_ru: string;
  cta_url: string | null;
  cta_label_en: string | null;
  cta_label_ru: string | null;
  offset_hours: number;
  sort_order: number;
  is_active: boolean;
}

export default function LifecycleMessaging() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const qc = useQueryClient();
  const [editTemplate, setEditTemplate] = useState<Template | null>(null);

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['lifecycle-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lifecycle_templates')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return data as Template[];
    },
  });

  const { data: stats } = useQuery({
    queryKey: ['lifecycle-stats'],
    queryFn: async () => {
      const { count: total } = await supabase
        .from('lifecycle_executions')
        .select('*', { count: 'exact', head: true });
      const { count: sent } = await supabase
        .from('lifecycle_executions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'sent');
      const { count: pending } = await supabase
        .from('lifecycle_executions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      return { total: total || 0, sent: sent || 0, pending: pending || 0 };
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('lifecycle_templates')
        .update({ is_active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lifecycle-templates'] });
      toast.success(isRu ? 'Обновлено' : 'Updated');
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (tmpl: Template) => {
      const { error } = await supabase
        .from('lifecycle_templates')
        .update({
          title_en: tmpl.title_en,
          title_ru: tmpl.title_ru,
          body_en: tmpl.body_en,
          body_ru: tmpl.body_ru,
          channel: tmpl.channel,
          offset_hours: tmpl.offset_hours,
          cta_url: tmpl.cta_url,
          cta_label_en: tmpl.cta_label_en,
          cta_label_ru: tmpl.cta_label_ru,
        })
        .eq('id', tmpl.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lifecycle-templates'] });
      setEditTemplate(null);
      toast.success(isRu ? 'Шаблон сохранён' : 'Template saved');
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">{isRu ? 'Lifecycle Messaging' : 'Lifecycle Messaging'}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {isRu ? 'Автоматические сообщения гостям на каждом этапе проживания' : 'Automated guest messages at every stage of their stay'}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold">{stats?.total || 0}</p>
            <p className="text-xs text-muted-foreground">{isRu ? 'Всего отправлено' : 'Total Scheduled'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-green-600">{stats?.sent || 0}</p>
            <p className="text-xs text-muted-foreground">{isRu ? 'Доставлено' : 'Delivered'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-amber-600">{stats?.pending || 0}</p>
            <p className="text-xs text-muted-foreground">{isRu ? 'В очереди' : 'Pending'}</p>
          </CardContent>
        </Card>
      </div>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{isRu ? 'Путь гостя' : 'Guest Journey'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2">
            {STAGES.map((stage, idx) => {
              const StageIcon = stage.icon;
              const tmpl = templates.find(t => t.stage === stage.key);
              return (
                <div key={stage.key} className="flex items-center gap-2 min-w-0">
                  <div className="flex flex-col items-center text-center min-w-[100px]">
                    <div className={`w-10 h-10 rounded-full ${stage.color} flex items-center justify-center text-white mb-1`}>
                      <StageIcon className="h-5 w-5" />
                    </div>
                    <p className="text-xs font-medium">{isRu ? stage.labelRu : stage.labelEn}</p>
                    <p className="text-[10px] text-muted-foreground">{stage.desc}</p>
                    {tmpl && (
                      <Badge variant={tmpl.is_active ? 'default' : 'secondary'} className="mt-1 text-[10px]">
                        {tmpl.channel === 'email' ? <Mail className="h-3 w-3 mr-1" /> : <Bell className="h-3 w-3 mr-1" />}
                        {tmpl.channel}
                      </Badge>
                    )}
                  </div>
                  {idx < STAGES.length - 1 && <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Template Cards */}
      <div className="space-y-3">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">{isRu ? 'Загрузка...' : 'Loading...'}</p>
        ) : templates.map(tmpl => {
          const stage = STAGES.find(s => s.key === tmpl.stage);
          const StageIcon = stage?.icon || Clock;
          return (
            <Card key={tmpl.id} className={`transition-opacity ${!tmpl.is_active ? 'opacity-50' : ''}`}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className={`w-9 h-9 rounded-full ${stage?.color || 'bg-muted'} flex items-center justify-center text-white flex-shrink-0`}>
                      <StageIcon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-sm">{isRu ? tmpl.title_ru : tmpl.title_en}</p>
                        <Badge variant="outline" className="text-[10px]">
                          {tmpl.channel === 'email' ? <Mail className="h-3 w-3 mr-1" /> : <Bell className="h-3 w-3 mr-1" />}
                          {tmpl.channel}
                        </Badge>
                        <Badge variant="outline" className="text-[10px]">
                          <Clock className="h-3 w-3 mr-1" />
                          {tmpl.offset_hours > 0 ? `+${tmpl.offset_hours}h` : `${tmpl.offset_hours}h`}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {isRu ? tmpl.body_ru : tmpl.body_en}
                      </p>
                      {tmpl.cta_label_en && (
                        <p className="text-xs text-primary mt-1">
                          CTA: {isRu ? tmpl.cta_label_ru : tmpl.cta_label_en} → {tmpl.cta_url}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Switch
                      checked={tmpl.is_active}
                      onCheckedChange={(checked) => toggleMutation.mutate({ id: tmpl.id, is_active: checked })}
                    />
                    <Button size="icon" variant="ghost" onClick={() => setEditTemplate(tmpl)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Edit Dialog */}
      {editTemplate && (
        <Dialog open onOpenChange={() => setEditTemplate(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{isRu ? 'Редактировать шаблон' : 'Edit Template'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium">Title (EN)</label>
                  <Input value={editTemplate.title_en} onChange={e => setEditTemplate({ ...editTemplate, title_en: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-medium">Title (RU)</label>
                  <Input value={editTemplate.title_ru} onChange={e => setEditTemplate({ ...editTemplate, title_ru: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium">Body (EN)</label>
                <Textarea value={editTemplate.body_en} onChange={e => setEditTemplate({ ...editTemplate, body_en: e.target.value })} rows={3} />
              </div>
              <div>
                <label className="text-xs font-medium">Body (RU)</label>
                <Textarea value={editTemplate.body_ru} onChange={e => setEditTemplate({ ...editTemplate, body_ru: e.target.value })} rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium">Channel</label>
                  <Select value={editTemplate.channel} onValueChange={v => setEditTemplate({ ...editTemplate, channel: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="in_app">In-App</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium">Offset (hours)</label>
                  <Input type="number" value={editTemplate.offset_hours} onChange={e => setEditTemplate({ ...editTemplate, offset_hours: Number(e.target.value) })} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium">CTA URL</label>
                  <Input value={editTemplate.cta_url || ''} onChange={e => setEditTemplate({ ...editTemplate, cta_url: e.target.value })} placeholder="/welcome/{bookingId}" />
                </div>
                <div>
                  <label className="text-xs font-medium">CTA Label (EN)</label>
                  <Input value={editTemplate.cta_label_en || ''} onChange={e => setEditTemplate({ ...editTemplate, cta_label_en: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-medium">CTA Label (RU)</label>
                  <Input value={editTemplate.cta_label_ru || ''} onChange={e => setEditTemplate({ ...editTemplate, cta_label_ru: e.target.value })} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditTemplate(null)}>
                {isRu ? 'Отмена' : 'Cancel'}
              </Button>
              <Button onClick={() => saveMutation.mutate(editTemplate)} disabled={saveMutation.isPending}>
                {isRu ? 'Сохранить' : 'Save'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
