import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { QuickListingModal } from './QuickListingModal';

export function QuickListingFAB() {
  const { language } = useLanguage();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Listen for open-quick-listing event from CTA buttons
  useEffect(() => {
    const handleOpenQuickListing = () => setIsModalOpen(true);
    window.addEventListener('open-quick-listing', handleOpenQuickListing);
    return () => window.removeEventListener('open-quick-listing', handleOpenQuickListing);
  }, []);

  return (
    <>
      <motion.button
        className="fixed bottom-24 right-4 z-40 flex items-center gap-2 rounded-full gradient-gold text-primary-foreground shadow-lg"
        style={{ padding: isHovered ? '12px 20px' : '14px' }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        onClick={() => setIsModalOpen(true)}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Plus className="w-6 h-6" />
        <AnimatePresence>
          {isHovered && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="font-medium whitespace-nowrap overflow-hidden"
            >
              {language === 'ru' ? 'Разместить' : 'List Now'}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      <QuickListingModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
}
