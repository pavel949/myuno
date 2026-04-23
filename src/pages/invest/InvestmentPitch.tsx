import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useLanguage } from '@/contexts/LanguageContext';
import { MiniAppLayout } from '@/components/miniapp';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCapitalIntroRequest, type CapitalRangeBand, type CapitalTimeline } from '@/hooks/useCapitalIntroRequest';
import { BUSINESS_ASSET_CLASSES, LISTING_TYPE_LABELS, type BusinessListingType, type BusinessAssetClass } from '@/hooks/useBusinessListings';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, ArrowRight, Send, Loader2, CheckCircle2 } from 'lucide-react';
import { APP_ROUTES } from '@/lib/config/routes';

const STEPS = ['type', 'financials', 'use', 'contact'] as const;
type Step = typeof STEPS[number];

const PITCH_TYPE_OPTIONS: { v: BusinessListingType; en: string; ru: string; icon: string }[] = [
  { v: 'developer_raise', en: 'Real Estate project — raise capital', ru: 'Девелопер: привлечь капитал', icon: '🏗️' },
  { v: 'developer_inventory', en: 'Sell remaining units / inventory', ru: 'Продать остатки квартир', icon: '🏢' },
  { v: 'business_for_sale', en: 'Sell my operating business', ru: 'Продать действующий бизнес', icon: '🏪' },
  { v: 'startup_pitch', en: 'New business / Startup idea', ru: 'Новый бизнес / Стартап', icon: '💡' },
  { v: 'operating_partner_wanted', en: 'Looking for operating partner', ru: 'Ищу управляющего партнёра', icon: '🤝' },
];

