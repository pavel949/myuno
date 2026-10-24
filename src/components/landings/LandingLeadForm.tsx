/**
 * LandingLeadForm — shared compact lead form for Wave 1 landing pages.
 *
 * Wraps either `useCapitalIntroRequest` (capital-grade pipelines) or
 * `useUniversalLead` (consultation pipeline) behind a single API.
 */
import React, { useRef, useState } from 'react';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { pickLang, type LangValues } from '@/lib/i18n/pickLang';
import {
  useCapitalIntroRequest,
  type CapitalRangeBand,
  type CapitalRequestType,
  type CapitalTimeline,
} from '@/hooks/useCapitalIntroRequest';
import { useUniversalLead } from '@/hooks/useUniversalLead';
import type { LeadSource } from '@/lib/leadVerticalConfig';

export interface SelectFieldOption {
  value: string;
  label: LangValues;
}

export interface LandingLeadFormProps {
  /** Which pipeline to send into. */
  variant: 'capital' | 'universal';
  /** Capital pipeline request type (when variant='capital'). */
  capitalRequestType?: CapitalRequestType;
  /** Universal pipeline vertical id (when variant='universal'). */
  verticalId?: string;
  /** Universal pipeline request type label (when variant='universal'). */
  universalRequestType?: string;
  /** Universal pipeline entry point identifier. */
  entryPoint: string;
  /** Lead source classification. */
  leadSource?: LeadSource;
  /** Optional select shown above the message field (e.g. topic / asset class). */
  topicField?: {
    key: string;
    label: LangValues;
    options: SelectFieldOption[];
  };
  /** Whether to show capital range / budget select. */
  showBudgetField?: boolean;
  /** Whether to show timeline select. */
  showTimelineField?: boolean;
  /** Default placeholder for the message textarea. */
  messagePlaceholder?: LangValues;
  /** Submit button label override. */
  submitLabel?: LangValues;
  /** Success copy override. */
  successText?: LangValues;
}

const RANGE_OPTIONS: { value: CapitalRangeBand; label: LangValues }[] = [
  { value: '<5M', label: { ru: 'до 5M ฿', en: 'Under 5M ฿', th: 'ต่ำกว่า 5 ล้าน ฿' } },
  { value: '5-20M', label: { ru: '5–20M ฿', en: '5–20M ฿' } },
  { value: '20-100M', label: { ru: '20–100M ฿', en: '20–100M ฿' } },
  { value: '100M+', label: { ru: '100M ฿ и выше', en: '100M ฿+', th: '100 ล้าน ฿ ขึ้นไป' } },
];

const TIMELINE_OPTIONS: { value: CapitalTimeline; label: LangValues }[] = [
  { value: 'now', label: { ru: 'Сейчас', en: 'Now', th: 'ตอนนี้' } },
  { value: '1-3m', label: { ru: '1–3 месяца', en: '1–3 months', th: '1–3 เดือน' } },
  { value: '3-6m', label: { ru: '3–6 месяцев', en: '3–6 months', th: '3–6 เดือน' } },
  { value: '6-12m', label: { ru: '6–12 месяцев', en: '6–12 months', th: '6–12 เดือน' } },
];

