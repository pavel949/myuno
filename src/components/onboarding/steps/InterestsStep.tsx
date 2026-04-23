import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { Check, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type Language = 'ru' | 'en' | 'th';

interface Interest {
  id: string;
  name: { en: string; ru: string; th: string };
  icon: LucideIcon;
  color: string;
}

interface InterestsStepProps {
  lang: Language;
  step: {
    icon: LucideIcon;
    title: { en: string; ru: string; th: string };
    subtitle: { en: string; ru: string; th: string };
  };
  interests: Interest[];
  selectedInterests: string[];
  toggleInterest: (id: string) => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1 },
};

export const InterestsStep = forwardRef<HTMLDivElement, InterestsStepProps>(
  function InterestsStep({
    lang,
    step,
    interests,
    selectedInterests,
    toggleInterest,
  }, ref) {
    const StepIcon = step.icon;

    return (
      <div ref={ref} className="space-y-6 flex-1">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto rounded-none bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mb-4">
            <StepIcon className="w-8 h-8 text-primary-foreground" />
          </div>
          <h2 className="text-xl font-bold mb-1">
            {step.title[lang]}
          </h2>
          <p className="text-sm text-muted-foreground">
            {step.subtitle[lang]}
          </p>
        </div>
        
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 gap-3"
        >
          {interests.map((interest) => {
            const IconComponent = interest.icon;
            const isSelected = selectedInterests.includes(interest.id);
            
            return (
              <motion.button
                key={interest.id}
                variants={itemVariants}
                onClick={() => toggleInterest(interest.id)}
                className={cn(
                  "flex items-center gap-3 p-4 rounded-none border-2 transition-all relative",
                  isSelected 
                    ? "border-primary bg-primary/10" 
                    : "border-border hover:border-primary/50 bg-card"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-none bg-gradient-to-br flex items-center justify-center shrink-0",
                  interest.color
                )}>
                  <IconComponent className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm font-medium text-left">
                  {interest.name[lang]}
                </span>
                {isSelected && (
                  <div className="absolute top-2 right-2">
                    <Check className="w-4 h-4 text-primary" />
                  </div>
                )}
              </motion.button>
            );
          })}
        </motion.div>

        <p className="text-center text-xs text-muted-foreground">
          {lang === 'ru' 
            ? `Выбрано: ${selectedInterests.length}` 
            : lang === 'th'
            ? `เลือกแล้ว: ${selectedInterests.length}`
            : `Selected: ${selectedInterests.length}`}
        </p>
      </div>
    );
  }
);
