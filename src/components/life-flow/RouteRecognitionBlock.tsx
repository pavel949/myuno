/**
 * RouteRecognitionBlock - Empathy + Reassurance + What Matters
 * The calm, human-first opening of a LifeOS guided path
 */
import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface RouteRecognitionBlockProps {
  recognition: string;
  reassurance: string;
  whatMatters: string[];
  accentColor?: string;
}

export function RouteRecognitionBlock({ 
  recognition, reassurance, whatMatters, accentColor 
}: RouteRecognitionBlockProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="space-y-4"
    >
      {/* Recognition — empathy */}
      <p className="text-base font-medium leading-relaxed text-foreground">
        {recognition}
      </p>

      {/* Reassurance — calm */}
      <p className="text-sm text-muted-foreground leading-relaxed">
        {reassurance}
      </p>

      {/* What matters now — focus */}
      <div className="space-y-2.5 pt-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {isRu ? 'Сейчас важно:' : 'Right now it\'s important to:'}
        </p>
        {whatMatters.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 + i * 0.08 }}
            className="flex items-start gap-2.5"
          >
            <CheckCircle2 
              className="w-4 h-4 mt-0.5 shrink-0" 
              style={{ color: accentColor || 'hsl(var(--primary))' }}
            />
            <span className="text-sm leading-snug">{item}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
