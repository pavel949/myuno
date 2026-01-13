import React from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { PitchSlide, SlideTitle, SlideContent } from '../PitchSlide';
import { FINANCIAL_PROJECTIONS } from '@/hooks/useInvestorMetrics';

interface FinancialsSlideProps {
  isRussian: boolean;
}

export function FinancialsSlide({ isRussian }: FinancialsSlideProps) {
  const chartData = FINANCIAL_PROJECTIONS.map(p => ({
    year: p.year,
    GMV: p.gmv / 1000000, // Convert to millions
    Revenue: p.revenue / 1000000,
  }));

  return (
    <PitchSlide>
      <SlideTitle>
        {isRussian ? 'Финансовые прогнозы' : 'Financial Projections'}
      </SlideTitle>

      <SlideContent>
        <div className="flex flex-col lg:flex-row items-center gap-8">
          {/* Chart */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="w-full lg:w-2/3 h-64"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="year" stroke="rgba(255,255,255,0.5)" />
                <YAxis stroke="rgba(255,255,255,0.5)" tickFormatter={(v) => `$${v}M`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(30, 41, 59, 0.95)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    color: 'white'
                  }}
                  formatter={(value: number) => [`$${value}M`, '']}
                />
                <Legend
                  wrapperStyle={{ color: 'white' }}
                  formatter={(value) => <span className="text-slate-300">{value}</span>}
                />
                <Bar dataKey="GMV" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Projection details */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="w-full lg:w-1/3 space-y-4"
          >
            {FINANCIAL_PROJECTIONS.map((projection, index) => (
              <div
                key={projection.year}
                className="bg-white/5 rounded-xl p-4 border border-white/10"
              >
                <h4 className="text-lg font-semibold text-white mb-2">{projection.year}</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-slate-400">GMV</p>
                    <p className="text-white font-medium">${(projection.gmv / 1000000).toFixed(1)}M</p>
                  </div>
                  <div>
                    <p className="text-slate-400">{isRussian ? 'Выручка' : 'Revenue'}</p>
                    <p className="text-primary font-medium">${(projection.revenue / 1000).toFixed(0)}K</p>
                  </div>
                  <div>
                    <p className="text-slate-400">{isRussian ? 'Пользователи' : 'Users'}</p>
                    <p className="text-white font-medium">{(projection.users / 1000).toFixed(0)}K</p>
                  </div>
                  <div>
                    <p className="text-slate-400">{isRussian ? 'Провайдеры' : 'Providers'}</p>
                    <p className="text-white font-medium">{projection.providers}</p>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Assumptions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-6 text-center"
        >
          <p className="text-xs text-slate-500">
            {isRussian 
              ? 'Допущения: 10% средняя комиссия, 15% MoM рост пользователей, 40% конверсия в платные подписки Y3'
              : 'Assumptions: 10% avg take rate, 15% MoM user growth, 40% paid subscription conversion by Y3'}
          </p>
        </motion.div>
      </SlideContent>
    </PitchSlide>
  );
}
