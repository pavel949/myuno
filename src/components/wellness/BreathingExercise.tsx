import { useState, useEffect, useCallback, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLogWellness, WellnessContent } from '@/hooks/useWellness';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, Check, Volume2, VolumeX } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BreathingExerciseProps {
  exercise: WellnessContent;
  onComplete?: () => void;
}

type Phase = 'inhale' | 'hold' | 'exhale' | 'holdEmpty' | 'idle';

const phaseLabels: Record<Phase, { en: string; ru: string }> = {
  inhale: { en: 'Breathe In', ru: 'Вдох' },
  hold: { en: 'Hold', ru: 'Задержка' },
  exhale: { en: 'Breathe Out', ru: 'Выдох' },
  holdEmpty: { en: 'Hold', ru: 'Задержка' },
  idle: { en: 'Get Ready', ru: 'Приготовьтесь' },
};

export function BreathingExercise({ exercise, onComplete }: BreathingExerciseProps) {
  const { language } = useLanguage();
  const { logBreathing } = useLogWellness();
  const { toast } = useToast();
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [phase, setPhase] = useState<Phase>('idle');
  const [counter, setCounter] = useState(0);
  const [currentCycle, setCurrentCycle] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  const startTimeRef = useRef<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  
  const metadata = exercise.metadata as {
    inhale: number;
    hold?: number;
    exhale: number;
    holdEmpty?: number;
    cycles: number;
  };
  
  const totalCycles = metadata.cycles || 4;

  const playTone = useCallback((frequency: number, duration: number) => {
    if (!soundEnabled) return;
    
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const ctx = audioContextRef.current;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.05);
      gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration);
    } catch (e) {
      // Audio not supported
    }
  }, [soundEnabled]);

  const runBreathingCycle = useCallback(async () => {
    const phases: { phase: Phase; duration: number }[] = [];
    
    if (metadata.inhale) phases.push({ phase: 'inhale', duration: metadata.inhale });
    if (metadata.hold) phases.push({ phase: 'hold', duration: metadata.hold });
    if (metadata.exhale) phases.push({ phase: 'exhale', duration: metadata.exhale });
    if (metadata.holdEmpty) phases.push({ phase: 'holdEmpty', duration: metadata.holdEmpty });
    
    for (const { phase: p, duration } of phases) {
      setPhase(p);
      playTone(p === 'inhale' ? 440 : p === 'exhale' ? 330 : 220, 0.2);
      
      for (let i = duration; i > 0; i--) {
        setCounter(i);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }, [metadata, playTone]);

  useEffect(() => {
    if (!isPlaying) return;
    
    let cancelled = false;
    
    const runExercise = async () => {
      startTimeRef.current = Date.now();
      
      for (let cycle = currentCycle; cycle < totalCycles && !cancelled; cycle++) {
        setCurrentCycle(cycle + 1);
        await runBreathingCycle();
        
        if (cancelled) break;
      }
      
      if (!cancelled) {
        setIsComplete(true);
        setIsPlaying(false);
        playTone(523, 0.5); // Success tone
        
        const durationSeconds = Math.floor((Date.now() - startTimeRef.current) / 1000);
        await logBreathing(exercise.id, durationSeconds);
        
        toast({
          title: language === 'ru' ? 'Отлично!' : 'Well done!',
          description: language === 'ru' 
            ? 'Дыхательное упражнение завершено' 
            : 'Breathing exercise completed',
        });
        
        onComplete?.();
      }
    };
    
    runExercise();
    
    return () => {
      cancelled = true;
    };
  }, [isPlaying, currentCycle, totalCycles, runBreathingCycle, exercise.id, logBreathing, language, toast, playTone, onComplete]);

  const handleStart = () => {
    setIsPlaying(true);
    setIsComplete(false);
    setCurrentCycle(0);
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setPhase('idle');
    setCounter(0);
    setCurrentCycle(0);
    setIsComplete(false);
  };

  const getCircleScale = () => {
    if (phase === 'inhale') return 1.3;
    if (phase === 'exhale') return 0.8;
    return 1;
  };

  const getTransitionDuration = () => {
    if (phase === 'inhale') return metadata.inhale;
    if (phase === 'exhale') return metadata.exhale;
    return 0.3;
  };

  if (isComplete) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-8 gap-4"
      >
        <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
          <Check className="w-8 h-8 text-green-500" />
        </div>
        <div className="text-center">
          <h3 className="text-lg font-semibold">
            {language === 'ru' ? 'Упражнение завершено!' : 'Exercise Complete!'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {language === 'ru' 
              ? `${totalCycles} циклов дыхания` 
              : `${totalCycles} breathing cycles`}
          </p>
        </div>
        <Button variant="outline" onClick={handleReset}>
          {language === 'ru' ? 'Повторить' : 'Do Again'}
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      {/* Breathing circle */}
      <div className="relative w-48 h-48 flex items-center justify-center">
        {/* Outer ring */}
        <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
        
        {/* Animated circle */}
        <motion.div
          animate={{ 
            scale: getCircleScale(),
            opacity: isPlaying ? 1 : 0.5,
          }}
          transition={{ 
            duration: getTransitionDuration(),
            ease: phase === 'inhale' ? 'easeOut' : phase === 'exhale' ? 'easeIn' : 'linear',
          }}
          className={cn(
            "w-32 h-32 rounded-full flex items-center justify-center",
            "bg-gradient-to-br from-primary/40 to-primary/20",
            "backdrop-blur-sm border border-primary/30"
          )}
        >
          <div className="text-center">
            <AnimatePresence mode="wait">
              <motion.p
                key={phase}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="text-sm font-medium text-foreground"
              >
                {phaseLabels[phase][language === 'ru' ? 'ru' : 'en']}
              </motion.p>
            </AnimatePresence>
            {isPlaying && counter > 0 && (
              <motion.p
                key={counter}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-3xl font-bold text-primary mt-1"
              >
                {counter}
              </motion.p>
            )}
          </div>
        </motion.div>
      </div>

      {/* Progress */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          {language === 'ru' ? 'Цикл' : 'Cycle'} {currentCycle}/{totalCycles}
        </p>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setSoundEnabled(!soundEnabled)}
        >
          {soundEnabled ? (
            <Volume2 className="w-4 h-4" />
          ) : (
            <VolumeX className="w-4 h-4" />
          )}
        </Button>
        
        {isPlaying ? (
          <Button
            size="lg"
            variant="outline"
            onClick={handlePause}
            className="w-24"
          >
            <Pause className="w-4 h-4 mr-2" />
            {language === 'ru' ? 'Пауза' : 'Pause'}
          </Button>
        ) : (
          <Button
            size="lg"
            onClick={handleStart}
            className="w-24"
          >
            <Play className="w-4 h-4 mr-2" />
            {language === 'ru' ? 'Старт' : 'Start'}
          </Button>
        )}
        
        <Button
          variant="outline"
          size="icon"
          onClick={handleReset}
        >
          <RotateCcw className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
