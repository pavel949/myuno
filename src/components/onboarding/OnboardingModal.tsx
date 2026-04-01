/**
 * OnboardingModal — 4-step fullscreen onboarding
 * Step 1: Who are you (persona selection — 10 lifestyle personas)
 * Step 2: Ecosystem map (animated cluster diagram)
 * Step 3: Role-specific feature highlight
 * Step 4: Quick win CTA
 */
import React, { forwardRef, useCallback, useState, memo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronRight, Plane, Home, Building2, TrendingUp, Check,
  Scale, HardHat, Car, CreditCard, Stethoscope, Calculator,
  BarChart3, Shield, Calendar, Sparkles, FileSearch,
  Baby, Heart, Music, Dumbbell, Laptop, Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUserPersonas, UserPersona, PERSONA_OPTIONS as ALL_PERSONAS, PERSONA_INFO } from '@/hooks/useUserPersonas';
import { useNavigate } from 'react-router-dom';
import { triggerHaptic } from '@/hooks/useHapticFeedback';

interface OnboardingModalProps {
  open: boolean;
  onComplete: () => void;
}

type Step = 1 | 2 | 3 | 4;

interface ClusterNode {
  id: string;
  labelRu: string;
  labelEn: string;
  color: string;
  icon: React.ElementType;
  servicesRu: string[];
  servicesEn: string[];
}

const CLUSTER_NODES: ClusterNode[] = [
  { id: 'arrive', labelRu: 'ПРИЕХАТЬ', labelEn: 'ARRIVE', color: '#00D68F', icon: Plane, servicesRu: ['Трансферы', 'SIM-карты', 'Обмен валют'], servicesEn: ['Transfers', 'SIM Cards', 'Exchange'] },
  { id: 'live', labelRu: 'ЖИТЬ', labelEn: 'LIVE', color: '#4E7BFF', icon: Home, servicesRu: ['Рестораны', 'Уборка', 'Медицина'], servicesEn: ['Restaurants', 'Cleaning', 'Medical'] },
  { id: 'legal', labelRu: 'ЛЕГАЛЬНО', labelEn: 'STAY LEGAL', color: '#F59E0B', icon: Scale, servicesRu: ['Визы', 'Налоги', 'Договоры'], servicesEn: ['Visas', 'Taxes', 'Contracts'] },
  { id: 'invest', labelRu: 'КУПИТЬ', labelEn: 'INVEST', color: '#A855F7', icon: Building2, servicesRu: ['Поиск', 'Off-Plan', 'ROI'], servicesEn: ['Search', 'Off-Plan', 'ROI'] },
  { id: 'manage', labelRu: 'УПРАВЛЯТЬ', labelEn: 'MANAGE', color: '#06B6D4', icon: Calendar, servicesRu: ['Календарь', 'Финансы', 'Команда'], servicesEn: ['Calendar', 'Finance', 'Team'] },
  { id: 'build', labelRu: 'ДЕВЕЛОПЕРАМ', labelEn: 'BUILD', color: '#F43F5E', icon: HardHat, servicesRu: ['Продажи', 'Стройка', 'Аналитика'], servicesEn: ['Sales', 'Construction', 'Analytics'] },
];

