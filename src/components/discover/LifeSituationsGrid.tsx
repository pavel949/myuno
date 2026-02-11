import React, { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Plane, Home, Palmtree, Heart, Users, Building, FileText, Briefcase,
  ArrowUpRight,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { triggerHaptic } from '@/hooks/useHapticFeedback';
import { cn } from '@/lib/utils';

interface LifeSituation {
  code: string;
  icon: React.ElementType;
  titleEn: string;
  titleRu: string;
  descEn: string;
  descRu: string;
  route: string;
  bg: string;
  iconBg: string;
  iconColor: string;
  accentBorder: string;
}

const ICON_GRADIENT = 'bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600';

const SITUATIONS: LifeSituation[] = [
  {
    code: 'arrival',
    icon: Plane,
    titleEn: 'Arrival',
    titleRu: 'Прибытие',
    descEn: 'Airport, transport, essentials',
    descRu: 'Аэропорт, трансфер, первый день',
    route: '/life/arrival',
    bg: 'bg-emerald-50/50 dark:bg-emerald-950/20',
    iconBg: ICON_GRADIENT,
    iconColor: 'text-white',
    accentBorder: 'border-emerald-200/60 dark:border-emerald-800/30',
  },
  {
    code: 'living',
    icon: Home,
    titleEn: 'Daily Life',
    titleRu: 'Быт',
    descEn: 'Home, groceries, routines',
    descRu: 'Дом, быт, задачи',
    route: '/life/living',
    bg: 'bg-teal-50/50 dark:bg-teal-950/20',
    iconBg: ICON_GRADIENT,
    iconColor: 'text-white',
    accentBorder: 'border-teal-200/60 dark:border-teal-800/30',
  },
  {
    code: 'leisure',
    icon: Palmtree,
    titleEn: 'Leisure',
    titleRu: 'Отдых',
    descEn: 'Tours, yachts, activities',
    descRu: 'Туры, яхты, активности',
    route: '/life/leisure',
    bg: 'bg-cyan-50/50 dark:bg-cyan-950/20',
    iconBg: ICON_GRADIENT,
    iconColor: 'text-white',
    accentBorder: 'border-cyan-200/60 dark:border-cyan-800/30',
  },
  {
    code: 'health',
    icon: Heart,
    titleEn: 'Health',
    titleRu: 'Здоровье',
    descEn: 'Clinics, insurance, pharmacy',
    descRu: 'Клиники, страховка, аптека',
    route: '/life/health',
    bg: 'bg-emerald-50/50 dark:bg-emerald-950/20',
    iconBg: ICON_GRADIENT,
    iconColor: 'text-white',
    accentBorder: 'border-emerald-200/60 dark:border-emerald-800/30',
  },
  {
    code: 'family',
    icon: Users,
    titleEn: 'Family',
    titleRu: 'Семья',
    descEn: 'Childcare, schools, activities',
    descRu: 'Няни, школы, занятия',
    route: '/life/family',
    bg: 'bg-teal-50/50 dark:bg-teal-950/20',
    iconBg: ICON_GRADIENT,
    iconColor: 'text-white',
    accentBorder: 'border-teal-200/60 dark:border-teal-800/30',
  },
  {
    code: 'property',
    icon: Building,
    titleEn: 'Property',
    titleRu: 'Недвижимость',
    descEn: 'Rent, buy, manage',
    descRu: 'Аренда, покупка, управление',
    route: '/life/property',
    bg: 'bg-cyan-50/50 dark:bg-cyan-950/20',
    iconBg: ICON_GRADIENT,
    iconColor: 'text-white',
    accentBorder: 'border-cyan-200/60 dark:border-cyan-800/30',
  },
  {
    code: 'relocation',
    icon: FileText,
    titleEn: 'Relocation',
    titleRu: 'Переезд',
    descEn: 'Visa, banking, legal help',
    descRu: 'Виза, банки, юрист',
    route: '/life/relocation',
    bg: 'bg-emerald-50/50 dark:bg-emerald-950/20',
    iconBg: ICON_GRADIENT,
    iconColor: 'text-white',
    accentBorder: 'border-emerald-200/60 dark:border-emerald-800/30',
  },
  {
    code: 'business',
    icon: Briefcase,
    titleEn: 'Business',
    titleRu: 'Бизнес',
    descEn: 'Coworking, company setup',
    descRu: 'Коворкинг, компания',
    route: '/life/business',
    bg: 'bg-teal-50/50 dark:bg-teal-950/20',
    iconBg: ICON_GRADIENT,
    iconColor: 'text-white',
    accentBorder: 'border-teal-200/60 dark:border-teal-800/30',
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

const itemVariant = {
  hidden: { opacity: 0, y: 16, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1, transition: { ease: [0.22, 1, 0.36, 1] as [number, number, number, number], duration: 0.4 } },
};

export const LifeSituationsGrid = memo(function LifeSituationsGrid() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-bold text-foreground">
        {isRu ? 'Жизненные ситуации' : 'Life Situations'}
      </h2>
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 gap-3"
      >
        {SITUATIONS.map((s) => {
          const Icon = s.icon;
          return (
            <motion.button
              key={s.code}
              variants={itemVariant}
              whileTap={{ scale: 0.96 }}
              onClick={() => { triggerHaptic('light'); navigate(s.route); }}
              className={cn(
                "relative flex flex-col items-start gap-3 p-4 rounded-2xl text-left group cursor-pointer",
                "border shadow-sm min-h-[130px]",
                "hover:shadow-lg hover:-translate-y-1 transition-all duration-300",
                s.bg,
                s.accentBorder,
              )}
              style={{ touchAction: 'manipulation' }}
            >
              {/* Gradient icon */}
              <div className={cn(
                "w-11 h-11 rounded-xl flex items-center justify-center shadow-md",
                "group-hover:scale-110 group-hover:shadow-lg transition-all duration-300",
                s.iconBg,
              )}>
                <Icon className={cn("w-5 h-5", s.iconColor)} />
              </div>

              {/* Text */}
              <div className="space-y-0.5 flex-1">
                <h3 className="text-[14px] font-bold text-foreground leading-tight">
                  {isRu ? s.titleRu : s.titleEn}
                </h3>
                <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2">
                  {isRu ? s.descRu : s.descEn}
                </p>
              </div>

              {/* Arrow indicator */}
              <div className="absolute top-3.5 right-3.5 w-6 h-6 rounded-full bg-foreground/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowUpRight className="w-3.5 h-3.5 text-foreground/40" />
              </div>
            </motion.button>
          );
        })}
      </motion.div>
    </section>
  );
});
