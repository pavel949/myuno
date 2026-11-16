import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, BedDouble, Building2, Home, ListPlus, ShieldCheck, Wrench } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { SEOHead } from '@/components/seo/SEOHead';
import { useLanguage } from '@/contexts/LanguageContext';
import { pickLang } from '@/lib/i18n/pickLang';
import { APP_ROUTES as R } from '@/lib/config/routes';
import { GOAL_ENTRIES, GOAL_ORDER, type GoalId } from '@/lib/nav/goalEntries';
import { cn } from '@/lib/utils';

const goalIcons: Record<GoalId, typeof BedDouble> = {
  stay: BedDouble,
  live: Home,
  buy: Building2,
  services: Wrench,
};

export default function DiscoveryHubPage() {
  const { language } = useLanguage();
  const [searchParams] = useSearchParams();
  const t = (value: { en: string; ru: string; th: string }) => pickLang(language, value);

  // Preserve old service-search URLs while making the clean /discover route an intent hub.
  const hasServiceQuery = ['category', 'q', 'provider', 'ref'].some((key) => searchParams.has(key));
  if (hasServiceQuery) {
    return <Navigate to={`${R.GOAL_SERVICES}?${searchParams.toString()}`} replace />;
  }

  return (
    <AppLayout title={t({ en: 'What are you looking for?', ru: 'Что вы ищете?', th: 'คุณกำลังมองหาอะไร' })} usePageContainer={false}>
      <SEOHead
        title={t({ en: 'Find your next step in Phuket', ru: 'Найдите следующий шаг на Пхукете', th: 'ค้นหาสิ่งที่คุณต้องการในภูเก็ต' })}
        description={t({ en: 'Choose a clear path for a home, property purchase, relocation or local service.', ru: 'Выберите понятный путь: жильё, покупка недвижимости, переезд или услуга.', th: 'เลือกเส้นทางที่ชัดเจนสำหรับที่พัก การซื้ออสังหาริมทรัพย์ การย้ายถิ่น หรือบริการท้องถิ่น' })}
      />
      <section className="mx-auto w-full max-w-[var(--layout-width-journey)] px-[var(--layout-gutter)] py-8 sm:py-12" aria-labelledby="discovery-hub-title">
        <header className="mb-8 max-w-[var(--layout-width-article)] sm:mb-10">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">myUNO · Discovery</p>
          <h1 id="discovery-hub-title" className="text-4xl font-semibold tracking-tight text-foreground sm:text-6xl">
            {t({ en: 'Start with your goal', ru: 'Начните с вашей задачи', th: 'เริ่มจากเป้าหมายของคุณ' })}
          </h1>
          <p className="mt-4 max-w-[var(--layout-width-form)] text-base leading-7 text-muted-foreground sm:text-lg">
            {t({ en: 'We will take you to the right catalogue — not a mixed marketplace. Choose what you need first.', ru: 'Мы сразу направим вас в нужный каталог — без смешения всего в одном marketplace. Сначала выберите задачу.', th: 'เราจะพาคุณไปยังแคตตาล็อกที่ถูกต้อง ไม่ใช่ตลาดรวมที่สับสน เลือกสิ่งที่ต้องการก่อน' })}
          </p>
        </header>

        <section aria-labelledby="discovery-goals-title">
          <h2 id="discovery-goals-title" className="sr-only">{t({ en: 'Goals', ru: 'Задачи', th: 'เป้าหมาย' })}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {GOAL_ORDER.map((goal) => {
              const entry = GOAL_ENTRIES[goal];
              const Icon = goalIcons[goal];
              return (
                <Link
                  key={goal}
                  to={entry.path}
                  className={cn(
                    'group flex min-h-40 items-start gap-4 border border-border bg-card p-5 transition-colors hover:border-primary hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:min-h-48 sm:p-6',
                    goal === 'stay' && 'sm:col-span-2',
                  )}
                >
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon size={25} aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xl font-semibold text-foreground">{t({ en: entry.en, ru: entry.ru, th: entry.th })}</span>
                    <span className="mt-2 block max-w-[var(--layout-width-form)] text-sm leading-6 text-muted-foreground">{t({ en: entry.leadEn, ru: entry.leadRu, th: entry.leadTh })}</span>
                    <span className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary">
                      {t({ en: goal === 'stay' ? 'Browse homes' : 'Open this path', ru: goal === 'stay' ? 'Выбрать жильё' : 'Открыть раздел', th: goal === 'stay' ? 'เลือกที่พัก' : 'เปิดส่วนนี้' })}
                      <ArrowRight size={16} aria-hidden="true" className="transition-transform group-hover:translate-x-1" />
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="mt-8 grid gap-4 border-t border-border pt-8 sm:grid-cols-2" aria-labelledby="discovery-other-title">
          <h2 id="discovery-other-title" className="sr-only">{t({ en: 'Other paths', ru: 'Другие задачи', th: 'เส้นทางอื่น' })}</h2>
          <Link to={R.SELL} className="group flex min-h-28 items-center gap-4 border border-dashed border-border p-5 hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <ListPlus size={22} className="shrink-0 text-primary" aria-hidden="true" />
            <span className="min-w-0 flex-1">
              <span className="block font-semibold text-foreground">{t({ en: 'Sell or rent out a property', ru: 'Продать или сдать объект', th: 'ขายหรือปล่อยเช่าอสังหาริมทรัพย์' })}</span>
              <span className="mt-1 block text-sm text-muted-foreground">{t({ en: 'List a property or ask the team for a plan.', ru: 'Разместите объект или получите план от команды.', th: 'ลงประกาศหรือขอคำแนะนำจากทีมงาน' })}</span>
            </span>
            <ArrowRight size={18} className="shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </Link>
          <Link to={R.DISCOVER_SITUATIONS} className="group flex min-h-28 items-center gap-4 border border-dashed border-border p-5 hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <ShieldCheck size={22} className="shrink-0 text-primary" aria-hidden="true" />
            <span className="min-w-0 flex-1">
              <span className="block font-semibold text-foreground">{t({ en: 'Not sure where to start?', ru: 'Не знаете, с чего начать?', th: 'ไม่แน่ใจว่าจะเริ่มอย่างไร' })}</span>
              <span className="mt-1 block text-sm text-muted-foreground">{t({ en: 'Tell us your situation and get guided help.', ru: 'Расскажите о ситуации — мы подскажем путь.', th: 'บอกสถานการณ์ของคุณเพื่อรับคำแนะนำ' })}</span>
            </span>
            <ArrowRight size={18} className="shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </Link>
        </section>
      </section>
    </AppLayout>
  );
}
