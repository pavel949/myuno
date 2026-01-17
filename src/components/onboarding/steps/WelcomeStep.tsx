import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type Language = 'ru' | 'en' | 'th';

interface WelcomeCategory {
  icon: LucideIcon;
  name: { en: string; ru: string; th: string };
}

interface LanguageOption {
  code: 'en' | 'ru' | 'th';
  flag: string;
  label: string;
}

interface WelcomeStepProps {
  lang: Language;
  language: string;
  setLanguage: (lang: 'en' | 'ru' | 'th') => void;
  step: {
    icon: LucideIcon;
    title: { en: string; ru: string; th: string };
    subtitle: { en: string; ru: string; th: string };
  };
  audienceTexts: Record<Language, string>;
  welcomeCategories: WelcomeCategory[];
  languageOptions: LanguageOption[];
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.4,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.9 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { type: 'spring' as const, stiffness: 300, damping: 20 },
  },
};

export function WelcomeStep({
  lang,
  language,
  setLanguage,
  step,
  audienceTexts,
  welcomeCategories,
  languageOptions,
}: WelcomeStepProps) {
  const StepIcon = step.icon;

  return (
    <div className="text-center space-y-5 flex-1 flex flex-col justify-center">
      {/* Animated Icon */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
        className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-primary via-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/25"
      >
        <StepIcon className="w-10 h-10 text-primary-foreground" />
      </motion.div>

      {/* Title and Subtitle */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-2"
      >
        <h2 className="text-3xl font-bold">
          {step.title[lang]}
        </h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {step.subtitle[lang]}
        </p>
        <p className="text-xs text-muted-foreground/70">
          {audienceTexts[lang]}
        </p>
      </motion.div>

      {/* Categories Grid with Staggered Animation */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-3 gap-3 pt-2"
      >
        {welcomeCategories.map((cat, index) => {
          const IconComponent = cat.icon;
          return (
            <motion.div
              key={index}
              variants={itemVariants}
              className="flex flex-col items-center gap-2 p-3 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/30 hover:bg-card/80 transition-all duration-200"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <IconComponent className="w-5 h-5 text-primary" />
              </div>
              <span className="text-xs font-medium text-foreground/80">
                {cat.name[lang]}
              </span>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Language Selection */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="flex justify-center gap-2 pt-2"
      >
        {languageOptions.map((opt) => (
          <button
            key={opt.code}
            onClick={() => setLanguage(opt.code)}
            className={cn(
              "px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-all duration-200",
              language === opt.code
                ? "bg-primary text-primary-foreground shadow-md"
                : "bg-muted hover:bg-muted/80"
            )}
          >
            <span>{opt.flag}</span>
            <span className="hidden sm:inline">{opt.label}</span>
          </button>
        ))}
      </motion.div>
    </div>
  );
}