const ROLE_FEATURES: Record<UserPersona, { titleRu: string; titleEn: string; bulletsRu: string[]; bulletsEn: string[] }> = {
  tourist: {
    titleRu: 'Ваш маршрут начинается здесь', titleEn: 'Your journey starts here',
    bulletsRu: ['Трансфер с аэропорта', 'SIM-карта', 'Обмен валют'],
    bulletsEn: ['Airport transfer', 'SIM card', 'Currency exchange'],
  },
  resident: {
    titleRu: 'Всё для жизни под рукой', titleEn: 'Everything for daily life',
    bulletsRu: ['Уборка и сервис', 'Медицина', 'Задачи и быт'],
    bulletsEn: ['Cleaning & services', 'Medical', 'Tasks & daily life'],
  },
  property_owner: {
    titleRu: 'Управляйте объектами из одного места', titleEn: 'Manage properties from one place',
    bulletsRu: ['Календарь бронирований', 'Финансы', 'Задачи клининга'],
    bulletsEn: ['Booking calendar', 'Finances', 'Cleaning tasks'],
  },
  investor: {
    titleRu: 'Данные для принятия решений', titleEn: 'Data-driven decisions',
    bulletsRu: ['Аналитика рынка', 'ROI калькулятор', 'Due Diligence AI'],
    bulletsEn: ['Market analytics', 'ROI calculator', 'Due Diligence AI'],
  },
  family: {
    titleRu: 'Всё для семьи на Пхукете', titleEn: 'Family life in Phuket',
    bulletsRu: ['Лучшие школы', 'Детские врачи', 'Активности для детей'],
    bulletsEn: ['Top schools', 'Pediatricians', 'Kids activities'],
  },
  couple: {
    titleRu: 'Романтика на острове', titleEn: 'Romance on the island',
    bulletsRu: ['Лучшие рестораны', 'Спа для двоих', 'Яхта на закате'],
    bulletsEn: ['Best restaurants', 'Couples spa', 'Sunset yacht'],
  },
  nightlife: {
    titleRu: 'Ночная жизнь Пхукета', titleEn: 'Phuket nightlife',
    bulletsRu: ['Топ клубы', 'VIP-столы', 'Бич-клабы'],
    bulletsEn: ['Top clubs', 'VIP tables', 'Beach clubs'],
  },
  active: {
    titleRu: 'Спорт и активный отдых', titleEn: 'Sports & active lifestyle',
    bulletsRu: ['Серфинг и дайвинг', 'Muay Thai', 'Фитнес-залы'],
    bulletsEn: ['Surfing & diving', 'Muay Thai', 'Fitness gyms'],
  },
  business: {
    titleRu: 'Бизнес на Пхукете', titleEn: 'Business in Phuket',
    bulletsRu: ['Юристы и бухгалтеры', 'Банковские счета', 'Коворкинги'],
    bulletsEn: ['Lawyers & accountants', 'Bank accounts', 'Coworking spaces'],
  },
  nomad: {
    titleRu: 'Цифровой кочевник', titleEn: 'Digital nomad life',
    bulletsRu: ['Коворкинги с WiFi', 'SIM и интернет', 'Долгосрочная аренда'],
    bulletsEn: ['Coworking with WiFi', 'SIM & internet', 'Long-term rentals'],
  },
  pet_owner: {
    titleRu: 'Ваш питомец в надёжных руках', titleEn: 'Your pet in safe hands',
    bulletsRu: ['Ветеринарные клиники', 'Груминг и отели', 'Перевозка питомцев'],
    bulletsEn: ['Vet clinics', 'Grooming & hotels', 'Pet transport'],
  },
  relocation: {
    titleRu: 'Переезд на Пхукет — пошагово', titleEn: 'Relocate to Phuket — step by step',
    bulletsRu: ['Визы и документы', 'Жильё и школы', 'Юрист и банки'],
    bulletsEn: ['Visas & documents', 'Housing & schools', 'Legal & banking'],
  },
};

const QUICK_WINS: Record<UserPersona, { titleRu: string; titleEn: string; descRu: string; descEn: string; icon: React.ElementType; path: string }> = {
  tourist: { titleRu: 'Забронировать трансфер', titleEn: 'Book a transfer', descRu: 'Из аэропорта до отеля', descEn: 'Airport to hotel', icon: Car, path: '/transport/airport-transfer' },
  resident: { titleRu: 'Заказать уборку', titleEn: 'Book cleaning', descRu: 'Профессиональный клининг', descEn: 'Professional cleaning', icon: Sparkles, path: '/cleaning' },
  property_owner: { titleRu: 'Добавить объект', titleEn: 'Add property', descRu: 'Начните управлять', descEn: 'Start managing', icon: Building2, path: '/owner' },
  investor: { titleRu: 'Открыть ROI калькулятор', titleEn: 'Open ROI Calculator', descRu: 'Рассчитайте доходность', descEn: 'Calculate returns', icon: BarChart3, path: '/invest' },
  family: { titleRu: 'Найти школу', titleEn: 'Find a school', descRu: 'Лучшие школы Пхукета', descEn: 'Best schools in Phuket', icon: Baby, path: '/education' },
  couple: { titleRu: 'Забронировать спа', titleEn: 'Book a spa', descRu: 'Спа для двоих', descEn: 'Couples spa experience', icon: Heart, path: '/beauty?category=spa' },
  nightlife: { titleRu: 'Топ клубы сегодня', titleEn: 'Top clubs tonight', descRu: 'Лучшие вечеринки', descEn: 'Best parties tonight', icon: Music, path: '/experiences?tag=nightlife' },
  active: { titleRu: 'Записаться на серфинг', titleEn: 'Book surfing', descRu: 'Уроки серфинга', descEn: 'Surf lessons', icon: Dumbbell, path: '/experiences?tag=surf' },
  business: { titleRu: 'Найти юриста', titleEn: 'Find a lawyer', descRu: 'Бизнес-юристы', descEn: 'Business lawyers', icon: Scale, path: '/legal' },
  nomad: { titleRu: 'Найти коворкинг', titleEn: 'Find coworking', descRu: 'С быстрым WiFi', descEn: 'With fast WiFi', icon: Laptop, path: '/services?category=coworking' },
  pet_owner: { titleRu: 'Найти ветеринара', titleEn: 'Find a vet', descRu: 'Лучшие клиники', descEn: 'Best clinics', icon: Shield, path: '/pets' },
  relocation: { titleRu: 'Бесплатная консультация', titleEn: 'Free consultation', descRu: 'Дорожная карта переезда', descEn: 'Relocation roadmap', icon: Globe, path: '/relocate' },
};

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? '100%' : '-100%', opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? '-100%' : '100%', opacity: 0 }),
};

function ProgressDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2 justify-center">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className="h-1.5 rounded-full transition-all duration-300"
          style={{
            width: i + 1 === current ? 24 : 6,
            background: i + 1 === current ? 'hsl(var(--primary))' : 'hsl(0 0% 100% / 0.15)',
          }}
        />
      ))}
    </div>
  );
}

function EcosystemDiagram({ isRu, expandedNode, onTapNode }: { isRu: boolean; expandedNode: string | null; onTapNode: (id: string) => void }) {
  const [counter, setCounter] = useState(0);

  useEffect(() => {
    let frame: number;
    let start: number | null = null;
    const duration = 1200;
    const animate = (ts: number) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      setCounter(Math.round(progress * 40));
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  const r = 110;
  const cx = 150;
  const cy = 140;

  return (
    <div className="relative flex flex-col items-center">
      <svg width={300} height={280} viewBox="0 0 300 280" className="mx-auto">
        {CLUSTER_NODES.map((node, i) => {
          const angle = (i * 60 - 90) * (Math.PI / 180);
          const nx = cx + r * Math.cos(angle);
          const ny = cy + r * Math.sin(angle);
          return (
            <motion.line
              key={node.id}
              x1={cx} y1={cy} x2={nx} y2={ny}
              stroke={node.color}
              strokeOpacity={0.3}
              strokeWidth={1.5}
              strokeDasharray="4 4"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ delay: 0.2 + i * 0.08, duration: 0.5 }}
            />
          );
        })}

        <motion.g
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          <circle cx={cx} cy={cy} r={28} fill="hsl(var(--primary) / 0.15)" />
          <circle cx={cx} cy={cy} r={22} fill="hsl(var(--primary) / 0.25)" />
          <text x={cx} y={cy - 5} textAnchor="middle" fill="hsl(var(--primary))" fontSize={10} fontWeight={700}>my</text>
          <text x={cx} y={cy + 9} textAnchor="middle" fill="hsl(var(--foreground))" fontSize={12} fontWeight={700}>UNO</text>
        </motion.g>

        {CLUSTER_NODES.map((node, i) => {
          const angle = (i * 60 - 90) * (Math.PI / 180);
          const nx = cx + r * Math.cos(angle);
          const ny = cy + r * Math.sin(angle);
          const Icon = node.icon;
          return (
            <motion.g
              key={node.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3 + i * 0.08, duration: 0.35, type: 'spring', stiffness: 300 }}
              style={{ cursor: 'pointer' }}
              onClick={() => onTapNode(node.id)}
            >
              <circle cx={nx} cy={ny} r={22} fill={node.color + '20'} stroke={node.color + '40'} strokeWidth={1} />
              <foreignObject x={nx - 10} y={ny - 10} width={20} height={20}>
                <div className="w-full h-full flex items-center justify-center">
                  <Icon style={{ width: 14, height: 14, color: node.color }} />
                </div>
              </foreignObject>
              <text x={nx} y={ny + 34} textAnchor="middle" fill={node.color} fontSize={8} fontWeight={600}>
                {isRu ? node.labelRu : node.labelEn}
              </text>
            </motion.g>
          );
        })}
      </svg>

      <AnimatePresence mode="wait">
        {expandedNode && (() => {
          const node = CLUSTER_NODES.find(n => n.id === expandedNode);
          if (!node) return null;
          return (
            <motion.div
              key={expandedNode}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-wrap gap-1.5 justify-center mt-1"
            >
              {(isRu ? node.servicesRu : node.servicesEn).map(s => (
                <span key={s} className="text-[11px] px-2.5 py-1 rounded-[var(--radius-full)] text-muted-foreground"
                  style={{ background: 'hsl(var(--bg-elevated))' }}
                >
                  {s}
                </span>
              ))}
            </motion.div>
          );
        })()}
      </AnimatePresence>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="text-center mt-3 text-sm text-muted-foreground"
      >
        <span className="text-2xl font-bold font-display text-primary">{counter}+</span>{' '}
        {isRu ? 'сервисов' : 'services'}
      </motion.p>
    </div>
  );
}

