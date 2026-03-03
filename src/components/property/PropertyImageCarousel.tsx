import React, { useState, useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PropertyImageCarouselProps {
  images: string[];
  alt?: string;
  className?: string;
  isHovered?: boolean;
  /** Aspect ratio class, default aspect-square */
  aspectClass?: string;
}

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=600';

export function PropertyImageCarousel({
  images,
  alt = '',
  className,
  isHovered,
  aspectClass = 'aspect-square',
}: PropertyImageCarouselProps) {
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

  const scrollPrev = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    emblaApi?.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    emblaApi?.scrollNext();
  }, [emblaApi]);

  // Single image — no carousel
  if (allImages.length === 1) {
    return (
      <div className={cn(aspectClass, "rounded-xl overflow-hidden", className)}>
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
    <div className={cn(aspectClass, "rounded-xl overflow-hidden relative group/carousel", className)}>
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

      {/* Airbnb-style navigation arrows — visible on hover */}
      {allImages.length > 1 && (
        <>
          <button
            onClick={scrollPrev}
            className={cn(
              "absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/90 shadow-md",
              "flex items-center justify-center",
              "opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-200",
              "hover:bg-background hover:shadow-lg hover:scale-105",
              "disabled:opacity-0",
              selectedIndex === 0 && "hidden"
            )}
            aria-label="Previous"
          >
            <ChevronLeft className="w-4 h-4 text-foreground" />
          </button>
          <button
            onClick={scrollNext}
            className={cn(
              "absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/90 shadow-md",
              "flex items-center justify-center",
              "opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-200",
              "hover:bg-background hover:shadow-lg hover:scale-105",
              "disabled:opacity-0",
              selectedIndex === allImages.length - 1 && "hidden"
            )}
            aria-label="Next"
          >
            <ChevronRight className="w-4 h-4 text-foreground" />
          </button>
        </>
      )}

      {/* Dots */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
        {allImages.slice(0, 5).map((_, i) => (
          <button
            key={i}
            className={cn(
              "rounded-full transition-all",
              selectedIndex === i
                ? "bg-white w-[6px] h-[6px]"
                : "bg-white/50 w-[5px] h-[5px]"
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
