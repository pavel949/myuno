import React, { useState } from 'react';
import { logger } from '@/lib/logger';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Send, Users, Megaphone, Loader2, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

type SegmentFilter = 
  | 'all'
  | 'new'
  | 'active'
  | 'at_risk'
  | 'dormant'
  | 'churned'
  | 'vip'
  | 'high'
  | 'mid'
  | 'low';

interface SegmentOption {
  value: SegmentFilter;
  labelRu: string;
  labelEn: string;
  type: 'lifecycle' | 'value' | 'all';
}

const SEGMENT_OPTIONS: SegmentOption[] = [
  { value: 'all', labelRu: 'Все пользователи', labelEn: 'All Users', type: 'all' },
  { value: 'active', labelRu: 'Активные', labelEn: 'Active', type: 'lifecycle' },
  { value: 'at_risk', labelRu: 'Под риском', labelEn: 'At Risk', type: 'lifecycle' },
  { value: 'dormant', labelRu: 'Дремлющие', labelEn: 'Dormant', type: 'lifecycle' },
  { value: 'churned', labelRu: 'Отток', labelEn: 'Churned', type: 'lifecycle' },
  { value: 'new', labelRu: 'Новые', labelEn: 'New', type: 'lifecycle' },
  { value: 'vip', labelRu: 'VIP', labelEn: 'VIP', type: 'value' },
  { value: 'high', labelRu: 'Высокий LTV', labelEn: 'High LTV', type: 'value' },
  { value: 'mid', labelRu: 'Средний LTV', labelEn: 'Mid LTV', type: 'value' },
  { value: 'low', labelRu: 'Низкий LTV', labelEn: 'Low LTV', type: 'value' },
];

function useSegmentReach(filter: SegmentFilter) {
  return useQuery({
    queryKey: ['broadcast-reach', filter],
    queryFn: async () => {
      if (filter === 'all') {
        const { count } = await supabase
          .from('notification_preferences')
          .select('*', { count: 'exact', head: true })
          .eq('promotions', true);
        return count || 0;
      }

      const lifecycleStages = ['new', 'active', 'at_risk', 'dormant', 'churned'];
      const isLifecycle = lifecycleStages.includes(filter);
      const isVip = filter === 'vip';
      
      let query = supabase
        .from('user_segments')
        .select('user_id', { count: 'exact', head: true });

      if (isLifecycle) {
        query = query.eq('lifecycle_stage', filter);
      } else if (isVip) {
        query = query.eq('is_vip', true);
      } else {
        query = query.eq('value_segment', filter);
      }

      const { count } = await query;
      return count || 0;
    },
    staleTime: 30000,
  });
}

