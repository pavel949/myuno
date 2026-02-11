import React, { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Plane, Home, Palmtree, Heart, Users, Building, FileText, Briefcase,
  ChevronRight,
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
}

const SITUATIONS: LifeSituation[] = [
  {
    code: 'arrival',
    icon: Plane,
    titleEn: 'Arrival & First Days',
    titleRu: 'Прибытие',
    descEn: 'Airport, transport, essentials',
    descRu: 'Аэропорт, трансфер, первый день',
    route: '/life/arrival',
    bg: 'bg-amber-50/60 dark:bg-amber-950/20',
    iconBg: 'bg-amber-100 dark:bg-amber-900/40',
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
  {
    code: 'living',
    icon: Home,
    titleEn: 'Daily Life',
    titleRu: 'Быт',
    descEn: 'Home services, groceries',
    descRu: 'Дом, быт, задачи',
    route: '/life/living',
    bg: 'bg-violet-50/60 dark:bg-violet-950/20',
    iconBg: 'bg-violet-100 dark:bg-violet-900/40',
    iconColor: 'text-violet-600 dark:text-violet-400',
  },
  {
    code: 'leisure',
    icon: Palmtree,
    titleEn: 'Leisure',
    titleRu: 'Отдых',
    descEn: 'Tours, yachts, activities',
    descRu: 'Туры, яхты, активности',
    route: '/life/leisure',
    bg: 'bg-sky-50/60 dark:bg-sky-950/20',
    iconBg: 'bg-sky-100 dark:bg-sky-900/40',
    iconColor: 'text-sky-600 dark:text-sky-400',
  },
  {
    code: 'health',
    icon: Heart,
    titleEn: 'Health',
    titleRu: 'Здоровье',
    descEn: 'Clinics, insurance, pharmacy',
    descRu: 'Клиники, страховка, аптека',
    route: '/life/health',
    bg: 'bg-rose-50/60 dark:bg-rose-950/20',
    iconBg: 'bg-rose-100 dark:bg-rose-900/40',
    iconColor: 'text-rose-600 dark:text-rose-400',
  },
  {
    code: 'family',
    icon: Users,
    titleEn: 'Family & Kids',
    titleRu: 'Семья',
    descEn: 'Childcare, schools, activities',
    descRu: 'Няни, школы, занятия',
    route: '/life/family',
    bg: 'bg-teal-50/60 dark:bg-teal-950/20',
    iconBg: 'bg-teal-100 dark:bg-teal-900/40',
    iconColor: 'text-teal-600 dark:text-teal-400',
  },
  {
    code: 'property',
    icon: Building,
    titleEn: 'Property',
    titleRu: 'Недвижимость',
    descEn: 'Rent, buy, manage',
    descRu: 'Аренда, покупка, управление',
    route: '/life/property',
    bg: 'bg-indigo-50/60 dark:bg-indigo-950/20',
    iconBg: 'bg-indigo-100 dark:bg-indigo-900/40',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
  },
  {
    code: 'relocation',
    icon: FileText,
    titleEn: 'Relocation',
    titleRu: 'Переезд',
    descEn: 'Visa, banking, legal help',
    descRu: 'Виза, банки, юрист',
    route: '/life/relocation',
    bg: 'bg-cyan-50/60 dark:bg-cyan-950/20',
    iconBg: 'bg-cyan-100 dark:bg-cyan-900/40',
    iconColor: 'text-cyan-600 dark:text-cyan-400',
  },
  {
    code: 'business',
    icon: Briefcase,
    titleEn: 'Business',
    titleRu: 'Бизнес',
    descEn: 'Coworking, company setup',
    descRu: 'Коворкинг, компания',
    route: '/life/business',
    bg: 'bg-slate-50/60 dark:bg-slate-950/20',
    iconBg: 'bg-slate-100 dark:bg-slate-900/40',
    iconColor: 'text-slate-600 dark:text-slate-400',
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

export const LifeSituationsGrid = memo(function LifeSituationsGrid() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';

  return (
    <section className="space-y-3">
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
              variants={item}
              whileTap={{ scale: 0.97 }}
              onClick={() => { triggerHaptic('light'); navigate(s.route); }}
              className={cn(
                "flex flex-col items-start gap-2.5 p-4 rounded-2xl text-left group cursor-pointer",
                "border border-border/30 shadow-sm",
                "hover:shadow-md hover:-translate-y-0.5 transition-all duration-200",
                s.bg
              )}
              style={{ touchAction: 'manipulation' }}
            >
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", s.iconBg)}>
                <Icon className={cn("w-5 h-5", s.iconColor)} />
              </div>
              <div className="space-y-0.5">
                <h3 className="text-sm font-semibold text-foreground leading-tight">
                  {isRu ? s.titleRu : s.titleEn}
                </h3>
                <p className="text-[11px] text-muted-foreground line-clamp-1">
                  {isRu ? s.descRu : s.descEn}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground/30 self-end mt-auto group-hover:text-muted-foreground transition-colors" />
            </motion.button>
          );
        })}
      </motion.div>
    </section>
  );
});
