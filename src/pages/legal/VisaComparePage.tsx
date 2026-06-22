import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { BackButton } from '@/components/uno/BackButton';
import { Button } from '@/components/ui/button';
import { SEOHead } from '@/components/seo';
import { useLanguage } from '@/contexts/LanguageContext';
import { APP_ROUTES } from '@/lib/config/routes';
import { cn } from '@/lib/utils';
import { ConciergeHelpCTA } from '@/components/concierge/ConciergeHelpCTA';

type Nationality = 'cis' | 'western' | 'other';
type Purpose = 'remote' | 'local_job' | 'retire' | 'study' | 'tourism';
type Horizon = 'u3' | '3_12' | '12p';
type Family = 'yes' | 'no';

interface VisaOption {
  id: string;
  titleRu: string;
  titleEn: string;
  titleTh: string;
  score: number;
  fitRu: string;
  fitEn: string;
  fitTh: string;
  caveatsRu: string;
  caveatsEn: string;
  caveatsTh: string;
}

function scoreOptions(input: { nationality: Nationality; purpose: Purpose; horizon: Horizon; family: Family }): VisaOption[] {
  const { nationality, purpose, horizon, family } = input;
  const opts: VisaOption[] = [
    {
      id: 'dtv',
      titleRu: 'DTV (удалёнка)',
      titleEn: 'DTV (remote)',
      titleTh: 'DTV (ทำงานทางไกล)',
      score: 0,
      fitRu: 'Удалённая работа за рубежом, длительные визиты без тайского работодателя.',
      fitEn: 'Remote employment abroad, longer stays without a Thai employer.',
      fitTh: 'ทำงานทางไกลให้นายจ้างต่างประเทศ พำนักระยะยาวโดยไม่ต้องมีนายจ้างในไทย',
      caveatsRu: 'Нужны подтверждения дохода/работодателя; не для работы в Таиланде.',
      caveatsEn: 'Proof of income/employer required; not for working inside Thailand.',
      caveatsTh: 'ต้องมีหลักฐานรายได้/นายจ้าง ใช้ทำงานในประเทศไทยไม่ได้',
    },
    {
      id: 'ed',
      titleRu: 'ED (учёба)',
      titleEn: 'ED (education)',
      titleTh: 'ED (เพื่อการศึกษา)',
      score: 0,
      fitRu: 'Очное или языковое обучение в аккредитованной школе.',
      fitEn: 'Full-time or language study at a legitimate school.',
      fitTh: 'เรียนเต็มเวลาหรือเรียนภาษาในสถาบันที่ได้รับการรับรอง',
      caveatsRu: 'Нужна реальная учёба; проверки посещаемости.',
      caveatsEn: 'Must attend classes; attendance checks.',
      caveatsTh: 'ต้องเข้าเรียนจริง และมีการตรวจสอบการเข้าเรียน',
    },
    {
      id: 'nonb',
      titleRu: 'Non-Immigrant B + WP',
      titleEn: 'Non-B + work permit',
      titleTh: 'Non-B + ใบอนุญาตทำงาน',
      score: 0,
      fitRu: 'Официальная работа в Таиланде.',
      fitEn: 'Onshore employment in Thailand.',
      fitTh: 'ทำงานอย่างถูกต้องตามกฎหมายในประเทศไทย',
      caveatsRu: 'Работодатель и work permit; сроки зависят от компании.',
      caveatsEn: 'Employer + work permit; timelines depend on the company.',
      caveatsTh: 'ต้องมีนายจ้างและใบอนุญาตทำงาน ระยะเวลาขึ้นอยู่กับบริษัท',
    },
    {
      id: 'tourist',
      titleRu: 'Туризм / exemption',
      titleEn: 'Tourist / exemption',
      titleTh: 'ท่องเที่ยว / ยกเว้นวีซ่า',
      score: 0,
      fitRu: 'Короткие поездки и разведка перед переездом.',
      fitEn: 'Short trips and scouting before committing.',
      fitTh: 'การเดินทางระยะสั้นและสำรวจพื้นที่ก่อนตัดสินใจย้าย',
      caveatsRu: 'Не заменяет статус для жизни 6–12+ месяцев.',
      caveatsEn: 'Not a substitute for 6–12+ month living status.',
      caveatsTh: 'ไม่สามารถใช้แทนสถานะสำหรับการพำนัก 6–12 เดือนขึ้นไป',
    },
    {
      id: 'elite',
      titleRu: 'Thailand Elite / премиум',
      titleEn: 'Thailand Elite / premium',
      titleTh: 'Thailand Elite / พรีเมียม',
      score: 0,
      fitRu: 'Длинные визиты при готовности платить премию за простоту.',
      fitEn: 'Long visits when you prioritise convenience over cost.',
      fitTh: 'การพำนักระยะยาวเมื่อให้ความสำคัญกับความสะดวกมากกว่าค่าใช้จ่าย',
      caveatsRu: 'Высокая стоимость; правила программы меняются.',
      caveatsEn: 'Higher cost; programme rules change over time.',
      caveatsTh: 'ค่าใช้จ่ายสูง และกฎของโครงการมีการเปลี่ยนแปลงเป็นระยะ',
    },
    {
      id: 'ltr_retire',
      titleRu: 'LTR / пенсионная (если подходите)',
      titleEn: 'LTR / retirement (if eligible)',
      titleTh: 'LTR / วีซ่าเกษียณ (หากมีคุณสมบัติ)',
      score: 0,
      fitRu: 'Долгосрок при выполнении финансовых/возрастных критериев.',
      fitEn: 'Long-term when financial/age thresholds are met.',
      fitTh: 'พำนักระยะยาวเมื่อผ่านเกณฑ์ด้านการเงิน/อายุ',
      caveatsRu: 'Строгие критерии; нужна проверка с юристом.',
      caveatsEn: 'Strict criteria; confirm with counsel.',
      caveatsTh: 'เกณฑ์เข้มงวด ควรตรวจสอบกับทนายความ',
    },
  ];

  const bump = (id: string, n: number) => {
    const o = opts.find((x) => x.id === id);
    if (o) o.score += n;
  };

  if (purpose === 'remote') bump('dtv', 4);
  if (nationality === 'cis' && purpose === 'remote') bump('dtv', 1);
  if (purpose === 'local_job') bump('nonb', 5);
  if (purpose === 'study') bump('ed', 5);
  if (purpose === 'retire') bump('ltr_retire', 4);
  if (purpose === 'tourism') bump('tourist', 4);

  if (horizon === 'u3') bump('tourist', 2);
  if (horizon === '3_12') {
    bump('dtv', 2);
    bump('ed', 2);
    bump('nonb', 1);
  }
  if (horizon === '12p') {
    bump('dtv', 2);
    bump('nonb', 2);
    bump('ltr_retire', 2);
    bump('elite', 1);
  }

  if (family === 'yes') {
    bump('nonb', 1);
    bump('ed', 1);
    bump('ltr_retire', 1);
  }

  bump('elite', 1); // baseline visibility

  return opts.sort((a, b) => b.score - a.score);
}

