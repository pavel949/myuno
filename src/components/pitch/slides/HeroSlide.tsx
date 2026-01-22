import React from 'react';
import { motion } from 'framer-motion';
import { Globe, Sparkles } from 'lucide-react';
import { PitchSlide } from '../PitchSlide';

interface HeroSlideProps {
  isRussian: boolean;
}

export function HeroSlide({ isRussian }: HeroSlideProps) {
  return (
    <PitchSlide className="relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Gradient orbs */}
        <motion.div
          className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/30 rounded-full blur-[120px]"
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
          className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-cyan-500/30 rounded-full blur-[120px]"
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
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/20 rounded-full blur-[150px]"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
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
          <div className="relative w-28 h-28 md:w-36 md:h-36">
            <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/80 to-cyan-500 rounded-3xl shadow-2xl shadow-primary/30" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Globe className="w-14 h-14 md:w-18 md:h-18 text-white" />
            </div>
            <motion.div
              className="absolute -top-2 -right-2"
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Sparkles className="w-6 h-6 text-yellow-400" />
            </motion.div>
          </div>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tight"
        >
          <span className="bg-gradient-to-r from-white via-primary/90 to-cyan-400 bg-clip-text text-transparent">
            my
          </span>
          <span className="bg-gradient-to-r from-primary to-cyan-400 bg-clip-text text-transparent">
            UNO
          </span>
        </motion.h1>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-2xl md:text-3xl lg:text-4xl text-slate-300 mt-4 mb-8 font-light"
        >
          {isRussian ? 'Дом там, где UNO' : 'Home is where UNO is'}
        </motion.p>

        {/* Elevator pitch */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white/10 backdrop-blur-md rounded-2xl px-8 py-5 border border-white/20 max-w-2xl"
        >
          <p className="text-lg md:text-xl text-white font-medium leading-relaxed">
            {isRussian 
              ? 'Цифровая и офлайн инфраструктура для жизни и путешествий за рубежом'
              : 'Digital & offline infrastructure for living and traveling abroad'}
          </p>
        </motion.div>

        {/* Key stats */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.9 }}
          className="mt-12 flex flex-wrap items-center justify-center gap-8 md:gap-12"
        >
          <div className="text-center">
            <p className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-cyan-400 bg-clip-text text-transparent">
              15+
            </p>
            <p className="text-sm md:text-base text-slate-400 mt-1">
              {isRussian ? 'Вертикалей услуг' : 'Service Verticals'}
            </p>
          </div>
          <div className="w-px h-12 bg-white/20 hidden md:block" />
          <div className="text-center">
            <p className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              $15.6B
            </p>
            <p className="text-sm md:text-base text-slate-400 mt-1">
              {isRussian ? 'Рынок туризма Пхукета' : 'Phuket Tourism Market'}
            </p>
          </div>
          <div className="w-px h-12 bg-white/20 hidden md:block" />
          <div className="text-center">
            <p className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              24/7
            </p>
            <p className="text-sm md:text-base text-slate-400 mt-1">
              {isRussian ? 'UNO Team на месте' : 'UNO Team On Ground'}
            </p>
          </div>
        </motion.div>
      </div>
    </PitchSlide>
  );
}
