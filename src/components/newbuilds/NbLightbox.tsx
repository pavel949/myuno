/**
 * NbLightbox — Fullscreen image viewer for newbuilds section
 * Supports keyboard navigation, swipe, and zoom
 */
import React, { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Download } from 'lucide-react';

interface Props {
  images: string[];
  initialIndex?: number;
  onClose: () => void;
  captions?: string[];
}

export function NbLightbox({ images, initialIndex = 0, onClose, captions }: Props) {
  const [index, setIndex] = useState(initialIndex);

  const goNext = useCallback(() => setIndex(i => (i + 1) % images.length), [images.length]);
  const goPrev = useCallback(() => setIndex(i => (i - 1 + images.length) % images.length), [images.length]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [onClose, goNext, goPrev]);

  // Touch swipe support
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.touches[0].clientX);
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const diff = e.changedTouches[0].clientX - touchStart;
    if (Math.abs(diff) > 60) {
      if (diff > 0) goPrev();
      else goNext();
    }
    setTouchStart(null);
  };

  if (!images.length) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.95)' }}
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 rounded-full transition-colors"
        style={{ background: 'hsl(var(--nb-gold) / 0.2)', color: 'hsl(var(--nb-gold))' }}
      >
        <X className="w-6 h-6" />
      </button>

      {/* Counter */}
      <div className="absolute top-4 left-4 z-10 nb-mono text-sm" style={{ color: 'hsl(var(--nb-muted))' }}>
        {index + 1} / {images.length}
      </div>

      {/* Download */}
      {images[index] && (
        <a
          href={images[index]}
          target="_blank"
          rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          className="absolute top-4 right-16 z-10 p-2 rounded-full transition-colors"
          style={{ background: 'hsl(var(--nb-gold) / 0.2)', color: 'hsl(var(--nb-gold))' }}
        >
          <Download className="w-5 h-5" />
        </a>
      )}

      {/* Image */}
      <div
        className="max-w-[90vw] max-h-[85vh] flex items-center justify-center"
        onClick={e => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <img
          src={images[index]}
          alt={captions?.[index] || `Image ${index + 1}`}
          className="max-w-full max-h-[85vh] object-contain rounded-lg select-none"
          draggable={false}
        />
      </div>

      {/* Caption */}
      {captions?.[index] && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 text-center max-w-lg px-4">
          <p className="text-sm" style={{ color: 'hsl(var(--nb-text-secondary))' }}>{captions[index]}</p>
        </div>
      )}

      {/* Navigation arrows */}
      {images.length > 1 && (
        <>
          <button
            onClick={e => { e.stopPropagation(); goPrev(); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full transition-all hover:scale-110"
            style={{ background: 'hsl(var(--nb-gold) / 0.2)', color: 'hsl(var(--nb-gold))' }}
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={e => { e.stopPropagation(); goNext(); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full transition-all hover:scale-110"
            style={{ background: 'hsl(var(--nb-gold) / 0.2)', color: 'hsl(var(--nb-gold))' }}
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Thumbnails strip */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 max-w-[80vw] overflow-x-auto pb-1">
          {images.map((url, i) => (
            <button
              key={i}
              onClick={e => { e.stopPropagation(); setIndex(i); }}
              className="flex-shrink-0 w-12 h-9 rounded overflow-hidden transition-all"
              style={{
                border: i === index ? '2px solid hsl(var(--nb-gold))' : '2px solid transparent',
                opacity: i === index ? 1 : 0.5,
              }}
            >
              <img src={url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
