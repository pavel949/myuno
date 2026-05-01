/**
 * LandingLeadForm — shared compact lead form for Wave 1 landing pages.
 *
 * Wraps either `useCapitalIntroRequest` (capital-grade pipelines) or
 * `useUniversalLead` (consultation pipeline) behind a single API.
 */
import React, { useState } from 'react';
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
  label: { ru: string; en: string };
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
    label: { ru: string; en: string };
    options: SelectFieldOption[];
  };
  /** Whether to show capital range / budget select. */
  showBudgetField?: boolean;
  /** Whether to show timeline select. */
  showTimelineField?: boolean;
  /** Default placeholder for the message textarea. */
  messagePlaceholder?: { ru: string; en: string };
  /** Submit button label override. */
  submitLabel?: { ru: string; en: string };
  /** Success copy override. */
  successText?: { ru: string; en: string };
}

const RANGE_OPTIONS: { value: CapitalRangeBand; label: { ru: string; en: string } }[] = [
  { value: '<5M', label: { ru: 'до 5M ฿', en: 'Under 5M ฿' } },
  { value: '5-20M', label: { ru: '5–20M ฿', en: '5–20M ฿' } },
  { value: '20-100M', label: { ru: '20–100M ฿', en: '20–100M ฿' } },
  { value: '100M+', label: { ru: '100M ฿ и выше', en: '100M ฿+' } },
];

const TIMELINE_OPTIONS: { value: CapitalTimeline; label: { ru: string; en: string } }[] = [
  { value: 'now', label: { ru: 'Сейчас', en: 'Now' } },
  { value: '1-3m', label: { ru: '1–3 месяца', en: '1–3 months' } },
  { value: '3-6m', label: { ru: '3–6 месяцев', en: '3–6 months' } },
  { value: '6-12m', label: { ru: '6–12 месяцев', en: '6–12 months' } },
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
  const isRu = language === 'ru';
  const t = <T,>(p: { ru: T; en: T }): T => (isRu ? p.ru : p.en);

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

  const isPending = capitalMutation.isPending || submitLead.isPending;
  const canSubmit = name.trim().length > 0 && phone.trim().length > 0 && !isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

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
        await submitLead.mutateAsync({
          vertical_id: verticalId ?? 'general',
          request_type: universalRequestType ?? 'consultation',
          lead_source: leadSource,
          entry_point: entryPoint,
          name,
          phone,
          email: email || undefined,
          notes:
            [topic && `${topicField?.label[language as 'ru' | 'en'] ?? 'Topic'}: ${topic}`, message]
              .filter(Boolean)
              .join('\n') || undefined,
        });
      }
      setSubmitted(true);
    } catch {
      /* hooks already toast errors */
    }
  };

  if (submitted) {
    return (
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-6 text-center space-y-3">
          <CheckCircle2 className="h-10 w-10 text-primary mx-auto" />
          <h3 className="text-lg font-semibold">
            {t({ ru: 'Заявка принята', en: 'Request received' })}
          </h3>
          <p className="text-sm text-muted-foreground">
            {t(
              successText ?? {
                ru: 'Мы свяжемся с вами в течение 24 часов.',
                en: 'We will reach out within 24 hours.',
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
              <Label htmlFor="lead-name">{t({ ru: 'Имя', en: 'Name' })} *</Label>
              <Input
                id="lead-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={100}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lead-phone">{t({ ru: 'Телефон / WhatsApp', en: 'Phone / WhatsApp' })} *</Label>
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
            <Label htmlFor="lead-email">Email</Label>
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
                  <SelectValue placeholder={t({ ru: 'Выберите', en: 'Select' })} />
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
              <Label>{t({ ru: 'Бюджет', en: 'Budget' })}</Label>
              <Select value={budget} onValueChange={(v) => setBudget(v as CapitalRangeBand)}>
                <SelectTrigger>
                  <SelectValue placeholder={t({ ru: 'Выберите диапазон', en: 'Select range' })} />
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
              <Label>{t({ ru: 'Когда планируете', en: 'Timeline' })}</Label>
              <Select value={timeline} onValueChange={(v) => setTimeline(v as CapitalTimeline)}>
                <SelectTrigger>
                  <SelectValue placeholder={t({ ru: 'Выберите срок', en: 'Select timeline' })} />
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
            <Label htmlFor="lead-message">{t({ ru: 'Комментарий', en: 'Message' })}</Label>
            <Textarea
              id="lead-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t(
                messagePlaceholder ?? {
                  ru: 'Расскажите коротко о задаче…',
                  en: 'Tell us briefly about your goal…',
                },
              )}
              rows={4}
              maxLength={1000}
            />
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={!canSubmit}>
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t({ ru: 'Отправляем…', en: 'Sending…' })}
              </>
            ) : (
              t(submitLabel ?? { ru: 'Отправить заявку', en: 'Submit request' })
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            {t({
              ru: 'Нажимая «Отправить», вы соглашаетесь с обработкой персональных данных.',
              en: 'By submitting you agree to our data-processing policy.',
            })}
          </p>
        </form>
      </CardContent>
    </Card>
  );
}

export default LandingLeadForm;
