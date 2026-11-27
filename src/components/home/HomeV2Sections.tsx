import { Link } from 'react-router-dom';
import { ArrowRight, BedDouble, Building2, Compass, HardHat, Handshake, Sparkles, Wrench } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { pickLang, type LangValues } from '@/lib/i18n/pickLang';
import { APP_ROUTES as R } from '@/lib/config/routes';
import { useCatalogFromDB } from '@/lib/catalog/useCatalogFromDB';
import { serviceDiscoveryCategories, serviceDiscoverySituations } from '@/lib/services/serviceDiscoveryProjection';
import { Skeleton } from '@/components/ui/skeleton';

type Path = { key: string; to: string; icon: LucideIcon; title: LangValues; text: LangValues };

/** Six primary choices; navigation only, never evidence of supply or availability. */
export const HOME_V2_PATHS: readonly Path[] = [
  { key: 'rent', to: R.PROPERTY_RENT, icon: BedDouble, title: { ru: 'Аренда', en: 'Rent', th: 'เช่า' }, text: { ru: 'Посуточно и помесячно', en: 'Nightly and monthly', th: 'รายวันและรายเดือน' } },
  { key: 'buy', to: R.PROPERTY_BUY, icon: Building2, title: { ru: 'Покупка', en: 'Buy', th: 'ซื้อ' }, text: { ru: 'Новостройки и вторичка', en: 'New builds and resale', th: 'บ้านพร้อมอยู่' } },
  { key: 'offplan', to: R.OFFPLAN_SEARCH, icon: HardHat, title: { ru: 'Новостройки', en: 'New developments', th: 'โครงการใหม่' }, text: { ru: 'Проекты и условия', en: 'Projects and terms', th: 'โครงการและเงื่อนไข' } },
  { key: 'experiences', to: R.EXPERIENCES, icon: Compass, title: { ru: 'Впечатления', en: 'Experiences', th: 'ประสบการณ์' }, text: { ru: 'Отдых на острове', en: 'Time on the island', th: 'กิจกรรมบนเกาะ' } },
  { key: 'services', to: R.GOAL_SERVICES, icon: Wrench, title: { ru: 'Услуги', en: 'Services', th: 'บริการ' }, text: { ru: 'Помощь в быту', en: 'Everyday help', th: 'ความช่วยเหลือในชีวิตประจำวัน' } },
  { key: 'partners', to: R.LIST_WITH_US, icon: Handshake, title: { ru: 'Партнёрам', en: 'Partners', th: 'พาร์ทเนอร์' }, text: { ru: 'Разместить объявление', en: 'Post a listing', th: 'ลงประกาศ' } },
];

