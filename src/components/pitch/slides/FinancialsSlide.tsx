import React from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart } from 'recharts';
import { TrendingUp, Target } from 'lucide-react';
import { PitchSlide, SlideTitle, SlideContent } from '../PitchSlide';
import { FINANCIAL_PROJECTIONS } from '@/hooks/useInvestorMetrics';

interface FinancialsSlideProps {
  isRussian: boolean;
}

export function FinancialsSlide({ isRussian }: FinancialsSlideProps) {
  const chartData = FINANCIAL_PROJECTIONS.map(p => ({
    year: isRussian ? p.yearRu : p.year,
    GMV: p.gmv / 1000000, // Convert to millions
    Revenue: p.revenue / 1000000,
  }));

  const year3 = FINANCIAL_PROJECTIONS[2];

  return (
    <PitchSlide>
      <SlideTitle>
        {isRussian ? 'Финансовые прогнозы' : 'Financial Projections'}
      </SlideTitle>

      <SlideContent>
        <div className="flex flex-col lg:flex-row items-start gap-8">
          {/* Chart */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="w-full lg:w-2/3"
          >
            <div className="h-64 md:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="gmvGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis 
                    dataKey="year" 
                    stroke="rgba(255,255,255,0.5)" 
                    tick={{ fill: 'rgba(255,255,255,0.7)' }}
                  />
                  <YAxis 
                    stroke="rgba(255,255,255,0.5)" 
                    tickFormatter={(v) => `$${v}M`}
                    tick={{ fill: 'rgba(255,255,255,0.7)' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.95)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                      color: 'white',
                      padding: '12px'
                    }}
                    formatter={(value: number, name: string) => [
                      `$${value.toFixed(2)}M`, 
                      name === 'GMV' ? 'GMV' : (isRussian ? 'Выручка' : 'Revenue')
                    ]}
                  />
                  <Legend 
                    wrapperStyle={{ color: 'white' }}
                    formatter={(value) => (
                      <span className="text-slate-300">
                        {value === 'GMV' ? 'GMV' : (isRussian ? 'Выручка' : 'Revenue')}
                      </span>
                    )}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="GMV" 
                    stroke="hsl(var(--chart-2))" 
                    strokeWidth={2}
                    fill="url(#gmvGradient)" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="Revenue" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    fill="url(#revenueGradient)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Projection details */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="w-full lg:w-1/3 space-y-4"
          >
            {FINANCIAL_PROJECTIONS.map((projection, index) => (
              <motion.div
                key={projection.year}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + index * 0.1 }}
                className={`bg-white/5 rounded-xl p-4 border ${
                  index === 2 ? 'border-primary/50 bg-primary/10' : 'border-white/10'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-lg font-semibold text-white">
                    {isRussian ? projection.yearRu : projection.year}
                  </h4>
                  {index === 2 && (
                    <span className="text-xs px-2 py-1 bg-primary/20 text-primary rounded-full">
                      {isRussian ? 'Цель' : 'Target'}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-slate-400">GMV</p>
                    <p className="text-white font-semibold">${(projection.gmv / 1000000).toFixed(1)}M</p>
                  </div>
                  <div>
                    <p className="text-slate-400">{isRussian ? 'Выручка' : 'Revenue'}</p>
                    <p className="text-primary font-semibold">${(projection.revenue / 1000).toFixed(0)}K</p>
                  </div>
                  <div>
                    <p className="text-slate-400">{isRussian ? 'Пользователи' : 'Users'}</p>
                    <p className="text-white font-semibold">{(projection.users / 1000).toFixed(0)}K</p>
                  </div>
                  <div>
                    <p className="text-slate-400">{isRussian ? 'Провайдеры' : 'Providers'}</p>
                    <p className="text-white font-semibold">{projection.providers.toLocaleString()}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Key metrics & valuation justification */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="mt-6 flex flex-wrap justify-center gap-4"
        >
          <div className="bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl px-5 py-3 border border-primary/30">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              <p className="text-sm text-slate-300">{isRussian ? 'Оценка $2M' : '$2M Valuation'}</p>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {isRussian ? '2.5x Year 3 выручка' : '2.5x Year 3 Revenue'}
            </p>
          </div>
          <div className="bg-white/5 rounded-xl px-5 py-3 border border-white/10">
            <p className="text-sm text-slate-300">{isRussian ? 'Ср. комиссия' : 'Avg Take Rate'}</p>
            <p className="text-lg font-bold text-white">10%</p>
          </div>
          <div className="bg-white/5 rounded-xl px-5 py-3 border border-white/10">
            <p className="text-sm text-slate-300">CAGR</p>
            <p className="text-lg font-bold text-green-400 flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              350%+
            </p>
          </div>
        </motion.div>

        {/* Assumptions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
          className="mt-4 text-center"
        >
          <p className="text-xs text-slate-500">
            {isRussian 
              ? 'Допущения: 10% средняя комиссия, 12% MoM рост, 40% конверсия в подписки к году 3'
              : 'Assumptions: 10% avg take rate, 12% MoM growth, 40% subscription conversion by Year 3'}
          </p>
        </motion.div>
      </SlideContent>
    </PitchSlide>
  );
}
