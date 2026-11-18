import { ExternalLink } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { MiniAppLayout } from '@/components/miniapp/MiniAppLayout';
import { Button } from '@/components/ui/button';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { pickLang } from '@/lib/i18n/pickLang';
import { complexMediaUrl } from '@/lib/real-estate/complexMedia';
import type { Experience } from '@/hooks/useExperiences';

/** Editorial catalogue information does not admit a myUNO booking or quote. */
export function ExperienceDiscoveryDetail({ experience, onBack }: { experience: Experience; onBack: () => void }) {
  const { language } = useLanguage();
  const t = (ru: string, en: string, th: string) => pickLang(language, { ru, en, th });
  const title = (language === 'ru' ? experience.title_ru : experience.title_en) || experience.title_en;
  const description = (language === 'ru' ? experience.description_ru : experience.description_en) || experience.description_en;
  const source = complexMediaUrl(experience.source_page_url);
  return <MiniAppLayout title={title} fallbackPath="/experiences" onBack={onBack} showHero={false} showFilter={false} showCategories={false}>
    <article className="space-y-4">
      {experience.cover_image && <OptimizedImage src={experience.cover_image} alt={title} width={800} height={450} className="aspect-video w-full" />}
      {experience.location_name && <p className="text-sm text-muted-foreground">{experience.location_name}</p>}
      <p>{description}</p>
      <div className="space-y-3 border border-border bg-muted/30 p-4">
        <h2 className="font-display text-h3">{t('Перед посещением', 'Before you visit', 'ก่อนเข้าชม')}</h2>
        <p>{t('Это идея для отдыха. Цену, места, ограничения и условия уточняйте непосредственно у оператора. Бронирование и оплата через myUNO для этой карточки пока недоступны.', 'An idea for your day. Confirm prices, availability, restrictions and terms directly with the operator. This listing does not offer booking or payment through myUNO.', 'ไอเดียสำหรับวันพักผ่อน โปรดยืนยันราคา ที่ว่าง ข้อจำกัด และเงื่อนไขกับผู้ให้บริการโดยตรง รายการนี้ยังไม่เปิดให้จองหรือชำระเงินผ่าน myUNO')}</p>
        {source && <Button asChild variant="outline"><a href={source} target="_blank" rel="noopener noreferrer">{t('Уточнить у оператора', 'Check with the operator', 'สอบถามผู้ให้บริการ')}<ExternalLink className="ml-2 h-4 w-4" aria-hidden="true" /></a></Button>}
      </div>
    </article>
  </MiniAppLayout>;
}
