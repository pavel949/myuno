import React from 'react';
import { motion } from 'framer-motion';
import { Car, Smartphone, ShieldX, Banknote } from 'lucide-react';
import { PitchSlide, SlideTitle, SlideContent } from '../PitchSlide';
import { PAIN_POINTS } from '@/hooks/useInvestorMetrics';

const iconMap: Record<string, React.ElementType> = {
  Car,
  Smartphone,
  ShieldX,
  Banknote,
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

      <SlideContent className="mt-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {PAIN_POINTS.map((point, index) => {
            const Icon = iconMap[point.icon] || Smartphone;
            return (
              <motion.div
                key={point.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.15 }}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-red-500/20 rounded-xl">
                    <Icon className="w-6 h-6 text-red-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-3xl md:text-4xl font-bold text-red-400">
                        {point.stat}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-1">
                      {isRussian ? point.titleRu : point.title}
                    </h3>
                    <p className="text-sm text-slate-400">
                      {isRussian ? point.descriptionRu : point.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Additional context */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-8 text-center"
        >
          <p className="text-slate-400 text-lg">
            {isRussian 
              ? 'Нет единой платформы, объединяющей все услуги с гарантией доверия'
              : 'No unified platform combining all services with trust guarantees'}
          </p>
        </motion.div>
      </SlideContent>
    </PitchSlide>
  );
}
