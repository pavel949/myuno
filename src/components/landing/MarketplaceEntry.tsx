import type { ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { pickLang, type LangValues } from '@/lib/i18n/pickLang';
import coast from '@/assets/hero-phuket-coast-editorial.webp';
import housing from '@/assets/solutions/property-tour.webp';
import islands from '@/assets/solutions/islands.webp';
import transfer from '@/assets/solutions/transfer.webp';

const entries: Record<string, { image: string; title: LangValues; lead: LangValues }> = {
  rent: { image: coast, title: { ru: 'Аренда на Пхукете', en: 'Rent in Phuket', th: 'เช่าที่พักในภูเก็ต' },
    lead: { ru: 'Выберите даты и жильё. Команда myUNO поможет проверить условия и доступность.', en: 'Choose an area, dates and a place to stay. The myUNO team can help check availability and terms.', th: 'เลือกย่าน วันที่ และที่พัก ทีม myUNO ช่วยตรวจสอบที่ว่างและเงื่อนไขได้' } },
  buy: { image: housing, title: { ru: 'Купить недвижимость на Пхукете', en: 'Buy property in Phuket', th: 'ซื้ออสังหาริมทรัพย์ในภูเก็ต' },
    lead: { ru: 'Новостройки и вторичный рынок. Команда myUNO поможет сравнить варианты и уточнить условия покупки.', en: 'Explore new developments and resale homes. The myUNO team can help compare options and check terms.', th: 'ดูโครงการใหม่และบ้านมือสอง ทีม myUNO ช่วยเปรียบเทียบตัวเลือกและตรวจสอบเงื่อนไขได้' } },
  experiences: { image: islands, title: { ru: 'Впечатления на Пхукете', en: 'Experiences in Phuket', th: 'ประสบการณ์ในภูเก็ต' },
    lead: { ru: 'Острова, парки и приключения. Консьерж myUNO уточнит программу, места и цену.', en: 'Islands, parks and adventures. The myUNO concierge will check the programme, availability and price on request.', th: 'เกาะ สวนสนุก และการผจญภัย คอนเซียร์จ myUNO ช่วยตรวจสอบโปรแกรม ที่ว่าง และราคาตามคำขอ' } },
  services: { image: transfer, title: { ru: 'Услуги на Пхукете', en: 'Services in Phuket', th: 'บริการในภูเก็ต' },
    lead: { ru: 'Трансферы, цветы и помощь по дому. Команда myUNO подскажет условия заказа.', en: 'Transfers, flowers and help at home. Choose a service and the myUNO team can guide you through the terms.', th: 'รถรับส่ง ดอกไม้ และบริการดูแลบ้าน เลือกบริการที่ต้องการ แล้วทีม myUNO จะแนะนำเงื่อนไขการสั่งบริการ' } },
};

type EntryAction = { label: LangValues; href: string };

export function MarketplaceEntry({ kind, headingId, actions = [] }: {
  kind: 'rent' | 'buy' | 'experiences' | 'services';
  headingId?: string;
  actions?: EntryAction[];
}) {
  const { language } = useLanguage();
  const { image, title, lead } = entries[kind];
  return (
    <section data-marketplace-entry={kind} aria-labelledby={headingId ?? `marketplace-${kind}-title`}
      className="grid min-w-0 gap-4 border-b border-border py-4 sm:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] sm:items-center sm:gap-6 sm:py-6">
      <div className="min-w-0 space-y-2">
        <p className="text-sm font-medium text-muted-foreground">
          {pickLang(language, { ru: 'Пхукет · Команда myUNO', en: 'Phuket · myUNO team', th: 'ภูเก็ต · ทีม myUNO' })}
        </p>
        <h1 id={headingId ?? `marketplace-${kind}-title`} className="break-words font-display text-3xl font-normal leading-tight tracking-tight text-foreground sm:text-5xl">
          {pickLang(language, title)}
        </h1>
        <p className="text-base leading-normal text-foreground">{pickLang(language, lead)}</p>
        {actions.length > 0 && <div className="grid grid-cols-2 gap-2 pt-2 min-[480px]:flex min-[480px]:flex-wrap">
          {actions.map(({ href, label }, index) => {
            const content = <>{pickLang(language, label)}<ArrowRight className="size-4 shrink-0" aria-hidden="true" /></>;
            return <Button key={href} asChild variant={index === 0 ? 'default' : 'outline'} className="min-h-11 min-w-0 max-w-full whitespace-normal text-left">
              {href.startsWith('#') ? <a href={href}>{content}</a> : <Link to={href}>{content}</Link>}
            </Button>;
          })}
        </div>}
      </div>
      <div className="hidden overflow-hidden bg-muted sm:block">
        <img src={image} alt="" width="640" height="320" decoding="async"
          className="aspect-[8/3] w-full object-cover" />
      </div>
    </section>
  );
}
