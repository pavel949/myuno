import '@/styles/landing-editorial.css';
import { LandingLeadForm } from '@/components/landings/LandingLeadForm';
import { SEOHead } from '@/components/seo/SEOHead';
import { useLanguage } from '@/contexts/LanguageContext';
import { PROPERTY_VERTICAL_PAGE_GUTTER } from '@/design-system/propertyVertical';
import { APP_ROUTES } from '@/lib/config/routes';
import { pickLang } from '@/lib/i18n/pickLang';
import { cn } from '@/lib/utils';

const saleIntent = {
  intent: 'sell_property',
  label: { ru: 'Продажа недвижимости', en: 'Property sale', th: 'ขายอสังหาริมทรัพย์' },
};

export default function PropertySellLanding() {
  const { language } = useLanguage();
  const title = pickLang(language, {
    ru: 'Продать недвижимость на Пхукете',
    en: 'Sell property in Phuket',
    th: 'ขายอสังหาริมทรัพย์ในภูเก็ต',
  });
  const description = pickLang(language, {
    ru: 'Расскажите, какой объект хотите продать. Команда свяжется с вами, чтобы обсудить условия и следующие шаги.',
    en: 'Tell us about the property you want to sell. The team will contact you to discuss the terms and next steps.',
    th: 'บอกเราเกี่ยวกับอสังหาริมทรัพย์ที่คุณต้องการขาย ทีมงานจะติดต่อเพื่อหารือเงื่อนไขและขั้นตอนต่อไป',
  });

  return (
    <section className={cn(PROPERTY_VERTICAL_PAGE_GUTTER, 'space-y-6 py-8')} aria-labelledby="property-sell-title">
      <SEOHead title={title} description={description} />
      <header className="max-w-[var(--layout-width-form)] space-y-3">
        <h1 id="property-sell-title" className="landing-catalog-title font-display text-h1">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </header>
      <div className="max-w-[var(--layout-width-form)]">
        <LandingLeadForm
          variant="universal"
          verticalId="properties"
          universalRequestType="property_consultation"
          entryPoint={APP_ROUTES.PROPERTY_SELL}
          requestContext={saleIntent}
          messagePlaceholder={{
            ru: 'Название комплекса или район, тип объекта и желаемый срок продажи',
            en: 'Development name or area, property type and preferred sale timeline',
            th: 'ชื่อโครงการหรือย่าน ประเภทอสังหาริมทรัพย์ และช่วงเวลาที่ต้องการขาย',
          }}
          submitLabel={{ ru: 'Отправить запрос', en: 'Send enquiry', th: 'ส่งคำขอ' }}
        />
      </div>
    </section>
  );
}
