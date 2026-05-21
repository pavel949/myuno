/**
 * OnboardingFlow — friction-removal onboarding (4 sequential screens).
 *
 * Ported from the design handoff bundle (`onboarding.html`). Visual goal:
 * chaos → core → order. The user lands, sees their pain reflected back,
 * picks a destination, answers three questions, and walks away with a
 * personalised task map before they've signed up.
 *
 * Routing:
 *   /onboarding              → step 1 (welcome + animation)
 *   /onboarding/destination  → step 2
 *   /onboarding/questions    → step 3
 *   /onboarding/map          → step 4 (final, CTA → /auth?mode=signup)
 *
 * All step state is local; nothing is persisted yet. Once auth is wired
 * downstream this can pass `onboarding_role`, `onboarding_destination`,
 * etc. via the auth flow's `state` parameter.
 */
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
/* BrandWordmark is used on other screens; the welcome header uses the icon-mark per design spec */

// ── Shared phone-frame chrome ──────────────────────────────────────────

const StatusBar: React.FC = () => (
  <div className="onb-statusbar">
    <span>9:41</span>
    <div className="sb-r" aria-hidden>
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M2 22h4v-8H2v8zm6 0h4V10H8v12zm6 0h4V6h-4v16zm6 0h4V2h-4v20z" />
      </svg>
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M1 9l2 2a12.87 12.87 0 0 1 18 0l2-2A15.75 15.75 0 0 0 1 9z" />
      </svg>
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M17 4h2a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-2V4zM4 7h11v10H4z" />
      </svg>
    </div>
  </div>
);

interface PhoneShellProps {
  children: React.ReactNode;
  contentClassName?: string;
}
const PhoneShell: React.FC<PhoneShellProps> = ({ children, contentClassName }) => (
  <div className="onb-stage-frame">
    <div className="onb-phone">
      <div className="onb-phone-in">
        <StatusBar />
        <div className={`onb-phone-content ${contentClassName ?? ''}`}>{children}</div>
      </div>
    </div>
  </div>
);

// ── SCREEN 01 · WELCOME + ANIMATION ────────────────────────────────────

