import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { WellnessContent } from '@/hooks/useWellness';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { motion } from 'framer-motion';
import { Play, Pause, Volume2, Clock, MapPin } from 'lucide-react';

interface SoundscapePlayerProps {
  soundscape: WellnessContent;
  isActive?: boolean;
  onPlay?: () => void;
}

// Ambient sound URLs (using free sounds from freesound.org or similar)
const ambientSounds: Record<string, string> = {
  ocean: 'https://assets.mixkit.co/active_storage/sfx/212/212-preview.mp3',
  rain: 'https://assets.mixkit.co/active_storage/sfx/1238/1238-preview.mp3',
  forest: 'https://assets.mixkit.co/active_storage/sfx/2516/2516-preview.mp3',
  temple: 'https://assets.mixkit.co/active_storage/sfx/159/159-preview.mp3',
};

export function SoundscapePlayer({ soundscape, isActive, onPlay }: SoundscapePlayerProps) {
  const { language } = useLanguage();
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const metadata = soundscape.metadata as { 
    location?: string; 
    ambientType?: string;
  };
  
  const audioUrl = soundscape.audio_url || ambientSounds[metadata.ambientType || 'ocean'];

  useEffect(() => {
    if (!isActive && isPlaying) {
      handlePause();
    }
  }, [isActive]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const handlePlay = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(audioUrl);
      audioRef.current.loop = true;
      audioRef.current.volume = volume;
      
      audioRef.current.addEventListener('timeupdate', () => {
        setCurrentTime(audioRef.current?.currentTime || 0);
      });
      
      audioRef.current.addEventListener('loadedmetadata', () => {
        setDuration(audioRef.current?.duration || 0);
      });
    }
    
    audioRef.current.play();
    setIsPlaying(true);
    onPlay?.();
  };

  const handlePause = () => {
    audioRef.current?.pause();
    setIsPlaying(false);
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const durationMinutes = Math.floor((soundscape.duration_seconds || 1800) / 60);

  return (
    <motion.div
      layout
      className={cn(
        "relative overflow-hidden rounded-2xl transition-all",
        "bg-gradient-to-br from-card to-card/50",
        "border border-border",
        isPlaying && "ring-2 ring-primary/50"
      )}
    >
      {/* Background image */}
      {soundscape.image_url && (
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{ backgroundImage: `url(${soundscape.image_url})` }}
        />
      )}
      
      {/* Content */}
      <div className="relative z-10 p-4">
        <div className="flex items-start gap-4">
          {/* Play button */}
          <button
            onClick={isPlaying ? handlePause : handlePlay}
            className={cn(
              "flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center",
              "bg-background/80 backdrop-blur-sm border border-border",
              "transition-all hover:scale-105 active:scale-95",
              isPlaying && "bg-primary text-primary-foreground border-primary"
            )}
          >
            {isPlaying ? (
              <Pause className="w-6 h-6" />
            ) : (
              <Play className="w-6 h-6 ml-0.5" />
            )}
          </button>
          
          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground truncate">
              {language === 'ru' ? soundscape.title_ru : soundscape.title_en}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
              {language === 'ru' ? soundscape.description_ru : soundscape.description_en}
            </p>
            
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              {metadata.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {metadata.location}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {durationMinutes} {language === 'ru' ? 'мин' : 'min'}
              </span>
            </div>
          </div>
        </div>
        
        {/* Volume slider - show when playing */}
        {isPlaying && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pt-4 border-t border-border/50"
          >
            <div className="flex items-center gap-3">
              <Volume2 className="w-4 h-4 text-muted-foreground" />
              <Slider
                value={[volume]}
                onValueChange={handleVolumeChange}
                min={0}
                max={1}
                step={0.01}
                className="flex-1"
              />
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
