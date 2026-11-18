import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { MiniAppLayout } from '@/components/miniapp/MiniAppLayout';
import { Button } from '@/components/ui/button';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { pickLang } from '@/lib/i18n/pickLang';
import { InquiryForm } from '@/components/vertical-wizard/InquiryForm';
import type { Experience } from '@/hooks/useExperiences';

/** Editorial information admits a concierge inquiry, never a booking, payment or asserted quote. */
export function ExperienceDiscoveryDetail({ experience, onBack, initialInquiryOpen = false }: { experience: Experience; onBack: () => void; initialInquiryOpen?: boolean }) {
  const { language } = useLanguage();
  const t = (ru: string, en: string, th: string) => pickLang(language, { ru, en, th });
  const title = (language === 'ru' ? experience.title_ru : experience.title_en) || experience.title_en;
  const description = (language === 'ru' ? experience.description_ru : experience.description_en) || experience.description_en;
  const [inquiryOpen, setInquiryOpen] = useState(initialInquiryOpen);
  const [activeImage, setActiveImage] = useState(0);
  const images = [experience.cover_image, ...(experience.images || [])].filter((image): image is string => Boolean(image));
  return <MiniAppLayout title={title} fallbackPath="/experiences" onBack={onBack} showHero={false} showFilter={false} showCategories={false}>
    <article className="space-y-4">
      {images.length > 0 && <div className="space-y-2">
        <OptimizedImage src={images[activeImage] || images[0]} alt={title} width={800} height={450} className="aspect-video w-full" />
        {images.length > 1 && <div className="flex gap-2 overflow-x-auto" aria-label={t('Фотографии', 'Photos', 'รูปภาพ')}>
          {images.map((image, index) => <button key={`${image}-${index}`} type="button" onClick={() => setActiveImage(index)} aria-label={`${t('Фото', 'Photo', 'รูปภาพ')} ${index + 1}`} aria-pressed={activeImage === index} className="h-16 w-20 shrink-0 overflow-hidden border border-border focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
            <img src={image} alt="" className="h-full w-full object-cover" />
          </button>)}
        </div>}
      </div>}
      {experience.location_name && <p className="text-sm text-muted-foreground">{experience.location_name}</p>}
      <p>{description}</p>
      <div className="space-y-3 border border-border bg-muted/30 p-4">
        <h2 className="font-display text-h3">{t('Перед посещением', 'Before you visit', 'ก่อนเข้าชม')}</h2>
        <p>{t('Это идея для отдыха. Консьерж myUNO поможет уточнить программу, доступность и условия. Отправка запроса не подтверждает бронирование; онлайн-оплата для этой карточки недоступна.', 'An idea for your day. myUNO concierge can help check the programme, availability and conditions. An inquiry is not a confirmed booking; online payment is not available for this listing.', 'ไอเดียสำหรับวันพักผ่อน ติดต่อคอนเซียร์จ myUNO เพื่อสอบถามโปรแกรม ที่ว่าง และเงื่อนไข การส่งคำขอไม่ใช่การยืนยันการจอง และยังไม่เปิดให้ชำระเงินออนไลน์')}</p>
        <Button onClick={() => setInquiryOpen(true)}>{t('Спросить консьержа myUNO', 'Ask myUNO concierge', 'สอบถามคอนเซียร์จ myUNO')}</Button>
      </div>
    </article>
    <InquiryForm open={inquiryOpen} onOpenChange={setInquiryOpen} verticalId="tour" listingId={experience.id} listingTitle={title} entryPoint="experience_discovery:concierge" />
  </MiniAppLayout>;
}
