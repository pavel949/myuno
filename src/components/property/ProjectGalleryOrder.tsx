import { ArrowDown, ArrowUp, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { pickLang } from '@/lib/i18n/pickLang';
import { publicProjectMediaUrl, reorderProjectImages } from '@/lib/real-estate/projectEditorialMedia';

export function ProjectGalleryOrder({ images, cover, language, onChange, onCover }: {
  images: string[];
  cover?: string | null;
  language: Parameters<typeof pickLang>[0];
  onChange: (images: string[]) => void;
  onCover: (image: string) => void;
}) {
  if (!images.length) return null;
  const title = pickLang(language, { ru: 'Порядок фотографий', en: 'Photo order', th: 'ลำดับรูปภาพ' });
  const earlier = pickLang(language, { ru: 'Выше', en: 'Move earlier', th: 'เลื่อนขึ้น' });
  const later = pickLang(language, { ru: 'Ниже', en: 'Move later', th: 'เลื่อนลง' });
  const makeCover = pickLang(language, { ru: 'Сделать обложкой', en: 'Set as cover', th: 'ตั้งเป็นภาพปก' });
  const isCover = pickLang(language, { ru: 'Обложка', en: 'Cover', th: 'ภาพปก' });
  return (
    <ol aria-label={title} className="space-y-2">
      {images.map((image, index) => {
        const url = publicProjectMediaUrl(image);
        const imageLabel = pickLang(language, { ru: `Фото ${index + 1}`, en: `Photo ${index + 1}`, th: `รูปภาพ ${index + 1}` });
        return (
          <li key={image} className="flex flex-wrap items-center gap-2 border p-2">
            {url ? <img src={url} alt="" loading="lazy" className="h-11 w-14 object-cover" /> : <ImageIcon aria-hidden="true" />}
            <span className="mr-auto text-sm">{imageLabel}</span>
            <Button type="button" size="icon" variant="outline" className="min-h-11 min-w-11" aria-label={`${earlier}: ${imageLabel}`}
              disabled={index === 0} onClick={() => onChange(reorderProjectImages(images, index, -1))}><ArrowUp aria-hidden="true" /></Button>
            <Button type="button" size="icon" variant="outline" className="min-h-11 min-w-11" aria-label={`${later}: ${imageLabel}`}
              disabled={index === images.length - 1} onClick={() => onChange(reorderProjectImages(images, index, 1))}><ArrowDown aria-hidden="true" /></Button>
            <Button type="button" size="sm" variant="secondary" className="min-h-11" disabled={!url || cover === image}
              aria-label={`${cover === image ? isCover : makeCover}: ${imageLabel}`} onClick={() => onCover(image)}>{cover === image ? isCover : makeCover}</Button>
          </li>
        );
      })}
    </ol>
  );
}
