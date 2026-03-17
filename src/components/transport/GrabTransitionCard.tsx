import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Star, Clock, Shield, Zap } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { GrabLeadModal } from './GrabLeadModal';

interface GrabTransitionCardProps {
  pickupAddress?: string;
  destinationAddress?: string;
  className?: string;
}

export function GrabTransitionCard({ pickupAddress, destinationAddress, className }: GrabTransitionCardProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsModalOpen(true)}
        className={cn(
          "w-full p-4 rounded-2xl text-left transition-all",
          "bg-gradient-to-br from-success via-success/90 to-success/80",
          "shadow-lg shadow-success/20",
          "border border-white/10",
          className
        )}
      >
        <div className="flex items-start gap-4">
          {/* Grab Logo */}
          <div className="flex-shrink-0">
            <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <span className="text-white font-bold text-2xl">G</span>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-bold text-white">
                Grab
              </h3>
              <div className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-semibold text-white uppercase">
                {isRu ? 'Партнёр' : 'Partner'}
              </div>
            </div>
            
            <p className="text-white/80 text-sm mb-3">
              {isRu 
                ? 'Крупнейший сервис такси в Юго-Восточной Азии'
                : 'Southeast Asia\'s largest ride-hailing service'}
            </p>

            {/* Features */}
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/15 text-xs text-white">
                <Star className="w-3 h-3" />
                <span>4.8</span>
              </div>
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/15 text-xs text-white">
                <Clock className="w-3 h-3" />
                <span>{isRu ? '3-5 мин' : '3-5 min'}</span>
              </div>
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/15 text-xs text-white">
                <Shield className="w-3 h-3" />
                <span>{isRu ? 'Страховка' : 'Insured'}</span>
              </div>
            </div>
          </div>

          {/* Arrow */}
          <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-white/20">
            <ArrowRight className="w-5 h-5 text-white" />
          </div>
        </div>

        {/* Bottom accent */}
        <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white/70 text-xs">
            <Zap className="w-3.5 h-3.5" />
            <span>{isRu ? 'Быстрое подключение через myUNO' : 'Quick connect via myUNO'}</span>
          </div>
          <span className="text-white font-medium text-sm">
            {isRu ? 'Заказать →' : 'Book now →'}
          </span>
        </div>
      </motion.button>

      <GrabLeadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        pickupAddress={pickupAddress}
        destinationAddress={destinationAddress}
      />
    </>
  );
}