export default function VisaComparePage() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const isTh = language === 'th';
  const [nationality, setNationality] = useState<Nationality>('cis');
  const [purpose, setPurpose] = useState<Purpose>('remote');
  const [horizon, setHorizon] = useState<Horizon>('3_12');
  const [family, setFamily] = useState<Family>('no');

  const ranked = useMemo(
    () => scoreOptions({ nationality, purpose, horizon, family }),
    [nationality, purpose, horizon, family],
  );

  const title = isRu ? 'Какая виза на Пхукет?' : isTh ? 'วีซ่าแบบไหนเหมาะกับภูเก็ต?' : 'Which Phuket visa fits?';
  const description = isRu
    ? 'Быстрый decision tree: не юридическая консультация, а ориентир для разговора с юристом.'
    : isTh
    ? 'แผนผังการตัดสินใจอย่างรวดเร็ว ไม่ใช่คำปรึกษาทางกฎหมาย ใช้เป็นแนวทางในการพูดคุยกับทนายความ'
    : 'Fast decision tree — not legal advice; use it to brief your lawyer.';

  const chip = (active: boolean, onClick: () => void, label: string) => (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'px-3 py-2 rounded-full text-xs border transition-colors',
        active ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:text-foreground',
      )}
    >
      {label}
    </button>
  );

  return (
    <AppLayout>
      <SEOHead title={title} description={description} url="https://www.myuno.app/visa/compare" />
      <div className="px-4 pb-28 pt-4 max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-4">
          <BackButton fallbackPath={APP_ROUTES.VISA_IMMIGRATION} variant="ghost" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>

        <section className="mt-6 space-y-5 rounded-none border border-border bg-card p-4">
          <div>
            <p className="text-xs font-semibold uppercase text-muted-foreground">{isRu ? 'Паспорт / регион' : isTh ? 'หนังสือเดินทาง / ภูมิภาค' : 'Passport / region'}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {chip(nationality === 'cis', () => setNationality('cis'), isRu ? 'СНГ' : isTh ? 'CIS' : 'CIS')}
              {chip(nationality === 'western', () => setNationality('western'), isRu ? 'EU / US / UK' : 'EU / US / UK')}
              {chip(nationality === 'other', () => setNationality('other'), isRu ? 'Другое' : isTh ? 'อื่น ๆ' : 'Other')}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-muted-foreground">{isRu ? 'Цель' : isTh ? 'วัตถุประสงค์หลัก' : 'Primary goal'}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {chip(purpose === 'remote', () => setPurpose('remote'), isRu ? 'Удалёнка' : isTh ? 'ทำงานทางไกล' : 'Remote work')}
              {chip(purpose === 'local_job', () => setPurpose('local_job'), isRu ? 'Работа в TH' : isTh ? 'ทำงานในไทย' : 'Job in TH')}
              {chip(purpose === 'retire', () => setPurpose('retire'), isRu ? 'Пенсия' : isTh ? 'เกษียณ' : 'Retire')}
              {chip(purpose === 'study', () => setPurpose('study'), isRu ? 'Учёба' : isTh ? 'เรียน' : 'Study')}
              {chip(purpose === 'tourism', () => setPurpose('tourism'), isRu ? 'Туризм' : isTh ? 'ท่องเที่ยว' : 'Tourism')}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-muted-foreground">{isRu ? 'Горизонт' : isTh ? 'ระยะเวลาพำนัก' : 'Stay horizon'}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {chip(horizon === 'u3', () => setHorizon('u3'), '<3 mo')}
              {chip(horizon === '3_12', () => setHorizon('3_12'), '3–12 mo')}
              {chip(horizon === '12p', () => setHorizon('12p'), '12+ mo')}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-muted-foreground">{isRu ? 'Семья' : isTh ? 'ครอบครัว' : 'Family'}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {chip(family === 'no', () => setFamily('no'), isRu ? 'Без детей' : isTh ? 'ไม่มีบุตร' : 'No kids')}
              {chip(family === 'yes', () => setFamily('yes'), isRu ? 'С детьми' : isTh ? 'มีบุตร' : 'With kids')}
            </div>
          </div>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-lg font-semibold text-foreground">{isRu ? 'Рекомендованный порядок изучения' : isTh ? 'ลำดับที่แนะนำให้พิจารณา' : 'Suggested order to explore'}</h2>
          {ranked.map((v, idx) => (
            <div key={v.id} className="rounded-none border border-border bg-card p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[10px] font-bold text-muted-foreground">#{idx + 1}</p>
                <span className="text-[10px] font-mono text-muted-foreground">score {v.score}</span>
              </div>
              <h3 className="text-base font-semibold text-foreground mt-1">{isRu ? v.titleRu : isTh ? v.titleTh : v.titleEn}</h3>
              <p className="text-xs text-foreground mt-2">{isRu ? v.fitRu : isTh ? v.fitTh : v.fitEn}</p>
              <p className="text-xs text-destructive/90 mt-2">{isRu ? v.caveatsRu : isTh ? v.caveatsTh : v.caveatsEn}</p>
            </div>
          ))}
        </section>

        <div className="mt-8 flex flex-col gap-2">
          <Button asChild>
            <Link to={APP_ROUTES.RELOCATION_GUIDE('visa-overview')}>{isRu ? 'Читать гайд по визам' : isTh ? 'อ่านคู่มือภาพรวมวีซ่า' : 'Read visa overview guide'}</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to={APP_ROUTES.VISA_IMMIGRATION}>{isRu ? 'Все визовые сервисы' : isTh ? 'บริการด้านวีซ่าทั้งหมด' : 'All visa services'}</Link>
          </Button>
        </div>

        <div className="mt-6">
          <ConciergeHelpCTA topic="visa" variant="card" />
        </div>
      </div>
    </AppLayout>
  );
}
