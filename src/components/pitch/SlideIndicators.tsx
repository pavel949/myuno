import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SlideIndicatorsProps {
  totalSlides: number;
  currentSlide: number;
  onSlideClick: (index: number) => void;
  visible: boolean;
}

export function SlideIndicators({ totalSlides, currentSlide, onSlideClick, visible }: SlideIndicatorsProps) {
  if (!visible) return null;

  return (
    <div className="fixed right-6 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-2">
      {Array.from({ length: totalSlides }).map((_, index) => (
        <motion.button
          key={index}
          onClick={() => onSlideClick(index)}
          className={cn(
            "w-2 h-2 rounded-full transition-all duration-300",
            index === currentSlide 
              ? "bg-primary w-2 h-6" 
              : "bg-white/40 hover:bg-white/60"
          )}
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.9 }}
          aria-label={`Go to slide ${index + 1}`}
        />
      ))}
    </div>
  );
}

interface SlideLabelsProps {
  labels: string[];
  currentSlide: number;
  onSlideClick: (index: number) => void;
  visible: boolean;
}

export function SlideLabels({ labels, currentSlide, onSlideClick, visible }: SlideLabelsProps) {
  if (!visible) return null;

  return (
    <div className="fixed left-6 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-1">
      {labels.map((label, index) => (
        <motion.button
          key={index}
          onClick={() => onSlideClick(index)}
          className={cn(
            "text-xs text-left px-2 py-1 rounded transition-all duration-300",
            index === currentSlide 
              ? "bg-primary/20 text-primary font-medium" 
              : "text-white/40 hover:text-white/60 hover:bg-white/10"
          )}
          whileHover={{ x: 4 }}
        >
          {label}
        </motion.button>
      ))}
    </div>
  );
}
