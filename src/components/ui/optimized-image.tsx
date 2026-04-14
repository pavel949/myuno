/**
 * OptimizedImage - Performance-optimized image component
 * Features: lazy loading, srcset for responsive images, WebP format, skeleton placeholder
 */

import { useState, useRef, useEffect, memo, forwardRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { PLACEHOLDER_IMAGES } from '@/lib/config/placeholders';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  aspectRatio?: '1:1' | '4:3' | '16:9' | '3:4' | 'auto';
  priority?: boolean;
  quality?: number;
  sizes?: string;
  style?: React.CSSProperties;
  onLoad?: () => void;
  onError?: () => void;
  fallback?: string;
}

// Derive project ID from the Supabase URL env var instead of hardcoding
const SUPABASE_PROJECT_ID = (() => {
  try {
    const url = import.meta.env.VITE_SUPABASE_URL || '';
    const match = url.match(/https:\/\/([^.]+)\.supabase\.co/);
    return match?.[1] || '';
  } catch {
    return '';
  }
})();
const WIDTHS = [320, 640, 960, 1280, 1920];

function isSupabaseStorageUrl(url: string): boolean {
  return SUPABASE_PROJECT_ID !== '' && url.includes(SUPABASE_PROJECT_ID) && url.includes('/storage/v1/object/public/');
}

function generateSupabaseSrcSet(_url: string, _quality: number = 80): string {
  // Disabled: render/image endpoint requires Pro plan
  return '';
}

function getOptimizedUrl(url: string, _width: number, _quality: number = 80): string {
  // Disabled: render/image endpoint requires Pro plan
  return url;
}

const aspectRatioClasses = {
  '1:1': 'aspect-square',
  '4:3': 'aspect-[4/3]',
  '16:9': 'aspect-video',
  '3:4': 'aspect-[3/4]',
  'auto': '',
};

export const OptimizedImage = memo(forwardRef<HTMLDivElement, OptimizedImageProps>(
  function OptimizedImage({
    src,
    alt,
    width,
    height,
    className,
    style,
    aspectRatio = 'auto',
    priority = false,
    quality = 80,
    sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
    onLoad,
    onError,
    fallback = PLACEHOLDER_IMAGES.imageFallback,
  }: OptimizedImageProps, forwardedRef) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Combine refs for container
  const setRefs = useCallback((node: HTMLDivElement | null) => {
    containerRef.current = node;
    if (typeof forwardedRef === 'function') {
      forwardedRef(node);
    } else if (forwardedRef) {
      forwardedRef.current = node;
    }
  }, [forwardedRef]);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || isInView) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px', threshold: 0 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [priority, isInView]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  const imageSrc = hasError ? fallback : src;
  const srcSet = isSupabaseStorageUrl(imageSrc) ? generateSupabaseSrcSet(imageSrc, quality) : undefined;
  const optimizedSrc = width && isSupabaseStorageUrl(imageSrc) 
    ? getOptimizedUrl(imageSrc, width, quality) 
    : imageSrc;

  return (
    <div 
      ref={setRefs}
      className={cn(
        'relative overflow-hidden bg-muted',
        aspectRatioClasses[aspectRatio],
        className
      )}
      style={style || (aspectRatio === 'auto' && height && width ? { aspectRatio: `${width}/${height}` } : undefined)}
    >
      {/* Skeleton placeholder */}
      {!isLoaded && (
        <Skeleton className="absolute inset-0 w-full h-full" />
      )}
      
      {/* Actual image */}
      {isInView && (
        <img
          ref={imgRef}
          src={optimizedSrc}
          srcSet={srcSet}
          sizes={sizes}
          alt={alt}
          width={width}
          height={height}
          loading={priority ? 'eager' : 'lazy'}
          decoding={priority ? 'sync' : 'async'}
          // @ts-expect-error - fetchpriority is valid HTML but not in React types
          fetchpriority={priority ? 'high' : 'auto'}
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            'w-full h-full object-cover transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0'
          )}
        />
      )}
    </div>
  );
}));

// Simplified version for thumbnails
export const OptimizedThumbnail = memo(function OptimizedThumbnail({
  src,
  alt,
  size = 80,
  className,
  rounded = 'lg',
}: {
  src: string;
  alt: string;
  size?: number;
  className?: string;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
}) {
  const roundedClasses = {
    none: '',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    full: 'rounded-full',
  };

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={size}
      height={size}
      aspectRatio="1:1"
      quality={75}
      sizes={`${size}px`}
      className={cn(roundedClasses[rounded], className)}
      style={{ width: size, height: size }}
    />
  );
});

// Hero image with priority loading
export const OptimizedHeroImage = memo(function OptimizedHeroImage({
  src,
  alt,
  className,
  overlay = false,
}: {
  src: string;
  alt: string;
  className?: string;
  overlay?: boolean;
}) {
  return (
    <div className={cn('relative', className)}>
      <OptimizedImage
        src={src}
        alt={alt}
        aspectRatio="16:9"
        priority
        quality={85}
        sizes="100vw"
        className="w-full"
      />
      {overlay && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      )}
    </div>
  );
});
