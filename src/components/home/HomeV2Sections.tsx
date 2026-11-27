import { Link } from 'react-router-dom';
import { ArrowRight, BedDouble, Building2, Compass, HardHat, MapPin, Wrench } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { pickLang, type LangValues } from '@/lib/i18n/pickLang';
import { APP_ROUTES as R } from '@/lib/config/routes';

type Path = { key: string; to: string; icon: LucideIcon; title: LangValues; text: LangValues };

/** Six primary choices; navigation only, never evidence of supply or availability. */
export const HOME_V2_PATHS: readonly Path[] = [
  { key: 'rent', to: R.PROPERTY_RENT, icon: BedDouble, title: { ru: 'Аренда', en: 'Rent', th: 'เช่า' }, text: { ru: 'Посуточно и помесячно', en: 'Nightly and monthly', th: 'รายวันและรายเดือน' } },
  { key: 'buy', to: R.PROPERTY_BUY, icon: Building2, title: { ru: 'Покупка', en: 'Buy', th: 'ซื้อ' }, text: { ru: 'Готовое жильё', en: 'Ready homes', th: 'บ้านพร้อมอยู่' } },
  { key: 'offplan', to: R.OFFPLAN, icon: HardHat, title: { ru: 'Новостройки', en: 'New developments', th: 'โครงการใหม่' }, text: { ru: 'Проекты и условия', en: 'Projects and terms', th: 'โครงการและเงื่อนไข' } },
  { key: 'experiences', to: R.EXPERIENCES, icon: Compass, title: { ru: 'Впечатления', en: 'Experiences', th: 'ประสบการณ์' }, text: { ru: 'Отдых на острове', en: 'Time on the island', th: 'กิจกรรมบนเกาะ' } },
  { key: 'services', to: R.GOAL_SERVICES, icon: Wrench, title: { ru: 'Сервисы', en: 'Services', th: 'บริการ' }, text: { ru: 'Помощь в быту', en: 'Everyday help', th: 'ความช่วยเหลือในชีวิตประจำวัน' } },
  { key: 'areas', to: R.AREA_INDEX, icon: MapPin, title: { ru: 'Районы', en: 'Areas', th: 'ย่าน' }, text: { ru: 'Знакомство с районами', en: 'Area guides', th: 'คู่มือย่าน' } },
];

export function HomeV2Paths() {
  const { language } = useLanguage();
  const t = (v: LangValues) => pickLang(language, v);
  return <section className="home-container py-8" aria-labelledby="home-v2-paths-title">
    <div className="mb-4 flex items-baseline justify-between gap-4">
      <h2 id="home-v2-paths-title" className="!text-2xl md:!text-3xl">{t({ ru: 'С чего начать', en: 'Where to start', th: 'เริ่มต้นจากตรงไหน' })}</h2>
      <Link className="ds-focus inline-flex min-h-11 items-center gap-1 text-sm underline underline-offset-4" to={R.GOAL_SERVICES}>{t({ ru: 'Все категории', en: 'All categories', th: 'ทุกหมวดหมู่' })}<ArrowRight size={16} aria-hidden="true" /></Link>
    </div>
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">{HOME_V2_PATHS.map(p => { const Icon = p.icon; return <li key={p.key}>
      <Link className="ds-focus flex h-full min-h-11 items-start gap-3 rounded-[var(--bible-radius-card)] border border-border bg-card p-4 text-foreground transition-colors hover:border-primary" to={p.to}>
        <Icon className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
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
