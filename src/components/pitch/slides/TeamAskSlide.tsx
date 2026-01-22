import React from 'react';
import { motion } from 'framer-motion';
import { Mail, Globe, Rocket, Target, TrendingUp, DollarSign } from 'lucide-react';
import { PitchSlide, SlideTitle, SlideContent } from '../PitchSlide';
import { PMF_TARGETS, INVESTMENT_DETAILS } from '@/hooks/useInvestorMetrics';

interface TeamAskSlideProps {
  isRussian: boolean;
}

export function TeamAskSlide({ isRussian }: TeamAskSlideProps) {
  const { useOfFunds, raising, valuation, stage } = INVESTMENT_DETAILS;

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
            {/* Investment box */}
            <div className="relative overflow-hidden bg-gradient-to-br from-primary/30 via-primary/20 to-cyan-500/20 rounded-2xl p-6 border border-primary/40 mb-6">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-3">
                  <Rocket className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold text-white">
                    {isRussian ? 'Привлекаем' : 'Raising'}
                  </h3>
                </div>
                <p className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white to-primary bg-clip-text text-transparent mb-2">
                  ${(raising.min / 1000).toFixed(0)}K - ${(raising.max / 1000000).toFixed(1)}M
                </p>
                <p className="text-slate-400 mb-4">
                  {stage}
                </p>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-green-400" />
                    <span className="text-slate-300">
                      {isRussian ? 'Оценка' : 'Valuation'}: ${(valuation / 1000000).toFixed(0)}M
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Fund allocation */}
            <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              {isRussian ? 'Использование средств' : 'Use of Funds'}
            </h4>
            <div className="space-y-3">
              {useOfFunds.map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                >
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-slate-300">{isRussian ? item.labelRu : item.label}</span>
                    <span className="text-white font-semibold">{item.percent}%</span>
                  </div>
                  <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${item.percent}%` }}
                      transition={{ delay: 0.6 + index * 0.1, duration: 0.6 }}
                      className={`h-full ${item.color} rounded-full`}
                    />
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
            <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              {isRussian ? '18-месячные цели PMF' : '18-Month PMF Milestones'}
            </h4>
            <div className="grid grid-cols-2 gap-3">
              {PMF_TARGETS.slice(0, 6).map((target, index) => (
                <motion.div
                  key={target.metric}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 + index * 0.05 }}
                  className="bg-white/5 rounded-xl p-3 border border-white/10 hover:border-white/20 transition-colors"
                >
                  <p className="text-xs text-slate-400 mb-1">
                    {isRussian ? target.metricRu : target.metric}
                  </p>
                  <p className="text-lg font-bold text-white">{target.target}</p>
                </motion.div>
              ))}
            </div>

            {/* Contact */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="mt-6 bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-xl p-5 border border-white/10"
            >
              <h4 className="text-lg font-semibold text-white mb-4">
                {isRussian ? 'Свяжитесь с нами' : 'Get in Touch'}
              </h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-slate-300 hover:text-white transition-colors">
                  <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
                    <Mail className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-sm">invest@myuno.app</span>
                </div>
                <div className="flex items-center gap-3 text-slate-300 hover:text-white transition-colors">
                  <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
                    <Globe className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-sm">myuno.app</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.1 }}
          className="mt-8 text-center"
        >
          <p className="text-xl md:text-2xl font-semibold">
            <span className="bg-gradient-to-r from-primary via-cyan-400 to-purple-400 bg-clip-text text-transparent">
              {isRussian 
                ? 'Создаём инфраструктуру для жизни за рубежом'
                : 'Building infrastructure for living abroad'}
            </span>
          </p>
        </motion.div>
      </SlideContent>
    </PitchSlide>
  );
}