/** Island life panel: live active situations from Life OS; falls back to the navigator link only. */
export function HomeIslandLife() {
  const { language } = useLanguage();
  const t = (v: LangValues) => pickLang(language, v);
  const catalog = useCatalogFromDB();
  const items = catalog.isFromDB
    ? serviceDiscoverySituations(serviceDiscoveryCategories(catalog.categories), catalog.lifeSituations ?? []).slice(0, 4)
    : [];
  return <section aria-labelledby="home-life-situations-title" className="home-container flex flex-col rounded-[var(--bible-radius-card)] bg-primary p-5 text-primary-foreground md:p-6">
    <Sparkles className="size-5" aria-hidden="true" />
    <h2 id="home-life-situations-title" className="mt-3 text-xl font-semibold">{t({ ru: 'Жизненные ситуации', en: 'Life situations', th: 'สถานการณ์ชีวิต' })}</h2>
    <p className="mt-1 text-sm opacity-80">{t({ ru: 'Выберите вашу ситуацию — подскажем, что сделать и кто поможет.', en: 'Pick your situation and see what to do and who can help.', th: 'เลือกสถานการณ์ของคุณ แล้วดูว่าต้องทำอะไรและใครช่วยได้' })}</p>
    {catalog.isLoading && <div className="mt-4 grid gap-2">{[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-11 bg-primary-foreground/15" />)}</div>}
    {!catalog.isLoading && !catalog.error && items.length > 0 && <ul className="mt-4 grid gap-2">{items.map(s => <li key={s.code}>
      <Link className="ds-focus flex min-h-11 items-center justify-between gap-3 rounded-[var(--bible-radius-control)] border border-primary-foreground/20 px-3 py-2 text-sm transition-colors hover:bg-primary-foreground/10" to={`${R.GOAL_SERVICES}?${new URLSearchParams({ browse: "situations", situation: s.code })}`}>
        <span className="min-w-0 break-words">{language === 'ru' ? s.titleRu : s.titleEn}</span><ArrowRight className="size-4 shrink-0" aria-hidden="true" />
      </Link></li>)}</ul>}
    <Link className="ds-focus mt-auto inline-flex min-h-11 items-center gap-1 pt-4 text-sm font-medium underline underline-offset-4" to={`${R.GOAL_SERVICES}?browse=situations`}>{t({ ru: 'Все жизненные ситуации', en: 'All life situations', th: 'สถานการณ์ทั้งหมด' })}<ArrowRight size={16} aria-hidden="true" /></Link>
  </section>;
}

export function HomeV2Paths() {
  const { language } = useLanguage();
  const t = (v: LangValues) => pickLang(language, v);
  return <section className="home-container py-8" aria-labelledby="home-v2-paths-title">
    <h2 id="home-v2-paths-title" className="mb-4 !text-2xl md:!text-3xl">{t({ ru: 'С чего начать', en: 'Where to start', th: 'เริ่มต้นจากตรงไหน' })}</h2>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">{HOME_V2_PATHS.map(p => { const Icon = p.icon; return <li key={p.key}>
        <Link className="ds-focus flex h-full min-h-24 flex-col justify-between gap-3 rounded-[var(--bible-radius-card)] border border-border bg-card p-4 text-foreground transition-colors hover:border-primary" to={p.to}>
          <Icon className="size-5 shrink-0 text-primary" aria-hidden="true" />
          <span className="min-w-0"><span className="block font-medium leading-snug">{t(p.title)}</span><span className="mt-1 block text-sm text-muted-foreground">{t(p.text)}</span></span>
        </Link></li>; })}</ul>
  </section>;
}

const STEPS: readonly { title: LangValues; text: LangValues }[] = [
  { title: { ru: 'Оставьте заявку', en: 'Send a request', th: 'ส่งคำขอ' }, text: { ru: 'Укажите даты, гостей и пожелания.', en: 'Share your dates, guests and wishes.', th: 'ระบุวันที่ จำนวนผู้เข้าพัก และความต้องการ' } },
  { title: { ru: 'Мы уточним условия', en: 'We confirm the details', th: 'เรายืนยันรายละเอียด' }, text: { ru: 'Команда проверит наличие и итоговую стоимость.', en: 'The team checks availability and the final price.', th: 'ทีมงานตรวจสอบที่ว่างและราคาสุดท้าย' } },
  { title: { ru: 'Подтвердите бронь', en: 'Confirm your booking', th: 'ยืนยันการจอง' }, text: { ru: 'Бронь действует после вашего подтверждения.', en: 'The booking holds once you confirm it.', th: 'การจองมีผลเมื่อคุณยืนยัน' } },
];

/** Assisted booking: no instant confirmation or payment promise. */
export function HomeV2Steps() {
  const { language } = useLanguage();
  const t = (v: LangValues) => pickLang(language, v);
  return <section className="home-container py-10" aria-labelledby="home-v2-steps-title">
    <h2 id="home-v2-steps-title" className="mb-5 !text-2xl md:!text-3xl">{t({ ru: 'Как проходит бронирование', en: 'How booking works', th: 'ขั้นตอนการจอง' })}</h2>
    <ol className="grid gap-4 md:grid-cols-3">{STEPS.map((s, i) => <li key={i} className="rounded-[var(--bible-radius-card)] border border-border bg-card p-5">
      <span className="font-mono text-sm text-muted-foreground">{String(i + 1).padStart(2, '0')}</span>
      <h3 className="mt-2 text-lg">{t(s.title)}</h3><p className="mt-1 text-sm text-muted-foreground">{t(s.text)}</p></li>)}</ol>
  </section>;
}
