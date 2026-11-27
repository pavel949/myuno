import { Link } from 'react-router-dom';
import { ArrowRight, BedDouble, Building2, Compass, HardHat, MapPin, Wrench } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { pickLang, type LangValues } from '@/lib/i18n/pickLang';
import { APP_ROUTES as R } from '@/lib/config/routes';
import { HomeCarousel } from './HomeCarousel';

type Path = { key: string; to: string; icon: LucideIcon; title: LangValues; text: LangValues };

/** Six primary choices; navigation only, never evidence of supply or availability. */
export const HOME_V2_PATHS: readonly Path[] = [
  { key: 'rent', to: R.PROPERTY_RENT, icon: BedDouble, title: { ru: 'Аренда', en: 'Rent', th: 'เช่า' }, text: { ru: 'Посуточно и помесячно', en: 'Nightly and monthly', th: 'รายวันและรายเดือน' } },
  { key: 'buy', to: R.PROPERTY_BUY, icon: Building2, title: { ru: 'Покупка', en: 'Buy', th: 'ซื้อ' }, text: { ru: 'Готовое жильё', en: 'Ready homes', th: 'บ้านพร้อมอยู่' } },
  { key: 'offplan', to: R.OFFPLAN, icon: HardHat, title: { ru: 'Новостройки', en: 'New developments', th: 'โครงการใหม่' }, text: { ru: 'Проекты и условия', en: 'Projects and terms', th: 'โครงการและเงื่อนไข' } },
  { key: 'experiences', to: R.EXPERIENCES, icon: Compass, title: { ru: 'Впечатления', en: 'Experiences', th: 'ประสบการณ์' }, text: { ru: 'Отдых на острове', en: 'Time on the island', th: 'กิจกรรมบนเกาะ' } },
  { key: 'services', to: R.GOAL_SERVICES, icon: Wrench, title: { ru: 'Услуги', en: 'Services', th: 'บริการ' }, text: { ru: 'Помощь в быту', en: 'Everyday help', th: 'ความช่วยเหลือในชีวิตประจำวัน' } },
  { key: 'areas', to: R.AREA_INDEX, icon: MapPin, title: { ru: 'Районы', en: 'Areas', th: 'ย่าน' }, text: { ru: 'Знакомство с районами', en: 'Area guides', th: 'คู่มือย่าน' } },
];

export function HomeV2Paths() {
  const { language } = useLanguage();
  const t = (v: LangValues) => pickLang(language, v);
  return <HomeCarousel id="home-v2-paths-title" className="home-v2-paths" items={HOME_V2_PATHS} getKey={p => p.key}
    title={t({ ru: 'С чего начать', en: 'Where to start', th: 'เริ่มต้นจากตรงไหน' })}
    href={R.GOAL_SERVICES} linkLabel={t({ ru: 'Все категории', en: 'All categories', th: 'ทุกหมวดหมู่' })}
    empty={{ ru: 'Разделы недоступны.', en: 'Sections are unavailable.', th: 'ไม่มีหมวดหมู่' }}
    renderItem={p => { const Icon = p.icon; return <article className="home-guide-card"><Link className="ds-focus flex h-full min-h-11 w-56 flex-col gap-3 border border-border bg-card p-5 text-foreground" to={p.to}>
      <Icon className="size-6 text-primary" aria-hidden="true" /><h3 className="text-lg">{t(p.title)}</h3><p className="text-sm text-muted-foreground">{t(p.text)}</p>
      <span className="mt-auto inline-flex items-center gap-2 text-sm">{t({ ru: 'Открыть', en: 'Open', th: 'เปิด' })}<ArrowRight size={16} aria-hidden="true" /></span></Link></article>; }} />;
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
  return <section className="home-container py-12" aria-labelledby="home-v2-steps-title">
    <h2 id="home-v2-steps-title" className="mb-6 text-3xl">{t({ ru: 'Как проходит бронирование', en: 'How booking works', th: 'ขั้นตอนการจอง' })}</h2>
    <ol className="grid gap-4 md:grid-cols-3">{STEPS.map((s, i) => <li key={i} className="border border-border bg-card p-5">
      <span className="font-mono text-sm text-muted-foreground">{String(i + 1).padStart(2, '0')}</span>
      <h3 className="mt-2 text-lg">{t(s.title)}</h3><p className="mt-1 text-sm text-muted-foreground">{t(s.text)}</p></li>)}</ol>
  </section>;
}
