import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { LandingLayout } from '@/components/miniapp/LandingLayout';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Globe, FileText, Home, GraduationCap, Stethoscope, Landmark, Car, Scale, Users, Check, ArrowRight, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const STEPS = [
  { icon: FileText, labelEn: 'Visas & Documents', labelRu: 'Визы и документы', descEn: 'Work permits, retirement visa, education visa — we handle paperwork', descRu: 'Рабочие разрешения, пенсионная виза, учебная виза — мы берём на себя документы', path: '/visa', color: '#4E7BFF' },
  { icon: Home, labelEn: 'Housing', labelRu: 'Жильё', descEn: 'Long-term rentals, condos, villas — vetted by our team', descRu: 'Долгосрочная аренда, кондо, виллы — проверены нашей командой', path: '/property?mode=long-term', color: '#00D68F' },
  { icon: GraduationCap, labelEn: 'Schools & Kindergartens', labelRu: 'Школы и сады', descEn: 'International schools, Russian schools, kindergartens', descRu: 'Международные школы, русские школы, детские сады', path: '/education', color: '#F59E0B' },
  { icon: Stethoscope, labelEn: 'Medical & Insurance', labelRu: 'Медицина и страховка', descEn: 'Health insurance, clinics, dentists, pediatricians', descRu: 'Медстраховка, клиники, стоматологи, педиатры', path: '/medical', color: '#F43F5E' },
  { icon: Landmark, labelEn: 'Banking & Finance', labelRu: 'Банки и финансы', descEn: 'Thai bank account, tax planning, crypto-friendly banks', descRu: 'Счёт в тайском банке, налоговое планирование', path: '/banking', color: '#06B6D4' },
  { icon: Car, labelEn: 'Transport', labelRu: 'Транспорт', descEn: 'Car rental, driver license, scooter purchase', descRu: 'Аренда авто, водительские права, покупка скутера', path: '/transport', color: '#F97316' },
  { icon: Scale, labelEn: 'Legal & Accounting', labelRu: 'Юрист и бухгалтер', descEn: 'Company setup, contracts, tax filing', descRu: 'Регистрация компании, договоры, налоговая отчётность', path: '/legal', color: '#A855F7' },
  { icon: Users, labelEn: 'Community & Lifestyle', labelRu: 'Досуг и комьюнити', descEn: 'Expat groups, sports, restaurants, events', descRu: 'Экспат-группы, спорт, рестораны, события', path: '/experiences', color: '#EC4899' },
];

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
  const whatsappUrl = 'https://wa.me/66800000000?text=' + encodeURIComponent(t ? 'Здравствуйте! Интересует переезд на Пхукет' : 'Hello! I am interested in relocating to Phuket');

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
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: step.color + '15' }}>
                    <Icon className="w-5 h-5" style={{ color: step.color }} />
                  </div>
                  {i < STEPS.length - 1 && <div className="w-px h-6 mt-1" style={{ background: step.color + '30' }} />}
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
