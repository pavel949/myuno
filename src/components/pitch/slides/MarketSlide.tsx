import React from 'react';
import { motion } from 'framer-motion';
import { PitchSlide, SlideTitle, SlideContent } from '../PitchSlide';
import { MARKET_DATA } from '@/hooks/useInvestorMetrics';

interface MarketSlideProps {
  isRussian: boolean;
}

export function MarketSlide({ isRussian }: MarketSlideProps) {
  return (
    <PitchSlide>
      <SlideTitle>
        {isRussian ? 'Рыночная возможность' : 'Market Opportunity'}
      </SlideTitle>

      <SlideContent>
        <div className="flex flex-col lg:flex-row items-center justify-center gap-8">
          {/* TAM/SAM/SOM Visualization */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="relative w-80 h-80 md:w-96 md:h-96"
          >
            {/* TAM - Outer circle */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4, type: "spring" }}
              className="absolute inset-0 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 border-2 border-slate-600 flex items-center justify-center"
            >
              <span className="absolute top-4 text-sm text-slate-400">TAM</span>
            </motion.div>

            {/* SAM - Middle circle */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.6, type: "spring" }}
              className="absolute inset-12 md:inset-16 rounded-full bg-gradient-to-br from-blue-900 to-blue-950 border-2 border-blue-700 flex items-center justify-center"
            >
              <span className="absolute top-2 text-sm text-blue-400">SAM</span>
            </motion.div>

            {/* SOM - Inner circle */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.8, type: "spring" }}
              className="absolute inset-24 md:inset-32 rounded-full bg-gradient-to-br from-primary to-primary/80 border-2 border-primary flex items-center justify-center"
            >
              <span className="text-sm text-white font-semibold">SOM</span>
            </motion.div>
          </motion.div>

          {/* Market data */}
          <div className="flex flex-col gap-4 max-w-md">
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-slate-700/50 rounded-xl p-4 border-l-4 border-slate-500"
            >
              <p className="text-3xl font-bold text-white">${MARKET_DATA.phuketTourismRevenue2024}B</p>
              <p className="text-slate-400">{isRussian ? 'TAM: Туризм Пхукета 2024' : 'TAM: Phuket Tourism 2024'}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 }}
              className="bg-blue-900/50 rounded-xl p-4 border-l-4 border-blue-500"
            >
              <p className="text-3xl font-bold text-white">${MARKET_DATA.addressableMarket}B</p>
              <p className="text-slate-400">{isRussian ? 'SAM: Цифровые услуги' : 'SAM: Digital-Addressable'}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.9 }}
              className="bg-primary/30 rounded-xl p-4 border-l-4 border-primary"
            >
              <p className="text-3xl font-bold text-white">${MARKET_DATA.potentialRevenue}M</p>
              <p className="text-slate-400">{isRussian ? 'SOM: При 10% доле' : 'SOM: 10% Capture @ 10% Take Rate'}</p>
            </motion.div>
          </div>
        </div>

        {/* Supporting stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
          className="mt-8 flex flex-wrap justify-center gap-4"
        >
          {[
            { value: `${MARKET_DATA.digitalPenetration}%`, label: isRussian ? 'Интернет проникновение' : 'Internet Penetration' },
            { value: `${MARKET_DATA.mobilePaymentAdoption}%`, label: isRussian ? 'Мобильные платежи' : 'Mobile Payment Adoption' },
            { value: `${MARKET_DATA.independentBookers}%`, label: isRussian ? 'Самостоятельное бронирование' : 'Independent Bookers' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white/5 rounded-lg px-4 py-2 text-center">
              <p className="text-lg font-bold text-primary">{stat.value}</p>
              <p className="text-xs text-slate-400">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </SlideContent>
    </PitchSlide>
  );
}
