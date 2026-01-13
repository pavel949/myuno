import React from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { PitchSlide, SlideTitle, SlideContent } from '../PitchSlide';
import { REVENUE_STREAMS } from '@/hooks/useInvestorMetrics';

interface BusinessModelSlideProps {
  isRussian: boolean;
}

const pricingTiers = [
  {
    name: 'Free',
    nameRu: 'Бесплатный',
    price: '$0',
    features: ['Basic listing', '5% commission', 'Standard support'],
    featuresRu: ['Базовое размещение', '5% комиссия', 'Стандартная поддержка'],
  },
  {
    name: 'Pro',
    nameRu: 'Про',
    price: '$49/mo',
    features: ['Featured listings', '3% commission', 'Priority support', 'Analytics'],
    featuresRu: ['Продвижение', '3% комиссия', 'Приоритетная поддержка', 'Аналитика'],
    highlighted: true,
  },
  {
    name: 'Business',
    nameRu: 'Бизнес',
    price: '$149/mo',
    features: ['Premium placement', '2% commission', 'Dedicated manager', 'API access'],
    featuresRu: ['Премиум размещение', '2% комиссия', 'Персональный менеджер', 'API доступ'],
  },
];

export function BusinessModelSlide({ isRussian }: BusinessModelSlideProps) {
  return (
    <PitchSlide>
      <SlideTitle>
        {isRussian ? 'Бизнес-модель' : 'Business Model'}
      </SlideTitle>

      <SlideContent>
        <div className="flex flex-col lg:flex-row items-center justify-center gap-8">
          {/* Revenue pie chart */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="w-full max-w-sm h-64"
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={REVENUE_STREAMS.map(s => ({
                    ...s,
                    name: isRussian ? s.nameRu : s.name
                  }))}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {REVENUE_STREAMS.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(30, 41, 59, 0.9)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    color: 'white'
                  }}
                  formatter={(value: number) => [`${value}%`, '']}
                />
                <Legend 
                  wrapperStyle={{ color: 'white' }}
                  formatter={(value) => <span className="text-slate-300 text-sm">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Pricing tiers */}
          <div className="flex flex-wrap justify-center gap-4">
            {pricingTiers.map((tier, index) => (
              <motion.div
                key={tier.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.15 }}
                className={`w-40 p-4 rounded-xl border ${
                  tier.highlighted 
                    ? 'bg-primary/20 border-primary' 
                    : 'bg-white/5 border-white/10'
                }`}
              >
                <h4 className={`font-semibold mb-1 ${
                  tier.highlighted ? 'text-primary' : 'text-white'
                }`}>
                  {isRussian ? tier.nameRu : tier.name}
                </h4>
                <p className="text-2xl font-bold text-white mb-3">{tier.price}</p>
                <ul className="space-y-1">
                  {(isRussian ? tier.featuresRu : tier.features).map((feature, i) => (
                    <li key={i} className="text-xs text-slate-400">• {feature}</li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Unit economics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="mt-8 flex flex-wrap justify-center gap-4"
        >
          {[
            { label: isRussian ? 'Ср. комиссия' : 'Avg Take Rate', value: '8-10%' },
            { label: isRussian ? 'CAC' : 'Target CAC', value: '<$15' },
            { label: isRussian ? 'LTV:CAC' : 'Target LTV:CAC', value: '>3:1' },
          ].map((metric) => (
            <div key={metric.label} className="bg-white/5 rounded-lg px-4 py-2 text-center">
              <p className="text-lg font-bold text-primary">{metric.value}</p>
              <p className="text-xs text-slate-400">{metric.label}</p>
            </div>
          ))}
        </motion.div>
      </SlideContent>
    </PitchSlide>
  );
}
