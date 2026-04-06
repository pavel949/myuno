import React, { useState, useCallback, useRef } from 'react';
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

import { PLACEHOLDER_IMAGES } from '@/lib/config/placeholders';

const FALLBACK_IMAGE = PLACEHOLDER_IMAGES.property;

/**
 * Lazy carousel: renders a single static image on mount for fast LCP.
 * Carousel initializes only after user interaction (touch/mouse-enter).
 */
export function PropertyImageCarousel({
  images,
  alt = '',
  className,
  isHovered,
  aspectClass = 'aspect-[4/5] sm:aspect-square',
}: PropertyImageCarouselProps) {
  const allImages = images.length > 0 ? images : [FALLBACK_IMAGE];
  const [carouselActive, setCarouselActive] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const activatedRef = useRef(false);

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, dragFree: false });

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

  const activateCarousel = useCallback(() => {
    if (!activatedRef.current) {
      activatedRef.current = true;
      setCarouselActive(true);
    }
  }, []);

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

  const hasMultiple = allImages.length > 1;

  // Static cover image — fast initial render
  if (!carouselActive || !hasMultiple) {
    return (
      <div
        className={cn(aspectClass, "rounded-lg sm:rounded-xl overflow-hidden relative", hasMultiple && "group/carousel", className)}
        onMouseEnter={hasMultiple ? activateCarousel : undefined}
        onTouchStart={hasMultiple ? activateCarousel : undefined}
      >
        <img
          src={allImages[0]}
          alt={alt}
          className={cn(
            "w-full h-full object-cover transition-transform duration-300",
            isHovered && "scale-[1.03]"
          )}
          loading="lazy"
          decoding="async"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
        {hasMultiple && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {allImages.slice(0, 5).map((_, i) => (
              <span key={i} className={cn("rounded-full", i === 0 ? "bg-white w-[6px] h-[6px]" : "bg-white/50 w-[5px] h-[5px]")} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn(aspectClass, "rounded-lg sm:rounded-xl overflow-hidden relative group/carousel", className)}>
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
                decoding="async"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Navigation arrows */}
      <button
        onClick={scrollPrev}
        className={cn(
          "absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/90 shadow-md",
          "flex items-center justify-center",
          "opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-200",
          "hover:bg-background hover:shadow-lg hover:scale-105",
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
          selectedIndex === allImages.length - 1 && "hidden"
        )}
        aria-label="Next"
      >
        <ChevronRight className="w-4 h-4 text-foreground" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
        {allImages.slice(0, 5).map((_, i) => (
          <button
            key={i}
            className={cn(
              "rounded-full transition-all",
              selectedIndex === i ? "bg-white w-[6px] h-[6px]" : "bg-white/50 w-[5px] h-[5px]"
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