export const OnboardingModal = memo(forwardRef<HTMLDivElement, OnboardingModalProps>(
  function OnboardingModal({ open, onComplete }, ref) {
    const { language } = useLanguage();
    const { setPersonas } = useUserPersonas();
    const navigate = useNavigate();
    const isRu = language === 'ru';
    const [step, setStep] = useState<Step>(1);
    const [direction, setDirection] = useState(1);
    const [selectedPersona, setSelectedPersona] = useState<UserPersona | null>(null);
    const [expandedNode, setExpandedNode] = useState<string | null>(null);

    const goNext = useCallback(() => {
      if (step < 4) {
        setDirection(1);
        setStep(s => (s + 1) as Step);
      }
    }, [step]);

    const handleSelectPersona = useCallback((p: UserPersona) => {
      triggerHaptic('light');
      setSelectedPersona(p);
    }, []);

    const handleComplete = useCallback(() => {
      localStorage.setItem('myuno-onboarding-complete', 'true');
      sessionStorage.setItem('myuno-onboarding-complete', 'true');
      localStorage.setItem('myuno_onboarded', 'true');
      if (selectedPersona) {
        setPersonas([selectedPersona]);
      }
      onComplete();
    }, [onComplete, selectedPersona, setPersonas]);

    const handleQuickWin = useCallback(() => {
      handleComplete();
      const win = QUICK_WINS[selectedPersona || 'tourist'];
      navigate(win.path);
    }, [handleComplete, navigate, selectedPersona]);

    const handleSkip = useCallback(() => {
      localStorage.setItem('myuno-onboarding-complete', 'true');
      sessionStorage.setItem('myuno-onboarding-complete', 'true');
      localStorage.setItem('myuno_onboarded', 'true');
      onComplete();
    }, [onComplete]);

    if (!open) return null;

    const persona = selectedPersona || 'tourist';
    const features = ROLE_FEATURES[persona];
    const quickWin = QUICK_WINS[persona];
    const QuickWinIcon = quickWin.icon;

    return (
      <div
        ref={ref}
        className="fixed inset-0 z-[9999] flex flex-col"
        style={{ background: 'rgba(8,16,30,0.97)' }}
      >
        {/* Progress */}
        <div className="pt-[env(safe-area-inset-top,12px)] px-6 pb-3 pt-6 flex items-center justify-between">
          <ProgressDots current={step} total={4} />
          <button onClick={handleSkip} className="text-xs text-muted-foreground hover:text-foreground transition-colors min-h-[44px] flex items-center px-2">
            {isRu ? 'Пропустить' : 'Skip'}
          </button>
        </div>

        {/* Step content */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait" custom={direction}>
            {step === 1 && (
              <motion.div
                key="step1"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                className="px-6 py-4 flex flex-col items-center"
              >
                <h1 className="text-[26px] font-bold font-display text-foreground text-center leading-tight mb-2">
                  {isRu ? 'Добро пожаловать в myUNO' : 'Welcome to myUNO'}
                </h1>
                <p className="text-sm text-muted-foreground text-center mb-5">
                  {isRu ? 'Кто вы? Мы подберём сервисы для вас:' : 'Who are you? We\'ll tailor services for you:'}
                </p>

                {/* 10 personas in a 2-col grid (scrollable on smaller screens) */}
                <div className="grid grid-cols-2 gap-2.5 w-full max-w-sm">
                  {ALL_PERSONAS.map((p) => {
                    const info = PERSONA_INFO[p];
                    const isSelected = selectedPersona === p;
                    return (
                      <button
                        key={p}
                        onClick={() => handleSelectPersona(p)}
                        className={cn(
                          "relative flex items-center gap-3 p-3 rounded-[var(--radius-md)] transition-all duration-200 text-left",
                          isSelected
                            ? "scale-[1.02]"
                            : "hover:border-primary/40 active:scale-[0.97]"
                        )}
                        style={{
                          background: isSelected ? 'hsl(var(--primary) / 0.12)' : 'hsl(var(--card))',
                          border: `2px solid ${isSelected ? 'hsl(var(--primary))' : 'hsl(0 0% 100% / 0.07)'}`,
                        }}
                      >
                        <span className="text-[28px] leading-none shrink-0">{info.icon}</span>
                        <div className="min-w-0 flex-1">
                          <span className={cn("text-sm font-display font-semibold block", isSelected ? "text-primary" : "text-foreground")}>
                            {isRu ? info.labelRu : info.labelEn}
                          </span>
                          <span className="text-[11px] text-muted-foreground leading-tight block truncate">
                            {isRu ? info.descRu : info.descEn}
                          </span>
                        </div>
                        {isSelected && (
                          <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 text-primary-foreground" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                className="px-6 py-4 flex flex-col items-center"
              >
                <h2 className="text-xl font-bold font-display text-foreground text-center mb-1">
                  {isRu ? '6 направлений, 40+ сервисов' : '6 clusters, 40+ services'}
                </h2>
                <p className="text-sm text-muted-foreground text-center mb-4">
                  {isRu ? 'Всё связано в одну экосистему' : 'All connected in one ecosystem'}
                </p>
                <EcosystemDiagram isRu={isRu} expandedNode={expandedNode} onTapNode={(id) => setExpandedNode(prev => prev === id ? null : id)} />
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                className="px-6 py-8 flex flex-col items-center"
              >
                <h2 className="text-xl font-bold font-display text-foreground text-center mb-6">
                  {isRu ? features.titleRu : features.titleEn}
                </h2>
                <div className="w-full max-w-sm space-y-4">
                  {(isRu ? features.bulletsRu : features.bulletsEn).map((bullet, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + i * 0.1 }}
                      className="flex items-center gap-3"
                    >
                      <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                        <Check className="w-4 h-4 text-primary" />
                      </div>
                      <span className="text-sm text-foreground font-medium">{bullet}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="step4"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                className="px-6 py-8 flex flex-col items-center"
              >
                <h2 className="text-xl font-bold font-display text-foreground text-center mb-6">
                  {isRu ? 'Ваш первый шаг на Пхукете' : 'Your first step in Phuket'}
                </h2>

                <button
                  onClick={handleQuickWin}
                  className="w-full max-w-sm p-5 rounded-[var(--radius-lg)] text-left transition-all active:scale-[0.98]"
                  style={{
                    background: 'hsl(var(--primary) / 0.12)',
                    border: '1px solid hsl(var(--primary) / 0.3)',
                  }}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-[var(--radius-md)] bg-primary/20 flex items-center justify-center shrink-0">
                      <QuickWinIcon className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-display font-bold text-foreground mb-1">
                        {isRu ? quickWin.titleRu : quickWin.titleEn}
                      </h3>
                      <p className="text-[13px] text-muted-foreground">
                        {isRu ? quickWin.descRu : quickWin.descEn}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-center gap-2 text-sm font-semibold text-primary">
                    {isRu ? 'Открыть сейчас' : 'Open now'} <ChevronRight className="w-4 h-4" />
                  </div>
                </button>

                <button
                  onClick={handleComplete}
                  className="mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors min-h-[44px]"
                >
                  {isRu ? 'Изучу сам' : "I'll explore myself"}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom CTA */}
        {step < 4 && (
          <div className="px-6 pb-[env(safe-area-inset-bottom,16px)] pb-6">
            <Button
              className="w-full h-12 text-base font-semibold rounded-[var(--radius-md)]"
              onClick={goNext}
              disabled={step === 1 && !selectedPersona}
            >
              {step === 1 ? (isRu ? 'Продолжить' : 'Continue') :
               step === 2 ? (isRu ? 'Понятно, вперёд' : 'Got it, next') :
               (isRu ? 'Начать' : 'Start')}
              <ChevronRight className="w-5 h-5 ml-1" />
            </Button>
          </div>
        )}
      </div>
    );
  }
));

OnboardingModal.displayName = 'OnboardingModal';
