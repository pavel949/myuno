import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { LandingLayout } from '@/components/miniapp/LandingLayout';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Globe, FileText, Home, GraduationCap, Stethoscope, Landmark, Car, Scale, Users, Check, ArrowRight, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { APP_ROUTES } from '@/lib/config/routes';
import { StartPageLayout, StepByStepNav, type Step } from '@/components/patterns';
import { tokenColor } from '@/lib/utils/hslAlpha';

const STEPS = [
  { id: 'visa', icon: FileText, labelEn: 'Visas & Documents', labelRu: 'Визы и документы', descEn: 'Work permits, retirement visa, education visa — we handle paperwork', descRu: 'Рабочие разрешения, пенсионная виза, учебная виза — мы берём на себя документы', path: APP_ROUTES.VISA_IMMIGRATION, color: 'cluster-live' },
  { id: 'housing', icon: Home, labelEn: 'Housing', labelRu: 'Жильё', descEn: 'Long-term rentals, condos, villas — vetted by our team', descRu: 'Долгосрочная аренда, кондо, виллы — проверены нашей командой', path: `${APP_ROUTES.PROPERTY_BROWSE}?mode=rent&tenancy=long`, color: 'cluster-arrive' },
  { id: 'school', icon: GraduationCap, labelEn: 'Schools & Kindergartens', labelRu: 'Школы и сады', descEn: 'International schools, Russian schools, kindergartens', descRu: 'Международные школы, русские школы, детские сады', path: APP_ROUTES.EDUCATION, color: 'accent-amber' },
  { id: 'medical', icon: Stethoscope, labelEn: 'Medical & Insurance', labelRu: 'Медицина и страховка', descEn: 'Health insurance, clinics, dentists, pediatricians', descRu: 'Медстраховка, клиники, стоматологи, педиатры', path: APP_ROUTES.MEDICAL, color: 'destructive' },
  { id: 'banking', icon: Landmark, labelEn: 'Banking & Finance', labelRu: 'Банки и финансы', descEn: 'Thai bank account, tax planning, crypto-friendly banks', descRu: 'Счёт в тайском банке, налоговое планирование', path: APP_ROUTES.BANKING, color: 'accent-cyan' },
  { id: 'transport', icon: Car, labelEn: 'Transport', labelRu: 'Транспорт', descEn: 'Car rental, driver license, scooter purchase', descRu: 'Аренда авто, водительские права, покупка скутера', path: APP_ROUTES.TRANSPORT, color: 'accent-coral' },
  { id: 'legal', icon: Scale, labelEn: 'Legal & Accounting', labelRu: 'Юрист и бухгалтер', descEn: 'Company setup, contracts, tax filing', descRu: 'Регистрация компании, договоры, налоговая отчётность', path: APP_ROUTES.LEGAL, color: 'accent-purple' },
  { id: 'lifestyle', icon: Users, labelEn: 'Community & Lifestyle', labelRu: 'Досуг и комьюнити', descEn: 'Expat groups, sports, restaurants, events', descRu: 'Экспат-группы, спорт, рестораны, события', path: APP_ROUTES.EXPERIENCES, color: 'accent-purple' },
];

type StepId = typeof STEPS[number]['id'];

const PRIORITY_TO_STEP: Record<string, StepId[]> = {
  visa: ['visa', 'legal', 'banking'],
  housing: ['housing', 'visa', 'transport'],
  school: ['school', 'housing', 'medical'],
  medical: ['medical', 'visa'],
  banking: ['banking', 'legal'],
  legal: ['legal', 'visa', 'banking'],
  transport: ['transport', 'housing'],
  community: ['lifestyle', 'housing'],
};

