/**
 * VisaQuizPage — "Which visa do I need?" interactive quiz
 * Bible cluster: LEGAL → lead-gen for legal services
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, ChevronRight, CheckCircle2, ArrowLeft, FileText, Clock, DollarSign, AlertTriangle, Scale, CreditCard } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { BackButton } from '@/components/uno/BackButton';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { SEOHead } from '@/components/seo';
import { StartPageLayout } from '@/components/patterns';

interface QuizOption {
  id: string;
  labelEn: string;
  labelRu: string;
  emoji: string;
}

interface QuizStep {
  id: string;
  questionEn: string;
  questionRu: string;
  options: QuizOption[];
}

const QUIZ_STEPS: QuizStep[] = [
  {
    id: 'purpose',
    questionEn: 'What brings you to Thailand?',
    questionRu: 'Зачем вы приезжаете в Таиланд?',
    options: [
      { id: 'tourism', labelEn: 'Tourism / Vacation', labelRu: 'Туризм / Отпуск', emoji: '🏖️' },
      { id: 'work', labelEn: 'Work / Business', labelRu: 'Работа / Бизнес', emoji: '💼' },
      { id: 'retirement', labelEn: 'Retirement', labelRu: 'Пенсия / Retirement', emoji: '🌅' },
      { id: 'study', labelEn: 'Study / Education', labelRu: 'Учёба / Образование', emoji: '📚' },
    ],
  },
  {
    id: 'duration',
    questionEn: 'How long do you plan to stay?',
    questionRu: 'Как долго планируете оставаться?',
    options: [
      { id: 'short', labelEn: 'Up to 30 days', labelRu: 'До 30 дней', emoji: '📅' },
      { id: 'medium', labelEn: '1–3 months', labelRu: '1–3 месяца', emoji: '🗓️' },
      { id: 'long', labelEn: '3–12 months', labelRu: '3–12 месяцев', emoji: '📆' },
      { id: 'permanent', labelEn: 'Over 1 year', labelRu: 'Более 1 года', emoji: '🏠' },
    ],
  },
  {
    id: 'nationality',
    questionEn: 'Your passport type?',
    questionRu: 'Тип вашего паспорта?',
    options: [
      { id: 'russia', labelEn: 'Russia / CIS', labelRu: 'Россия / СНГ', emoji: '🇷🇺' },
      { id: 'eu', labelEn: 'EU / UK', labelRu: 'ЕС / Великобритания', emoji: '🇪🇺' },
      { id: 'us', labelEn: 'USA / Canada / Australia', labelRu: 'США / Канада / Австралия', emoji: '🇺🇸' },
      { id: 'other', labelEn: 'Other', labelRu: 'Другой', emoji: '🌍' },
    ],
  },
  {
    id: 'family',
    questionEn: 'Traveling with family?',
    questionRu: 'Едете с семьёй?',
    options: [
      { id: 'solo', labelEn: 'Solo', labelRu: 'Один / Одна', emoji: '🧑' },
      { id: 'couple', labelEn: 'With partner', labelRu: 'С партнёром', emoji: '👫' },
      { id: 'family_kids', labelEn: 'With children', labelRu: 'С детьми', emoji: '👨‍👩‍👧‍👦' },
    ],
  },
];

interface VisaResult {
  titleEn: string;
  titleRu: string;
  descEn: string;
  descRu: string;
  duration: string;
  cost: string;
  complexity: 'easy' | 'medium' | 'hard';
  tips: { en: string; ru: string }[];
}

function getVisaResult(answers: Record<string, string>): VisaResult {
  const { purpose, duration, nationality } = answers;

  if (purpose === 'tourism' && (duration === 'short' || duration === 'medium')) {
    return {
      titleEn: 'Visa Exemption / Tourist Visa',
      titleRu: 'Безвизовый въезд / Туристическая виза',
      descEn: nationality === 'russia'
        ? 'Russian citizens get 90-day visa-free entry. No visa needed for stays up to 90 days.'
        : 'Most nationalities get 30-60 day visa-free entry. Can be extended once at immigration.',
      descRu: nationality === 'russia'
        ? 'Граждане России получают 90 дней безвизового пребывания. Виза не нужна для поездок до 90 дней.'
        : 'Большинство стран получают 30-60 дней безвизового въезда. Можно продлить один раз в иммиграции.',
      duration: nationality === 'russia' ? '90 days' : '30-60 days',
      cost: 'Free',
      complexity: 'easy',
      tips: [
        { en: 'Have a return ticket ready', ru: 'Подготовьте обратный билет' },
        { en: 'Hotel booking confirmation helps', ru: 'Бронирование отеля поможет при въезде' },
        { en: '20,000 THB cash per person recommended', ru: 'Рекомендуется 20 000 ฿ наличными на человека' },
      ],
    };
  }

  if (purpose === 'work') {
    return {
      titleEn: 'Non-Immigrant B Visa + Work Permit',
      titleRu: 'Виза Non-Immigrant B + Разрешение на работу',
      descEn: 'Required for legal employment. Your employer must sponsor the work permit application.',
      descRu: 'Требуется для легальной работы. Работодатель должен подать заявку на разрешение на работу.',
      duration: '1 year (renewable)',
      cost: '2,000-5,000 THB',
      complexity: 'hard',
      tips: [
        { en: 'Start process before arriving', ru: 'Начните процесс до приезда' },
        { en: 'Need employer sponsorship', ru: 'Нужна спонсорская поддержка работодателя' },
        { en: 'Digital nomad? Consider DTV visa', ru: 'Цифровой кочевник? Рассмотрите DTV визу' },
      ],
    };
  }

  if (purpose === 'retirement') {
    return {
      titleEn: 'Non-Immigrant O-A (Retirement Visa)',
      titleRu: 'Виза Non-Immigrant O-A (Пенсионная)',
      descEn: 'For retirees 50+. Requires 800,000 THB in Thai bank or 65,000 THB/month income proof.',
      descRu: 'Для пенсионеров 50+. Требуется 800 000 ฿ в тайском банке или доход 65 000 ฿/мес.',
      duration: '1 year (renewable)',
      cost: '2,000 THB',
      complexity: 'medium',
      tips: [
        { en: 'Open Thai bank account first', ru: 'Сначала откройте счёт в тайском банке' },
        { en: 'Health insurance required', ru: 'Требуется медицинская страховка' },
        { en: '90-day reporting mandatory', ru: 'Обязательна отметка каждые 90 дней' },
      ],
    };
  }

  if (purpose === 'study') {
    return {
      titleEn: 'Non-Immigrant ED Visa (Education)',
      titleRu: 'Виза Non-Immigrant ED (Образовательная)',
      descEn: 'For Thai language courses, university, or Muay Thai training at accredited schools.',
      descRu: 'Для курсов тайского языка, университета или тренировок Муай Тай в аккредитованных школах.',
      duration: '90 days – 1 year',
      cost: '2,000 THB + school fees',
      complexity: 'medium',
      tips: [
        { en: 'Choose a MoE-accredited school', ru: 'Выберите аккредитованную школу' },
        { en: 'Attendance required', ru: 'Требуется посещение занятий' },
        { en: 'Can be combined with part-time work', ru: 'Можно совмещать с подработкой' },
      ],
    };
  }

  // Long-stay tourism
  if (duration === 'long' || duration === 'permanent') {
    return {
      titleEn: 'Tourist Visa (TR) or DTV Visa',
      titleRu: 'Туристическая виза (TR) или DTV Виза',
      descEn: 'For stays over 60 days. DTV (Destination Thailand Visa) allows 180-day stays with remote work.',
      descRu: 'Для пребывания свыше 60 дней. DTV виза позволяет 180 дней с удалённой работой.',
      duration: '60-180 days',
      cost: '1,000-10,000 THB',
      complexity: 'medium',
      tips: [
        { en: 'DTV requires proof of remote work', ru: 'DTV требует подтверждение удалённой работы' },
        { en: 'Apply at Thai embassy before travel', ru: 'Подайте в посольство Таиланда до поездки' },
        { en: 'Can extend TR visa 30 days at immigration', ru: 'Можно продлить TR визу на 30 дней в иммиграции' },
      ],
    };
  }

  // Default fallback
  return {
    titleEn: 'Visa Exemption',
    titleRu: 'Безвизовый въезд',
    descEn: 'You likely qualify for visa-free entry. Contact our legal team for personalized advice.',
    descRu: 'Вероятно, вы можете въехать без визы. Свяжитесь с нашей командой для консультации.',
    duration: '30-90 days',
    cost: 'Free',
    complexity: 'easy',
    tips: [
      { en: 'Check latest rules before travel', ru: 'Проверьте актуальные правила перед поездкой' },
    ],
  };
}

export default function VisaQuizPage() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isRu = language === 'ru';
  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResult, setShowResult] = useState(false);

  const currentStep = QUIZ_STEPS[step];
  const progress = showResult ? 100 : ((step) / QUIZ_STEPS.length) * 100;

  const handleSelect = (optionId: string) => {
    const newAnswers = { ...answers, [currentStep.id]: optionId };
    setAnswers(newAnswers);

    if (step < QUIZ_STEPS.length - 1) {
      setStep(step + 1);
    } else {
      setShowResult(true);
    }
  };

  const handleBack = () => {
    if (showResult) {
      setShowResult(false);
    } else if (step > 0) {
      setStep(step - 1);
    }
  };

  const handleRestart = () => {
    setStep(0);
    setAnswers({});
    setShowResult(false);
  };

  const result = showResult ? getVisaResult(answers) : null;
  const complexityColors = {
    easy: 'bg-success/10 text-success border-success/30',
    medium: 'bg-warning/10 text-warning border-warning/30',
    hard: 'bg-destructive/10 text-destructive border-destructive/30',
  };
  const complexityLabels = {
    easy: isRu ? 'Просто' : 'Easy',
    medium: isRu ? 'Средне' : 'Medium',
    hard: isRu ? 'Сложно' : 'Complex',
  };

  return (
    <AppLayout showHeader={false} showBottomNav>
      <SEOHead
        title={isRu ? 'Какая виза мне нужна? — Квиз' : 'Which Visa Do I Need? — Quiz'}
        description={isRu ? 'Пройдите квиз и узнайте какая виза подходит для вашей поездки в Таиланд' : 'Take a quick quiz to find the right visa for your Thailand trip'}
      />

      {!started ? (
        <StartPageLayout
          cluster={isRu ? 'ВИЗЫ И ДОКУМЕНТЫ' : 'VISAS & DOCUMENTS'}
          title={isRu ? 'Подберите подходящую визу за 4 шага' : 'Find the right visa in 4 steps'}
          summary={isRu
            ? 'Короткий квиз, который покажет, какая тайская виза подходит вашей цели поездки. В конце — стоимость, сроки и контакт юриста.'
            : 'A short quiz that picks the right Thai visa for your trip. Ends with cost, timing, and a lawyer contact.'}
          meta={{
            duration: isRu ? '2 мин' : '2 min',
            cost: isRu ? 'Бесплатно' : 'Free',
            eligibility: isRu ? 'Любой паспорт' : 'Any passport',
            requirements: isRu ? 'Цель и срок поездки' : 'Trip purpose & duration',
          }}
          eligibility={isRu
            ? ['Едете в Таиланд впервые или повторно', 'Любой состав поездки: один, пара, семья', 'Любая цель: туризм, работа, учёба, пенсия']
            : ['First trip or returning', 'Any party: solo, couple, family', 'Any purpose: tourism, work, study, retirement']}
          requirements={isRu
            ? ['Знаете цель поездки', 'Знаете планируемый срок', 'Знаете тип паспорта']
            : ['You know your trip purpose', 'You know how long you plan to stay', 'You know your passport type']}
          startLabel={isRu ? 'Начать квиз' : 'Start the quiz'}
          onStart={() => setStarted(true)}
          secondaryLabel={isRu ? 'Назад' : 'Back'}
          onSecondary={() => navigate(-1)}
          lastUpdated={isRu ? 'Апр 2026' : 'Apr 2026'}
        />
      ) : (
        <>
          {/* Header */}
      <div className="sticky top-0 z-40 bg-background border-b border-border/50">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" className="shrink-0 h-9 w-9" onClick={step === 0 && !showResult ? () => navigate(-1) : handleBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-semibold truncate">
              {isRu ? 'Какая виза мне нужна?' : 'Which Visa Do I Need?'}
            </h1>
            <p className="text-xs text-muted-foreground">
              {showResult
                ? (isRu ? 'Результат' : 'Result')
                : `${step + 1} / ${QUIZ_STEPS.length}`}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary" />
          </div>
        </div>
        <Progress value={progress} className="h-1" />
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 pb-24">
        {!showResult && currentStep ? (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">
              {isRu ? currentStep.questionRu : currentStep.questionEn}
            </h2>
            <div className="space-y-3">
              {currentStep.options.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => handleSelect(opt.id)}
                  className={cn(
                    "w-full flex items-center gap-3 p-4 rounded-xl border text-left transition-all",
                    "hover:border-primary hover:bg-primary/5",
                    answers[currentStep.id] === opt.id
                      ? "border-primary bg-primary/10"
                      : "border-border bg-card"
                  )}
                >
                  <span className="text-2xl">{opt.emoji}</span>
                  <span className="font-medium text-sm">{isRu ? opt.labelRu : opt.labelEn}</span>
                  <ChevronRight className="w-4 h-4 ml-auto text-muted-foreground" />
                </button>
              ))}
            </div>
          </div>
        ) : result ? (
          <div className="space-y-6">
            {/* Result card */}
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Badge className={cn("mb-2", complexityColors[result.complexity])}>
                      {complexityLabels[result.complexity]}
                    </Badge>
                    <h2 className="text-lg font-bold">{isRu ? result.titleRu : result.titleEn}</h2>
                  </div>
                  <CheckCircle2 className="w-8 h-8 text-primary shrink-0" />
                </div>
                <p className="text-sm text-muted-foreground">{isRu ? result.descRu : result.descEn}</p>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-background">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-[10px] text-muted-foreground">{isRu ? 'Срок' : 'Duration'}</p>
                      <p className="text-xs font-semibold">{result.duration}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-background">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-[10px] text-muted-foreground">{isRu ? 'Стоимость' : 'Cost'}</p>
                      <p className="text-xs font-semibold">{result.cost}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tips */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-warning" />
                {isRu ? 'Важные советы' : 'Important Tips'}
              </h3>
              {result.tips.map((tip, i) => (
                <div key={i} className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
                  <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <p className="text-sm">{isRu ? tip.ru : tip.en}</p>
                </div>
              ))}
            </div>

            {/* Lawyer Consultation CTA */}
            <Card className="border-primary bg-gradient-to-br from-primary/10 to-primary/5 overflow-hidden">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                    <Scale className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">
                      {isRu ? 'Консультация с юристом' : 'Lawyer Consultation'}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {isRu
                        ? 'Разберём ваш кейс и подготовим документы'
                        : "We'll review your case & prepare documents"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between px-1">
                  <span className="text-lg font-bold text-primary">฿2,000</span>
                  <Badge variant="outline" className="text-[10px]">
                    <CreditCard className="w-3 h-3 mr-1" />
                    {isRu ? 'Оплата онлайн' : 'Pay Online'}
                  </Badge>
                </div>
                <Button
                  className="w-full"
                  onClick={() => navigate(
                    `/legal/booking/visa-consultation?service=${encodeURIComponent(
                      isRu ? 'Визовая консультация' : 'Visa Consultation'
                    )}&visa_type=${encodeURIComponent(result.titleEn)}`
                  )}
                >
                  <Scale className="w-4 h-4 mr-2" />
                  {isRu ? 'Записаться на консультацию' : 'Book Consultation'}
                </Button>
              </CardContent>
            </Card>

            {/* Other CTAs */}
            <div className="space-y-3">
              <Button variant="outline" className="w-full" onClick={() => navigate('/legal')}>
                <FileText className="w-4 h-4 mr-2" />
                {isRu ? 'Все юридические услуги' : 'Browse All Legal Services'}
              </Button>
              <Button variant="ghost" className="w-full" onClick={handleRestart}>
                {isRu ? 'Пройти заново' : 'Retake Quiz'}
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </AppLayout>
  );
}
