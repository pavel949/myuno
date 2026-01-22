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
        <div className="flex flex-col lg:flex-row items-center justify-center gap-10">
          {/* TAM/SAM/SOM Visualization - Enhanced */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="relative w-72 h-72 md:w-80 md:h-80"
          >
            {/* TAM - Outer circle */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4, type: "spring" }}
              className="absolute inset-0 rounded-full bg-gradient-to-br from-slate-700/80 to-slate-800/80 border-2 border-slate-500/50 flex items-center justify-center shadow-xl"
            >
              <span className="absolute top-6 left-1/2 -translate-x-1/2 text-sm font-medium text-slate-400 bg-slate-900/80 px-3 py-1 rounded-full">
                TAM
              </span>
            </motion.div>

            {/* SAM - Middle circle */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.6, type: "spring" }}
              className="absolute inset-14 md:inset-16 rounded-full bg-gradient-to-br from-blue-800/80 to-blue-900/80 border-2 border-blue-500/50 flex items-center justify-center shadow-lg"
            >
              <span className="absolute top-4 left-1/2 -translate-x-1/2 text-sm font-medium text-blue-400 bg-blue-950/80 px-3 py-1 rounded-full">
                SAM
              </span>
            </motion.div>

            {/* SOM - Inner circle */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.8, type: "spring" }}
              className="absolute inset-28 md:inset-32 rounded-full bg-gradient-to-br from-primary to-primary/80 border-2 border-primary flex items-center justify-center shadow-lg shadow-primary/30"
            >
              <span className="text-sm font-bold text-white">SOM</span>
            </motion.div>
          </motion.div>

          {/* Market data - Enhanced cards */}
          <div className="flex flex-col gap-4 max-w-md">
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="relative overflow-hidden bg-gradient-to-br from-slate-700/50 to-slate-800/50 rounded-2xl p-5 border-l-4 border-slate-400"
            >
              <div className="absolute top-0 right-0 w-20 h-20 bg-slate-500/10 rounded-full blur-2xl" />
              <p className="text-sm text-slate-400 mb-1">{isRussian ? 'TAM: Рынок ЮВА' : 'TAM: SEA Travel & Tourism'}</p>
              <p className="text-3xl md:text-4xl font-bold text-white">${MARKET_DATA.seaTourismMarket}B</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 }}
              className="relative overflow-hidden bg-gradient-to-br from-blue-900/50 to-blue-950/50 rounded-2xl p-5 border-l-4 border-blue-500"
            >
              <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-full blur-2xl" />
              <p className="text-sm text-blue-400 mb-1">{isRussian ? 'SAM: Пхукет + цифровые услуги' : 'SAM: Phuket Digital-Addressable'}</p>
              <p className="text-3xl md:text-4xl font-bold text-white">${MARKET_DATA.addressableMarket}B</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.9 }}
              className="relative overflow-hidden bg-gradient-to-br from-primary/30 to-primary/10 rounded-2xl p-5 border-l-4 border-primary"
            >
              <div className="absolute top-0 right-0 w-20 h-20 bg-primary/20 rounded-full blur-2xl" />
              <p className="text-sm text-primary mb-1">{isRussian ? 'SOM: Потенциал выручки' : 'SOM: Revenue Potential'}</p>
              <p className="text-3xl md:text-4xl font-bold text-white">${MARKET_DATA.potentialRevenue}M</p>
              <p className="text-xs text-slate-400 mt-1">
                {isRussian ? 'При 10% доле рынка × 10% комиссия' : '10% market capture × 10% take rate'}
              </p>
            </motion.div>
          </div>
        </div>

        {/* Supporting stats - Enhanced */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
          className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {[
            { value: `${MARKET_DATA.digitalPenetration}%`, label: isRussian ? 'Интернет проникновение' : 'Internet Penetration', color: 'text-blue-400' },
            { value: `${MARKET_DATA.mobilePaymentAdoption}%`, label: isRussian ? 'Мобильные платежи' : 'Mobile Payments', color: 'text-green-400' },
            { value: `${(MARKET_DATA.russianTouristsMonthly / 1000).toFixed(0)}K/мес`, label: isRussian ? 'Русских туристов' : 'Russian Tourists/mo', color: 'text-purple-400' },
            { value: `${(MARKET_DATA.expatsInThailand).toFixed(1)}M`, label: isRussian ? 'Экспатов в Таиланде' : 'Expats in Thailand', color: 'text-amber-400' },
          ].map((stat, index) => (
            <motion.div 
              key={stat.label} 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 + index * 0.1 }}
              className="bg-white/5 rounded-xl px-4 py-3 text-center border border-white/10"
            >
              <p className={`text-xl md:text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-slate-400 mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </SlideContent>
    </PitchSlide>
  );
}
