import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Search } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { pickLang, type LangValues } from '@/lib/i18n/pickLang';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { HomeDiscoverySearch } from './HomeDiscoverySearch';

type Intent = 'holiday' | 'long' | 'buy';

/** One public entry; existing search URL and civil-date contracts remain authoritative. */
export function HomeSearchEntry() {
  const { language } = useLanguage();
  const t = (value: LangValues) => pickLang(language, value);
  const [open, setOpen] = useState(false);
  const [intent, setIntent] = useState<Intent | null>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => { if (open) titleRef.current?.focus(); }, [intent, open]);
  const labels: Record<Intent, LangValues> = {
    holiday: { ru: 'Для отдыха', en: 'For a holiday', th: 'สำหรับวันหยุด' },
    long: { ru: 'Для жизни надолго', en: 'For a longer stay', th: 'สำหรับพักระยะยาว' },
    buy: { ru: 'Хочу купить', en: 'To buy a home', th: 'ต้องการซื้อบ้าน' },
  };
  return <div className="home-search-entry">
    <Sheet open={open} onOpenChange={value => { setOpen(value); if (!value) setIntent(null); }}>
      <SheetTrigger asChild><button type="button" className="home-search-entry-button">
        <Search size={23} aria-hidden="true" /><span><strong>{t({ ru: 'Найти жильё на Пхукете', en: 'Find a home in Phuket', th: 'ค้นหาที่พักในภูเก็ต' })}</strong><small>{t({ ru: 'Для отдыха, жизни или покупки', en: 'For a holiday, a longer stay or a purchase', th: 'สำหรับวันหยุด อยู่อาศัย หรือซื้อ' })}</small></span><ArrowRight size={22} aria-hidden="true" />
      </button></SheetTrigger>
      <SheetContent onOpenAutoFocus={event => { event.preventDefault(); titleRef.current?.focus(); }} side="bottom" className="home-search-sheet" closeLabel={t({ ru: 'Закрыть поиск', en: 'Close search', th: 'ปิดการค้นหา' })}>
        <div className="home-search-sheet-inner">
          <SheetHeader><SheetTitle ref={titleRef} tabIndex={-1}>{intent ? t(labels[intent]) : t({ ru: 'Для чего ищете жильё?', en: 'What are you looking for?', th: 'คุณกำลังมองหาที่พักแบบใด' })}</SheetTitle><SheetDescription>{t({ ru: 'Можно начать без дат и выбранного района.', en: 'You can start without dates or a chosen area.', th: 'เริ่มค้นหาได้โดยไม่ต้องระบุวันที่หรือย่าน' })}</SheetDescription></SheetHeader>
          {intent ? <>
            <button type="button" className="home-search-back" onClick={() => setIntent(null)}><ArrowLeft size={16} aria-hidden="true" />{t({ ru: 'Изменить цель', en: 'Change your plans', th: 'เปลี่ยนความต้องการ' })}</button>
            <HomeDiscoverySearch key={intent} hideModeSwitch progressive initialParams={new URLSearchParams(intent === 'buy' ? { mode: 'buy' } : { mode: 'rent', tenancy: intent === 'long' ? 'long' : 'short' })} />
          </> : <div className="home-search-intents">{(['holiday', 'long', 'buy'] as const).map(value => <button type="button" key={value} onClick={() => setIntent(value)}>{t(labels[value])}<ArrowRight size={20} aria-hidden="true" /></button>)}</div>}
        </div>
      </SheetContent>
    </Sheet>
    <p>{t({ ru: 'Даты и район можно выбрать позже', en: 'Choose dates and an area when you are ready', th: 'เลือกวันที่และย่านภายหลังได้' })}</p>
    <a className="home-explore-areas" href="#home-locations-title">{t({ ru: 'Познакомиться с Пхукетом', en: 'Get to know Phuket', th: 'ทำความรู้จักภูเก็ต' })} ↓</a>
  </div>;
}
