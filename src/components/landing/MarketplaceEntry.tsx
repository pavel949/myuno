import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { pickLang, type LangValues } from '@/lib/i18n/pickLang';
import '@/styles/marketplace-unity.css';
import coast from '@/assets/hero-phuket-coast-editorial.webp';
import housing from '@/assets/solutions/property-tour.webp';
import islands from '@/assets/solutions/islands.webp';
import transfer from '@/assets/solutions/transfer.webp';

type MarketplaceKind = 'rent' | 'buy' | 'experiences' | 'services' | 'property' | 'discovery' | 'live';

const entries: Record<MarketplaceKind, { image: string; title: LangValues; lead: LangValues }> = {
  property: { image: housing, title: { ru: 'Недвижимость на Пхукете', en: 'Homes in Phuket', th: 'อสังหาริมทรัพย์ในภูเก็ต' },
    lead: { ru: 'Аренда, покупка и управление. Выберите задачу и сравните предложения.', en: 'Rent, buy or manage a property. Choose your next step and compare homes.', th: 'เช่า ซื้อ หรือจัดการอสังหาริมทรัพย์ เลือกสิ่งที่ต้องการและเปรียบเทียบที่พัก' } },
  discovery: { image: coast, title: { ru: 'Начните с вашей задачи', en: 'Start with your goal', th: 'เริ่มจากเป้าหมายของคุณ' },
    lead: { ru: 'Жильё, переезд, услуги и впечатления — выберите направление.', en: 'Homes, moving, services and experiences — choose your next step.', th: 'ที่พัก การย้ายมาอยู่ บริการ และประสบการณ์ เลือกสิ่งที่ต้องการ' } },
  live: { image: housing, title: { ru: 'Переезд и жизнь на Пхукете', en: 'Moving to and living in Phuket', th: 'ย้ายมาและใช้ชีวิตในภูเก็ต' },
    lead: { ru: 'Жильё, документы и повседневные задачи. Найдите подходящий раздел.', en: 'Homes, documents and everyday needs. Find the right place to start.', th: 'ที่พัก เอกสาร และสิ่งจำเป็นในชีวิตประจำวัน ค้นหาจุดเริ่มต้นที่เหมาะสม' } },
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
  kind: MarketplaceKind;
  headingId?: string;
  actions?: EntryAction[];
}) {
  const { language } = useLanguage();
  const { image, title, lead } = entries[kind];
  return (
    <section data-marketplace-entry={kind} aria-labelledby={headingId ?? `marketplace-${kind}-title`}
      className="marketplace-entry">
      <div className="marketplace-heading">
        <p className="marketplace-eyebrow">
          {pickLang(language, { ru: 'Пхукет · Команда myUNO', en: 'Phuket · myUNO team', th: 'ภูเก็ต · ทีม myUNO' })}
        </p>
        <h1 id={headingId ?? `marketplace-${kind}-title`} className="marketplace-title">
          {pickLang(language, title)}
        </h1>
        <p className="marketplace-lead">{pickLang(language, lead)}</p>
        {actions.length > 0 && <div className="grid grid-cols-2 gap-2 pt-2 min-[480px]:flex min-[480px]:flex-wrap">
          {actions.map(({ href, label }, index) => {
            const content = <>{pickLang(language, label)}<ArrowRight className="size-4 shrink-0" aria-hidden="true" /></>;
            return <Button key={href} asChild variant={index === 0 ? 'default' : 'outline'} className="min-h-11 min-w-0 max-w-full whitespace-normal text-left">
              {href.startsWith('#') ? <a href={href}>{content}</a> : <Link to={href}>{content}</Link>}
            </Button>;
          })}
        </div>}
      </div>
      <div className="marketplace-entry-art">
        <img src={image} alt="" width="640" height="320" decoding="async"
          className="aspect-[8/3] w-full object-cover" />
      </div>
    </section>
  );
}
