/**
 * ConciergeHelpSheet — единая форма «Связаться с myUNO».
 *
 * Открывается из любой точки приложения с указанным topic.
 * Отправляет заявку в edge-функцию submit-help-request, которая
 * сохраняет её в `help_requests` и рассылает алерт менеджеру.
 */
import { useRef, useState } from 'react';
import { Loader2, CheckCircle2, MessageSquare, Clock } from 'lucide-react';
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
import { pickLang, type LangValues } from '@/lib/i18n/pickLang';
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

const TOPIC_LABELS: Record<HelpTopic, LangValues> = {
  visa: { ru: 'Виза и иммиграция', en: 'Visa & immigration', th: 'วีซ่าและการเข้าเมือง' },
  invest: { ru: 'Инвестиции', en: 'Investment', th: 'การลงทุน' },
  business: { ru: 'Бизнес и компания', en: 'Business & company', th: 'ธุรกิจและบริษัท' },
  relocation: { ru: 'Переезд', en: 'Relocation', th: 'การย้ายถิ่นฐาน' },
  property: { ru: 'Недвижимость', en: 'Property', th: 'อสังหาริมทรัพย์' },
  legal: { ru: 'Юридический вопрос', en: 'Legal', th: 'กฎหมาย' },
  finance: { ru: 'Финансы и платежи', en: 'Finance', th: 'การเงิน' },
  general: { ru: 'Общий вопрос', en: 'General question', th: 'คำถามทั่วไป' },
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
  const t = (value: LangValues) => pickLang(language, value);
  const pendingRef = useRef(false);
  const returnFocusRef = useRef<HTMLElement | null>(null);

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

  const topicLabel = t(TOPIC_LABELS[topic]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pendingRef.current || submitted) return;
    if (message.trim().length < 5) {
      toast.error(t({ ru: 'Опишите запрос подробнее', en: 'Please describe your request', th: 'โปรดอธิบายคำขอเพิ่มเติม' }));
      return;
    }
    if (!user && !email && !phone) {
      toast.error(t({ ru: 'Укажите email или телефон', en: 'Email or phone is required', th: 'โปรดระบุอีเมลหรือหมายเลขโทรศัพท์' }));
      return;
    }

    pendingRef.current = true;
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
          language: language === 'ru' || language === 'th' ? language : 'en',
          source_page: typeof document !== 'undefined' ? document.title : undefined,
          source_route: typeof window !== 'undefined' ? window.location.pathname : undefined,
          vendor_id: vendorId ?? undefined,
          listing_id: listingId ?? undefined,
          source_data: sourceData,
        },
      });

      if (error || data?.success !== true || typeof data.request_id !== 'string' || !data.request_id.trim()) {
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
      toast.success(t({ ru: 'Заявка сохранена', en: 'Request saved', th: 'บันทึกคำขอแล้ว' }));
    } catch (err) {
      console.error('[ConciergeHelpSheet] submit failed:', err);
      toast.error(
        t({ ru: 'Сохранение заявки не подтверждено. Попробуйте ещё раз.', en: 'Request saving was not confirmed. Please try again.', th: 'ยังยืนยันการบันทึกคำขอไม่ได้ โปรดลองอีกครั้ง' }),
      );
    } finally {
      pendingRef.current = false;
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
      <SheetContent
        side="bottom"
        closeLabel={t({ ru: 'Закрыть', en: 'Close', th: 'ปิด' })}
        className="max-h-[92vh] overflow-y-auto"
        onOpenAutoFocus={() => {
          // This controlled sheet has callers outside a SheetTrigger. Capture
          // their focus before Radix moves it into the dialog.
          returnFocusRef.current = document.activeElement instanceof HTMLElement
            ? document.activeElement : null;
        }}
        onCloseAutoFocus={(event) => {
          const opener = returnFocusRef.current;
          returnFocusRef.current = null;
          if (opener?.isConnected) {
            event.preventDefault();
            opener.focus({ preventScroll: true });
          }
        }}
      >
        <SheetHeader className="text-left">
          <SheetTitle>
            {t({ ru: 'Чем помочь?', en: 'How can we help?', th: 'ให้เราช่วยเรื่องอะไร' })} · {topicLabel}
          </SheetTitle>
          <SheetDescription>
            {t({ ru: 'Расскажите, что нужно. Форма сохраняет обращение для команды myUNO.', en: 'Tell us what you need. This form saves a request for the myUNO team.', th: 'บอกสิ่งที่คุณต้องการ แบบฟอร์มนี้บันทึกคำขอถึงทีม myUNO' })}
          </SheetDescription>
        </SheetHeader>

        {submitted ? (
          <div className="py-12 text-center space-y-4">
            <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">
              {t({ ru: 'Заявка сохранена', en: 'Your request is saved', th: 'บันทึกคำขอของคุณแล้ว' })}
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              {t({ ru: 'Команда ещё не ответила. Сохранение заявки не подтверждает услугу или срок ответа.', en: 'A team reply is still pending. Saving a request does not confirm a service or response time.', th: 'ยังรอการตอบกลับจากทีม การบันทึกคำขอไม่ได้ยืนยันบริการหรือเวลาตอบกลับ' })}
            </p>
            <Button onClick={() => handleClose(false)} className="mt-4">
              {t({ ru: 'Закрыть', en: 'Close', th: 'ปิด' })}
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="flex items-center gap-3 rounded-none border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
              <MessageSquare className="w-4 h-4 shrink-0 text-primary" />
              <span>
                {t({ ru: 'Укажите контакт для ответа команды myUNO по вашему обращению.', en: 'Provide a contact for the myUNO team to reply about your request.', th: 'ระบุช่องทางติดต่อเพื่อให้ทีม myUNO ตอบกลับเรื่องคำขอของคุณ' })}
              </span>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="hr-subject">
                {t({ ru: 'Коротко о чём вопрос (необязательно)', en: 'What is it about (optional)', th: 'หัวข้อคำถาม (ไม่บังคับ)' })}
              </Label>
              <Input
                id="hr-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                maxLength={200}
                placeholder={
                  t({ ru: 'Например: учебная виза на год', en: 'For example: education visa for one year', th: 'เช่น วีซ่าการศึกษาหนึ่งปี' })
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="hr-message">
                {t({ ru: 'Расскажите, что нужно', en: 'Tell us what you need', th: 'บอกสิ่งที่คุณต้องการ' })} *
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
                    t({ ru: 'Что нужно, к какому сроку, есть ли бюджет. Можно записать голосом.', en: 'What you need, by when, and your budget. You can also record it.', th: 'สิ่งที่ต้องการ กำหนดเวลา และงบประมาณ คุณสามารถใช้เสียงได้ด้วย' })
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
                <Label htmlFor="hr-urgency">{t({ ru: 'Насколько срочно', en: 'How urgent is it', th: 'เร่งด่วนเพียงใด' })}</Label>
                <Select value={urgency} onValueChange={(v) => setUrgency(v as typeof urgency)}>
                  <SelectTrigger id="hr-urgency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">{t({ ru: 'Могу подождать', en: 'I can wait', th: 'รอได้' })}</SelectItem>
                    <SelectItem value="normal">{t({ ru: 'В обычном порядке', en: 'No rush', th: 'ไม่เร่งด่วน' })}</SelectItem>
                    <SelectItem value="high">{t({ ru: 'Хотелось бы быстрее', en: 'Soon, please', th: 'ต้องการความช่วยเหลือเร็ว ๆ นี้' })}</SelectItem>
                    <SelectItem value="urgent">{t({ ru: 'Нужно сейчас', en: 'I need help now', th: 'ต้องการความช่วยเหลือตอนนี้' })}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="hr-channel">{t({ ru: 'Как с вами связаться', en: 'How to reach you', th: 'ช่องทางติดต่อกลับ' })}</Label>
                <Select value={channel} onValueChange={(v) => setChannel(v as typeof channel)}>
                  <SelectTrigger id="hr-channel">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in_app">{t({ ru: 'В приложении', en: 'In-app', th: 'ในแอป' })}</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="email">{t({ ru: 'Email', en: 'Email', th: 'อีเมล' })}</SelectItem>
                    <SelectItem value="phone">{t({ ru: 'Звонок', en: 'Phone call', th: 'โทรศัพท์' })}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="hr-email">{t({ ru: 'Email', en: 'Email', th: 'อีเมล' })} {!user && !phone && '*'}</Label>
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
                  {t({ ru: 'Телефон', en: 'Phone', th: 'หมายเลขโทรศัพท์' })} {!user && !email && '*'}
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
                {t({ ru: 'Срок ответа пока не подтверждён.', en: 'A response time has not been confirmed.', th: 'ยังไม่ได้ยืนยันเวลาตอบกลับ' })}
              </span>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t({ ru: 'Отправка…', en: 'Sending…', th: 'กำลังส่ง…' })}
                </>
              ) : t({ ru: 'Отправить', en: 'Send to a concierge', th: 'ส่งคำขอ' })}
            </Button>
          </form>
        )}
      </SheetContent>
    </Sheet>
  );
}
