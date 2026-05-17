import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem, SelectGroup, SelectLabel } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import {
  DEAL_INTENTS, DEAL_CATEGORIES, CAPITAL_RANGES, DEAL_STAGES, DEAL_STRUCTURES,
  type DealIntent, type CapitalRangeKey, type DealStage,
} from '@/lib/investment/dealTaxonomy';
import { useSubmitInvestmentDeal } from '@/hooks/investment-hub/useInvestmentDeals';
import { APP_ROUTES } from '@/lib/config/routes';

type Step = 1 | 2 | 3 | 4 | 5;

export default function InvestmentSubmit() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [step, setStep] = useState<Step>(1);
  const submitMutation = useSubmitInvestmentDeal();

  const [form, setForm] = useState({
    deal_intent: (params.get('intent') as DealIntent) || ('raise_capital' as DealIntent),
    category: params.get('category') || '',
    title_private: '',
    location_full: '',
    teaser_public: '',
    description_private: '',
    deal_stage: '' as DealStage | '',
    capital_range: '' as CapitalRangeKey | '',
    deal_structure: 'open',
    target_timeline_months: '',
    expected_irr: '',
    submitter_name: '',
    submitter_company: '',
    submitter_role: '',
    submitter_email: '',
    submitter_whatsapp: '',
    submitter_telegram: '',
    source: '',
    consent: false,
  });

  const set = <K extends keyof typeof form>(k: K, v: typeof form[K]) => setForm((f) => ({ ...f, [k]: v }));

  const totalSteps: Step = 5;
  const pct = (step / totalSteps) * 100;

  const canNext = (): boolean => {
    if (step === 1) return !!form.deal_intent;
    if (step === 2) return !!form.category;
    if (step === 3)
      return !!form.title_private && !!form.teaser_public && !!form.capital_range;
    if (step === 4) return !!form.submitter_name && !!form.submitter_email;
    if (step === 5) return form.consent;
    return false;
  };

  const handleSubmit = async () => {
    if (!form.consent) return;
    try {
      const res = await submitMutation.mutateAsync({
        deal_intent: form.deal_intent,
        category: form.category,
        title_private: form.title_private,
        teaser_public: form.teaser_public,
        description_private: form.description_private || undefined,
        location_full: form.location_full || undefined,
        deal_stage: form.deal_stage || undefined,
        capital_range: form.capital_range as CapitalRangeKey,
        deal_structure: form.deal_structure || undefined,
        target_timeline_months: form.target_timeline_months ? Number(form.target_timeline_months) : undefined,
        expected_irr: form.expected_irr ? Number(form.expected_irr) : undefined,
        submitter_name: form.submitter_name,
        submitter_company: form.submitter_company || undefined,
        submitter_role: form.submitter_role || undefined,
        submitter_email: form.submitter_email,
        submitter_whatsapp: form.submitter_whatsapp || undefined,
        submitter_telegram: form.submitter_telegram || undefined,
        source: form.source || undefined,
        linked_developer_id: params.get('developer_id') || undefined,
        linked_property_id: params.get('property_id') || undefined,
      });
      toast.success('Заявка отправлена! Мы свяжемся с вами в течение 24 часов.');
      navigate(`${APP_ROUTES.INVEST}?submitted=${res.id}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Ошибка: ${msg}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Submit your project — myUNO Deal Rooms</title>
        <meta name="description" content="Подайте проект девелопера, найдите покупателя или партнёра в Таиланде. Анонимизированный профиль проекта в deal room myUNO." />
      </Helmet>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <button onClick={() => navigate(APP_ROUTES.INVEST)} className="mb-4 text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Deal Rooms
        </button>

        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Submit your project</h1>
          <p className="text-muted-foreground">Шаг {step} из {totalSteps}</p>
          <div className="mt-3 h-1 bg-muted rounded-full overflow-hidden">
            <motion.div className="h-full bg-primary" initial={{ width: 0 }} animate={{ width: `${pct}%` }} />
          </div>
        </div>

        <Card className="p-6">
          {step === 1 && (
            <div className="space-y-3">
              <h2 className="text-xl font-semibold mb-2">What are you looking for?</h2>
              <RadioGroup value={form.deal_intent} onValueChange={(v) => set('deal_intent', v as DealIntent)}>
                {DEAL_INTENTS.map((opt) => (
                  <Label key={opt.key} htmlFor={opt.key} className="flex items-start gap-3 p-4 rounded-none border border-border cursor-pointer hover:border-primary/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                    <RadioGroupItem id={opt.key} value={opt.key} className="mt-1" />
                    <div className="flex-1">
                      <div className="font-medium flex items-center gap-2">
                        <span>{opt.icon}</span>{opt.labelEn}
                      </div>
                      <div className="text-sm text-muted-foreground">{opt.descriptionEn}</div>
                    </div>
                  </Label>
                ))}
              </RadioGroup>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <h2 className="text-xl font-semibold mb-2">Category</h2>
              <p className="text-sm text-muted-foreground mb-3">Выберите класс актива или тип проекта</p>
              <Select value={form.category} onValueChange={(v) => set('category', v)}>
                <SelectTrigger><SelectValue placeholder="Выберите категорию" /></SelectTrigger>
                <SelectContent className="max-h-[60vh]">
                  {DEAL_CATEGORIES.map((g) => (
                    <SelectGroup key={g.key}>
                      <SelectLabel>{g.labelEn}</SelectLabel>
                      {g.options.map((o) => (
                        <SelectItem key={o.key} value={o.key}>{o.labelEn}</SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Project details</h2>
              <div>
                <Label>Title (internal — для админа) *</Label>
                <Input value={form.title_private} onChange={(e) => set('title_private', e.target.value)} placeholder="Phuket beachfront restaurant — owner exit" maxLength={150} />
              </div>
              <div>
                <Label>One-line public teaser * (макс. 150 символов, будет показано членам buyer club)</Label>
                <Input value={form.teaser_public} onChange={(e) => set('teaser_public', e.target.value)} placeholder="Profitable beachfront F&B venue, $2M EBITDA, owner exit" maxLength={150} />
              </div>
              <div>
                <Label>Location (точный адрес — приватный)</Label>
                <Input value={form.location_full} onChange={(e) => set('location_full', e.target.value)} placeholder="Bang Tao, Phuket, Thailand" />
              </div>
              <div>
                <Label>Description (приватная, до 1000 символов)</Label>
                <Textarea value={form.description_private} onChange={(e) => set('description_private', e.target.value)} maxLength={1000} rows={5} placeholder="Расскажите подробнее о проекте — финансы, команда, причины, юр. структура..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Stage</Label>
                  <Select value={form.deal_stage} onValueChange={(v) => set('deal_stage', v as DealStage)}>
                    <SelectTrigger><SelectValue placeholder="Stage" /></SelectTrigger>
                    <SelectContent>
                      {DEAL_STAGES.map((s) => <SelectItem key={s.key} value={s.key}>{s.labelEn}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Capital range *</Label>
                  <Select value={form.capital_range} onValueChange={(v) => set('capital_range', v as CapitalRangeKey)}>
                    <SelectTrigger><SelectValue placeholder="USD" /></SelectTrigger>
                    <SelectContent>
                      {CAPITAL_RANGES.map((r) => <SelectItem key={r.key} value={r.key}>{r.labelShort}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Deal structure</Label>
                  <Select value={form.deal_structure} onValueChange={(v) => set('deal_structure', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DEAL_STRUCTURES.map((s) => <SelectItem key={s.key} value={s.key}>{s.labelEn}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Timeline (months)</Label>
                  <Input type="number" value={form.target_timeline_months} onChange={(e) => set('target_timeline_months', e.target.value)} placeholder="6" />
                </div>
                <div>
                  <Label>Historical comparable IRR (%) — для внутреннего ревью</Label>
                  <Input type="number" step="0.1" value={form.expected_irr} onChange={(e) => set('expected_irr', e.target.value)} placeholder="15" />
                  <p className="text-[11px] text-muted-foreground mt-1">Based on comparable units. Not shown publicly as a forecast.</p>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Your profile</h2>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Name *</Label>
                  <Input value={form.submitter_name} onChange={(e) => set('submitter_name', e.target.value)} />
                </div>
                <div>
                  <Label>Company / project</Label>
                  <Input value={form.submitter_company} onChange={(e) => set('submitter_company', e.target.value)} />
                </div>
                <div>
                  <Label>Role</Label>
                  <Select value={form.submitter_role} onValueChange={(v) => set('submitter_role', v)}>
                    <SelectTrigger><SelectValue placeholder="Role" /></SelectTrigger>
                    <SelectContent>
                      {['Owner', 'Founder', 'Broker', 'Agent', 'Authorized rep'].map((r) => (
                        <SelectItem key={r} value={r}>{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Email *</Label>
                  <Input type="email" value={form.submitter_email} onChange={(e) => set('submitter_email', e.target.value)} />
                </div>
                <div>
                  <Label>WhatsApp</Label>
                  <Input value={form.submitter_whatsapp} onChange={(e) => set('submitter_whatsapp', e.target.value)} placeholder="+66..." />
                </div>
                <div>
                  <Label>Telegram</Label>
                  <Input value={form.submitter_telegram} onChange={(e) => set('submitter_telegram', e.target.value)} placeholder="@handle" />
                </div>
                <div className="col-span-2">
                  <Label>Откуда узнали о myUNO?</Label>
                  <Input value={form.source} onChange={(e) => set('source', e.target.value)} placeholder="Recommendation / Google / Instagram..." />
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Review & submit</h2>
              <div className="space-y-2 text-sm">
                <div><span className="text-muted-foreground">Intent:</span> {DEAL_INTENTS.find((i) => i.key === form.deal_intent)?.labelEn}</div>
                <div><span className="text-muted-foreground">Category:</span> {form.category}</div>
                <div><span className="text-muted-foreground">Title:</span> {form.title_private}</div>
                <div><span className="text-muted-foreground">Public teaser:</span> {form.teaser_public}</div>
                <div><span className="text-muted-foreground">Capital range:</span> {form.capital_range && CAPITAL_RANGES.find((c) => c.key === form.capital_range)?.labelShort}</div>
                <div><span className="text-muted-foreground">Contact:</span> {form.submitter_name} • {form.submitter_email}</div>
              </div>
              <Label className="flex items-start gap-3 p-4 border rounded-none cursor-pointer">
                <Checkbox checked={form.consent} onCheckedChange={(v) => set('consent', !!v)} className="mt-0.5" />
                <span className="text-sm">My project profile will be <strong>anonymised</strong> by the myUNO team before being shown to buyer club members. Personal details, exact location and identity remain private until I approve an introduction.</span>
              </Label>
            </div>
          )}

          <div className="flex justify-between mt-6 pt-6 border-t">
            <Button variant="outline" disabled={step === 1} onClick={() => setStep((s) => (s - 1) as Step)}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            {step < totalSteps ? (
              <Button disabled={!canNext()} onClick={() => setStep((s) => (s + 1) as Step)}>
                Next <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button disabled={!canNext() || submitMutation.isPending} onClick={handleSubmit}>
                {submitMutation.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Check className="w-4 h-4 mr-1" />}
                Submit project
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
