import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Search } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { pickLang, type LangValues } from '@/lib/i18n/pickLang';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { APP_ROUTES as R } from '@/lib/config/routes';

/** Intent is persisted in the canonical results URL. Dates and filters belong there. */
const homeSearchIntents = [
  { id: 'holiday', query: 'mode=rent&tenancy=short', title: { ru: 'Для отдыха', en: 'For a holiday', th: 'สำหรับวันหยุด' }, detail: { ru: 'Краткосрочная аренда', en: 'Short stays', th: 'เช่าระยะสั้น' } },
  { id: 'monthly', query: 'mode=rent&tenancy=medium', title: { ru: 'Пожить несколько месяцев', en: 'Stay for a few months', th: 'พักหลายเดือน' }, detail: { ru: 'Помесячная аренда', en: 'Monthly rentals', th: 'เช่ารายเดือน' } },
  { id: 'long', query: 'mode=rent&tenancy=long', title: { ru: 'Поселиться надолго', en: 'Settle in for longer', th: 'อยู่อาศัยระยะยาว' }, detail: { ru: 'Аренда на год', en: 'Yearly rentals', th: 'เช่ารายปี' } },
  { id: 'buy', query: 'mode=buy', title: { ru: 'Купить недвижимость', en: 'Buy a home', th: 'ซื้อบ้าน' }, detail: { ru: 'Предложения о продаже', en: 'Homes for sale', th: 'อสังหาริมทรัพย์สำหรับขาย' } },
] satisfies { id: string; query: string; title: LangValues; detail: LangValues }[];

export function HomeSearchEntry() {
  const { language } = useLanguage();
  const t = (value: LangValues) => pickLang(language, value);
  const [open, setOpen] = useState(false);
  return <div className="home-search-entry">
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild><button type="button" className="home-search-entry-button">
        <Search size={23} aria-hidden="true" /><span><strong>{t({ ru: 'Найти жильё на Пхукете', en: 'Find a home in Phuket', th: 'ค้นหาที่พักในภูเก็ต' })}</strong><small>{t({ ru: 'Для отдыха, жизни или покупки', en: 'For a holiday, a longer stay or a purchase', th: 'สำหรับวันหยุด อยู่อาศัย หรือซื้อ' })}</small></span><ArrowRight size={22} aria-hidden="true" />
      </button></SheetTrigger>
      <SheetContent side="bottom" className="home-search-sheet home-intent-sheet" closeLabel={t({ ru: 'Закрыть поиск', en: 'Close search', th: 'ปิดการค้นหา' })}>
        <div className="home-search-sheet-inner">
          <SheetHeader><SheetTitle>{t({ ru: 'Какие у вас планы?', en: 'What are your plans?', th: 'คุณมีแผนอย่างไร' })}</SheetTitle><SheetDescription>{t({ ru: 'Сразу покажем варианты. Даты и район — по желанию.', en: 'Go straight to homes. Dates and area are optional.', th: 'ดูที่พักได้ทันที วันที่และย่านเป็นตัวเลือก' })}</SheetDescription></SheetHeader>
          <div className="home-search-intents">{homeSearchIntents.map(intent => <Link key={intent.id} to={`${R.PROPERTY_SEARCH}?${intent.query}`} onClick={() => setOpen(false)}><span><strong>{t(intent.title)}</strong><small>{t(intent.detail)}</small></span><ArrowRight size={20} aria-hidden="true" /></Link>)}</div>
          <section className="home-owner-intents" aria-labelledby="home-owner-intent-title">
            <h3 id="home-owner-intent-title">{t({ ru: 'У меня есть недвижимость', en: 'I own a property', th: 'ฉันมีอสังหาริมทรัพย์' })}</h3>
            <div className="home-search-intents">
              <Link to={`${R.OWNER_MANAGEMENT_LANDING}?intent=rent`} onClick={() => setOpen(false)}><span><strong>{t({ ru: 'Хочу сдавать в аренду', en: 'I want to rent it out', th: 'ฉันต้องการปล่อยเช่า' })}</strong></span><ArrowRight size={20} aria-hidden="true" /></Link>
              <Link to={`${R.OWNER_MANAGEMENT_LANDING}?intent=management`} onClick={() => setOpen(false)}><span><strong>{t({ ru: 'Обсудить управление', en: 'Discuss management', th: 'ปรึกษาเรื่องการจัดการ' })}</strong></span><ArrowRight size={20} aria-hidden="true" /></Link>
            </div>
          </section>
        </div>
      </SheetContent>
    </Sheet>
    <p>{t({ ru: 'Даты и район можно выбрать позже', en: 'Choose dates and an area when you are ready', th: 'เลือกวันที่และย่านภายหลังได้' })}</p>
    <a className="home-explore-areas" href="#home-locations-title">{t({ ru: 'Познакомиться с Пхукетом', en: 'Get to know Phuket', th: 'ทำความรู้จักภูเก็ต' })} ↓</a>
  </div>;
}
