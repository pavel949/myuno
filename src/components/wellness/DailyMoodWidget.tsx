import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useWellnessLogs, useWellnessStreak } from '@/hooks/useWellness';
import { MoodCheckin } from './MoodCheckin';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { Heart, Flame, Sparkles, ChevronRight } from 'lucide-react';

export function DailyMoodWidget() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { user } = useAuth();
  const { logs, isLoading: logsLoading } = useWellnessLogs(1);
  const { streak, isLoading: streakLoading } = useWellnessStreak();
  
  const today = new Date().toISOString().split('T')[0];
  const hasCheckedInToday = logs.some(log => 
    log.log_type === 'mood' && log.logged_at === today
  );
  
  const [showCheckin, setShowCheckin] = useState(!hasCheckedInToday);

  useEffect(() => {
    setShowCheckin(!hasCheckedInToday);
  }, [hasCheckedInToday]);

  if (!user) {
    // Show teaser for non-logged-in users
    return (
      <motion.button
        onClick={() => navigate('/wellness')}
        className={cn(
          "w-full relative overflow-hidden rounded-2xl p-4",
          "bg-gradient-to-br from-purple-500/10 via-card to-pink-500/10",
          "border border-border hover:border-primary/30 transition-all",
          "text-left group"
        )}
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Heart className="w-6 h-6 text-white" />
          </div>
          
          <div className="flex-1">
            <h3 className="font-semibold text-foreground">
              {language === 'ru' ? 'Гармония' : 'Wellness Hub'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {language === 'ru' 
                ? 'Дыхание, медитации, звуки природы' 
                : 'Breathing, meditation, nature sounds'}
            </p>
          </div>
          
          <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
        </div>
      </motion.button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "relative overflow-hidden rounded-2xl",
        "bg-gradient-to-br from-purple-500/10 via-card to-pink-500/10",
        "border border-border"
      )}
    >
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-pink-500/10 rounded-full blur-2xl" />
      
      <div className="relative z-10 p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-medium">
              {language === 'ru' ? 'Гармония' : 'Wellness'}
            </h3>
          </div>
          
          {streak && streak.current_streak > 0 && (
            <Badge variant="secondary" className="gap-1">
              <Flame className="w-3 h-3 text-orange-500" />
              {streak.current_streak} {language === 'ru' ? 'дней' : 'days'}
            </Badge>
          )}
        </div>
        
        {/* Content */}
        {showCheckin ? (
          <MoodCheckin 
            compact 
            onComplete={() => setShowCheckin(false)} 
          />
        ) : (
          <button
            onClick={() => navigate('/wellness')}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-background/50 hover:bg-background transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium">
                  {language === 'ru' ? 'Настроение записано!' : 'Mood logged!'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {language === 'ru' 
                    ? 'Попробуй дыхательное упражнение' 
                    : 'Try a breathing exercise'}
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          </button>
        )}
      </div>
    </motion.div>
  );
}