interface WelcomeProps {
  isRu: boolean;
  onSkip: () => void;
  onSignIn: () => void;
  onStart: () => void;
}
const WelcomeScreen: React.FC<WelcomeProps> = ({ isRu, onSkip, onSignIn, onStart }) => {
  const chaosCards = isRu
    ? [
        { cls: 'c1 alert', icon: 'doc',   title: 'Виза истекает',    lng: 'EN · 14 дн' },
        { cls: 'c2',       icon: 'baht',  title: 'Перевод ฿',         lng: 'RU → THB' },
        { cls: 'c3 alert', icon: 'pin',   title: 'Снять виллу',       lng: 'Layan' },
        { cls: 'c4',       icon: 'pulse', title: 'Доктор · RU',       lng: 'ภาษาไทย' },
        { cls: 'c5',       icon: 'pet',   title: 'Ввоз кота',         lng: 'Чип · TR' },
        { cls: 'c6 alert', icon: 'shield',title: 'TM30',              lng: 'Штраф ฿1.6K' },
      ]
    : [
        { cls: 'c1 alert', icon: 'doc',   title: 'Visa expires',      lng: 'EN · 14 d'  },
        { cls: 'c2',       icon: 'baht',  title: 'Transfer ฿',        lng: 'EN → THB'   },
        { cls: 'c3 alert', icon: 'pin',   title: 'Rent a villa',      lng: 'Layan'      },
        { cls: 'c4',       icon: 'pulse', title: 'Doctor · EN',       lng: 'ภาษาไทย'    },
        { cls: 'c5',       icon: 'pet',   title: 'Bring a cat',       lng: 'Chip · TR'  },
        { cls: 'c6 alert', icon: 'shield',title: 'TM30',              lng: '฿1.6K fine' },
      ];

  const phaseWords = isRu
    ? ['Десять задач. Шесть языков.', 'Один поток через myUNO.', 'Одна карта. Понятный следующий шаг.']
    : ['Ten tasks. Six languages.', 'One stream through myUNO.', 'One map. A clear next step.'];

  return (
    <div className="onb-welcome">
      <div className="onb-w-head">
        <div className="onb-w-mark">
          <svg width="22" height="22" viewBox="0 0 32 32" fill="none" aria-hidden>
            <rect width="32" height="32" rx="7" className="fill-primary" />
            <path d="M10 10v9.5a2.5 2.5 0 0 0 5 0V10" className="stroke-primary-foreground" strokeWidth="2" strokeLinecap="square" />
            <path d="M17 22V12.5a2.5 2.5 0 0 1 5 0V22" className="stroke-accent" strokeWidth="2" strokeLinecap="square" />
          </svg>
          <span>myUNO</span>
        </div>
        <button type="button" className="onb-w-skip" onClick={onSkip}>
          {isRu ? 'Пропустить' : 'Skip'}
        </button>
      </div>

      <div className="onb-w-stage">
        <div className="onb-phase-cap">
          <div className="l">
            Phuket · <b>{isRu ? 'иностранец' : 'foreigner'}</b>
          </div>
          <span className="dot" aria-hidden />
        </div>

        <div className="onb-w-anim" aria-hidden>
          {chaosCards.map((card) => (
            <div key={card.cls} className={`onb-chaos ${card.cls}`}>
              <div className="ic">
                <ChaosIcon kind={card.icon} />
              </div>
              <div>{card.title}</div>
              <div className="lng">{card.lng}</div>
            </div>
          ))}

          <div className="onb-core">
            <div className="onb-core-ring" />
            <div className="onb-core-mark">
              <svg viewBox="0 0 32 32" fill="none">
                <path d="M10 8v11a3 3 0 0 0 6 0V8" className="stroke-primary-foreground" strokeWidth="2.4" strokeLinecap="square" />
                <path d="M17 24V11a3 3 0 0 1 6 0V24" className="stroke-accent" strokeWidth="2.4" strokeLinecap="square" />
              </svg>
            </div>
          </div>

          <div className="onb-slots">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className={`onb-slot s${i}`} />
            ))}
          </div>
        </div>

        <div className="onb-phase-words" aria-hidden>
          <span className="pw1">{phaseWords[0]}</span>
          <span className="pw2">{phaseWords[1]}</span>
          <span className="pw3">{phaseWords[2]}</span>
        </div>
      </div>

      <div className="onb-w-foot">
        <h3>
          {isRu ? (
            <>
              Одно место для всего, <em>что важно</em> на острове.
            </>
          ) : (
            <>
              One place for everything <em>that matters</em> on the island.
            </>
          )}
        </h3>
        <p>
          {isRu
            ? 'Визы, банк, жильё, врачи, ввоз питомца, экстренная помощь — собрано, проверено, на вашем языке.'
            : 'Visas, banking, housing, doctors, pet relocation, emergency help — collected, verified, in your language.'}
        </p>
        <div className="onb-w-dots" aria-hidden>
          <span className="on" />
          <span />
          <span />
          <span />
        </div>
        <div className="cta">
          <button type="button" className="b1" onClick={onSignIn}>
            {isRu ? 'Войти' : 'Sign in'}
          </button>
          <button type="button" className="b2" onClick={onStart}>
            {isRu ? 'Начать · 90 сек' : 'Start · 90 sec'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Chaos card icons (line-art SVGs matching the prototype)
const ChaosIcon: React.FC<{ kind: string }> = ({ kind }) => {
  switch (kind) {
    case 'doc':    return (<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 10h18" /></svg>);
    case 'baht':   return (<svg viewBox="0 0 24 24"><path d="M12 2v20M17 6H9a3 3 0 0 0 0 6h6a3 3 0 0 1 0 6H6" /></svg>);
    case 'pin':    return (<svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>);
    case 'pulse':  return (<svg viewBox="0 0 24 24"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>);
    case 'pet':    return (<svg viewBox="0 0 24 24"><circle cx="5.5" cy="17.5" r="3.5" /><circle cx="18.5" cy="17.5" r="3.5" /><path d="M15 17l-3-9h7l-2 9" /></svg>);
    case 'shield': return (<svg viewBox="0 0 24 24"><path d="M12 22s-8-4.5-8-12V5l8-3 8 3v5c0 7.5-8 12-8 12z" /></svg>);
    default:       return null;
  }
};

// ── SCREEN 02 · DESTINATION + LANGUAGE ─────────────────────────────────

type DestinationId = 'phuket' | 'bali' | 'danang' | 'samui';
type LangCode = 'RU' | 'EN' | '中文' | 'DE' | 'МН';

interface DestinationProps {
  isRu: boolean;
  destination: DestinationId;
  onPickDestination: (id: DestinationId) => void;
  language: LangCode;
  onPickLanguage: (lng: LangCode) => void;
  onBack: () => void;
  onContinue: () => void;
}
const DestinationScreen: React.FC<DestinationProps> = ({
  isRu, destination, onPickDestination, language, onPickLanguage, onBack, onContinue,
}) => {
  const dests: Array<{ id: DestinationId; flag: 'amber' | 'teal' | 'dust' | ''; letter: string; ru: string; en: string; meta: string; live: boolean }> = [
    { id: 'phuket', flag: 'amber', letter: 'P', ru: 'Пхукет · Таиланд', en: 'Phuket · Thailand', meta: isRu ? 'Live · 11 вертикалей · ภาษาไทย' : 'Live · 11 verticals · ภาษาไทย', live: true },
    { id: 'bali',   flag: 'teal',  letter: 'B', ru: 'Бали · Индонезия', en: 'Bali · Indonesia', meta: isRu ? 'Soon · Q3 2026' : 'Soon · Q3 2026', live: false },
    { id: 'danang', flag: 'dust',  letter: 'D', ru: 'Дананг · Вьетнам', en: 'Da Nang · Vietnam', meta: isRu ? 'Soon · Q1 2027' : 'Soon · Q1 2027', live: false },
    { id: 'samui',  flag: '',      letter: 'S', ru: 'Самуи · Таиланд',  en: 'Samui · Thailand', meta: isRu ? 'Soon · Q2 2027' : 'Soon · Q2 2027', live: false },
  ];

  const langs: LangCode[] = ['RU', 'EN', '中文', 'DE', 'МН'];

  return (
    <>
      <div className="onb-q-prog">
        <span>01 / 03</span>
        <div className="bar"><span className="on" /><span /><span /></div>
      </div>
      <div className="onb-dest-h">
        {isRu ? <>Где будет <em>ваша база</em>?</> : <>Where is <em>your base</em>?</>}
      </div>
      <p className="onb-dest-sub">
        {isRu
          ? 'Платформа адаптируется под юрисдикцию: визы, банки, налоги, локальные сервисы. Можно выбрать несколько.'
          : 'The platform adapts to your jurisdiction: visas, banking, tax, local services. Multi-select supported.'}
      </p>

      <div className="onb-dest-list">
        {dests.map((d) => {
          const selected = destination === d.id;
          return (
            <button
              key={d.id}
              type="button"
              className={`onb-dest-row ${selected ? 'on' : ''} ${d.live ? '' : 'soon'}`.trim()}
              onClick={() => d.live && onPickDestination(d.id)}
              disabled={!d.live}
              aria-pressed={selected}
            >
              <div className={`onb-dest-flag ${d.flag}`}>{d.letter}</div>
              <div>
                <h6>{isRu ? d.ru : d.en}</h6>
                <div className="meta">{d.meta}</div>
              </div>
              <div className="dot" aria-hidden />
            </button>
          );
        })}
      </div>

      <div
        style={{
          marginTop: 16,
          fontSize: 10,
          fontFamily: 'var(--font-mono)',
          color: 'var(--uno-subtle)',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}
      >
        {isRu ? 'Язык интерфейса' : 'Interface language'}
      </div>
      <div className="onb-lang-strip" role="radiogroup" aria-label={isRu ? 'Язык' : 'Language'}>
        {langs.map((lng) => (
          <button
            key={lng}
            type="button"
            role="radio"
            aria-checked={language === lng}
            className={`lng ${language === lng ? 'on' : ''}`.trim()}
            onClick={() => onPickLanguage(lng)}
          >
            {lng}
          </button>
        ))}
      </div>

      <div className="onb-q-foot">
        <button type="button" className="qb qb1" onClick={onBack}>
          {isRu ? 'Назад' : 'Back'}
        </button>
        <button type="button" className="qb qb2" onClick={onContinue}>
          {isRu ? 'Продолжить →' : 'Continue →'}
        </button>
      </div>
    </>
  );
};

// ── SCREEN 03 · THREE-QUESTION CONCIERGE ───────────────────────────────

type StatusId = 'looking' | 'living' | 'owning' | 'operating' | 'visiting';

interface QuestionsProps {
  isRu: boolean;
  status: StatusId;
  onPickStatus: (s: StatusId) => void;
  onBack: () => void;
  onContinue: () => void;
}
const QuestionsScreen: React.FC<QuestionsProps> = ({ isRu, status, onPickStatus, onBack, onContinue }) => {
  const opts: Array<{ id: StatusId; ru: string; ruDesc: string; en: string; enDesc: string; icon: React.ReactNode }> = [
    {
      id: 'looking',
      ru: 'Только присматриваюсь',
      ruDesc: 'Ещё не приехал · собираю информацию',
      en: 'Just exploring',
      enDesc: 'Not on the island yet · gathering info',
      icon: (
        <svg viewBox="0 0 24 24">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="7.5 4.21 12 6.81 16.5 4.21" />
        </svg>
      ),
    },
    {
      id: 'living',
      ru: 'Живу или скоро переезжаю',
      ruDesc: 'DTV · Non-B · LTR · Elite',
      en: 'Living or moving soon',
      enDesc: 'DTV · Non-B · LTR · Elite',
      icon: (
        <svg viewBox="0 0 24 24">
          <path d="M3 10l9-7 9 7v10a2 2 0 0 1-2 2h-4v-7h-6v7H5a2 2 0 0 1-2-2z" />
        </svg>
      ),
    },
    {
      id: 'owning',
      ru: 'Покупаю или владею',
      ruDesc: 'Off-plan · resale · land · сделка',
      en: 'Buying or owning',
      enDesc: 'Off-plan · resale · land · deal',
      icon: (
        <svg viewBox="0 0 24 24">
          <path d="M3 17l6-6 4 4 8-8" />
          <path d="M21 7h-6M21 7v6" />
        </svg>
      ),
    },
    {
      id: 'operating',
      ru: 'Сдаю и управляю',
      ruDesc: 'Оператор · владелец-арендодатель',
      en: 'Renting out & managing',
      enDesc: 'Operator · owner-landlord',
      icon: (
        <svg viewBox="0 0 24 24">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 22c0-4 4-7 8-7s8 3 8 7" />
        </svg>
      ),
    },
    {
      id: 'visiting',
      ru: 'Прилетаю на 1–6 месяцев',
      ruDesc: 'Snowbird · sport · medical · wedding',
      en: 'Visiting for 1–6 months',
      enDesc: 'Snowbird · sport · medical · wedding',
      icon: (
        <svg viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
    },
  ];

  return (
    <>
      <div className="onb-q-head">
        <div className="onb-q-prog">
          <span>02 / 03</span>
          <div className="bar"><span className="on" /><span className="on" /><span /></div>
        </div>
        <h2 className="onb-q-h">
          {isRu ? <>Что у вас <em>сейчас</em> на Пхукете?</> : <>What's <em>your situation</em> on Phuket?</>}
        </h2>
        <p className="onb-q-hint">
          {isRu ? 'Один вариант · можно сменить в Профиле' : 'Single choice · changeable in Profile'}
        </p>
      </div>

      <div className="onb-q-options" role="radiogroup">
        {opts.map((o) => {
          const on = status === o.id;
          return (
            <button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={on}
              className={`onb-q-opt ${on ? 'on' : ''}`.trim()}
              onClick={() => onPickStatus(o.id)}
            >
              <div className="qi">{o.icon}</div>
              <div>
                <h6>{isRu ? o.ru : o.en}</h6>
                <p>{isRu ? o.ruDesc : o.enDesc}</p>
              </div>
              <div className="check" aria-hidden />
            </button>
          );
        })}
      </div>

      <div className="onb-q-foot">
        <button type="button" className="qb qb1" onClick={onBack}>
          {isRu ? 'Назад' : 'Back'}
        </button>
        <button type="button" className="qb qb2" onClick={onContinue}>
          {isRu ? 'Продолжить →' : 'Continue →'}
        </button>
      </div>
    </>
  );
};

// ── SCREEN 04 · PERSONALIZED MAP REVEAL ────────────────────────────────

interface MapRevealProps {
  isRu: boolean;
  onOpen: () => void;
}
const MapRevealScreen: React.FC<MapRevealProps> = ({ isRu, onOpen }) => {
  const tasks = isRu
    ? [
        { n: '01', title: 'Продлить DTV',         meta: 'Срок · 14 дней · 2 варианта',     tag: 'Сегодня',     tone: 'urgent' as const },
        { n: '02', title: 'Открыть SCB-счёт',     meta: 'Запись на этой неделе',           tag: 'Эта неделя',   tone: undefined },
        { n: '03', title: 'TM30 авто-уведомления',meta: 'Привяжу к адресу Layan',          tag: '2 мин',        tone: 'ok' as const },
        { n: '04', title: 'Pet-friendly жильё',   meta: '3 виллы по фильтру · кот',        tag: 'Обзор',        tone: undefined },
        { n: '05', title: 'Страховка на 12 мес',  meta: 'Cigna · BUPA · сравнение',        tag: 'Позже',        tone: undefined },
      ]
    : [
        { n: '01', title: 'Extend DTV',           meta: '14 days left · 2 routes',         tag: 'Today',        tone: 'urgent' as const },
        { n: '02', title: 'Open SCB account',     meta: 'Booking this week',               tag: 'This week',    tone: undefined },
        { n: '03', title: 'TM30 auto-alerts',     meta: 'Tied to your Layan address',      tag: '2 min',        tone: 'ok' as const },
        { n: '04', title: 'Pet-friendly housing', meta: '3 villas · cat-filter applied',   tag: 'Browse',       tone: undefined },
        { n: '05', title: '12-month insurance',   meta: 'Cigna · BUPA · side-by-side',     tag: 'Later',        tone: undefined },
      ];

  const trust = isRu
    ? ['Омбудсмен · Москва', 'ClearView verified', 'RU · EN · 中文 · DE', 'SOS 24/7']
    : ['Ombudsman · Moscow', 'ClearView verified', 'RU · EN · 中文 · DE', 'SOS 24/7'];

  return (
    <>
      <div className="onb-q-prog">
        <span>{isRu ? '03 / 03 · Готово' : '03 / 03 · Done'}</span>
        <div className="bar"><span className="on" /><span className="on" /><span className="on" /></div>
      </div>
      <div className="onb-dest-h" style={{ marginTop: 8 }}>
        {isRu ? <>Собрал план <em>под вас</em>.</> : <>I built a plan <em>for you</em>.</>}
      </div>
      <p className="onb-dest-sub" style={{ marginBottom: 4 }}>
        {isRu
          ? 'DTV · Layan · 148 дней до ресета. Срочное — наверху.'
          : 'DTV · Layan · 148 days to reset. Urgent first.'}
      </p>

      <div className="onb-rev-banner" style={{ marginTop: 14 }}>
        <div className="u">U</div>
        <div>
          <div className="lb">{isRu ? 'UNO · Концьерж' : 'UNO · Concierge'}</div>
          <h6>
            {isRu
              ? 'Виза 14 дней — нашёл два пути продления. Параллельно открою банковский счёт и поставлю TM30 на авто-пилот.'
              : 'Visa expires in 14 days — I found two extension routes. In parallel I\'ll open your bank account and put TM30 on auto-pilot.'}
          </h6>
        </div>
      </div>

      <div className="onb-rev-list">
        {tasks.map((t) => (
          <div key={t.n} className="onb-rev-item">
            <div className="n">{t.n}</div>
            <div>
              <h6>{t.title}</h6>
              <p>{t.meta}</p>
            </div>
            <span className={`tag ${t.tone ?? ''}`.trim()}>{t.tag}</span>
          </div>
        ))}
      </div>

      <div className="onb-rev-trust" aria-hidden>
        {trust.map((t) => (
          <div key={t}>{t}</div>
        ))}
      </div>

      <div className="onb-rev-cta">
        <button type="button" onClick={onOpen}>
          {isRu ? 'Открыть мою карту →' : 'Open my map →'}
        </button>
      </div>
    </>
  );
};

// ── ORCHESTRATOR ───────────────────────────────────────────────────────

type Step = 'welcome' | 'destination' | 'questions' | 'map';

interface OnboardingFlowProps {
  /** Override the starting step (route-driven) */
  initialStep?: Step;
}

export default function OnboardingFlow({ initialStep = 'welcome' }: OnboardingFlowProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>(initialStep);
  const [destination, setDestination] = useState<DestinationId>('phuket');
  const [lang, setLang] = useState<LangCode>(isRu ? 'RU' : 'EN');
  const [status, setStatus] = useState<StatusId>('living');

  // Navigation helpers — keep URL in sync so deep-linking still works
  const go = (next: Step) => {
    setStep(next);
    navigate(stepRoute(next), { replace: false });
  };

  const goSignup = () => navigate('/auth?mode=signup');
  const goSignin = () => navigate('/auth');

  return (
    <div className="onboarding-scope" data-testid="onboarding-flow" data-step={step}>
      {step === 'welcome' && (
        <PhoneShell>
          <WelcomeScreen
            isRu={isRu}
            onSkip={goSignup}
            onSignIn={goSignin}
            onStart={() => go('destination')}
          />
        </PhoneShell>
      )}

      {step === 'destination' && (
        <PhoneShell>
          <DestinationScreen
            isRu={isRu}
            destination={destination}
            onPickDestination={setDestination}
            language={lang}
            onPickLanguage={setLang}
            onBack={() => go('welcome')}
            onContinue={() => go('questions')}
          />
        </PhoneShell>
      )}

      {step === 'questions' && (
        <PhoneShell>
          <QuestionsScreen
            isRu={isRu}
            status={status}
            onPickStatus={setStatus}
            onBack={() => go('destination')}
            onContinue={() => go('map')}
          />
        </PhoneShell>
      )}

      {step === 'map' && (
        <PhoneShell>
          <MapRevealScreen isRu={isRu} onOpen={goSignup} />
        </PhoneShell>
      )}

      {/* Tiny accessibility helper: lets keyboard users escape mid-flow */}
      <div style={{ position: 'fixed', bottom: 8, right: 12, zIndex: 50 }}>
        <Link
          to="/"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            color: 'var(--uno-subtle)',
            textDecoration: 'none',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          {isRu ? '× Закрыть' : '× Close'}
        </Link>
      </div>
    </div>
  );
}

function stepRoute(s: Step): string {
  switch (s) {
    case 'welcome':     return '/onboarding';
    case 'destination': return '/onboarding/destination';
    case 'questions':   return '/onboarding/questions';
    case 'map':         return '/onboarding/map';
  }
}
