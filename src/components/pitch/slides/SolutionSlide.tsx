import React from 'react';
import { motion } from 'framer-motion';
import { Smartphone, Shield, Users, Globe, Headphones, CreditCard } from 'lucide-react';
import { PitchSlide, SlideTitle, SlideContent } from '../PitchSlide';

interface SolutionSlideProps {
  isRussian: boolean;
}

const solutions = [
  {
    icon: Smartphone,
    title: '15+ Verticals in One App',
    titleRu: '15+ вертикалей в одном приложении',
    description: 'Transport, tours, property, medical, legal — all verified and accessible',
    descriptionRu: 'Транспорт, туры, недвижимость, медицина, юридические услуги — всё проверено',
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-blue-500/20',
  },
  {
    icon: Shield,
    title: 'G-Trust Partner Network',
    titleRu: 'Сеть G-Trust партнёров',
    description: 'Verified vendors with ratings, reviews & dispute resolution',
    descriptionRu: 'Проверенные поставщики с рейтингами, отзывами и защитой',
    color: 'from-green-500 to-emerald-500',
    bgColor: 'bg-green-500/20',
  },
  {
    icon: Headphones,
    title: 'UNO Team On Ground',
    titleRu: 'UNO Team на месте',
    description: '24/7 real human support in your language when you need it',
    descriptionRu: 'Реальная поддержка 24/7 на вашем языке, когда она нужна',
    color: 'from-purple-500 to-pink-500',
    bgColor: 'bg-purple-500/20',
  },
  {
    icon: CreditCard,
    title: 'Unified Digital Payments',
    titleRu: 'Единые цифровые платежи',
    description: 'One wallet for all services, cashback rewards, no cash hassles',
    descriptionRu: 'Один кошелёк для всех услуг, кэшбэк, никаких проблем с наличными',
    color: 'from-amber-500 to-orange-500',
    bgColor: 'bg-amber-500/20',
  },
  {
    icon: Globe,
    title: 'Multi-Language Support',
    titleRu: 'Многоязычная поддержка',
    description: 'English, Russian, Thai — serving expats and tourists alike',
    descriptionRu: 'Английский, русский, тайский — для экспатов и туристов',
    color: 'from-cyan-500 to-blue-500',
    bgColor: 'bg-cyan-500/20',
  },
  {
    icon: Users,
    title: 'Property Owner Tools',
    titleRu: 'Инструменты для владельцев',
    description: 'Full management, booking calendar, analytics, guest services',
    descriptionRu: 'Полное управление, календарь, аналитика, услуги для гостей',
    color: 'from-indigo-500 to-purple-500',
    bgColor: 'bg-indigo-500/20',
  },
];

export function SolutionSlide({ isRussian }: SolutionSlideProps) {
  return (
    <PitchSlide>
      <SlideTitle>
        {isRussian ? 'Решение' : 'The Solution'}
      </SlideTitle>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-center mb-8"
      >
        <p className="text-2xl md:text-3xl font-bold">
          <span className="bg-gradient-to-r from-primary to-cyan-400 bg-clip-text text-transparent">
            myUNO
          </span>
          <span className="text-white">
            {isRussian ? ' — Единая платформа' : ' — One Platform'}
          </span>
        </p>
        <p className="text-lg text-slate-400 mt-2">
          {isRussian 
            ? 'Цифровая + офлайн инфраструктура для всех задач'
            : 'Digital + offline infrastructure for all your needs'}
        </p>
      </motion.div>

      <SlideContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {solutions.map((solution, index) => (
            <motion.div
              key={solution.title}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.3 + index * 0.08 }}
              className="group relative"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${solution.color} rounded-2xl blur-xl opacity-0 group-hover:opacity-20 transition-opacity`} />
              <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-colors h-full">
                <div className="flex items-start gap-3">
                  <div className={`p-2.5 ${solution.bgColor} rounded-xl`}>
                    <solution.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white mb-1">
                      {isRussian ? solution.titleRu : solution.title}
                    </h3>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      {isRussian ? solution.descriptionRu : solution.description}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </SlideContent>
    </PitchSlide>
  );
}
