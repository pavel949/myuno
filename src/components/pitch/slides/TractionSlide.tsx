import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Building2, ShoppingCart, DollarSign, TrendingUp } from 'lucide-react';
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
        {isRussian ? 'Тракшн' : 'Traction'}
      </SlideTitle>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex items-center gap-2 mb-8"
      >
        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        <span className="text-green-400 text-sm">
          {isRussian ? 'Данные в реальном времени' : 'Live Data from Platform'}
        </span>
      </motion.div>

      <SlideContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {metrics.map((metric, index) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.15 }}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 text-center"
            >
              <div className={`inline-flex p-3 ${metric.bgColor} rounded-xl mb-4`}>
                <metric.icon className={`w-6 h-6 ${metric.color}`} />
              </div>
              <p className="text-3xl md:text-4xl font-bold text-white mb-2">
                {metric.prefix}
                {isLoading ? '...' : <AnimatedCounter value={metric.value} />}
              </p>
              <p className="text-sm text-slate-400 mb-2">{metric.label}</p>
              {metric.growth !== 0 && (
                <div className={`inline-flex items-center gap-1 text-xs ${metric.growth > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  <TrendingUp className="w-3 h-3" />
                  <span>{metric.growth > 0 ? '+' : ''}{metric.growth.toFixed(1)}%</span>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Growth indicator */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="mt-8 text-center"
        >
          <p className="text-slate-400">
            {isRussian 
              ? 'Данные обновляются каждую минуту с платформы'
              : 'Data refreshes every minute from live platform'}
          </p>
        </motion.div>
      </SlideContent>
    </PitchSlide>
  );
}