const QUIZ_PRIORITIES = [
  { id: 'visa', en: 'Visa & documents', ru: 'Виза и документы' },
  { id: 'housing', en: 'Housing search', ru: 'Поиск жилья' },
  { id: 'school', en: 'School / kindergarten', ru: 'Школа / детсад' },
  { id: 'medical', en: 'Medical & insurance', ru: 'Медицина и страховка' },
  { id: 'banking', en: 'Bank account', ru: 'Открытие счёта' },
  { id: 'legal', en: 'Legal / company setup', ru: 'Юридические вопросы / компания' },
  { id: 'transport', en: 'Transport & license', ru: 'Транспорт и права' },
  { id: 'community', en: 'Community & lifestyle', ru: 'Комьюнити и лайфстайл' },
] as const;

const PLANS = [
  { nameEn: 'DIY', nameRu: 'Самостоятельно', priceEn: 'Free', priceRu: 'Бесплатно', featuresEn: ['Access to all guides', 'Service directory', 'Community forum'], featuresRu: ['Доступ ко всем гайдам', 'Каталог сервисов', 'Форум комьюнити'], highlight: false },
  { nameEn: 'Guided', nameRu: 'С поддержкой', priceEn: '฿15,000', priceRu: '฿15,000', featuresEn: ['Personal coordinator', 'Visa assistance', 'Housing search', '5 consultations'], featuresRu: ['Личный координатор', 'Помощь с визой', 'Поиск жилья', '5 консультаций'], highlight: true },
  { nameEn: 'VIP', nameRu: 'VIP', priceEn: '฿50,000', priceRu: '฿50,000', featuresEn: ['Dedicated agent', 'Full document handling', 'School tours', 'Airport meet & greet', 'Unlimited support 90 days'], featuresRu: ['Выделенный агент', 'Полное оформление документов', 'Экскурсии по школам', 'Встреча в аэропорту', 'Безлимитная поддержка 90 дней'], highlight: false },
];

const FAQ = [
  { qEn: 'How long does relocation take?', qRu: 'Сколько занимает переезд?', aEn: 'Typically 2-4 weeks for basic setup. Full settling with schools takes 1-2 months.', aRu: 'Обычно 2-4 недели для базовой настройки. Полное обустройство со школами — 1-2 месяца.' },
  { qEn: 'Do I need a visa?', qRu: 'Нужна ли виза?', aEn: 'Yes. Options include tourist, education, retirement, business, or Thailand Elite visa.', aRu: 'Да. Варианты: туристическая, учебная, пенсионная, бизнес-виза или Thailand Elite.' },
  { qEn: 'Can I open a bank account?', qRu: 'Могу ли я открыть счёт в банке?', aEn: 'Yes, with a valid visa. We help navigate the process.', aRu: 'Да, при наличии визы. Мы поможем пройти процесс.' },
  { qEn: 'What about schools?', qRu: 'А что со школами?', aEn: 'Phuket has 10+ international schools. Fees range from ฿200k to ฿800k/year.', aRu: 'На Пхукете 10+ международных школ. Стоимость от ฿200k до ฿800k/год.' },
];