export default function InvestmentPitch() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const [params] = useSearchParams();
  const presetType = params.get('type') as BusinessListingType | null;

  const mutation = useCapitalIntroRequest();
  const [step, setStep] = useState<Step>('type');
  const [submitted, setSubmitted] = useState(false);

  const [listingType, setListingType] = useState<BusinessListingType | ''>(presetType ?? '');
  const [assetClass, setAssetClass] = useState<BusinessAssetClass | ''>('');
  const [askRange, setAskRange] = useState<CapitalRangeBand | ''>('');
  const [revenue, setRevenue] = useState('');
  const [equity, setEquity] = useState('');
  const [useOfFunds, setUseOfFunds] = useState('');
  const [timeline, setTimeline] = useState<CapitalTimeline | ''>('');

  const [name, setName] = useState('');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');

  const stepIdx = STEPS.indexOf(step);
  const next = () => setStep(STEPS[Math.min(stepIdx + 1, STEPS.length - 1)]);
  const back = () => setStep(STEPS[Math.max(stepIdx - 1, 0)]);

  const handleSubmit = async () => {
    await mutation.mutateAsync({
      request_type: 'pitch_submission',
      asset_class: assetClass || undefined,
      capital_range_thb: (askRange || undefined) as CapitalRangeBand | undefined,
      timeline: (timeline || undefined) as CapitalTimeline | undefined,
      guest_name: name || undefined,
      guest_email: email || undefined,
      guest_phone: phone || undefined,
      background: useOfFunds
        ? `${LISTING_TYPE_LABELS[listingType as BusinessListingType]?.en} | Use of funds: ${useOfFunds} | Revenue: ${revenue || 'n/a'} | Equity: ${equity || 'n/a'}`
        : undefined,
      message: message || undefined,
    });
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <MiniAppLayout title={isRu ? 'Готово' : 'Done'} showSearch={false}>
        <Card className="text-center">
          <CardContent className="p-8 space-y-4">
            <CheckCircle2 className="h-12 w-12 text-primary mx-auto" />
            <h2 className="text-xl font-bold">
              {isRu ? 'Заявка принята!' : 'Submission received!'}
            </h2>
            <p className="text-muted-foreground text-sm">
              {isRu
                ? 'Наша команда рассмотрит ваш проект и свяжется в течение 48 часов. После подписания NDA — выведем в анонимный листинг.'
                : 'Our team will review your project and reach out within 48 hours. After NDA — we publish as an anonymous listing.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button onClick={() => navigate(APP_ROUTES.INVEST)} variant="outline">
                {isRu ? 'К Investment Hub' : 'Back to Hub'}
              </Button>
              <Button onClick={() => navigate(APP_ROUTES.INVEST_BUSINESS)}>
                {isRu ? 'Смотреть другие проекты' : 'Browse other projects'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </MiniAppLayout>
    );
  }

  return (
    <>
      <Helmet>
        <title>{isRu ? 'Pitch your project | myUNO' : 'Pitch your project | myUNO'}</title>
      </Helmet>
      <MiniAppLayout title={isRu ? 'Подать проект' : 'Pitch project'} showSearch={false}>
        <div className="space-y-4 pb-10">
          {/* Progress */}
          <div className="flex gap-1.5">
            {STEPS.map((s, i) => (
              <div
                key={s}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  i <= stepIdx ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>
          <div className="text-xs text-muted-foreground text-center">
            {isRu ? `Шаг ${stepIdx + 1} из ${STEPS.length}` : `Step ${stepIdx + 1} of ${STEPS.length}`}
          </div>

          {step === 'type' && (
            <Card>
              <CardContent className="p-5 space-y-4">
                <h2 className="font-bold text-lg">
                  {isRu ? 'Что вы хотите сделать?' : 'What do you want to do?'}
                </h2>
                <div className="space-y-2">
                  {PITCH_TYPE_OPTIONS.map((opt) => (
                    <button
                      key={opt.v}
                      type="button"
                      onClick={() => setListingType(opt.v)}
                      className={`w-full text-left p-3 rounded-none border transition-colors ${
                        listingType === opt.v
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{opt.icon}</span>
                        <span className="font-medium">{isRu ? opt.ru : opt.en}</span>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="space-y-1.5">
                  <Label>{isRu ? 'Сектор / индустрия' : 'Industry / asset class'}</Label>
                  <Select value={assetClass} onValueChange={(v) => setAssetClass(v as BusinessAssetClass)}>
                    <SelectTrigger>
                      <SelectValue placeholder={isRu ? 'Выберите' : 'Select'} />
                    </SelectTrigger>
                    <SelectContent>
                      {BUSINESS_ASSET_CLASSES.map((a) => (
                        <SelectItem key={a.key} value={a.key}>
                          {a.icon} {isRu ? a.ru : a.en}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 'financials' && (
            <Card>
              <CardContent className="p-5 space-y-4">
                <h2 className="font-bold text-lg">{isRu ? 'Финансы' : 'Financials'}</h2>

                <div className="space-y-1.5">
                  <Label>{isRu ? 'Объём (тикет / привлечение)' : 'Ask amount / raise size'}</Label>
                  <Select value={askRange} onValueChange={(v) => setAskRange(v as CapitalRangeBand)}>
                    <SelectTrigger>
                      <SelectValue placeholder={isRu ? 'Выберите диапазон' : 'Select range'} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="<5M">{isRu ? 'до 5 млн ฿' : 'Under 5M ฿'}</SelectItem>
                      <SelectItem value="5-20M">5–20M ฿</SelectItem>
                      <SelectItem value="20-100M">20–100M ฿</SelectItem>
                      <SelectItem value="100M+">100M+ ฿</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="rev">{isRu ? 'Выручка/мес ฿' : 'Monthly rev. ฿'}</Label>
                    <Input id="rev" inputMode="numeric" value={revenue} onChange={(e) => setRevenue(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="eq">{isRu ? 'Доля % (опц)' : 'Equity % (opt)'}</Label>
                    <Input id="eq" inputMode="numeric" value={equity} onChange={(e) => setEquity(e.target.value)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 'use' && (
            <Card>
              <CardContent className="p-5 space-y-4">
                <h2 className="font-bold text-lg">
                  {isRu ? 'На что нужны деньги?' : 'Use of funds'}
                </h2>
                <div className="space-y-1.5">
                  <Label htmlFor="uof">{isRu ? 'Кратко (1-2 предложения)' : 'Briefly (1-2 sentences)'}</Label>
                  <Textarea id="uof" rows={4} value={useOfFunds} onChange={(e) => setUseOfFunds(e.target.value)}
                    placeholder={isRu ? 'Например: достроить виллу, открыть филиал, оборотный капитал…' : 'e.g. complete villa, open second location, working capital…'} />
                </div>
                <div className="space-y-1.5">
                  <Label>{isRu ? 'Когда нужны средства?' : 'Timeline'}</Label>
                  <Select value={timeline} onValueChange={(v) => setTimeline(v as CapitalTimeline)}>
                    <SelectTrigger><SelectValue placeholder={isRu ? 'Выберите' : 'Select'} /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="now">{isRu ? 'Сейчас' : 'Now'}</SelectItem>
                      <SelectItem value="1-3m">{isRu ? '1–3 мес' : '1–3 months'}</SelectItem>
                      <SelectItem value="3-6m">{isRu ? '3–6 мес' : '3–6 months'}</SelectItem>
                      <SelectItem value="6-12m">{isRu ? '6–12 мес' : '6–12 months'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 'contact' && (
            <Card>
              <CardContent className="p-5 space-y-4">
                <h2 className="font-bold text-lg">{isRu ? 'Контакты' : 'Contacts'}</h2>
                <Badge variant="secondary" className="text-xs">
                  🔒 {isRu ? 'Контакты видим только мы' : 'Contacts visible only to our team'}
                </Badge>

                <div className="space-y-1.5">
                  <Label htmlFor="pn-name">{isRu ? 'Имя' : 'Name'}</Label>
                  <Input id="pn-name" required value={name} onChange={(e) => setName(e.target.value)} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="pn-email">Email</Label>
                    <Input id="pn-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="pn-phone">{isRu ? 'WhatsApp' : 'WhatsApp'}</Label>
                    <Input id="pn-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="pn-msg">{isRu ? 'Доп. комментарий' : 'Additional notes'}</Label>
                  <Textarea id="pn-msg" rows={3} value={message} onChange={(e) => setMessage(e.target.value)} />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Nav */}
          <div className="flex gap-2">
            {stepIdx > 0 && (
              <Button variant="outline" onClick={back} className="gap-1.5">
                <ArrowLeft className="h-4 w-4" /> {isRu ? 'Назад' : 'Back'}
              </Button>
            )}
            {stepIdx < STEPS.length - 1 ? (
              <Button
                onClick={next}
                className="flex-1 gap-1.5"
                disabled={step === 'type' && !listingType}
              >
                {isRu ? 'Далее' : 'Next'} <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                className="flex-1 gap-1.5"
                disabled={mutation.isPending || !name || !email}
              >
                {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {isRu ? 'Подать проект' : 'Submit pitch'}
              </Button>
            )}
          </div>
        </div>
      </MiniAppLayout>
    </>
  );
}