export function LandingLeadForm(props: LandingLeadFormProps) {
  const {
    variant,
    capitalRequestType,
    verticalId,
    universalRequestType,
    entryPoint,
    leadSource = 'cta',
    topicField,
    showBudgetField,
    showTimelineField,
    messagePlaceholder,
    submitLabel,
    successText,
  } = props;

  const { language } = useLanguage();
  const t = (p: LangValues) => pickLang(language, p);
  const pendingRef = useRef(false);
  const [localPending, setLocalPending] = useState(false);
  const [submitError, setSubmitError] = useState(false);

  const { user } = useAuth();
  const capitalMutation = useCapitalIntroRequest();
  const { submitLead } = useUniversalLead();

  const [name, setName] = useState(user?.user_metadata?.full_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState('');
  const [topic, setTopic] = useState('');
  const [budget, setBudget] = useState<CapitalRangeBand | ''>('');
  const [timeline, setTimeline] = useState<CapitalTimeline | ''>('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const isPending = localPending || capitalMutation.isPending || submitLead.isPending;
  const canSubmit = name.trim().length > 0 && phone.trim().length > 0 && !isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || pendingRef.current || submitted) return;
    pendingRef.current = true; setLocalPending(true); setSubmitError(false);

    try {
      if (variant === 'capital') {
        await capitalMutation.mutateAsync({
          request_type: capitalRequestType ?? 'capital_advisory',
          guest_name: name,
          guest_email: email || undefined,
          guest_phone: phone,
          asset_class: topic || undefined,
          capital_range_thb: (budget || undefined) as CapitalRangeBand | undefined,
          timeline: (timeline || undefined) as CapitalTimeline | undefined,
          message: message || undefined,
          source_route: entryPoint,
        });
      } else {
        const receipt = await submitLead.mutateAsync({
          vertical_id: verticalId ?? 'general',
          request_type: universalRequestType ?? 'consultation',
          lead_source: leadSource,
          entry_point: entryPoint,
          name,
          phone,
          email: email || undefined,
          notes:
            [topic && `${topicField ? t(topicField.label) : t({ ru: 'Тема', en: 'Topic', th: 'หัวข้อ' })}: ${topic}`, message]
              .filter(Boolean)
              .join('\n') || undefined,
        });
        if (!receipt || typeof receipt.id !== 'string' || !receipt.id.trim()) throw new Error('Unconfirmed request receipt');
      }
      setSubmitted(true);
    } catch {
      setSubmitError(true); // No retry is initiated after an ambiguous response.
    } finally { pendingRef.current = false; setLocalPending(false); }
  };

  if (submitted) {
    return (
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-6 text-center space-y-3">
          <CheckCircle2 className="h-10 w-10 text-primary mx-auto" />
          <h3 className="text-lg font-semibold">
            {t({ ru: 'Заявка сохранена', en: 'Request saved', th: 'บันทึกคำขอแล้ว' })}
          </h3>
          <p className="text-sm text-muted-foreground">
            {t(
              successText ?? {
                ru: 'Ответ команды ожидается. Срок ответа не подтверждён.',
                en: 'A team reply is pending. A response time has not been confirmed.',
                th: 'ยังรอการตอบกลับจากทีม และยังไม่ได้ยืนยันเวลาตอบกลับ',
              },
            )}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="lead-name">{t({ ru: 'Имя', en: 'Name', th: 'ชื่อ' })} *</Label>
              <Input
                id="lead-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={100}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lead-phone">{t({ ru: 'Телефон / WhatsApp', en: 'Phone / WhatsApp', th: 'โทรศัพท์ / WhatsApp' })} *</Label>
              <Input
                id="lead-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                maxLength={32}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="lead-email">{t({ ru: 'Email', en: 'Email', th: 'อีเมล' })}</Label>
            <Input
              id="lead-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              maxLength={255}
            />
          </div>

          {topicField && (
            <div className="space-y-1.5">
              <Label>{t(topicField.label)}</Label>
              <Select value={topic} onValueChange={setTopic}>
                <SelectTrigger>
                  <SelectValue placeholder={t({ ru: 'Выберите', en: 'Select', th: 'เลือก' })} />
                </SelectTrigger>
                <SelectContent>
                  {topicField.options.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {t(opt.label)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {showBudgetField && (
            <div className="space-y-1.5">
              <Label>{t({ ru: 'Бюджет', en: 'Budget', th: 'งบประมาณ' })}</Label>
              <Select value={budget} onValueChange={(v) => setBudget(v as CapitalRangeBand)}>
                <SelectTrigger>
                  <SelectValue placeholder={t({ ru: 'Выберите диапазон', en: 'Select range', th: 'เลือกช่วงงบประมาณ' })} />
                </SelectTrigger>
                <SelectContent>
                  {RANGE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {t(opt.label)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {showTimelineField && (
            <div className="space-y-1.5">
              <Label>{t({ ru: 'Когда планируете', en: 'Timeline', th: 'กำหนดเวลา' })}</Label>
              <Select value={timeline} onValueChange={(v) => setTimeline(v as CapitalTimeline)}>
                <SelectTrigger>
                  <SelectValue placeholder={t({ ru: 'Выберите срок', en: 'Select timeline', th: 'เลือกช่วงเวลา' })} />
                </SelectTrigger>
                <SelectContent>
                  {TIMELINE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {t(opt.label)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="lead-message">{t({ ru: 'Комментарий', en: 'Message', th: 'ข้อความ' })}</Label>
            <Textarea
              id="lead-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t(
                messagePlaceholder ?? {
                  ru: 'Расскажите коротко о задаче…',
                  en: 'Tell us briefly about your goal…', th: 'บอกเป้าหมายของคุณสั้น ๆ…',
                },
              )}
              rows={4}
              maxLength={1000}
            />
          </div>

          {submitError && <p role="alert">{t({ ru: 'Сохранение заявки не подтверждено. Проверьте соединение перед повторной отправкой.', en: 'Request saving was not confirmed. Check your connection before submitting again.', th: 'ยังยืนยันการบันทึกคำขอไม่ได้ โปรดตรวจสอบการเชื่อมต่อก่อนส่งอีกครั้ง' })}</p>}
          <Button type="submit" className="w-full" size="lg" disabled={!canSubmit}>
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t({ ru: 'Отправляем…', en: 'Sending…', th: 'กำลังส่ง…' })}
              </>
            ) : (
              t(submitLabel ?? { ru: 'Отправить заявку', en: 'Submit request', th: 'ส่งคำขอ' })
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            {t({
              ru: 'Отправляя заявку, вы соглашаетесь с обработкой персональных данных.',
              en: 'By submitting you agree to our data-processing policy.', th: 'การส่งคำขอแสดงว่าคุณยอมรับนโยบายการประมวลผลข้อมูลของเรา',
            })}
          </p>
        </form>
      </CardContent>
    </Card>
  );
}

export default LandingLeadForm;
