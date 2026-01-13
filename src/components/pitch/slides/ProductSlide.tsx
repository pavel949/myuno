import React from 'react';
import { motion } from 'framer-motion';
import { 
  Car, Palmtree, UtensilsCrossed, Home, Heart, Sparkles, Ship, Scale,
  Dumbbell, Calendar, Waves, Pill, PawPrint, Shield, GraduationCap
} from 'lucide-react';
import { PitchSlide, SlideTitle, SlideContent } from '../PitchSlide';
import { SERVICE_VERTICALS } from '@/hooks/useInvestorMetrics';

const iconMap: Record<string, React.ElementType> = {
  Car,
  Palmtree,
  UtensilsCrossed,
  Home,
  Heart,
  Sparkles,
  Ship,
  Scale,
  Dumbbell,
  Calendar,
  Waves,
  Pill,
  PawPrint,
  Shield,
  GraduationCap,
};

interface ProductSlideProps {
  isRussian: boolean;
}

export function ProductSlide({ isRussian }: ProductSlideProps) {
  return (
    <PitchSlide>
      <SlideTitle>
        {isRussian ? 'Продукт' : 'Product Overview'}
      </SlideTitle>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-xl text-slate-300 text-center mb-8"
      >
        {isRussian 
          ? '15+ категорий услуг в одном приложении'
          : '15+ Service Verticals in One Super-App'}
      </motion.p>

      <SlideContent>
        <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
          {SERVICE_VERTICALS.map((vertical, index) => {
            const Icon = iconMap[vertical.icon] || Home;
            return (
              <motion.div
                key={vertical.name}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + index * 0.05 }}
                whileHover={{ scale: 1.1 }}
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all cursor-pointer"
              >
                <div className={`p-3 ${vertical.color} rounded-xl`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs md:text-sm text-white text-center font-medium">
                  {isRussian ? vertical.nameRu : vertical.name}
                </span>
              </motion.div>
            );
          })}
        </div>

        {/* Unique value props */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="mt-8 flex flex-wrap justify-center gap-3"
        >
          {[
            { text: isRussian ? 'Уникально: Юридические услуги' : 'Unique: Legal Services', highlight: true },
            { text: isRussian ? 'Уникально: Страхование' : 'Unique: Insurance', highlight: true },
            { text: isRussian ? 'Полный охват транспорта' : 'Full Transport Coverage', highlight: false },
          ].map((item) => (
            <span
              key={item.text}
              className={`px-3 py-1 rounded-full text-sm ${
                item.highlight 
                  ? 'bg-primary/20 text-primary border border-primary/40' 
                  : 'bg-white/10 text-white/80'
              }`}
            >
              {item.text}
            </span>
          ))}
        </motion.div>
      </SlideContent>
    </PitchSlide>
  );
}
