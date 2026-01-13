import React from 'react';
import { motion } from 'framer-motion';
import { Target, Users, Code, TrendingUp, Mail, Globe } from 'lucide-react';
import { PitchSlide, SlideTitle, SlideContent } from '../PitchSlide';
import { PMF_TARGETS } from '@/hooks/useInvestorMetrics';

interface TeamAskSlideProps {
  isRussian: boolean;
}

const fundAllocation = [
  { label: 'Product & Engineering', labelRu: 'Продукт и разработка', percent: 40, color: 'bg-blue-500' },
  { label: 'Marketing & Growth', labelRu: 'Маркетинг и рост', percent: 30, color: 'bg-green-500' },
  { label: 'Operations', labelRu: 'Операции', percent: 20, color: 'bg-purple-500' },
  { label: 'Legal & Compliance', labelRu: 'Юридические', percent: 10, color: 'bg-amber-500' },
];

export function TeamAskSlide({ isRussian }: TeamAskSlideProps) {
  return (
    <PitchSlide>
      <SlideTitle>
        {isRussian ? 'Инвестиционный раунд' : 'The Ask'}
      </SlideTitle>

      <SlideContent>
        <div className="flex flex-col lg:flex-row items-start gap-8">
          {/* The Ask */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="flex-1"
          >
            <div className="bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl p-6 border border-primary/30 mb-6">
              <h3 className="text-xl font-semibold text-white mb-4">
                {isRussian ? 'Привлекаем' : 'Raising'}
              </h3>
              <p className="text-4xl md:text-5xl font-bold text-primary mb-2">
                $500K - $1.5M
              </p>
              <p className="text-slate-400">
                {isRussian ? 'Pre-Seed / Seed раунд' : 'Pre-Seed / Seed Round'}
              </p>
            </div>

            {/* Fund allocation */}
            <h4 className="text-lg font-semibold text-white mb-4">
              {isRussian ? 'Использование средств' : 'Use of Funds'}
            </h4>
            <div className="space-y-3">
              {fundAllocation.map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-300">{isRussian ? item.labelRu : item.label}</span>
                      <span className="text-white font-medium">{item.percent}%</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${item.percent}%` }}
                        transition={{ delay: 0.6 + index * 0.1, duration: 0.5 }}
                        className={`h-full ${item.color} rounded-full`}
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Milestones / PMF Targets */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="flex-1"
          >
            <h4 className="text-lg font-semibold text-white mb-4">
              {isRussian ? 'Цели для достижения PMF' : 'PMF Milestones'}
            </h4>
            <div className="grid grid-cols-2 gap-3">
              {PMF_TARGETS.slice(0, 6).map((target, index) => (
                <div
                  key={target.metric}
                  className="bg-white/5 rounded-xl p-3 border border-white/10"
                >
                  <p className="text-xs text-slate-400 mb-1">{target.metric}</p>
                  <p className="text-lg font-bold text-white">{target.target}</p>
                </div>
              ))}
            </div>

            {/* Contact */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="mt-6 bg-white/5 rounded-xl p-4 border border-white/10"
            >
              <h4 className="text-lg font-semibold text-white mb-3">
                {isRussian ? 'Контакты' : 'Get in Touch'}
              </h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-slate-300">
                  <Mail className="w-4 h-4 text-primary" />
                  <span className="text-sm">invest@uno.app</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <Globe className="w-4 h-4 text-primary" />
                  <span className="text-sm">uno.app</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1 }}
          className="mt-8 text-center"
        >
          <p className="text-xl md:text-2xl font-semibold text-primary">
            {isRussian 
              ? 'Присоединяйтесь к будущему сервисов в Юго-Восточной Азии'
              : 'Join us in building the future of services in Southeast Asia'}
          </p>
        </motion.div>
      </SlideContent>
    </PitchSlide>
  );
}
