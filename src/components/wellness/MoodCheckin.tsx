import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLogWellness } from '@/hooks/useWellness';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Check } from 'lucide-react';

const moods = [
  { score: 1, emoji: '😢', label: 'Terrible', labelRu: 'Ужасно' },
  { score: 2, emoji: '😔', label: 'Bad', labelRu: 'Плохо' },
  { score: 3, emoji: '😐', label: 'Okay', labelRu: 'Нормально' },
  { score: 4, emoji: '🙂', label: 'Good', labelRu: 'Хорошо' },
  { score: 5, emoji: '😄', label: 'Great', labelRu: 'Отлично' },
];

interface MoodCheckinProps {
  compact?: boolean;
  onComplete?: () => void;
}

export function MoodCheckin({ compact = false, onComplete }: MoodCheckinProps) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { logMood } = useLogWellness();
  const { toast } = useToast();
  
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const handleMoodSelect = async (score: number) => {
    if (!user) {
      toast({
        title: language === 'ru' ? 'Войдите в аккаунт' : 'Please sign in',
        description: language === 'ru' 
          ? 'Чтобы отслеживать настроение, войдите в аккаунт' 
          : 'Sign in to track your mood',
        variant: 'destructive',
      });
      return;
    }

    setSelectedMood(score);
    setIsSubmitting(true);

    const { error } = await logMood(score);
    
    if (error) {
      toast({
        title: language === 'ru' ? 'Ошибка' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      setIsComplete(true);
      toast({
        title: language === 'ru' ? 'Сохранено!' : 'Saved!',
        description: language === 'ru' 
          ? 'Ваше настроение записано' 
          : 'Your mood has been logged',
      });
      onComplete?.();
    }
    
    setIsSubmitting(false);
  };

  if (isComplete) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-4 gap-2"
      >
        <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
          <Check className="w-6 h-6 text-green-500" />
        </div>
        <p className="text-sm text-muted-foreground">
          {language === 'ru' ? 'Увидимся завтра!' : 'See you tomorrow!'}
        </p>
      </motion.div>
    );
  }

  return (
    <div className={cn("space-y-3", compact && "space-y-2")}>
      {!compact && (
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-medium">
            {language === 'ru' ? 'Как вы сегодня?' : 'How are you feeling today?'}
          </h3>
        </div>
      )}
      
      <div className="flex justify-between gap-1">
        <AnimatePresence>
          {moods.map((mood, index) => (
            <motion.button
              key={mood.score}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => handleMoodSelect(mood.score)}
              disabled={isSubmitting}
              className={cn(
                "flex-1 flex flex-col items-center gap-1 p-2 rounded-xl transition-all",
                "hover:bg-muted/50 active:scale-95",
                selectedMood === mood.score && "bg-primary/10 ring-2 ring-primary",
                isSubmitting && "opacity-50 pointer-events-none"
              )}
            >
              <span className={cn("text-2xl", compact && "text-xl")}>
                {mood.emoji}
              </span>
              {!compact && (
                <span className="text-[10px] text-muted-foreground">
                  {language === 'ru' ? mood.labelRu : mood.label}
                </span>
              )}
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
