/**
 * useImagePreload - Preload critical images for better LCP
 */

import { useEffect, useState, useCallback } from 'react';

interface PreloadOptions {
  priority?: boolean;
  timeout?: number;
}

export function useImagePreload(src: string | undefined, options: PreloadOptions = {}) {
  const { priority = false, timeout = 5000 } = options;
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!src) return;

    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    const img = new Image();
    
    if (priority) {
      img.fetchPriority = 'high';
    }

    img.onload = () => {
      if (isMounted) {
        setIsLoaded(true);
        setError(null);
      }
    };

    img.onerror = () => {
      if (isMounted) {
        setError(new Error(`Failed to load image: ${src}`));
      }
    };

    // Timeout fallback
    timeoutId = setTimeout(() => {
      if (isMounted && !isLoaded) {
        setError(new Error('Image load timeout'));
      }
    }, timeout);

    img.src = src;

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [src, priority, timeout, isLoaded]);

  return { isLoaded, error };
}

// Preload multiple images
export function useImagesPreload(srcs: string[], options: PreloadOptions = {}) {
  const [loadedCount, setLoadedCount] = useState(0);
  const [errors, setErrors] = useState<Record<string, Error>>({});

  useEffect(() => {
    if (srcs.length === 0) return;

    let isMounted = true;

    srcs.forEach(src => {
      const img = new Image();
      
      if (options.priority) {
        img.fetchPriority = 'high';
      }

      img.onload = () => {
        if (isMounted) {
          setLoadedCount(c => c + 1);
        }
      };

      img.onerror = () => {
        if (isMounted) {
          setErrors(e => ({ ...e, [src]: new Error(`Failed: ${src}`) }));
        }
      };

      img.src = src;
    });

    return () => {
      isMounted = false;
    };
  }, [srcs.join(','), options.priority]);

  return {
    loadedCount,
    totalCount: srcs.length,
    isComplete: loadedCount >= srcs.length,
    errors,
    progress: srcs.length > 0 ? loadedCount / srcs.length : 1,
  };
}

// Add preload link to head for critical images
export function preloadCriticalImage(src: string) {
  if (typeof document === 'undefined') return;
  
  const existing = document.querySelector(`link[href="${src}"]`);
  if (existing) return;

  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = src;
  document.head.appendChild(link);
}

// Hook for adding preload links
export function useCriticalImagePreload(srcs: string[]) {
  useEffect(() => {
    srcs.forEach(preloadCriticalImage);
  }, [srcs.join(',')]);
}
