import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useYachtExperiences, type YachtExperience } from '@/hooks/useYachtExperiences';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

// Re-export type for consumers
export type { YachtExperience };

interface YachtExperienceSelectProps {
  selected: string[];
  onChange: (ids: string[]) => void;
  className?: string;
}

export function YachtExperienceSelect({ selected, onChange, className }: YachtExperienceSelectProps) {
  const { language } = useLanguage();
  const { data: experiences = [], isLoading } = useYachtExperiences();

  const toggleExperience = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter(s => s !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  const getTotal = () => {
    return selected.reduce((sum, id) => {
      const exp = experiences.find(e => e.id === id);
      return sum + (exp?.price || 0);
    }, 0);
  };
  
  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        <Skeleton className="h-6 w-40" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">
          {language === 'ru' ? 'Выберите впечатления' : 'Choose Experiences'}
        </h3>
        {selected.length > 0 && (
          <span className="text-sm text-primary font-medium">
            +฿{getTotal().toLocaleString()}
          </span>
        )}
      </div>

      <p className="text-sm text-muted-foreground">
        {language === 'ru' 
          ? 'Добавьте особые опции для незабываемого путешествия' 
          : 'Add special options for an unforgettable journey'}
      </p>

      <div className="grid grid-cols-2 gap-3">
        {experiences.map((exp) => {
          const isSelected = selected.includes(exp.id);
          return (
            <button
              key={exp.id}
              onClick={() => toggleExperience(exp.id)}
              className={cn(
                "relative p-3 rounded-xl border text-left transition-all",
                isSelected 
                  ? "border-primary bg-primary/5 ring-1 ring-primary" 
                  : "border-border hover:border-primary/30 hover:bg-muted/50"
              )}
            >
              {exp.popular && (
                <span className="absolute -top-2 -right-2 text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500 text-white font-medium">
                  {language === 'ru' ? 'ТОП' : 'HOT'}
                </span>
              )}
              
              {isSelected && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-3 h-3 text-primary-foreground" />
                </div>
              )}

              <span className="text-2xl mb-2 block">{exp.icon}</span>
              <p className="font-medium text-sm line-clamp-1">
                {language === 'ru' ? exp.labelRu : exp.labelEn}
              </p>
              <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                {language === 'ru' ? exp.descRu : exp.descEn}
              </p>
              <p className="text-sm font-semibold text-primary mt-2">
                +฿{exp.price.toLocaleString()}
              </p>
            </button>
          );
        })}
      </div>

      {selected.length > 0 && (
        <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {language === 'ru' ? 'Выбрано опций:' : 'Selected:'} {selected.length}
            </span>
            <span className="font-semibold text-primary">
              +฿{getTotal().toLocaleString()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// Quick filter chips for experiences on index page - compact version
interface ExperienceFilterChipsProps {
  selected: string[];
  onChange: (ids: string[]) => void;
}

export function ExperienceFilterChips({ selected, onChange }: ExperienceFilterChipsProps) {
  const { language } = useLanguage();
  const [showAll, setShowAll] = useState(false);
  const { data: experiences = [] } = useYachtExperiences();

  const toggleExperience = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter(s => s !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  // Show popular first, then others if expanded
  const popularExperiences = experiences.filter(e => e.popular);
  const otherExperiences = experiences.filter(e => !e.popular);
  const displayExperiences = showAll 
    ? [...popularExperiences, ...otherExperiences]
    : popularExperiences;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {displayExperiences.map((exp) => {
          const isSelected = selected.includes(exp.id);
          return (
            <button
              key={exp.id}
              onClick={() => toggleExperience(exp.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm transition-all",
                isSelected 
                  ? "border-primary bg-primary text-primary-foreground" 
                  : "border-border bg-card hover:border-primary/30"
              )}
            >
              <span className="text-base">{exp.icon}</span>
              <span className="text-xs">{language === 'ru' ? exp.labelRu : exp.labelEn}</span>
            </button>
          );
        })}
        
        {!showAll && otherExperiences.length > 0 && (
          <button
            onClick={() => setShowAll(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-dashed border-muted-foreground/50 text-xs text-muted-foreground hover:border-primary hover:text-primary transition-all"
          >
            +{otherExperiences.length} {language === 'ru' ? 'ещё' : 'more'}
          </button>
        )}
        
        {showAll && (
          <button
            onClick={() => setShowAll(false)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-dashed border-muted-foreground/50 text-xs text-muted-foreground hover:border-primary hover:text-primary transition-all"
          >
            {language === 'ru' ? 'Свернуть' : 'Less'}
          </button>
        )}
      </div>

      {selected.length > 0 && (
        <div className="text-xs text-primary font-medium">
          {language === 'ru' ? 'Выбрано:' : 'Selected:'} {selected.length}
        </div>
      )}
    </div>
  );
}
