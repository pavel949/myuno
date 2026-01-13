import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Building2, ShoppingCart, DollarSign, TrendingUp, Lightbulb, FlaskConical, Rocket, Target, Crown, Check } from 'lucide-react';
import { PitchSlide, SlideTitle, SlideContent } from '../PitchSlide';
import { useInvestorMetrics } from '@/hooks/useInvestorMetrics';

interface TractionSlideProps {
  isRussian: boolean;
}

function AnimatedCounter({ value, duration = 2000 }: { value: number; duration?: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    if (start === end) return;

    const incrementTime = duration / end;
    const timer = setInterval(() => {
      start += 1;
      setCount(start);
      if (start >= end) clearInterval(timer);
    }, Math.max(incrementTime, 10));

    return () => clearInterval(timer);
  }, [value, duration]);

  return <span>{count.toLocaleString()}</span>;
}

const validationCycles = [
  {
    id: 1,
    icon: Lightbulb,
    titleEn: 'Ideation',
    titleRu: 'Идея',
    descEn: 'Problem validation with 50+ user interviews',
    descRu: 'Валидация проблемы: 50+ интервью',
    status: 'completed',
    color: 'from-amber-500 to-orange-500',
  },
  {
    id: 2,
    icon: FlaskConical,
    titleEn: 'MVP',
    titleRu: 'MVP',
    descEn: 'Core features: Transport, Tours, Restaurants',
    descRu: 'Базовые функции: Транспорт, Туры, Рестораны',
    status: 'completed',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    id: 3,
    icon: Rocket,
    titleEn: 'Beta Launch',
    titleRu: 'Бета-запуск',
    descEn: '500+ beta users, 15 service verticals',
    descRu: '500+ бета-пользователей, 15 вертикалей',
    status: 'completed',
    color: 'from-purple-500 to-pink-500',
  },
  {
    id: 4,
    icon: Target,
    titleEn: 'Product-Market Fit',
    titleRu: 'Product-Market Fit',
    descEn: 'Retention >40%, NPS 65+, Revenue $50K MRR',
    descRu: 'Retention >40%, NPS 65+, Доход $50K MRR',
    status: 'in-progress',
    color: 'from-emerald-500 to-teal-500',
  },
  {
    id: 5,
    icon: Crown,
    titleEn: 'Scale',
    titleRu: 'Масштабирование',
    descEn: 'Expand to Samui, Pattaya, Bali',
    descRu: 'Расширение: Самуи, Паттайя, Бали',
    status: 'upcoming',
    color: 'from-rose-500 to-red-500',
  },
];

export function TractionSlide({ isRussian }: TractionSlideProps) {
  const { tractionMetrics, isLoading } = useInvestorMetrics();

  const metrics = [
    {
      icon: Users,
      value: tractionMetrics.totalUsers || 0,
      label: isRussian ? 'Пользователей' : 'Total Users',
      growth: tractionMetrics.growth.users,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20',
    },
    {
      icon: Building2,
      value: tractionMetrics.totalProviders || 0,
      label: isRussian ? 'Провайдеров' : 'Active Providers',
      growth: tractionMetrics.growth.providers,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/20',
    },
    {
      icon: ShoppingCart,
      value: tractionMetrics.totalBookings || 0,
      label: isRussian ? 'Бронирований' : 'Total Bookings',
      growth: tractionMetrics.growth.bookings,
      color: 'text-green-400',
      bgColor: 'bg-green-500/20',
    },
    {
      icon: DollarSign,
      value: Math.round(tractionMetrics.gmv || 0),
      label: isRussian ? 'GMV (THB)' : 'GMV (THB)',
      growth: tractionMetrics.growth.revenue,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/20',
      prefix: '฿',
    },
  ];

  return (
    <PitchSlide>
      <SlideTitle>
        {isRussian ? 'Тракшн и Валидация' : 'Traction & Validation'}
      </SlideTitle>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex items-center gap-2 mb-6"
      >
        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        <span className="text-green-400 text-sm">
          {isRussian ? 'Данные в реальном времени' : 'Live Data from Platform'}
        </span>
      </motion.div>

      <SlideContent>
        {/* Live Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {metrics.map((metric, index) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 text-center"
            >
              <div className={`inline-flex p-2 ${metric.bgColor} rounded-lg mb-2`}>
                <metric.icon className={`w-5 h-5 ${metric.color}`} />
              </div>
              <p className="text-2xl md:text-3xl font-bold text-white mb-1">
                {metric.prefix}
                {isLoading ? '...' : <AnimatedCounter value={metric.value} />}
              </p>
              <p className="text-xs text-slate-400 mb-1">{metric.label}</p>
              {metric.growth !== 0 && (
                <div className={`inline-flex items-center gap-1 text-xs ${metric.growth > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  <TrendingUp className="w-3 h-3" />
                  <span>{metric.growth > 0 ? '+' : ''}{metric.growth.toFixed(1)}%</span>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Validation Cycles */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mb-4"
        >
          <h3 className="text-lg font-semibold text-white mb-4 text-center">
            {isRussian ? '5 Циклов Валидации Продукта' : '5 Product Validation Cycles'}
          </h3>
        </motion.div>

        {/* Validation Timeline */}
        <div className="relative">
          {/* Progress Line */}
          <div className="absolute top-8 left-0 right-0 h-1 bg-slate-700 rounded-full hidden md:block">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '70%' }}
              transition={{ delay: 1, duration: 1.5, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-amber-500 via-purple-500 to-emerald-500 rounded-full"
            />
          </div>

          {/* Validation Steps */}
          <div className="grid grid-cols-5 gap-2 md:gap-4">
            {validationCycles.map((cycle, index) => (
              <motion.div
                key={cycle.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + index * 0.15 }}
                className="flex flex-col items-center text-center relative"
              >
                {/* Icon Circle */}
                <div
                  className={`relative z-10 w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br ${cycle.color} flex items-center justify-center mb-3 ${
                    cycle.status === 'upcoming' ? 'opacity-40' : ''
                  } ${cycle.status === 'in-progress' ? 'ring-4 ring-white/30 animate-pulse' : ''}`}
                >
                  <cycle.icon className="w-6 h-6 md:w-7 md:h-7 text-white" />
                  {cycle.status === 'completed' && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>

                {/* Title */}
                <p className={`text-sm md:text-base font-semibold mb-1 ${
                  cycle.status === 'upcoming' ? 'text-slate-500' : 'text-white'
                }`}>
                  {isRussian ? cycle.titleRu : cycle.titleEn}
                </p>

                {/* Description */}
                <p className={`text-xs leading-tight ${
                  cycle.status === 'upcoming' ? 'text-slate-600' : 'text-slate-400'
                } hidden md:block`}>
                  {isRussian ? cycle.descRu : cycle.descEn}
                </p>

                {/* Status Badge */}
                {cycle.status === 'in-progress' && (
                  <span className="mt-2 text-xs px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full">
                    {isRussian ? 'Сейчас' : 'Current'}
                  </span>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </SlideContent>
    </PitchSlide>
  );
}
