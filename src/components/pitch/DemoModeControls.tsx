import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Pause, 
  ChevronLeft, 
  ChevronRight, 
  Maximize2, 
  Minimize2,
  Timer,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DemoModeControlsProps {
  isPlaying: boolean;
  isFullscreen: boolean;
  currentSlide: number;
  totalSlides: number;
  slideInterval: number;
  onPlayPause: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onFullscreenToggle: () => void;
  onIntervalChange: (interval: number) => void;
  onExitDemo: () => void;
  visible: boolean;
  progress: number;
}

const SPEED_OPTIONS = [
  { label: 'Slow', value: 12000 },
  { label: 'Normal', value: 8000 },
  { label: 'Fast', value: 5000 },
];

export function DemoModeControls({
  isPlaying,
  isFullscreen,
  currentSlide,
  totalSlides,
  slideInterval,
  onPlayPause,
  onPrevious,
  onNext,
  onFullscreenToggle,
  onIntervalChange,
  onExitDemo,
  visible,
  progress
}: DemoModeControlsProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
        >
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4 shadow-2xl">
            {/* Progress bar */}
            <div className="w-full h-1 bg-white/20 rounded-full mb-4 overflow-hidden">
              <motion.div
                className="h-full bg-primary rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            <div className="flex items-center gap-4">
              {/* Exit button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={onExitDemo}
                className="text-white hover:bg-white/20"
              >
                <X className="h-5 w-5" />
              </Button>

              {/* Navigation */}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onPrevious}
                  className="text-white hover:bg-white/20"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onPlayPause}
                  className="text-white hover:bg-white/20 h-12 w-12"
                >
                  {isPlaying ? (
                    <Pause className="h-6 w-6" />
                  ) : (
                    <Play className="h-6 w-6" />
                  )}
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onNext}
                  className="text-white hover:bg-white/20"
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>

              {/* Slide counter */}
              <div className="text-white text-sm font-medium min-w-[60px] text-center">
                {currentSlide + 1} / {totalSlides}
              </div>

              {/* Speed selector */}
              <div className="flex items-center gap-1 border-l border-white/20 pl-4">
                <Timer className="h-4 w-4 text-white/60" />
                {SPEED_OPTIONS.map((option) => (
                  <Button
                    key={option.value}
                    variant="ghost"
                    size="sm"
                    onClick={() => onIntervalChange(option.value)}
                    className={cn(
                      "text-xs text-white/60 hover:text-white hover:bg-white/20",
                      slideInterval === option.value && "bg-white/20 text-white"
                    )}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>

              {/* Fullscreen toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={onFullscreenToggle}
                className="text-white hover:bg-white/20 border-l border-white/20 pl-4"
              >
                {isFullscreen ? (
                  <Minimize2 className="h-5 w-5" />
                ) : (
                  <Maximize2 className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
