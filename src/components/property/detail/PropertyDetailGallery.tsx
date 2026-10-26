/** Keyboard-accessible gallery; mobile never renders hidden off-grid photo rows. */
import { useState } from 'react';
import { Eye } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { pickLang } from '@/lib/i18n/pickLang';
import '@/styles/property-journey.css';

interface PropertyDetailGalleryProps {
  images: string[];
  alt: string;
  onOpenLightbox: (startIndex: number) => void;
}

export function PropertyDetailGallery({ images, alt, onOpenLightbox }: PropertyDetailGalleryProps) {
  const { language } = useLanguage();
  const [activeImage, setActiveImage] = useState(0);
  if (!images.length) return null;
  const active = activeImage < images.length ? activeImage : 0;
  const photoLabel = (index: number) => pickLang(language, { ru: `Открыть фото ${index + 1}`, en: `Open photo ${index + 1}`, th: `เปิดรูปที่ ${index + 1}` });
  return <div className="property-editorial-gallery">
    <div className={`property-editorial-photos${images.length === 1 ? ' property-editorial-photos--single' : ''}`}>
      <button type="button" className="property-editorial-main" onClick={() => onOpenLightbox(active)} aria-label={photoLabel(active)}>
        <img src={images[active]} alt={alt} width="1200" height="900" decoding="async" fetchPriority="high" />
      </button>
      {images.length > 1 && <button type="button" className="property-editorial-secondary" onClick={() => onOpenLightbox(active === 1 ? 0 : 1)} aria-label={photoLabel(active === 1 ? 0 : 1)}>
        <img src={images[active === 1 ? 0 : 1]} alt="" width="900" height="900" decoding="async" />
      </button>}
    </div>
    {images.length > 1 && <div className="property-editorial-thumbnails" aria-label={pickLang(language, { ru: 'Выбор фотографии', en: 'Choose a photo', th: 'เลือกรูปภาพ' })}>
      {images.map((image, index) => <button type="button" key={`${image}-${index}`} onClick={() => setActiveImage(index)} aria-label={pickLang(language, { ru: `Показать фото ${index + 1}`, en: `Show photo ${index + 1}`, th: `แสดงรูปที่ ${index + 1}` })} aria-pressed={active === index}>
        <img src={image} alt="" width="96" height="72" loading="lazy" decoding="async" />
      </button>)}
    </div>}
    <button type="button" className="property-editorial-all" onClick={() => onOpenLightbox(active)}><Eye size={16} aria-hidden="true" />{pickLang(language, { ru: `Все фото · ${images.length}`, en: `All photos · ${images.length}`, th: `รูปภาพทั้งหมด · ${images.length}` })}</button>
  </div>;
}
