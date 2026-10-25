/**
 * PhotoLightbox - Fullscreen photo gallery viewer (Airbnb-style)
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Dialog, DialogClose, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface PhotoLightboxProps {
  images: string[];
  initialIndex?: number;
  open: boolean;
  onClose: () => void;
  /** Optional per-image captions (same order as `images`), Airbnb-style. */
  captions?: Array<string | null | undefined>;
  /** Optional per-image alt text; falls back to the caption, then a generic label. */
  alts?: Array<string | null | undefined>;
}

export function PhotoLightbox({
  images,
  initialIndex = 0,
  open,
  onClose,
  captions,
  alts,
}: PhotoLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const openerRef = useRef<HTMLElement | null>(null);


  useEffect(() => {
    if (open) setCurrentIndex(initialIndex);
  }, [open, initialIndex]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') setCurrentIndex(i => Math.min(i + 1, images.length - 1));
      if (e.key === 'ArrowLeft') setCurrentIndex(i => Math.max(i - 1, 0));
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, images.length, onClose]);

  // Shared Dialog owns scroll locking, focus containment and Escape dismissal.

  const goNext = useCallback(() => setCurrentIndex(i => Math.min(i + 1, images.length - 1)), [images.length]);
  const goPrev = useCallback(() => setCurrentIndex(i => Math.max(i - 1, 0)), []);

  if (!open || images.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose(); }}>
    <DialogContent
      hideCloseButton
      className="fixed left-0 top-0 right-0 bottom-0 flex h-dvh w-screen max-h-none max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden border-0 bg-media-canvas p-0 sm:p-0 [box-shadow:none] data-[state=open]:!animate-none data-[state=closed]:!animate-none"
      onOpenAutoFocus={() => {
        openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      }}
      onCloseAutoFocus={(event) => {
        event.preventDefault();
        const opener = openerRef.current;
        if (opener?.isConnected && !opener.closest('[inert], [hidden]')) opener.focus();
      }}
    >
      <DialogTitle className="sr-only">{isRu ? 'Просмотр фотографий' : 'Photo viewer'}</DialogTitle>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 text-media-foreground/90">
        <DialogClose asChild><button aria-label={isRu ? 'Закрыть' : 'Close'} className="flex min-h-[var(--touch-target)] min-w-[var(--touch-target)] items-center justify-center p-2 rounded-full hover:bg-media-foreground/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-media-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-media-canvas">
          <X className="w-6 h-6" />
        </button></DialogClose>
        <span className="text-sm font-medium">
          {currentIndex + 1} / {images.length}
        </span>
        <div className="w-[var(--touch-target)]" /> {/* spacer */}
      </div>

      {/* Main image area */}
      <div className="flex-1 relative flex items-center justify-center min-h-0 px-4">
        {/* Prev button */}
        {currentIndex > 0 && (
          <button
            onClick={goPrev}
            aria-label={isRu ? 'Назад' : 'Previous'}
            className="absolute left-4 z-10 flex min-h-[var(--touch-target)] min-w-[var(--touch-target)] items-center justify-center p-2 rounded-full bg-media-canvas/60 hover:bg-media-canvas/75 transition-colors text-media-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-media-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-media-canvas"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* Image */}
        <img
          src={images[currentIndex]}
          alt={
            alts?.[currentIndex] ||
            captions?.[currentIndex] ||
            `${isRu ? 'Фото' : 'Photo'} ${currentIndex + 1}`
          }
          className="max-h-full max-w-full object-contain select-none"
          draggable={false}
        />


        {/* Next button */}
        {currentIndex < images.length - 1 && (
          <button
            onClick={goNext}
            aria-label={isRu ? 'Вперёд' : 'Next'}
            className="absolute right-4 z-10 flex min-h-[var(--touch-target)] min-w-[var(--touch-target)] items-center justify-center p-2 rounded-full bg-media-canvas/60 hover:bg-media-canvas/75 transition-colors text-media-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-media-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-media-canvas"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Caption for the current photo (room tag / description) */}
      {captions?.[currentIndex] && (
        <p className="px-6 pt-3 text-center text-sm text-media-foreground/80">{captions[currentIndex]}</p>
      )}

      {/* Thumbnail strip */}

      <div className="px-4 py-3 overflow-x-auto scrollbar-hide touch-pan-y">
        <div className="flex gap-2 justify-center">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              aria-label={isRu ? `Фото ${i + 1} из ${images.length}` : `Photo ${i + 1} of ${images.length}`}
              aria-current={currentIndex === i ? 'true' : undefined}
              className={cn(
                "w-16 h-12 rounded-none overflow-hidden flex-shrink-0 border-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-media-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-media-canvas",
                currentIndex === i
                  ? "border-media-foreground opacity-100 ring-2 ring-media-foreground/30"
                  : "border-transparent opacity-50 hover:opacity-80"
              )}
            >
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      </div>
    </DialogContent>
    </Dialog>
  );
}
