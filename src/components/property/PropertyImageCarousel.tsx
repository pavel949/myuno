import React, { useState, useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { cn } from '@/lib/utils';

interface PropertyImageCarouselProps {
  images: string[];
  alt?: string;
  className?: string;
  isHovered?: boolean;
}

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=600';

export function PropertyImageCarousel({ images, alt = '', className, isHovered }: PropertyImageCarouselProps) {
  const allImages = images.length > 0 ? images : [FALLBACK_IMAGE];
  const [selectedIndex, setSelectedIndex] = useState(0);

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    dragFree: false,
  });

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  React.useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on('select', onSelect);
    onSelect();
    return () => { emblaApi.off('select', onSelect); };
  }, [emblaApi, onSelect]);

  // Only show carousel if more than 1 image
  if (allImages.length === 1) {
    return (
      <div className={cn("aspect-square rounded-2xl overflow-hidden", className)}>
        <img
          src={allImages[0]}
          alt={alt}
          className={cn(
            "w-full h-full object-cover transition-transform duration-300",
            isHovered && "scale-[1.03]"
          )}
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <div className={cn("aspect-square rounded-2xl overflow-hidden relative group/carousel", className)}>
      <div ref={emblaRef} className="overflow-hidden h-full">
        <div className="flex h-full">
          {allImages.slice(0, 5).map((img, i) => (
            <div key={i} className="flex-[0_0_100%] min-w-0 h-full">
              <img
                src={img}
                alt={`${alt} ${i + 1}`}
                className={cn(
                  "w-full h-full object-cover transition-transform duration-300",
                  isHovered && "scale-[1.03]"
                )}
                loading={i === 0 ? 'eager' : 'lazy'}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Dots */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
        {allImages.slice(0, 5).map((_, i) => (
          <button
            key={i}
            className={cn(
              "w-1.5 h-1.5 rounded-full transition-all",
              selectedIndex === i
                ? "bg-white w-2 h-2"
                : "bg-white/60"
            )}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              emblaApi?.scrollTo(i);
            }}
          />
        ))}
      </div>
    </div>
  );
}
