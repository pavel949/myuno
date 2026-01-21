import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { WellnessContent } from '@/hooks/useWellness';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { 
  Wind, 
  Headphones, 
  BookOpen, 
  Play, 
  Clock, 
  Sparkles,
  Dumbbell,
  Calendar
} from 'lucide-react';

interface WellnessCardProps {
  content: WellnessContent;
  variant?: 'default' | 'compact' | 'featured';
  onClick?: () => void;
}

const typeIcons: Record<string, typeof Wind> = {
  breathing: Wind,
  soundscape: Headphones,
  article: BookOpen,
  meditation: Play,
  workout: Dumbbell,
  program: Calendar,
};

const typeColors: Record<string, string> = {
  breathing: 'from-sky-500 to-blue-600',
  soundscape: 'from-purple-500 to-violet-600',
  article: 'from-amber-500 to-orange-600',
  meditation: 'from-emerald-500 to-teal-600',
  workout: 'from-rose-500 to-pink-600',
  program: 'from-indigo-500 to-purple-600',
};

const categoryLabels: Record<string, { en: string; ru: string }> = {
  sleep: { en: 'Sleep', ru: 'Сон' },
  focus: { en: 'Focus', ru: 'Фокус' },
  relax: { en: 'Relax', ru: 'Расслабление' },
  energy: { en: 'Energy', ru: 'Энергия' },
  morning: { en: 'Morning', ru: 'Утро' },
};

export function WellnessCard({ content, variant = 'default', onClick }: WellnessCardProps) {
  const { language } = useLanguage();
  const navigate = useNavigate();
  
  const Icon = typeIcons[content.type] || Sparkles;
  const colorClass = typeColors[content.type] || 'from-primary to-primary/80';
  
  const title = language === 'ru' ? content.title_ru : content.title_en;
  const description = language === 'ru' ? content.description_ru : content.description_en;
  
  const durationMinutes = content.duration_seconds 
    ? Math.ceil(content.duration_seconds / 60) 
    : null;

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(`/wellness/${content.type}/${content.id}`);
    }
  };

  if (variant === 'compact') {
    return (
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleClick}
        className={cn(
          "flex items-center gap-3 p-3 w-full text-left",
          "rounded-xl bg-card border border-border",
          "hover:border-primary/30 transition-all"
        )}
      >
        <div className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center",
          "bg-gradient-to-br", colorClass
        )}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{title}</p>
          {durationMinutes && (
            <p className="text-xs text-muted-foreground">
              {durationMinutes} {language === 'ru' ? 'мин' : 'min'}
            </p>
          )}
        </div>
        
        <Play className="w-4 h-4 text-muted-foreground" />
      </motion.button>
    );
  }

  if (variant === 'featured') {
    return (
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleClick}
        className={cn(
          "relative overflow-hidden rounded-2xl w-full text-left",
          "bg-gradient-to-br", colorClass,
          "p-5 min-h-[160px]"
        )}
      >
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full blur-2xl transform -translate-x-1/2 translate-y-1/2" />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Icon className="w-6 h-6 text-white" />
            </div>
            
            {content.is_premium && (
              <Badge className="bg-white/20 text-white border-0">
                Premium
              </Badge>
            )}
          </div>
          
          <div className="mt-4">
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            {description && (
              <p className="text-sm text-white/80 mt-1 line-clamp-2">{description}</p>
            )}
          </div>
          
          <div className="flex items-center gap-3 mt-4">
            {durationMinutes && (
              <span className="flex items-center gap-1 text-xs text-white/70">
                <Clock className="w-3 h-3" />
                {durationMinutes} {language === 'ru' ? 'мин' : 'min'}
              </span>
            )}
            {content.category && categoryLabels[content.category] && (
              <Badge variant="secondary" className="bg-white/20 text-white border-0 text-xs">
                {categoryLabels[content.category][language === 'ru' ? 'ru' : 'en']}
              </Badge>
            )}
          </div>
        </div>
      </motion.button>
    );
  }

  // Default variant
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
      className={cn(
        "relative overflow-hidden rounded-xl w-full text-left",
        "bg-card border border-border p-4",
        "hover:border-primary/30 transition-all"
      )}
    >
      {content.image_url && (
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-10"
          style={{ backgroundImage: `url(${content.image_url})` }}
        />
      )}
      
      <div className="relative z-10 flex items-start gap-3">
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
          "bg-gradient-to-br", colorClass
        )}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-medium text-foreground">{title}</h3>
            {content.is_featured && (
              <Badge variant="secondary" className="text-xs flex-shrink-0">
                <Sparkles className="w-3 h-3 mr-1" />
                {language === 'ru' ? 'Хит' : 'Featured'}
              </Badge>
            )}
          </div>
          
          {description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {description}
            </p>
          )}
          
          <div className="flex items-center gap-2 mt-2">
            {durationMinutes && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                {durationMinutes} {language === 'ru' ? 'мин' : 'min'}
              </span>
            )}
            {content.category && categoryLabels[content.category] && (
              <Badge variant="outline" className="text-xs">
                {categoryLabels[content.category][language === 'ru' ? 'ru' : 'en']}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </motion.button>
  );
}
