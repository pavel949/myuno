/**
 * ConciergeHelpSheet — единая форма «Связаться с myUNO».
 *
 * Открывается из любой точки приложения с указанным topic.
 * Отправляет заявку в edge-функцию submit-help-request, которая
 * сохраняет её в `help_requests` и рассылает алерт менеджеру.
 */
import { useState } from 'react';
import { Loader2, CheckCircle2, ShieldCheck, Clock } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { VoiceInputButton, appendTranscript } from '@/components/ui/voice-input-button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { trackEvent } from '@/lib/analytics/track';

export type HelpTopic =
  | 'visa'
  | 'invest'
  | 'business'
  | 'relocation'
  | 'property'
  | 'legal'
  | 'finance'
  | 'general';

export interface ConciergeHelpSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  topic: HelpTopic;
  /** Optional initial subject (auto-filled from page context). */
  initialSubject?: string;
  /** Optional vendor/listing context. */
  vendorId?: string | null;
  listingId?: string | null;
  /** Additional structured context for the manager. */
  sourceData?: Record<string, unknown>;
}

const TOPIC_LABELS: Record<HelpTopic, { ru: string; en: string }> = {
  visa: { ru: 'Виза и иммиграция', en: 'Visa & immigration' },
  invest: { ru: 'Инвестиции', en: 'Investment' },
  business: { ru: 'Бизнес и компания', en: 'Business & company' },
  relocation: { ru: 'Переезд', en: 'Relocation' },
  property: { ru: 'Недвижимость', en: 'Property' },
  legal: { ru: 'Юридический вопрос', en: 'Legal' },
  finance: { ru: 'Финансы и платежи', en: 'Finance' },
  general: { ru: 'Общий вопрос', en: 'General question' },
};

