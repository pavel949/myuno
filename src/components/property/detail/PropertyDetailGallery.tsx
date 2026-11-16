import { useState } from 'react';
import '@/styles/premium-public.css';
import { ChevronLeft, ChevronRight, ImageOff } from 'lucide-react';
import '@/styles/property-journey.css';
import { pickLang } from '@/lib/i18n/pickLang';
import { useLanguage } from '@/contexts/LanguageContext';
interface PropertyDetailGalleryProps { images: string[]; alt: string; onOpenLightbox: (startIndex: number) => void }
/** One large photograph and two supporting photographs; mobile uses one image at a time. */
export function PropertyDetailGallery({ images, alt, onOpenLightbox }: PropertyDetailGalleryProps) {
  const { language } = useLanguage();
  const [active, setActive] = useState(0);
  const [failed, setFailed] = useState<Set<string>>(() => new Set());
  const available = images.map((src, index) => ({ src, index })).filter(image => image.src && !failed.has(image.src));
  const current = Math.min(active, Math.max(available.length - 1, 0));
  if (!available.length) return <div className="premium-gallery-empty" role="status"><ImageOff aria-hidden="true" /><p>{pickLang(language,{ru:'Фотографии пока не опубликованы',en:'Photos have not been published yet',th:'ยังไม่มีรูปภาพที่เผยแพร่'})}</p></div>;
  const visible = [available[current], ...available.filter((_, index) => index !== current).slice(0, 2)];
  return <section aria-label={pickLang(language,{ru:'Фотографии объекта',en:'Property photos',th:'รูปภาพที่พัก'})}>
    <div className={`premium-gallery${available.length === 2 ? ' premium-gallery--two' : ''}`}>
      {visible.map((image, i) => <button key={`${i}-${image.src}`} type="button" aria-label={pickLang(language,{ru:`Открыть фото ${image.index+1}`,en:`Open photo ${image.index+1}`,th:`เปิดรูปที่ ${image.index+1}`})} onClick={() => onOpenLightbox(image.index)}>
        <img src={image.src} alt={i === 0 ? alt : `${alt} · ${pickLang(language,{ru:'фото',en:'photo',th:'รูป'})} ${image.index + 1}`} loading={i === 0 ? 'eager' : 'lazy'} onError={() => setFailed(previous => new Set(previous).add(image.src))} />
      </button>)}
      <span className="premium-gallery-count">{available.length} {pickLang(language,{ru:'фото',en:'photos',th:'รูป'})}</span>
    </div>
    {available.length > 1 && <div className="property-editorial-thumbnails" aria-label={pickLang(language, {ru:'Выбор фотографии',en:'Choose a photo',th:'เลือกรูปภาพ'})}>
      {available.map((image,index) => <button key={image.src} type="button" onClick={() => setActive(index)} aria-pressed={current===index} aria-label={pickLang(language,{ru:`Показать фото ${image.index+1}`,en:`Show photo ${image.index+1}`,th:`แสดงรูปที่ ${image.index+1}`})}><img src={image.src} alt="" width="96" height="72" loading="lazy" /></button>)}
    </div>}
    <div className="premium-gallery-thumbs">
      {available.length > 1 && <><button type="button" aria-label={pickLang(language,{ru:'Предыдущее фото',en:'Previous photo',th:'รูปก่อนหน้า'})} onClick={() => setActive(Math.max(0, current - 1))} disabled={current === 0}><ChevronLeft aria-hidden="true" /></button><span aria-live="polite">{current + 1} / {available.length}</span><button type="button" aria-label={pickLang(language,{ru:'Следующее фото',en:'Next photo',th:'รูปถัดไป'})} onClick={() => setActive(Math.min(available.length - 1, current + 1))} disabled={current === available.length - 1}><ChevronRight aria-hidden="true" /></button></>}
      <button type="button" onClick={() => onOpenLightbox(available[current].index)}>{pickLang(language,{ru:'Все фото',en:'All photos',th:'รูปภาพทั้งหมด'})}</button>
    </div>
  </section>;
}