export default function RelocateLandingPage() {
  const { language } = useLanguage();
  const t = language === 'ru';
  const navigate = useNavigate();
  const [timeline, setTimeline] = useState<'urgent' | 'soon' | 'planned' | 'exploring'>('soon');
  const [household, setHousehold] = useState<'solo' | 'couple' | 'family'>('solo');
  const [budget, setBudget] = useState<'low' | 'mid' | 'high' | 'premium'>('mid');
  const [housingGoal, setHousingGoal] = useState<'rent' | 'buy' | 'undecided'>('rent');
  const [priorities, setPriorities] = useState<string[]>(['visa', 'housing']);

  const togglePriority = (id: string) => {
    setPriorities(prev => {
      if (prev.includes(id)) return prev.filter(p => p !== id);
      if (prev.length >= 4) return prev;
      return [...prev, id];
    });
  };

  const selectedSteps = useMemo(() => {
    const order: StepId[] = [];
    priorities.forEach(priorityId => {
      (PRIORITY_TO_STEP[priorityId] ?? []).forEach(stepId => {
        if (!order.includes(stepId)) order.push(stepId);
      });
    });
    if (order.length === 0) order.push('visa', 'housing');
    return order.slice(0, 5).map(stepId => STEPS.find(step => step.id === stepId)).filter(Boolean) as typeof STEPS;
  }, [priorities]);

  const requestSummary = useMemo(() => {
    const timelineLabel = t
      ? ({ urgent: 'в течение 1 месяца', soon: 'в течение 1-3 месяцев', planned: 'через 3-6 месяцев', exploring: 'пока изучаю' }[timeline])
      : ({ urgent: 'within 1 month', soon: 'in 1-3 months', planned: 'in 3-6 months', exploring: 'just exploring' }[timeline]);

    const householdLabel = t
      ? ({ solo: '1 человек', couple: 'пара', family: 'семья с детьми' }[household])
      : ({ solo: 'solo', couple: 'couple', family: 'family with kids' }[household]);

    const budgetLabel = t
      ? ({ low: 'до ฿50k/мес', mid: '฿50k-120k/мес', high: '฿120k-250k/мес', premium: '฿250k+/мес' }[budget])
      : ({ low: 'up to ฿50k/mo', mid: '฿50k-120k/mo', high: '฿120k-250k/mo', premium: '฿250k+/mo' }[budget]);

    const housingLabel = t
      ? ({ rent: 'аренда', buy: 'покупка', undecided: 'пока не решил' }[housingGoal])
      : ({ rent: 'rent', buy: 'buy', undecided: 'undecided' }[housingGoal]);

    const prioritiesLabel = priorities
      .map(priorityId => QUIZ_PRIORITIES.find(p => p.id === priorityId))
      .filter(Boolean)
      .map(item => (t ? item!.ru : item!.en))
      .join(', ');

    return t
      ? `Нужен персональный relocation roadmap. Срок: ${timelineLabel}. Формат: ${householdLabel}. Бюджет: ${budgetLabel}. Цель по жилью: ${housingLabel}. Приоритеты: ${prioritiesLabel || 'базовая адаптация'}.`
      : `Need a personalized relocation roadmap. Timeline: ${timelineLabel}. Household: ${householdLabel}. Budget: ${budgetLabel}. Housing goal: ${housingLabel}. Priorities: ${prioritiesLabel || 'basic setup'}.`;
  }, [budget, household, housingGoal, priorities, t, timeline]);

  const whatsappUrl = 'https://wa.me/66800000000?text=' + encodeURIComponent(requestSummary);

  const scrollToQuiz = () => {
    document.getElementById('relocation-quiz')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const relocationSteps: Step[] = [
    { id: 'decide', title: t ? 'Определите цели и сроки' : 'Define goals & timeline', description: t ? 'Срок переезда, состав семьи, бюджет.' : 'Move date, household, budget.', status: 'todo', duration: t ? '15 мин' : '15 min' },
    { id: 'visa', title: t ? 'Выберите визу' : 'Choose your visa', description: t ? 'DTV, Education, Retirement, Non-B — что подходит вам.' : 'DTV, Education, Retirement, Non-B — pick what fits.', status: 'todo', duration: t ? '1–4 нед' : '1–4 wk' },
    { id: 'housing', title: t ? 'Найдите жильё' : 'Find housing', description: t ? 'Долгосрочная аренда, кондо или вилла.' : 'Long-term rental, condo or villa.', status: 'todo', cost: t ? 'от ฿25k/мес' : 'from ฿25k/mo' },
    { id: 'school', title: t ? 'Выберите школу или сад' : 'Pick a school', description: t ? 'Если переезжаете с детьми.' : 'If moving with children.', status: 'todo' },
    { id: 'arrive', title: t ? 'Прилёт и трансфер' : 'Arrive & transfer', description: t ? 'Встреча в аэропорту, первая SIM, заселение.' : 'Airport meet, first SIM, check-in.', status: 'todo', duration: t ? '1 день' : '1 day' },
    { id: 'tm30', title: t ? 'Подайте TM30' : 'File TM30', description: t ? 'Регистрация адреса в течение 24 часов.' : 'Register your address within 24 hours.', status: 'todo' },
    { id: 'bank', title: t ? 'Откройте счёт в банке' : 'Open a bank account', description: t ? 'Bangkok Bank, Kasikorn, SCB.' : 'Bangkok Bank, Kasikorn, SCB.', status: 'todo', duration: t ? '1–2 нед' : '1–2 wk' },
    { id: 'medical', title: t ? 'Подключите медицину' : 'Set up healthcare', description: t ? 'Страховка, врач, аптека, педиатр.' : 'Insurance, doctor, pharmacy, paediatrician.', status: 'todo' },
    { id: 'community', title: t ? 'Войдите в комьюнити' : 'Join the community', description: t ? 'Экспат-чаты, спорт, события.' : 'Expat groups, sports, events.', status: 'todo' },
  ];

  return (
    <LandingLayout
      icon={Globe}
      title={t ? 'Переезд на Пхукет' : 'Relocate to Phuket'}
      subtitle={t ? 'Полное сопровождение переезда — от визы до школы для детей' : 'Full relocation support — from visa to school for your kids'}
      gradient="from-indigo-700 via-indigo-600 to-violet-700"
      heroCta={{ label: t ? 'Бесплатная консультация' : 'Free Consultation', onClick: () => window.open(whatsappUrl, '_blank') }}
      whatsappUrl={whatsappUrl}
      whatsappLabel={t ? 'Написать в WhatsApp' : 'Chat on WhatsApp'}
    >
      {/* GOV.UK-style start page */}
      <StartPageLayout
        cluster={t ? 'РЕЛОКАЦИЯ · 9 ШАГОВ' : 'RELOCATION · 9 STEPS'}
        title={t ? 'Переезд на Пхукет за 9 шагов' : 'Relocate to Phuket in 9 steps'}
        summary={t
          ? 'Понятный план для тех, кто планирует переехать на 6+ месяцев. От выбора визы до открытия счёта в банке.'
          : 'A clear plan for anyone moving for 6+ months. From choosing a visa to opening a bank account.'}
        meta={{
          duration: t ? '4–8 недель' : '4–8 weeks',
          cost: t ? 'от ฿15,000' : 'from ฿15,000',
          eligibility: t ? 'Любая национальность' : 'Any nationality',
          requirements: t ? 'Паспорт, бюджет' : 'Passport, budget',
        }}
        eligibility={t
          ? ['Едете на срок от 6 месяцев', 'Любой состав семьи', 'Любой бюджет — есть DIY и VIP-варианты']
          : ['Moving for 6+ months', 'Any household type', 'Any budget — DIY to VIP options available']}
        requirements={t
          ? ['Действующий паспорт (>6 мес.)', 'Подтверждение дохода / средств', 'Адрес проживания на первое время']
          : ['Valid passport (>6 months)', 'Proof of income or funds', 'Initial accommodation address']}
        startLabel={t ? 'Начать roadmap' : 'Start the roadmap'}
        onStart={scrollToQuiz}
        secondaryLabel={t ? 'Спросить в WhatsApp' : 'Ask on WhatsApp'}
        onSecondary={() => window.open(whatsappUrl, '_blank')}
      />

      <StepByStepNav
        title={t ? 'Что нужно сделать' : 'What you need to do'}
        steps={relocationSteps}
      />

      {/* Quiz */}
      <div id="relocation-quiz" className="px-4 py-8 scroll-mt-20">

        <div className="max-w-3xl mx-auto rounded-2xl border border-border bg-card p-5 md:p-6">
          <h2 className="text-xl font-bold font-display text-foreground">
            {t ? 'Relocation Quiz: персональный roadmap' : 'Relocation Quiz: personalized roadmap'}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {t
              ? 'Ответьте на 5 вопросов, чтобы сузить запросы и получить точный план действий.'
              : 'Answer 5 quick questions to narrow requests and generate a focused action plan.'}
          </p>

          <div className="grid gap-5 mt-5 md:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t ? 'Когда переезд?' : 'When do you move?'}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {[
                  { id: 'urgent', en: '0-1 month', ru: '0-1 месяц' },
                  { id: 'soon', en: '1-3 months', ru: '1-3 месяца' },
                  { id: 'planned', en: '3-6 months', ru: '3-6 месяцев' },
                  { id: 'exploring', en: 'Exploring', ru: 'Изучаю' },
                ].map(item => (
                  <button key={item.id} type="button" onClick={() => setTimeline(item.id as typeof timeline)} className={cn('px-3 py-2 rounded-full text-xs border transition-colors', timeline === item.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border text-muted-foreground hover:text-foreground')}>
                    {t ? item.ru : item.en}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t ? 'Кто переезжает?' : 'Who is relocating?'}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {[
                  { id: 'solo', en: 'Solo', ru: 'Один' },
                  { id: 'couple', en: 'Couple', ru: 'Пара' },
                  { id: 'family', en: 'Family', ru: 'Семья' },
                ].map(item => (
                  <button key={item.id} type="button" onClick={() => setHousehold(item.id as typeof household)} className={cn('px-3 py-2 rounded-full text-xs border transition-colors', household === item.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border text-muted-foreground hover:text-foreground')}>
                    {t ? item.ru : item.en}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t ? 'Бюджет в месяц' : 'Monthly budget'}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {[
                  { id: 'low', en: 'up to ฿50k', ru: 'до ฿50k' },
                  { id: 'mid', en: '฿50k-120k', ru: '฿50k-120k' },
                  { id: 'high', en: '฿120k-250k', ru: '฿120k-250k' },
                  { id: 'premium', en: '฿250k+', ru: '฿250k+' },
                ].map(item => (
                  <button key={item.id} type="button" onClick={() => setBudget(item.id as typeof budget)} className={cn('px-3 py-2 rounded-full text-xs border transition-colors', budget === item.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border text-muted-foreground hover:text-foreground')}>
                    {t ? item.ru : item.en}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t ? 'Цель по жилью' : 'Housing goal'}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {[
                  { id: 'rent', en: 'Rent', ru: 'Аренда' },
                  { id: 'buy', en: 'Buy', ru: 'Покупка' },
                  { id: 'undecided', en: 'Undecided', ru: 'Не решил' },
                ].map(item => (
                  <button key={item.id} type="button" onClick={() => setHousingGoal(item.id as typeof housingGoal)} className={cn('px-3 py-2 rounded-full text-xs border transition-colors', housingGoal === item.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border text-muted-foreground hover:text-foreground')}>
                    {t ? item.ru : item.en}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t ? 'Главные приоритеты (до 4)' : 'Top priorities (up to 4)'}
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              {QUIZ_PRIORITIES.map(priority => {
                const active = priorities.includes(priority.id);
                return (
                  <button
                    key={priority.id}
                    type="button"
                    onClick={() => togglePriority(priority.id)}
                    className={cn(
                      'px-3 py-2 rounded-full text-xs border transition-colors',
                      active
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background border-border text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {t ? priority.ru : priority.en}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-border bg-muted/30 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t ? 'Сформированный запрос' : 'Generated request'}
            </p>
            <p className="text-sm text-foreground mt-2">{requestSummary}</p>
            <div className="flex flex-wrap gap-2 mt-4">
              <Button onClick={() => window.open(whatsappUrl, '_blank')} className="gap-2">
                <MessageCircle className="w-4 h-4" />
                {t ? 'Отправить в WhatsApp' : 'Send to WhatsApp'}
              </Button>
              <Button variant="outline" onClick={() => navigate(APP_ROUTES.LIST_WITH_US)}>
                {t ? 'Оставить заявку в app' : 'Create in-app request'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Personalized Roadmap */}
      <div className="px-4 py-2">
        <h2 className="text-xl font-bold font-display text-foreground mb-6 text-center">
          {t ? 'Ваш персональный roadmap' : 'Your personalized roadmap'}
        </h2>
        <div className="space-y-4 max-w-lg mx-auto">
          {selectedSteps.map((step, i) => {
            const Icon = step.icon;
            return (
              <button key={`${step.id}-${i}`} onClick={() => navigate(step.path)} className="w-full flex items-start gap-4 p-4 rounded-xl border border-border bg-card text-left transition-all hover:[box-shadow:var(--shadow-elevation-2)] active:scale-[0.98]">
                <div className="relative flex flex-col items-center">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: tokenColor(step.color, 0.15) }}>
                    <Icon className="w-5 h-5" style={{ color: tokenColor(step.color) }} />
                  </div>
                  {i < selectedSteps.length - 1 && <div className="w-px h-6 mt-1" style={{ background: tokenColor(step.color, 0.3) }} />}
                </div>
                <div className="flex-1 min-w-0 pt-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-muted-foreground">{String(i + 1).padStart(2, '0')}</span>
                    <h3 className="font-semibold text-sm text-foreground">{t ? step.labelRu : step.labelEn}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{t ? step.descRu : step.descEn}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0 mt-2" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Roadmap */}
      <div className="px-4 py-8">
        <h2 className="text-xl font-bold font-display text-foreground mb-6 text-center">
          {t ? 'Дорожная карта переезда' : 'Relocation Roadmap'}
        </h2>
        <div className="space-y-4 max-w-lg mx-auto">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <button key={i} onClick={() => navigate(step.path)} className="w-full flex items-start gap-4 p-4 rounded-xl border border-border bg-card text-left transition-all hover:[box-shadow:var(--shadow-elevation-2)] active:scale-[0.98]">
                <div className="relative flex flex-col items-center">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: tokenColor(step.color, 0.15) }}>
                    <Icon className="w-5 h-5" style={{ color: tokenColor(step.color) }} />
                  </div>
                  {i < STEPS.length - 1 && <div className="w-px h-6 mt-1" style={{ background: tokenColor(step.color, 0.3) }} />}
                </div>
                <div className="flex-1 min-w-0 pt-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-muted-foreground">{String(i + 1).padStart(2, '0')}</span>
                    <h3 className="font-semibold text-sm text-foreground">{t ? step.labelRu : step.labelEn}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{t ? step.descRu : step.descEn}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0 mt-2" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Pricing */}
      <div className="px-4 py-8 bg-muted/30">
        <h2 className="text-xl font-bold font-display text-foreground mb-6 text-center">
          {t ? 'Тарифы' : 'Pricing'}
        </h2>
        <div className="grid gap-4 max-w-lg mx-auto md:grid-cols-3 md:max-w-3xl">
          {PLANS.map((plan, i) => (
            <div key={i} className={cn("rounded-xl border p-5 bg-card", plan.highlight ? "border-primary ring-2 ring-primary/20 shadow-lg" : "border-border")}>
              {plan.highlight && <span className="text-[10px] font-bold text-primary uppercase tracking-wider">{t ? 'Популярный' : 'Popular'}</span>}
              <h3 className="text-lg font-bold font-display text-foreground mt-1">{t ? plan.nameRu : plan.nameEn}</h3>
              <p className="text-2xl font-bold text-primary mt-2">{t ? plan.priceRu : plan.priceEn}</p>
              <ul className="mt-4 space-y-2">
                {(t ? plan.featuresRu : plan.featuresEn).map((f, j) => (
                  <li key={j} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="w-4 h-4 text-primary shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button onClick={() => window.open(whatsappUrl, '_blank')} variant={plan.highlight ? 'default' : 'outline'} className="w-full mt-5">
                {t ? 'Узнать больше' : 'Learn more'}
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div className="px-4 py-8 max-w-lg mx-auto">
        <h2 className="text-xl font-bold font-display text-foreground mb-4 text-center">
          {t ? 'Частые вопросы' : 'FAQ'}
        </h2>
        <Accordion type="single" collapsible className="w-full">
          {FAQ.map((item, i) => (
            <AccordionItem key={i} value={`faq-${i}`}>
              <AccordionTrigger className="text-sm text-left">{t ? item.qRu : item.qEn}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-sm">{t ? item.aRu : item.aEn}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </LandingLayout>
  );
}
