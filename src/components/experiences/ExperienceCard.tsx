/**
 * ExperienceCard - Unified card for tours and activities
 * Follows premium design tokens: hover:shadow-md, hover:-translate-y-0.5
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Compass, Waves, Star, Shield, Clock, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { Experience, formatDuration } from '@/hooks/useExperiences';
import { cn } from '@/lib/utils';
import { BADGE_SYSTEM, CARD_STYLES } from '@/lib/designTokens';

interface ExperienceCardProps {
  experience: Experience;
  language: string;
  className?: string;
}

/**
 * ExperienceCard - no forwardRef needed, Framer Motion handles layout internally
 * This fixes the "ref is not a prop" warning with AnimatePresence
 */
export function ExperienceCard({ experience, language, className }: ExperienceCardProps) {
  const navigate = useNavigate();
  const isTour = experience.experience_type === 'tour';
  const isRu = language === 'ru';
  
  return (
    <motion.div
      layout
      layoutId={experience.id}
        data-testid="experience-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={cn(
          "bg-card rounded-2xl overflow-hidden border",
          "hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group",
          className
        )}
        onClick={() => navigate(`/experiences/${experience.id}`)}
      >
        <div className="relative h-44 overflow-hidden">
          <OptimizedImage
            src={experience.cover_image || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400'}
            alt={isRu ? experience.title_ru : experience.title_en}
            width={400}
            height={176}
            className="w-full h-full group-hover:scale-[1.03] transition-transform duration-300"
            quality={80}
          />
          
          {/* Type badge */}
          <Badge 
            className={cn(
              "absolute top-3 left-3 text-xs border-none",
              isTour 
                ? BADGE_SYSTEM.tour
                : BADGE_SYSTEM.activity
            )}
          >
            {isTour ? (
              <>
                <Compass className="w-3.5 h-3.5 mr-1" />
                {isRu ? 'Тур' : 'Tour'}
              </>
            ) : (
              <>
                <Waves className="w-3.5 h-3.5 mr-1" />
                {isRu ? 'Активность' : 'Activity'}
              </>
            )}
          </Badge>
          
          {/* Certified badge */}
          {experience.is_certified && (
            <Badge className="absolute top-3 right-3 bg-primary text-primary-foreground text-xs">
              <Shield className="w-3 h-3 mr-1" />
              {isRu ? 'Сертификат' : 'Certified'}
            </Badge>
          )}
          
          {/* Featured badge */}
          {experience.is_featured && (
            <Badge className={cn("absolute bottom-3 left-3 text-xs border-none", BADGE_SYSTEM.featured)}>
              <Star className="w-3 h-3 mr-1 fill-current" />
              {isRu ? 'Топ' : 'Featured'}
            </Badge>
          )}
        </div>
        
        <div className="p-4">
          <h3 className="font-semibold text-base line-clamp-2 mb-2">
            {isRu ? experience.title_ru : experience.title_en}
          </h3>
          
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mb-3">
            <span className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              {experience.rating.toFixed(1)}
              <span className="text-xs">({experience.review_count})</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {formatDuration(experience.duration_minutes, language)}
            </span>
            {experience.location_name && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1 truncate max-w-[120px]">
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  {experience.location_name}
                </span>
              </>
            )}
          </div>
          
          {/* Difficulty badge */}
          {experience.difficulty && (
            <Badge variant="outline" className="mb-3 text-xs">
              {experience.difficulty === 'easy' && '🟢'}
              {experience.difficulty === 'moderate' && '🟡'}
              {experience.difficulty === 'challenging' && '🟠'}
              {experience.difficulty === 'expert' && '🔴'}
              {' '}
              {isRu 
                ? experience.difficulty === 'easy' ? 'Легкий' : experience.difficulty === 'moderate' ? 'Средний' : experience.difficulty === 'challenging' ? 'Сложный' : 'Эксперт'
                : experience.difficulty.charAt(0).toUpperCase() + experience.difficulty.slice(1)
              }
            </Badge>
          )}
          
          <div className="flex items-center justify-between">
            <p className="text-primary font-bold text-lg">
              ฿{experience.price?.toLocaleString()}
              {experience.price_per && (
                <span className="text-sm font-normal text-muted-foreground ml-1">
                  /{isRu ? 'чел' : 'person'}
                </span>
              )}
            </p>
            <Button size="sm" variant="outline" className="text-xs">
              {isRu ? 'Подробнее' : 'Details'}
            </Button>
          </div>
        </div>
    </motion.div>
  );
}

export default ExperienceCard;
