import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Shield, CreditCard, Globe } from 'lucide-react';
import { PitchSlide, SlideTitle, SlideContent } from '../PitchSlide';

interface SolutionSlideProps {
  isRussian: boolean;
}

const solutions = [
  {
    icon: CheckCircle2,
    title: '15+ Verified Verticals',
    titleRu: '15+ проверенных категорий',
    description: 'Transport, tours, property, medical, legal, and more - all in one app',
    descriptionRu: 'Транспорт, туры, недвижимость, медицина, юридические услуги - всё в одном приложении',
    color: 'bg-green-500/20',
    iconColor: 'text-green-400',
  },
  {
    icon: Shield,
    title: 'Trust Scores & Reviews',
    titleRu: 'Рейтинги и отзывы',
    description: 'Verified vendors with transparent ratings and dispute resolution',
    descriptionRu: 'Проверенные поставщики с прозрачными рейтингами и разрешением споров',
    color: 'bg-blue-500/20',
    iconColor: 'text-blue-400',
  },
  {
    icon: CreditCard,
    title: 'Unified Digital Payments',
    titleRu: 'Единые цифровые платежи',
    description: 'One wallet for all services, no more cash-only hassles',
    descriptionRu: 'Один кошелёк для всех услуг, никаких проблем с наличными',
    color: 'bg-purple-500/20',
    iconColor: 'text-purple-400',
  },
  {
    icon: Globe,
    title: 'Multi-Language Support',
    titleRu: 'Многоязычная поддержка',
    description: 'English, Russian, Thai - serving expats and tourists alike',
    descriptionRu: 'Английский, русский, тайский - для экспатов и туристов',
    color: 'bg-cyan-500/20',
    iconColor: 'text-cyan-400',
  },
];

export function SolutionSlide({ isRussian }: SolutionSlideProps) {
  return (
    <PitchSlide>
      <SlideTitle>
        {isRussian ? 'Решение' : 'The Solution'}
      </SlideTitle>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-xl md:text-2xl text-primary font-semibold text-center mb-8"
      >
        UNO - {isRussian ? 'Единая платформа для всех услуг' : 'One Platform for All Services'}
      </motion.p>

      <SlideContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {solutions.map((solution, index) => (
            <motion.div
              key={solution.title}
              initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + index * 0.15 }}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6"
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 ${solution.color} rounded-xl`}>
                  <solution.icon className={`w-6 h-6 ${solution.iconColor}`} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {isRussian ? solution.titleRu : solution.title}
                  </h3>
                  <p className="text-sm text-slate-400">
                    {isRussian ? solution.descriptionRu : solution.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </SlideContent>
    </PitchSlide>
  );
}
