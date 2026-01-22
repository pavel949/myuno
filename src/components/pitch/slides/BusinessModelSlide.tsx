import React from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { TrendingUp, Percent, Users } from 'lucide-react';
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
    features: ['Basic listing', '10% commission', 'Standard support'],
    featuresRu: ['Базовое размещение', '10% комиссия', 'Стандартная поддержка'],
    color: 'border-slate-500',
    bg: 'bg-slate-800/50',
  },
  {
    name: 'Pro',
    nameRu: 'Про',
    price: '$49/mo',
    features: ['Featured placement', '8% commission', 'Priority support', 'Analytics'],
    featuresRu: ['Продвижение', '8% комиссия', 'Приоритетная поддержка', 'Аналитика'],
    highlighted: true,
    color: 'border-primary',
    bg: 'bg-primary/20',
  },
  {
    name: 'Business',
    nameRu: 'Бизнес',
    price: '$149/mo',
    features: ['Premium placement', '5% commission', 'Dedicated manager', 'API access'],
    featuresRu: ['Премиум размещение', '5% комиссия', 'Персональный менеджер', 'API доступ'],
    color: 'border-purple-500',
    bg: 'bg-purple-500/10',
  },
];

export function BusinessModelSlide({ isRussian }: BusinessModelSlideProps) {
  return (
    <PitchSlide>
      <SlideTitle>
        {isRussian ? 'Бизнес-модель' : 'Business Model'}
      </SlideTitle>

      <SlideContent>
        <div className="flex flex-col lg:flex-row items-center justify-center gap-10">
          {/* Revenue pie chart - Enhanced */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="w-full max-w-xs"
          >
            <h3 className="text-center text-lg font-semibold text-white mb-4">
              {isRussian ? 'Источники дохода' : 'Revenue Mix'}
            </h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={REVENUE_STREAMS.map(s => ({
                      ...s,
                      name: isRussian ? s.nameRu : s.name
                    }))}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {REVENUE_STREAMS.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(15, 23, 42, 0.95)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                      color: 'white',
                      padding: '10px 14px'
                    }}
                    formatter={(value: number) => [`${value}%`, '']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Legend */}
            <div className="grid grid-cols-2 gap-2 mt-2">
              {REVENUE_STREAMS.map((stream) => (
                <div key={stream.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stream.color }} />
                  <span className="text-xs text-slate-400">
                    {isRussian ? stream.nameRu : stream.name}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Pricing tiers - Enhanced */}
          <div className="flex flex-wrap justify-center gap-4">
            {pricingTiers.map((tier, index) => (
              <motion.div
                key={tier.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.12 }}
                className={`relative w-44 p-5 rounded-2xl border-2 ${tier.color} ${tier.bg} ${
                  tier.highlighted ? 'shadow-lg shadow-primary/20' : ''
                }`}
              >
                {tier.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-primary text-white text-xs font-medium rounded-full">
                    {isRussian ? 'Популярный' : 'Popular'}
                  </div>
                )}
                <h4 className={`font-bold text-lg mb-1 ${
                  tier.highlighted ? 'text-primary' : 'text-white'
                }`}>
                  {isRussian ? tier.nameRu : tier.name}
                </h4>
                <p className="text-2xl font-bold text-white mb-4">{tier.price}</p>
                <ul className="space-y-2">
                  {(isRussian ? tier.featuresRu : tier.features).map((feature, i) => (
                    <li key={i} className="text-xs text-slate-400 flex items-start gap-1.5">
                      <span className="text-primary mt-0.5">•</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Unit economics - Enhanced */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="mt-10 flex flex-wrap justify-center gap-6"
        >
          {[
            { icon: Percent, label: isRussian ? 'Ср. комиссия' : 'Avg Take Rate', value: '8-10%', color: 'text-blue-400', bg: 'bg-blue-500/20' },
            { icon: Users, label: isRussian ? 'Target CAC' : 'Target CAC', value: '<$15', color: 'text-green-400', bg: 'bg-green-500/20' },
            { icon: TrendingUp, label: 'Target LTV:CAC', value: '>3:1', color: 'text-purple-400', bg: 'bg-purple-500/20' },
          ].map((metric, index) => (
            <motion.div 
              key={metric.label} 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1 + index * 0.1 }}
              className="flex items-center gap-3 bg-white/5 rounded-xl px-5 py-3 border border-white/10"
            >
              <div className={`p-2 ${metric.bg} rounded-lg`}>
                <metric.icon className={`w-5 h-5 ${metric.color}`} />
              </div>
              <div>
                <p className="text-xl font-bold text-white">{metric.value}</p>
                <p className="text-xs text-slate-400">{metric.label}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Property management note */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="mt-6 text-center"
        >
          <p className="text-xs text-slate-500">
            {isRussian 
              ? 'Full Management: 70/30 сплит (70% владельцу, 30% платформе) после расходов'
              : 'Full Management: 70/30 split (70% to owner, 30% platform) after expenses'}
          </p>
        </motion.div>
      </SlideContent>
    </PitchSlide>
  );
}
