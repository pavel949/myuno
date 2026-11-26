import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, BedDouble, Building2, Home, ListPlus, ShieldCheck, Wrench } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { SEOHead } from '@/components/seo/SEOHead';
import { useLanguage } from '@/contexts/LanguageContext';
import { pickLang } from '@/lib/i18n/pickLang';
import { APP_ROUTES as R } from '@/lib/config/routes';
import { GOAL_ENTRIES, GOAL_ORDER, type GoalId } from '@/lib/nav/goalEntries';
import { MarketplaceEntry } from '@/components/landing/MarketplaceEntry';
import { MarketplaceDiscoveryMenu } from '@/components/services/MarketplaceDiscoveryMenu';
import { PUBLIC_CONTENT_LAYOUT } from '@/design-system/ecosystemLayout';

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
      <section className={`${PUBLIC_CONTENT_LAYOUT.catalogue} marketplace-page`} aria-labelledby="discovery-hub-title">
        <MarketplaceEntry kind="discovery" headingId="discovery-hub-title" />
        <MarketplaceDiscoveryMenu title={t({ en: 'Choose your next step', ru: 'Выберите направление', th: 'เลือกสิ่งที่ต้องการ' })}
          items={GOAL_ORDER.map(goal => { const entry = GOAL_ENTRIES[goal]; return {
            id: goal, href: entry.path, icon: goalIcons[goal], label: t(entry),
            description: t({ en: entry.leadEn, ru: entry.leadRu, th: entry.leadTh }),
          }; })} />

        <section className="mt-8 grid gap-4 border-t border-border pt-8 sm:grid-cols-2" aria-labelledby="discovery-other-title">
          <h2 id="discovery-other-title" className="sr-only">{t({ en: 'Other paths', ru: 'Другие задачи', th: 'เส้นทางอื่น' })}</h2>
          <Link to={R.PROPERTY_SELL} className="group flex min-h-28 items-center gap-4 border border-dashed border-border p-5 hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <ListPlus size={22} className="shrink-0 text-primary" aria-hidden="true" />
            <span className="min-w-0 flex-1">
              <span className="block font-semibold text-foreground">{t({ en: 'Sell a property', ru: 'Продать объект', th: 'ขายอสังหาริมทรัพย์' })}</span>
              <span className="mt-1 block text-sm text-muted-foreground">{t({ en: 'Tell the team about your property and plans.', ru: 'Расскажите команде об объекте и ваших планах.', th: 'แจ้งข้อมูลอสังหาริมทรัพย์และแผนของคุณแก่ทีมงาน' })}</span>
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
