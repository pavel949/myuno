import { useState } from 'react';
import '@/styles/premium-public.css';
import { ChevronLeft, ChevronRight, ImageOff } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
interface PropertyDetailGalleryProps { images: string[]; alt: string; onOpenLightbox: (startIndex: number) => void }
/** One large photograph and two supporting photographs; mobile uses one image at a time. */
export function PropertyDetailGallery({ images, alt, onOpenLightbox }: PropertyDetailGalleryProps) {
  const { language } = useLanguage(); const isRu = language === 'ru';
  const [active, setActive] = useState(0);
  const [failed, setFailed] = useState<Set<string>>(() => new Set());
  const available = images.map((src, index) => ({ src, index })).filter(image => image.src && !failed.has(image.src));
  const current = Math.min(active, Math.max(available.length - 1, 0));
  if (!available.length) return <div className="premium-gallery-empty" role="status"><ImageOff aria-hidden="true" /><p>{isRu ? 'Фотографии пока не опубликованы' : 'Photos have not been published yet'}</p></div>;
  const visible = [available[current], ...available.filter((_, index) => index !== current).slice(0, 2)];
  return <section aria-label={isRu ? 'Фотографии объекта' : 'Property photos'}>
    <div className={`premium-gallery${available.length === 2 ? ' premium-gallery--two' : ''}`}>
      {visible.map((image, i) => <button key={`${i}-${image.src}`} type="button" aria-label={isRu ? `Открыть фото ${image.index + 1}` : `Open photo ${image.index + 1}`} onClick={() => onOpenLightbox(image.index)}>
        <img src={image.src} alt={i === 0 ? alt : `${alt} · ${isRu ? 'фото' : 'photo'} ${image.index + 1}`} loading={i === 0 ? 'eager' : 'lazy'} onError={() => setFailed(previous => new Set(previous).add(image.src))} />
      </button>)}
      <span className="premium-gallery-count">{available.length} {isRu ? 'фото' : 'photos'}</span>
    </div>
    <div className="premium-gallery-thumbs">
      {available.length > 1 && <><button type="button" aria-label={isRu ? 'Предыдущее фото' : 'Previous photo'} onClick={() => setActive(Math.max(0, current - 1))} disabled={current === 0}><ChevronLeft aria-hidden="true" /></button><span aria-live="polite">{current + 1} / {available.length}</span><button type="button" aria-label={isRu ? 'Следующее фото' : 'Next photo'} onClick={() => setActive(Math.min(available.length - 1, current + 1))} disabled={current === available.length - 1}><ChevronRight aria-hidden="true" /></button></>}
      <button type="button" onClick={() => onOpenLightbox(available[current].index)}>{isRu ? 'Все фото' : 'All photos'}</button>
    </div>
  </section>;
}
