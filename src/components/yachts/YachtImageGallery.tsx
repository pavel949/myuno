import React, { useState, useCallback, useEffect } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { Share2, Heart, Shield, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { PLACEHOLDER_IMAGES } from '@/lib/config/placeholders';
import { BackButton } from '@/components/uno/BackButton';
import { useLanguage } from '@/contexts/LanguageContext';

interface YachtImageGalleryProps {
  images: string[];
  name: string;
  isVerified?: boolean;
  isFeatured?: boolean;
}

export function YachtImageGallery({ images, name, isVerified, isFeatured }: YachtImageGalleryProps) {
  const { language } = useLanguage();
  const [currentImage, setCurrentImage] = useState(0);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false });

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCurrentImage(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on('select', onSelect);
    return () => { emblaApi.off('select', onSelect); };
  }, [emblaApi, onSelect]);

  return (
    <div className="relative h-72 md:h-96">
      <div className="overflow-hidden h-full" ref={emblaRef}>
        <div className="flex h-full">
          {images.map((img, idx) => (
            <div key={idx} className="flex-[0_0_100%] min-w-0 h-full">
              <img
                src={img}
                alt={`${name} ${idx + 1}`}
                className="w-full h-full object-cover select-none"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (!target.dataset.fallback) {
                    target.dataset.fallback = '1';
                    target.src = PLACEHOLDER_IMAGES.yacht;
                  }
                }}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="absolute top-4 left-4">
        <BackButton fallbackPath="/yachts" variant="overlay" />
      </div>

      <div className="absolute top-4 right-4 flex gap-2">
        <button className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center text-white">
          <Share2 className="w-5 h-5" />
        </button>
        <button className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center text-white">
          <Heart className="w-5 h-5" />
        </button>
      </div>

      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
          {images.slice(0, 10).map((_, idx) => (
            <button
              key={idx}
              onClick={() => emblaApi?.scrollTo(idx)}
              className={`w-2 h-2 rounded-full transition-all ${idx === currentImage ? 'bg-white w-4' : 'bg-white/50'}`}
            />
          ))}
          {images.length > 10 && <span className="text-white/70 text-xs ml-1">+{images.length - 10}</span>}
        </div>
      )}

      <div className="absolute bottom-4 left-4 flex gap-2">
        {isVerified && (
          <Badge className="bg-primary text-primary-foreground">
            <Shield className="w-3 h-3 mr-1" />{language === 'ru' ? 'Проверено' : 'Verified'}
          </Badge>
        )}
        {isFeatured && (
          <Badge className="bg-accent-amber text-white">
            <Star className="w-3 h-3 mr-1" />{language === 'ru' ? 'Рекомендуем' : 'Featured'}
          </Badge>
        )}
      </div>
    </div>
  );
}
