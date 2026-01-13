import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminCheck } from '@/hooks/useAdmin';
import { 
  DemoModeControls,
  SlideIndicators,
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
  AnimatedSlide
} from '@/components/pitch';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Play, Presentation } from 'lucide-react';

const SLIDE_LABELS = [
  'Hero',
  'Problem',
  'Solution',
  'Market',
  'Product',
  'Traction',
  'Competitors',
  'Business Model',
  'Financials',
  'The Ask',
];

const TOTAL_SLIDES = 10;
const DEFAULT_INTERVAL = 8000;

export default function InvestorPitchDeck() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { language } = useLanguage();
  const { isAdmin, isLoading: adminLoading } = useAdminCheck();
  const isRussian = language === 'ru';

  // Slide state
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(0);
  
  // Demo mode state
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [slideInterval, setSlideInterval] = useState(DEFAULT_INTERVAL);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [progress, setProgress] = useState(0);
  const [lastActivity, setLastActivity] = useState(Date.now());

  // Auth redirects
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!adminLoading && !isAdmin && user) {
      navigate('/');
    }
  }, [isAdmin, adminLoading, user, navigate]);

  // Auto-rotation
  useEffect(() => {
    if (!isPlaying) {
      setProgress(0);
      return;
    }

    const progressInterval = 100;
    const progressIncrement = (progressInterval / slideInterval) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setDirection(1);
          setCurrentSlide((s) => (s + 1) % TOTAL_SLIDES);
          return 0;
        }
        return prev + progressIncrement;
      });
    }, progressInterval);

    return () => clearInterval(timer);
  }, [isPlaying, slideInterval]);

  // Hide controls after inactivity
  useEffect(() => {
    if (!isDemoMode) return;

    const checkActivity = setInterval(() => {
      if (Date.now() - lastActivity > 3000) {
        setControlsVisible(false);
      }
    }, 1000);

    return () => clearInterval(checkActivity);
  }, [isDemoMode, lastActivity]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isDemoMode) return;

      switch (e.key) {
        case ' ':
          e.preventDefault();
          setIsPlaying((p) => !p);
          break;
        case 'ArrowLeft':
          goToPrevious();
          break;
        case 'ArrowRight':
          goToNext();
          break;
        case 'f':
        case 'F':
          toggleFullscreen();
          break;
        case 'Escape':
          if (isFullscreen) {
            document.exitFullscreen?.();
          } else {
            setIsDemoMode(false);
            setIsPlaying(false);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDemoMode, isFullscreen]);

  // Mouse move handler for controls visibility
  const handleMouseMove = useCallback(() => {
    setLastActivity(Date.now());
    setControlsVisible(true);
  }, []);

  const goToNext = () => {
    setDirection(1);
    setCurrentSlide((s) => (s + 1) % TOTAL_SLIDES);
    setProgress(0);
  };

  const goToPrevious = () => {
    setDirection(-1);
    setCurrentSlide((s) => (s - 1 + TOTAL_SLIDES) % TOTAL_SLIDES);
    setProgress(0);
  };

  const goToSlide = (index: number) => {
    setDirection(index > currentSlide ? 1 : -1);
    setCurrentSlide(index);
    setProgress(0);
  };

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
    }
  };

  const startDemoMode = () => {
    setIsDemoMode(true);
    setIsPlaying(true);
    setCurrentSlide(0);
    setProgress(0);
  };

  const exitDemoMode = () => {
    setIsDemoMode(false);
    setIsPlaying(false);
    if (document.fullscreenElement) {
      document.exitFullscreen?.();
    }
  };

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) return null;

  const renderSlide = () => {
    switch (currentSlide) {
      case 0: return <HeroSlide isRussian={isRussian} />;
      case 1: return <ProblemSlide isRussian={isRussian} />;
      case 2: return <SolutionSlide isRussian={isRussian} />;
      case 3: return <MarketSlide isRussian={isRussian} />;
      case 4: return <ProductSlide isRussian={isRussian} />;
      case 5: return <TractionSlide isRussian={isRussian} />;
      case 6: return <CompetitorSlide isRussian={isRussian} />;
      case 7: return <BusinessModelSlide isRussian={isRussian} />;
      case 8: return <FinancialsSlide isRussian={isRussian} />;
      case 9: return <TeamAskSlide isRussian={isRussian} />;
      default: return <HeroSlide isRussian={isRussian} />;
    }
  };

  // Demo mode view
  if (isDemoMode) {
    return (
      <div 
        className="fixed inset-0 bg-slate-900 z-50"
        onMouseMove={handleMouseMove}
      >
        <div className="relative w-full h-full overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            <AnimatedSlide key={currentSlide} direction={direction}>
              {renderSlide()}
            </AnimatedSlide>
          </AnimatePresence>
        </div>

        <SlideIndicators
          totalSlides={TOTAL_SLIDES}
          currentSlide={currentSlide}
          onSlideClick={goToSlide}
          visible={controlsVisible}
        />

        <DemoModeControls
          isPlaying={isPlaying}
          isFullscreen={isFullscreen}
          currentSlide={currentSlide}
          totalSlides={TOTAL_SLIDES}
          slideInterval={slideInterval}
          onPlayPause={() => setIsPlaying((p) => !p)}
          onPrevious={goToPrevious}
          onNext={goToNext}
          onFullscreenToggle={toggleFullscreen}
          onIntervalChange={setSlideInterval}
          onExitDemo={exitDemoMode}
          visible={controlsVisible}
          progress={progress}
        />
      </div>
    );
  }

  // Interactive mode view
  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-slate-900/80 backdrop-blur-lg border-b border-white/10">
        <div className="flex items-center justify-between px-4 py-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/admin')}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {isRussian ? 'Назад' : 'Back'}
          </Button>

          <h1 className="text-lg font-semibold text-white">
            {isRussian ? 'Инвесторская презентация' : 'Investor Pitch Deck'}
          </h1>

          <Button
            onClick={startDemoMode}
            className="bg-primary hover:bg-primary/90"
          >
            <Play className="h-4 w-4 mr-2" />
            {isRussian ? 'Демо режим' : 'Demo Mode'}
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="pt-16">
        <div className="relative w-full min-h-[calc(100vh-4rem)] overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            <AnimatedSlide key={currentSlide} direction={direction}>
              {renderSlide()}
            </AnimatedSlide>
          </AnimatePresence>
        </div>

        {/* Navigation dots */}
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-lg rounded-full px-4 py-2 border border-white/20">
            <Button
              variant="ghost"
              size="sm"
              onClick={goToPrevious}
              className="text-white hover:bg-white/20 h-8 w-8 p-0"
            >
              ←
            </Button>
            
            <div className="flex gap-2">
              {Array.from({ length: TOTAL_SLIDES }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentSlide 
                      ? 'bg-primary w-6' 
                      : 'bg-white/40 hover:bg-white/60'
                  }`}
                />
              ))}
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={goToNext}
              className="text-white hover:bg-white/20 h-8 w-8 p-0"
            >
              →
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
