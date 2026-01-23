import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence, PanInfo, useAnimation } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Play, 
  Pause,
  Maximize2,
  Minimize2,
  MoreVertical
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  HeroSlide,
  ProblemSlide,
  SolutionSlide,
  MarketSlide,
  ProductSlide,
  TractionSlide,
  CompetitorSlide,
  BusinessModelSlide,
  FinancialsSlide,
  TeamAskSlide,
} from './slides';

const SLIDE_LABELS_EN = [
  'Intro', 'Problem', 'Solution', 'Market', 'Product',
  'Traction', 'Competition', 'Business', 'Financials', 'Ask'
];

const SLIDE_LABELS_RU = [
  'Интро', 'Проблема', 'Решение', 'Рынок', 'Продукт',
  'Трекшн', 'Конкуренты', 'Модель', 'Финансы', 'Запрос'
];

const TOTAL_SLIDES = 10;
const AUTO_PLAY_INTERVAL = 8000;
const SWIPE_THRESHOLD = 50;

interface MobilePitchDeckProps {
  isRussian: boolean;
  onExit: () => void;
}

export function MobilePitchDeck({ isRussian, onExit }: MobilePitchDeckProps) {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const controls = useAnimation();
  
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showSlideMenu, setShowSlideMenu] = useState(false);
  const [lastInteraction, setLastInteraction] = useState(Date.now());

  const labels = isRussian ? SLIDE_LABELS_RU : SLIDE_LABELS_EN;

  // Auto-hide controls on mobile
  useEffect(() => {
    if (!isMobile) return;
    
    const timer = setInterval(() => {
      if (Date.now() - lastInteraction > 3000 && !showSlideMenu) {
        setShowControls(false);
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [isMobile, lastInteraction, showSlideMenu]);

  // Auto-play
  useEffect(() => {
    if (!isPlaying) return;
    
    const timer = setInterval(() => {
      goToNext();
    }, AUTO_PLAY_INTERVAL);
    
    return () => clearInterval(timer);
  }, [isPlaying, currentSlide]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          goToPrevious();
          break;
        case 'ArrowRight':
        case ' ':
          e.preventDefault();
          goToNext();
          break;
        case 'Escape':
          if (isFullscreen) {
            document.exitFullscreen?.();
          } else {
            onExit();
          }
          break;
        case 'f':
        case 'F':
          toggleFullscreen();
          break;
        case 'p':
        case 'P':
          setIsPlaying(p => !p);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // Fullscreen listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleInteraction = useCallback(() => {
    setLastInteraction(Date.now());
    setShowControls(true);
  }, []);

  const goToNext = useCallback(() => {
    setDirection(1);
    setCurrentSlide(s => (s + 1) % TOTAL_SLIDES);
    handleInteraction();
  }, [handleInteraction]);

  const goToPrevious = useCallback(() => {
    setDirection(-1);
    setCurrentSlide(s => (s - 1 + TOTAL_SLIDES) % TOTAL_SLIDES);
    handleInteraction();
  }, [handleInteraction]);

  const goToSlide = useCallback((index: number) => {
    setDirection(index > currentSlide ? 1 : -1);
    setCurrentSlide(index);
    setShowSlideMenu(false);
    handleInteraction();
  }, [currentSlide, handleInteraction]);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
    }
    handleInteraction();
  };

  // Swipe handling
  const handleDragEnd = useCallback((
    event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    const { offset, velocity } = info;
    
    if (Math.abs(offset.x) > SWIPE_THRESHOLD || Math.abs(velocity.x) > 500) {
      if (offset.x > 0) {
        goToPrevious();
      } else {
        goToNext();
      }
    }
    
    controls.start({ x: 0 });
  }, [controls, goToNext, goToPrevious]);

  const renderSlide = () => {
    const props = { isRussian };
    switch (currentSlide) {
      case 0: return <HeroSlide {...props} />;
      case 1: return <ProblemSlide {...props} />;
      case 2: return <SolutionSlide {...props} />;
      case 3: return <MarketSlide {...props} />;
      case 4: return <ProductSlide {...props} />;
      case 5: return <TractionSlide {...props} />;
      case 6: return <CompetitorSlide {...props} />;
      case 7: return <BusinessModelSlide {...props} />;
      case 8: return <FinancialsSlide {...props} />;
      case 9: return <TeamAskSlide {...props} />;
      default: return <HeroSlide {...props} />;
    }
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      x: direction < 0 ? '100%' : '-100%',
      opacity: 0
    })
  };

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-50 bg-slate-900 touch-pan-y"
      onClick={handleInteraction}
      onTouchStart={handleInteraction}
    >
      {/* Slide Content with Swipe */}
      <motion.div
        className="absolute inset-0 overflow-hidden"
        drag={isMobile ? "x" : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        animate={controls}
      >
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentSlide}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 }
            }}
            className="absolute inset-0"
          >
            {renderSlide()}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Top Bar - Mobile Optimized */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-0 left-0 right-0 z-50"
          >
            <div className="flex items-center justify-between p-3 bg-gradient-to-b from-black/60 to-transparent">
              {/* Exit Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={onExit}
                className="text-white hover:bg-white/20 h-10 w-10"
              >
                <X className="h-5 w-5" />
              </Button>

              {/* Slide Counter */}
              <div className="flex items-center gap-2">
                <span className="text-white/80 text-sm font-medium">
                  {currentSlide + 1} / {TOTAL_SLIDES}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowSlideMenu(true)}
                  className="text-white hover:bg-white/20 h-10 w-10"
                >
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsPlaying(p => !p)}
                  className="text-white hover:bg-white/20 h-10 w-10"
                >
                  {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                </Button>
                {!isMobile && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleFullscreen}
                    className="text-white hover:bg-white/20 h-10 w-10"
                  >
                    {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Navigation - Mobile Optimized */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-0 left-0 right-0 z-50 pb-safe"
          >
            <div className="p-3 bg-gradient-to-t from-black/60 to-transparent">
              {/* Progress Dots */}
              <div className="flex items-center justify-center gap-1.5 mb-3">
                {Array.from({ length: TOTAL_SLIDES }).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    className={cn(
                      "transition-all duration-300 rounded-full",
                      index === currentSlide 
                        ? "w-6 h-2 bg-primary" 
                        : "w-2 h-2 bg-white/40 hover:bg-white/60"
                    )}
                    aria-label={`${isRussian ? 'Слайд' : 'Slide'} ${index + 1}`}
                  />
                ))}
              </div>

              {/* Navigation Arrows - Desktop */}
              {!isMobile && (
                <div className="flex items-center justify-center gap-4">
                  <Button
                    variant="ghost"
                    size="lg"
                    onClick={goToPrevious}
                    className="text-white hover:bg-white/20"
                  >
                    <ChevronLeft className="h-6 w-6" />
                    {isRussian ? 'Назад' : 'Back'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="lg"
                    onClick={goToNext}
                    className="text-white hover:bg-white/20"
                  >
                    {isRussian ? 'Далее' : 'Next'}
                    <ChevronRight className="h-6 w-6" />
                  </Button>
                </div>
              )}

              {/* Swipe Hint - Mobile */}
              {isMobile && currentSlide === 0 && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center text-white/60 text-xs"
                >
                  {isRussian ? '← Свайпните для навигации →' : '← Swipe to navigate →'}
                </motion.p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Side Navigation Arrows - Touch Zones for Mobile */}
      {isMobile && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-0 top-1/4 bottom-1/4 w-16 z-40 opacity-0 active:bg-white/10 transition-colors"
            aria-label={isRussian ? 'Предыдущий слайд' : 'Previous slide'}
          />
          <button
            onClick={goToNext}
            className="absolute right-0 top-1/4 bottom-1/4 w-16 z-40 opacity-0 active:bg-white/10 transition-colors"
            aria-label={isRussian ? 'Следующий слайд' : 'Next slide'}
          />
        </>
      )}

      {/* Slide Menu Modal */}
      <AnimatePresence>
        {showSlideMenu && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowSlideMenu(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-800 rounded-2xl p-4 w-full max-w-sm max-h-[80vh] overflow-auto"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-white mb-4 text-center">
                {isRussian ? 'Перейти к слайду' : 'Go to Slide'}
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {labels.map((label, index) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    className={cn(
                      "p-3 rounded-xl text-left transition-all",
                      index === currentSlide
                        ? "bg-primary text-primary-foreground"
                        : "bg-white/10 text-white hover:bg-white/20"
                    )}
                  >
                    <span className="text-xs opacity-60">{index + 1}</span>
                    <p className="font-medium text-sm">{label}</p>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Auto-play Progress Indicator */}
      {isPlaying && (
        <motion.div
          className="absolute bottom-16 left-0 right-0 h-0.5 bg-white/20"
        >
          <motion.div
            className="h-full bg-primary"
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{
              duration: AUTO_PLAY_INTERVAL / 1000,
              ease: 'linear',
              repeat: Infinity
            }}
            key={currentSlide}
          />
        </motion.div>
      )}
    </div>
  );
}
