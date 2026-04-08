/**
 * PhotoLightbox - Fullscreen photo gallery viewer (Airbnb-style)
 */

import React, { useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface PhotoLightboxProps {
  images: string[];
  initialIndex?: number;
  open: boolean;
  onClose: () => void;
}

export function PhotoLightbox({ images, initialIndex = 0, open, onClose }: PhotoLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const { language } = useLanguage();
  const isRu = language === 'ru';

  useEffect(() => {
    if (open) setCurrentIndex(initialIndex);
  }, [open, initialIndex]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setCurrentIndex(i => Math.min(i + 1, images.length - 1));
      if (e.key === 'ArrowLeft') setCurrentIndex(i => Math.max(i - 1, 0));
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, images.length, onClose]);

  // Lock body scroll
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [open]);

  const goNext = useCallback(() => setCurrentIndex(i => Math.min(i + 1, images.length - 1)), [images.length]);
  const goPrev = useCallback(() => setCurrentIndex(i => Math.max(i - 1, 0)), []);

  if (!open || images.length === 0) return null;

  return createPortal(
    <div className="fixed inset-0 z-modal bg-black flex flex-col" role="dialog" aria-modal="true">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 text-white/90">
        <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors">
          <X className="w-6 h-6" />
        </button>
        <span className="text-sm font-medium">
          {currentIndex + 1} / {images.length}
        </span>
        <div className="w-10" /> {/* spacer */}
      </div>

      {/* Main image area */}
      <div className="flex-1 relative flex items-center justify-center min-h-0 px-4">
        {/* Prev button */}
        {currentIndex > 0 && (
          <button
            onClick={goPrev}
            className="absolute left-4 z-10 p-2 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors text-white"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* Image */}
        <img
          src={images[currentIndex]}
          alt={`${isRu ? 'Фото' : 'Photo'} ${currentIndex + 1}`}
          className="max-h-full max-w-full object-contain select-none"
          draggable={false}
        />

        {/* Next button */}
        {currentIndex < images.length - 1 && (
          <button
            onClick={goNext}
            className="absolute right-4 z-10 p-2 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors text-white"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Thumbnail strip */}
      <div className="px-4 py-3 overflow-x-auto scrollbar-hide touch-pan-y">
        <div className="flex gap-2 justify-center">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={cn(
                "w-16 h-12 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all",
                currentIndex === i
                  ? "border-white opacity-100 ring-2 ring-white/30"
                  : "border-transparent opacity-50 hover:opacity-80"
              )}
            >
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
}