export function MCCBroadcastPanel() {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const [segmentFilter, setSegmentFilter] = useState<SegmentFilter>('all');
  const [channel, setChannel] = useState<'inapp' | 'email'>('inapp');
  const [titleRu, setTitleRu] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [bodyRu, setBodyRu] = useState('');
  const [bodyEn, setBodyEn] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [lastSent, setLastSent] = useState<{ sent: number } | null>(null);

  const { data: reach, isLoading: reachLoading } = useSegmentReach(segmentFilter);

  const handleSend = async () => {
    if (!titleRu && !titleEn) {
      toast.error(isRu ? 'Введите заголовок' : 'Enter a title');
      return;
    }
    if (!bodyRu && !bodyEn) {
      toast.error(isRu ? 'Введите текст сообщения' : 'Enter message body');
      return;
    }

    setIsSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-promotions', {
        body: {
          title: titleEn || titleRu,
          title_ru: titleRu,
          body: bodyEn || bodyRu,
          body_ru: bodyRu,
          promo_code: promoCode || undefined,
          channel,
          segment_filter: segmentFilter,
        },
      });

      if (error) throw error;

      setLastSent({ sent: data.sent || 0 });
      toast.success(isRu
        ? `Рассылка отправлена: ${data.sent} получателей`
        : `Broadcast sent: ${data.sent} recipients`
      );

      // Reset form
      setTitleRu('');
      setTitleEn('');
      setBodyRu('');
      setBodyEn('');
      setPromoCode('');
    } catch (err) {
      logger.error(err);
      toast.error(isRu ? 'Ошибка при отправке рассылки' : 'Failed to send broadcast');
    } finally {
      setIsSending(false);
    }
  };

  const selectedOption = SEGMENT_OPTIONS.find(o => o.value === segmentFilter);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-primary" />
          {isRu ? 'Сегментированная рассылка' : 'Segmented Broadcast'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {lastSent && (
          <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg text-primary text-sm">
            <CheckCircle className="h-4 w-4" />
            {isRu ? `Последняя рассылка: ${lastSent.sent} получателей` : `Last broadcast: ${lastSent.sent} recipients`}
          </div>
        )}

        {/* Audience selector */}
        <div className="space-y-2">
          <Label>{isRu ? 'Аудитория' : 'Audience'}</Label>
          <Select value={segmentFilter} onValueChange={(v) => setSegmentFilter(v as SegmentFilter)}>
            <SelectTrigger>
              <SelectValue>
                {selectedOption ? (isRu ? selectedOption.labelRu : selectedOption.labelEn) : '—'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {SEGMENT_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>
                  <div className="flex items-center gap-2">
                    <span>{isRu ? opt.labelRu : opt.labelEn}</span>
                    <Badge variant="outline" className="text-xs">{opt.type}</Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Reach preview */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            {reachLoading ? (
              <span>{isRu ? 'Считаем охват...' : 'Calculating reach...'}</span>
            ) : (
              <span>
                {isRu ? `Охват: ~${reach?.toLocaleString() || 0} пользователей` : `Reach: ~${reach?.toLocaleString() || 0} users`}
              </span>
            )}
          </div>
        </div>

        <Separator />

        {/* Channel */}
        <div className="space-y-2">
          <Label>{isRu ? 'Канал' : 'Channel'}</Label>
          <RadioGroup value={channel} onValueChange={(v) => setChannel(v as 'inapp' | 'email')} className="flex gap-4">
            <div className="flex items-center gap-2">
              <RadioGroupItem value="inapp" id="ch-inapp" />
              <Label htmlFor="ch-inapp">{isRu ? 'In-app уведомление' : 'In-app notification'}</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="email" id="ch-email" />
              <Label htmlFor="ch-email">Email</Label>
            </div>
          </RadioGroup>
        </div>

        {/* Message form */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>{isRu ? 'Заголовок (RU)' : 'Title (RU)'}</Label>
            <Input value={titleRu} onChange={e => setTitleRu(e.target.value)} placeholder="Специальное предложение!" />
          </div>
          <div className="space-y-2">
            <Label>{isRu ? 'Заголовок (EN)' : 'Title (EN)'}</Label>
            <Input value={titleEn} onChange={e => setTitleEn(e.target.value)} placeholder="Special offer!" />
          </div>
          <div className="space-y-2">
            <Label>{isRu ? 'Текст (RU)' : 'Body (RU)'}</Label>
            <Textarea value={bodyRu} onChange={e => setBodyRu(e.target.value)} rows={3} placeholder="Скидка 20% на все услуги..." />
          </div>
          <div className="space-y-2">
            <Label>{isRu ? 'Текст (EN)' : 'Body (EN)'}</Label>
            <Textarea value={bodyEn} onChange={e => setBodyEn(e.target.value)} rows={3} placeholder="20% off all services..." />
          </div>
        </div>

        <div className="space-y-2">
          <Label>{isRu ? 'Промо-код (необязательно)' : 'Promo code (optional)'}</Label>
          <Input value={promoCode} onChange={e => setPromoCode(e.target.value.toUpperCase())} placeholder="SUMMER25" className="max-w-xs font-mono" />
        </div>

        <Button onClick={handleSend} disabled={isSending || (reach === 0)} className="w-full sm:w-auto">
          {isSending
            ? <Loader2 className="h-4 w-4 animate-spin mr-2" />
            : <Send className="h-4 w-4 mr-2" />
          }
          {isSending
            ? (isRu ? 'Отправка...' : 'Sending...')
            : (isRu ? `Запустить рассылку (~${reach || 0})` : `Launch broadcast (~${reach || 0})`)}
        </Button>
      </CardContent>
    </Card>
  );
}
