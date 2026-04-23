import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { BackButton } from '@/components/uno/BackButton';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { APP_ROUTES } from '@/lib/config/routes';
import { supabase } from '@/integrations/supabase/client';
import { Calculator, Loader2, ChevronRight, ChevronLeft, FileText, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { SEOHead } from '@/components/seo';
import ReactMarkdown from 'react-markdown';

interface StepConfig {
  id: string;
  question: string;
  questionRu: string;
  type: 'radio' | 'checkbox';
  options: { value: string; label: string; labelRu: string }[];
}

const STEPS: StepConfig[] = [
  {
    id: 'residency',
    question: 'What is your tax residency status?',
    questionRu: 'Ваш налоговый статус?',
    type: 'radio',
    options: [
      { value: 'resident', label: 'Tax resident (180+ days/year)', labelRu: 'Налоговый резидент (180+ дней/год)' },
      { value: 'non_resident', label: 'Non-resident (<180 days/year)', labelRu: 'Нерезидент (<180 дней/год)' },
      { value: 'unsure', label: 'Not sure', labelRu: 'Не уверен(а)' },
    ],
  },
  {
    id: 'income_sources',
    question: 'What are your income sources?',
    questionRu: 'Источники дохода?',
    type: 'checkbox',
    options: [
      { value: 'employment', label: 'Employment in Thailand', labelRu: 'Работа в Таиланде' },
      { value: 'rental', label: 'Rental income (Thai property)', labelRu: 'Доход от аренды (тайская недвижимость)' },
      { value: 'freelance', label: 'Freelance / Remote work', labelRu: 'Фриланс / Удалённая работа' },
      { value: 'investment', label: 'Investment / Dividends', labelRu: 'Инвестиции / Дивиденды' },
      { value: 'pension', label: 'Pension', labelRu: 'Пенсия' },
      { value: 'business', label: 'Thai business owner', labelRu: 'Владелец бизнеса в Таиланде' },
    ],
  },
  {
    id: 'stay_duration',
    question: 'How long have you been in Thailand this year?',
    questionRu: 'Сколько вы в Таиланде в этом году?',
    type: 'radio',
    options: [
      { value: 'under_90', label: 'Under 90 days', labelRu: 'Менее 90 дней' },
      { value: '90_180', label: '90-180 days', labelRu: '90-180 дней' },
      { value: 'over_180', label: 'Over 180 days', labelRu: 'Более 180 дней' },
    ],
  },
  {
    id: 'existing_filing',
    question: 'Do you currently file taxes in Thailand?',
    questionRu: 'Подаёте ли вы налоговую декларацию в Таиланде?',
    type: 'radio',
    options: [
      { value: 'yes', label: 'Yes, I file annually', labelRu: 'Да, ежегодно' },
      { value: 'no', label: 'No', labelRu: 'Нет' },
      { value: 'unsure', label: 'Not sure if I need to', labelRu: 'Не уверен(а), нужно ли' },
    ],
  },
];

export default function TaxNavPage() {
  const { language } = useLanguage();
  const t = language === 'ru';
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const currentStep = STEPS[step];
  const isLastStep = step === STEPS.length - 1;
  const canProceed = currentStep ? (
    currentStep.type === 'radio' 
      ? !!answers[currentStep.id] 
      : Array.isArray(answers[currentStep.id]) && (answers[currentStep.id] as string[]).length > 0
  ) : false;

  const handleRadio = (value: string) => {
    setAnswers(prev => ({ ...prev, [currentStep.id]: value }));
  };

  const handleCheckbox = (value: string, checked: boolean) => {
    setAnswers(prev => {
      const current = (prev[currentStep.id] as string[]) || [];
      return { ...prev, [currentStep.id]: checked ? [...current, value] : current.filter(v => v !== value) };
    });
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const prompt = STEPS.map(s => {
        const answer = answers[s.id];
        const q = t ? s.questionRu : s.question;
        if (Array.isArray(answer)) {
          const labels = answer.map(a => s.options.find(o => o.value === a)?.[t ? 'labelRu' : 'label'] || a);
          return `${q}\n→ ${labels.join(', ')}`;
        }
        return `${q}\n→ ${s.options.find(o => o.value === answer)?.[t ? 'labelRu' : 'label'] || answer}`;
      }).join('\n\n');

      const { data, error } = await supabase.functions.invoke('ai-agent', {
        body: {
          messages: [
            {
              role: 'system',
              content: `You are a Thai tax advisor for expats and foreigners. Based on the user's answers, provide a clear, actionable summary of their likely tax obligations in Thailand. Include: (1) Whether they need to file, (2) Key deadlines, (3) Applicable tax rates, (4) Recommended next steps. Be specific but note this is informational, not legal advice. Respond in ${t ? 'Russian' : 'English'}. Use markdown formatting.`
            },
            { role: 'user', content: `Here are my answers to the tax questionnaire:\n\n${prompt}` }
          ],
          model: 'google/gemini-2.5-flash',
        },
      });
      if (error) throw error;
      setResult(data?.choices?.[0]?.message?.content || data?.result || 'No response');
    } catch (err) {
      console.error('Tax analysis error:', err);
      toast.error(t ? 'Ошибка анализа' : 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleNext = () => {
    if (isLastStep) {
      handleAnalyze();
      setStep(STEPS.length); // move to results
    } else {
      setStep(s => s + 1);
    }
  };

  // Results view
  if (step >= STEPS.length) {
    return (
      <AppLayout>
        <SEOHead title={t ? 'Налоговый навигатор' : 'Tax Navigator'} description={t ? 'AI-навигатор налоговых обязательств для иностранцев в Таиланде' : 'AI tax obligations navigator for foreigners in Thailand'} />
        <div className="pb-24">
          <div className="relative bg-gradient-to-br from-primary via-primary to-primary p-6 pt-16 pb-8">
            <BackButton fallbackPath={APP_ROUTES.LEGAL} variant="overlay" className="absolute top-4 left-4" />
            <div className="text-white text-center">
              <Calculator className="w-8 h-8 mx-auto mb-2" />
              <h1 className="text-xl font-bold">{t ? 'Результат анализа' : 'Analysis Result'}</h1>
            </div>
          </div>
          <div className="px-4 -mt-4 space-y-4">
            {isAnalyzing ? (
              <Card><CardContent className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary mb-3" /><p className="text-sm text-muted-foreground">{t ? 'Анализирую...' : 'Analyzing your situation...'}</p></CardContent></Card>
            ) : result ? (
              <>
                <Card>
                  <CardContent className="p-4 prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown>{result}</ReactMarkdown>
                  </CardContent>
                </Card>
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="p-4 text-center">
                    <MessageCircle className="w-6 h-6 mx-auto text-primary mb-2" />
                    <p className="text-sm font-medium mb-1">{t ? 'Нужна консультация?' : 'Need expert advice?'}</p>
                    <p className="text-xs text-muted-foreground mb-3">{t ? 'Свяжитесь с налоговым консультантом' : 'Connect with a tax advisor'}</p>
                    <Button size="sm" onClick={() => window.open('https://wa.me/66612345678?text=Tax consultation request', '_blank')}>
                      {t ? 'Связаться' : 'Get in Touch'}
                    </Button>
                  </CardContent>
                </Card>
                <Button variant="outline" className="w-full" onClick={() => { setStep(0); setResult(null); setAnswers({}); }}>
                  {t ? 'Начать заново' : 'Start Over'}
                </Button>
              </>
            ) : null}
          </div>
        </div>
      </AppLayout>
    );
  }

  // Questionnaire view
  return (
    <AppLayout>
      <SEOHead title={t ? 'Налоговый навигатор' : 'Tax Navigator'} description={t ? 'AI-навигатор налоговых обязательств для иностранцев в Таиланде' : 'AI tax obligations navigator for foreigners in Thailand'} />
      <div className="pb-24">
        <div className="relative bg-gradient-to-br from-primary via-primary to-primary p-6 pt-16 pb-8">
          <BackButton fallbackPath={APP_ROUTES.LEGAL} variant="overlay" className="absolute top-4 left-4" />
          <div className="text-white text-center">
            <Calculator className="w-8 h-8 mx-auto mb-2" />
            <h1 className="text-xl font-bold">{t ? 'TaxNav' : 'TaxNav'}</h1>
            <p className="text-white/80 text-sm">{t ? 'Навигатор налоговых обязательств' : 'Tax obligations navigator'}</p>
          </div>
        </div>

        <div className="px-4 -mt-4 space-y-4">
          {/* Progress */}
          <div className="flex gap-1">
            {STEPS.map((_, i) => (
              <div key={i} className={`flex-1 h-1 rounded-full ${i <= step ? 'bg-primary' : 'bg-muted'}`} />
            ))}
          </div>

          {/* Question */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <p className="text-sm text-muted-foreground">{t ? 'Шаг' : 'Step'} {step + 1}/{STEPS.length}</p>
              <h2 className="text-base font-semibold">{t ? currentStep.questionRu : currentStep.question}</h2>

              {currentStep.type === 'radio' ? (
                <RadioGroup value={answers[currentStep.id] as string || ''} onValueChange={handleRadio} className="space-y-2">
                  {currentStep.options.map(opt => (
                    <div key={opt.value} className="flex items-center space-x-3 p-3 rounded-none border border-border hover:bg-muted/50 transition-colors">
                      <RadioGroupItem value={opt.value} id={opt.value} />
                      <Label htmlFor={opt.value} className="text-sm cursor-pointer flex-1">{t ? opt.labelRu : opt.label}</Label>
                    </div>
                  ))}
                </RadioGroup>
              ) : (
                <div className="space-y-2">
                  {currentStep.options.map(opt => (
                    <div key={opt.value} className="flex items-center space-x-3 p-3 rounded-none border border-border hover:bg-muted/50 transition-colors">
                      <Checkbox
                        id={opt.value}
                        checked={((answers[currentStep.id] as string[]) || []).includes(opt.value)}
                        onCheckedChange={(checked) => handleCheckbox(opt.value, !!checked)}
                      />
                      <Label htmlFor={opt.value} className="text-sm cursor-pointer flex-1">{t ? opt.labelRu : opt.label}</Label>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex gap-3">
            {step > 0 && (
              <Button variant="outline" className="gap-1" onClick={() => setStep(s => s - 1)}>
                <ChevronLeft className="w-4 h-4" />{t ? 'Назад' : 'Back'}
              </Button>
            )}
            <Button className="flex-1 gap-1" disabled={!canProceed} onClick={handleNext}>
              {isLastStep ? (t ? 'Анализировать' : 'Analyze') : (t ? 'Далее' : 'Next')}
              {!isLastStep && <ChevronRight className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
