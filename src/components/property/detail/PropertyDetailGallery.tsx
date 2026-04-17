/**
 * PropertyDetailGallery — Airbnb-style image grid for the property detail page.
 * 5+ images: 2-column hero + 4 thumbs grid. Fewer: single image with thumbnail strip.
 */
import { useState } from 'react';
import { Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface PropertyDetailGalleryProps {
  images: string[];
  alt: string;
  onOpenLightbox: (startIndex: number) => void;
}

export function PropertyDetailGallery({ images, alt, onOpenLightbox }: PropertyDetailGalleryProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const [activeImage, setActiveImage] = useState(0);

  if (images.length === 0) return null;

  return (
    <div className="relative">
      {images.length >= 5 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 grid-rows-2 gap-2 h-[50vh] min-h-[300px] max-h-[500px]">
          <div
            className="col-span-2 row-span-2 relative cursor-pointer overflow-hidden rounded-l-xl"
            onClick={() => onOpenLightbox(0)}
          >
            <img
              src={images[0]}
              alt={alt}
              className="w-full h-full object-cover hover:scale-[1.03] transition-transform duration-300"
            />
          </div>
          {images.slice(1, 5).map((img, i) => (
            <div
              key={i}
              className={cn(
                'relative cursor-pointer overflow-hidden',
                i === 1 && 'rounded-tr-xl',
                i === 3 && 'rounded-br-xl',
              )}
              onClick={() => onOpenLightbox(i + 1)}
            >
              <img
                src={img}
                alt=""
                className="w-full h-full object-cover hover:scale-[1.03] transition-transform duration-300"
              />
              {i === 3 && images.length > 5 && (
                <div className="absolute inset-0 bg-foreground/40 flex items-center justify-center">
                  <span className="text-background font-medium">+{images.length - 5}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div>
          <div
            className="aspect-[16/10] overflow-hidden cursor-pointer"
            onClick={() => onOpenLightbox(activeImage)}
          >
            <img
              src={images[activeImage] || images[0]}
              alt={alt}
              className="w-full h-full object-contain bg-muted hover:scale-[1.03] transition-transform duration-300"
            />
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 p-3 overflow-x-auto bg-background/50">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={cn(
                    'w-16 h-12 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all',
                    activeImage === i
                      ? 'border-primary ring-2 ring-primary/30'
                      : 'border-transparent opacity-70 hover:opacity-100',
                  )}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <button
        onClick={() => onOpenLightbox(0)}
        className="absolute bottom-4 right-4 px-3 py-1.5 bg-background/90 backdrop-blur-sm rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-background transition-colors"
      >
        <Eye className="w-4 h-4" />
        {images.length} {isRu ? 'фото' : 'photos'}
      </button>
    </div>
  );
}
