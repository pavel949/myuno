import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';

interface NotificationGroupProps {
  label: string;
  labelRu: string;
  children: React.ReactNode;
}

export function NotificationGroup({ label, labelRu, children }: NotificationGroupProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-1">
        {isRu ? labelRu : label}
      </h3>
      <div className="space-y-2">
        {children}
      </div>
    </div>
  );
}
