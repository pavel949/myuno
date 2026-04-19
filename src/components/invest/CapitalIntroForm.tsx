import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  useCapitalIntroRequest,
  type CapitalIntroInput,
  type CapitalRangeBand,
  type CapitalTimeline,
} from '@/hooks/useCapitalIntroRequest';
import { Loader2, Send } from 'lucide-react';

interface Props {
  defaults: Pick<CapitalIntroInput, 'request_type' | 'listing_id' | 'project_id' | 'asset_class'>;
  onSuccess?: () => void;
  showCapitalRange?: boolean;
  showTimeline?: boolean;
}

export function CapitalIntroForm({
  defaults,
  onSuccess,
  showCapitalRange = true,
  showTimeline = true,
}: Props) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isRu = language === 'ru';
  const mutation = useCapitalIntroRequest();

  const [name, setName] = useState('');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState('');
  const [capitalRange, setCapitalRange] = useState<CapitalRangeBand | ''>('');
  const [timeline, setTimeline] = useState<CapitalTimeline | ''>('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await mutation.mutateAsync({
      ...defaults,
      guest_name: name || undefined,
      guest_email: email || undefined,
      guest_phone: phone || undefined,
      capital_range_thb: (capitalRange || undefined) as CapitalRangeBand | undefined,
      timeline: (timeline || undefined) as CapitalTimeline | undefined,
      message: message || undefined,
    });
    onSuccess?.();
  };

  const ranges: { v: CapitalRangeBand; l: string }[] = [
    { v: '<5M', l: isRu ? 'до 5 млн ฿' : 'Under 5M ฿' },
    { v: '5-20M', l: '5–20M ฿' },
    { v: '20-100M', l: '20–100M ฿' },
    { v: '100M+', l: '100M+ ฿' },
  ];

  const timelines: { v: CapitalTimeline; l: string }[] = [
    { v: 'now', l: isRu ? 'Сейчас' : 'Now' },
    { v: '1-3m', l: isRu ? '1–3 мес' : '1–3 months' },
    { v: '3-6m', l: isRu ? '3–6 мес' : '3–6 months' },
    { v: '6-12m', l: isRu ? '6–12 мес' : '6–12 months' },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="ci-name">{isRu ? 'Имя' : 'Name'}</Label>
          <Input id="ci-name" required value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ci-phone">{isRu ? 'Телефон / WhatsApp' : 'Phone / WhatsApp'}</Label>
          <Input id="ci-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="ci-email">Email</Label>
        <Input
          id="ci-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      {showCapitalRange && (
        <div className="space-y-1.5">
          <Label>{isRu ? 'Капитал' : 'Capital range'}</Label>
          <Select value={capitalRange} onValueChange={(v) => setCapitalRange(v as CapitalRangeBand)}>
            <SelectTrigger>
              <SelectValue placeholder={isRu ? 'Выберите диапазон' : 'Select range'} />
            </SelectTrigger>
            <SelectContent>
              {ranges.map((r) => (
                <SelectItem key={r.v} value={r.v}>
                  {r.l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {showTimeline && (
        <div className="space-y-1.5">
          <Label>{isRu ? 'Горизонт' : 'Timeline'}</Label>
          <Select value={timeline} onValueChange={(v) => setTimeline(v as CapitalTimeline)}>
            <SelectTrigger>
              <SelectValue placeholder={isRu ? 'Когда планируете?' : 'When are you planning?'} />
            </SelectTrigger>
            <SelectContent>
              {timelines.map((t) => (
                <SelectItem key={t.v} value={t.v}>
                  {t.l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="ci-msg">{isRu ? 'Комментарий' : 'Message'}</Label>
        <Textarea
          id="ci-msg"
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={
            isRu
              ? 'Расскажите кратко о целях, опыте, предпочтениях…'
              : 'Briefly: goals, background, preferences…'
          }
        />
      </div>

      <Button type="submit" className="w-full gap-2" disabled={mutation.isPending}>
        {mutation.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
        {isRu ? 'Отправить заявку' : 'Submit request'}
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        {isRu
          ? 'Заявка попадёт в наш CRM. Мы свяжемся в течение 24 часов.'
          : 'Lands in our CRM. We will respond within 24 hours.'}
      </p>
    </form>
  );
}
