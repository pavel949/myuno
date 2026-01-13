import React from 'react';
import { motion } from 'framer-motion';
import { Globe } from 'lucide-react';
import { PitchSlide, SlideTitle, SlideSubtitle } from '../PitchSlide';

interface HeroSlideProps {
  isRussian: boolean;
}

export function HeroSlide({ isRussian }: HeroSlideProps) {
  return (
    <PitchSlide className="relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center">
        {/* Logo */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", duration: 1 }}
          className="mb-8"
        >
          <div className="w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br from-primary to-primary/60 rounded-3xl flex items-center justify-center shadow-2xl">
            <Globe className="w-12 h-12 md:w-16 md:h-16 text-white" />
          </div>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-5xl md:text-7xl lg:text-8xl font-bold bg-gradient-to-r from-white via-primary to-cyan-400 bg-clip-text text-transparent mb-4"
        >
          UNO
        </motion.h1>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-xl md:text-2xl lg:text-3xl text-slate-300 mb-8"
        >
          {isRussian ? 'Дом там, где UNO' : 'Home is where UNO is'}
        </motion.p>

        {/* Elevator pitch */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white/10 backdrop-blur-sm rounded-2xl px-8 py-4 border border-white/20"
        >
          <p className="text-lg md:text-xl text-white font-medium">
            {isRussian 
              ? 'Супер-приложение для экспатов и туристов в Юго-Восточной Азии'
              : 'The Super-App for Expats and Tourists in Southeast Asia'}
          </p>
        </motion.div>

        {/* Key stat */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.9 }}
          className="mt-12 flex items-center gap-4"
        >
          <div className="text-center">
            <p className="text-4xl md:text-5xl font-bold text-primary">$15.6B</p>
            <p className="text-sm md:text-base text-slate-400">
              {isRussian ? 'Рынок туризма Пхукета' : 'Phuket Tourism Market'}
            </p>
          </div>
        </motion.div>
      </div>
    </PitchSlide>
  );
}
