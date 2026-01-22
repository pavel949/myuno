import React from 'react';
import { motion } from 'framer-motion';
import { Smartphone, ShieldX, Globe, Headphones } from 'lucide-react';
import { PitchSlide, SlideTitle, SlideContent } from '../PitchSlide';
import { PAIN_POINTS } from '@/hooks/useInvestorMetrics';

const iconMap: Record<string, React.ElementType> = {
  Smartphone,
  ShieldX,
  Globe,
  Headphones,
};

interface ProblemSlideProps {
  isRussian: boolean;
}

export function ProblemSlide({ isRussian }: ProblemSlideProps) {
  return (
    <PitchSlide>
      <SlideTitle>
        {isRussian ? 'Проблема' : 'The Problem'}
      </SlideTitle>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-xl md:text-2xl text-center text-slate-300 mb-10 max-w-3xl mx-auto"
      >
        {isRussian 
          ? 'Жизнь за рубежом = хаос приложений, языковые барьеры и отсутствие реальной поддержки'
          : 'Living abroad = chaos of apps, language barriers & no real support when you need it'}
      </motion.p>

      <SlideContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {PAIN_POINTS.map((pain, index) => {
            const Icon = iconMap[pain.icon] || ShieldX;
            return (
              <motion.div
                key={pain.id}
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-red-500/20 to-orange-500/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:border-red-500/30 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-red-500/30 to-orange-500/20 rounded-xl flex items-center justify-center">
                      <Icon className="w-7 h-7 text-red-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-3xl font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
                          {pain.stat}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-1">
                        {isRussian ? pain.titleRu : pain.title}
                      </h3>
                      <p className="text-sm text-slate-400">
                        {isRussian ? pain.descriptionRu : pain.description}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Quote */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-10 text-center"
        >
          <blockquote className="text-lg md:text-xl italic text-slate-400 max-w-2xl mx-auto">
            "{isRussian 
              ? 'Я потратил 3 часа, чтобы найти врача, говорящего по-русски. В итоге переплатил вдвое.'
              : 'I spent 3 hours finding a Russian-speaking doctor. Ended up paying double.'}"
          </blockquote>
          <p className="text-sm text-slate-500 mt-2">
            — {isRussian ? 'Типичный экспат в Таиланде' : 'Typical expat in Thailand'}
          </p>
        </motion.div>
      </SlideContent>
    </PitchSlide>
  );
}