export function ConciergeHelpSheet({
  open,
  onOpenChange,
  topic,
  initialSubject,
  vendorId,
  listingId,
  sourceData,
}: ConciergeHelpSheetProps) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isRu = language === 'ru';

  const [subject, setSubject] = useState(initialSubject ?? '');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState('');
  const [urgency, setUrgency] = useState<'low' | 'normal' | 'high' | 'urgent'>('normal');
  const [channel, setChannel] = useState<'in_app' | 'whatsapp' | 'email' | 'phone'>(
    user ? 'in_app' : 'whatsapp',
  );
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const topicLabel = TOPIC_LABELS[topic][isRu ? 'ru' : 'en'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim().length < 5) {
      toast.error(isRu ? 'Опишите запрос подробнее' : 'Please describe your request');
      return;
    }
    if (!user && !email && !phone) {
      toast.error(isRu ? 'Укажите email или телефон' : 'Email or phone is required');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('submit-help-request', {
        body: {
          topic,
          subject: subject || undefined,
          message,
          urgency,
          contact_email: email || undefined,
          contact_phone: phone || undefined,
          preferred_channel: channel,
          language: isRu ? 'ru' : 'en',
          source_page: typeof document !== 'undefined' ? document.title : undefined,
          source_route: typeof window !== 'undefined' ? window.location.pathname : undefined,
          vendor_id: vendorId ?? undefined,
          listing_id: listingId ?? undefined,
          source_data: sourceData,
        },
      });

      if (error || !data?.success) {
        throw new Error(error?.message ?? 'submit_failed');
      }

      trackEvent('help_request_submit', {
        topic,
        urgency,
        preferred_channel: channel,
        has_user: !!user,
        request_id: data.request_id,
      });

      setSubmitted(true);
      toast.success(isRu ? 'Заявка отправлена' : 'Request sent');
    } catch (err) {
      console.error('[ConciergeHelpSheet] submit failed:', err);
      toast.error(
        isRu
          ? 'Не удалось отправить. Попробуйте ещё раз.'
          : "Couldn't submit. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = (next: boolean) => {
    if (!next) {
      setTimeout(() => {
        setSubmitted(false);
        setMessage('');
      }, 300);
    }
    onOpenChange(next);
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="bottom" className="max-h-[92vh] overflow-y-auto">
        <SheetHeader className="text-left">
          <SheetTitle>
            {isRu ? 'Помощь myUNO' : 'myUNO Help'} · {topicLabel}
          </SheetTitle>
          <SheetDescription>
            {isRu
              ? 'Опишите задачу — менеджер myUNO ответит и подберёт проверенного исполнителя.'
              : 'Describe your need — a myUNO manager will respond and match a verified provider.'}
          </SheetDescription>
        </SheetHeader>

        {submitted ? (
          <div className="py-12 text-center space-y-4">
            <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">
              {isRu ? 'Заявка получена' : 'Request received'}
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              {isRu
                ? 'Менеджер свяжется в ближайшее время удобным вам способом. Все ваши заявки — в разделе «Я».'
                : "A manager will reach out shortly via your preferred channel. Track all your requests under 'Me'."}
            </p>
            <Button onClick={() => handleClose(false)} className="mt-4">
              {isRu ? 'Закрыть' : 'Close'}
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="flex items-center gap-3 rounded-none border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
              <ShieldCheck className="w-4 h-4 shrink-0 text-primary" />
              <span>
                {isRu
                  ? 'Все коммуникации идут через myUNO. Контакты исполнителя не передаются — мы соединим вас сами.'
                  : 'All communication goes through myUNO. Provider contacts are not shared — we connect you.'}
              </span>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="hr-subject">
                {isRu ? 'Заголовок (необязательно)' : 'Subject (optional)'}
              </Label>
              <Input
                id="hr-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                maxLength={200}
                placeholder={
                  isRu ? 'Напр. «Education visa на 1 год»' : 'e.g. "Education visa for 1 year"'
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="hr-message">
                {isRu ? 'Опишите задачу' : 'Describe your need'} *
              </Label>
              <div className="relative">
                <Textarea
                  id="hr-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                  maxLength={5000}
                  required
                  placeholder={
                    isRu
                      ? 'Что нужно сделать, сроки, бюджет, особенности…'
                      : 'What you need, timeline, budget, specifics…'
                  }
                  className="pr-12"
                />
                <VoiceInputButton
                  onTranscript={(t) => setMessage((prev) => appendTranscript(prev, t))}
                  className="absolute bottom-2 right-2"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{isRu ? 'Срочность' : 'Urgency'}</Label>
                <Select value={urgency} onValueChange={(v) => setUrgency(v as typeof urgency)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">{isRu ? 'Не срочно' : 'Low'}</SelectItem>
                    <SelectItem value="normal">{isRu ? 'Обычная' : 'Normal'}</SelectItem>
                    <SelectItem value="high">{isRu ? 'Высокая' : 'High'}</SelectItem>
                    <SelectItem value="urgent">{isRu ? 'Срочно' : 'Urgent'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>{isRu ? 'Как связаться' : 'Contact via'}</Label>
                <Select value={channel} onValueChange={(v) => setChannel(v as typeof channel)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in_app">{isRu ? 'В приложении' : 'In-app'}</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="phone">{isRu ? 'Звонок' : 'Phone call'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="hr-email">Email {!user && !phone && '*'}</Label>
                <Input
                  id="hr-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  maxLength={255}
                  placeholder="you@example.com"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="hr-phone">
                  {isRu ? 'Телефон' : 'Phone'} {!user && !email && '*'}
                </Label>
                <Input
                  id="hr-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  maxLength={40}
                  placeholder="+66…"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              <span>
                {isRu
                  ? 'Среднее время ответа: 1–2 часа в рабочее время.'
                  : 'Average response time: 1–2 hours during business hours.'}
              </span>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isRu ? 'Отправка…' : 'Sending…'}
                </>
              ) : isRu ? (
                'Отправить запрос'
              ) : (
                'Send request'
              )}
            </Button>
          </form>
        )}
      </SheetContent>
    </Sheet>
  );
}
