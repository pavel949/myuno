import React, { memo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plane, Home, Palmtree, Heart, Users, Building, FileText, Briefcase,
  ArrowUpRight, Dumbbell, Music, ShoppingBag, GraduationCap, PawPrint,
  MapPin, PartyPopper, Armchair, ChevronDown, CalendarCheck,
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

const ICON_GRADIENT = 'bg-gradient-to-br from-primary via-primary/80 to-primary/60';

/** Primary 8 — large cards */
const PRIMARY_SITUATIONS: LifeSituation[] = [
  {
    code: 'arrival',
    icon: Plane,
    titleEn: 'Arrival',
    titleRu: 'Прибытие',
    descEn: 'Airport, transport, essentials',
    descRu: 'Аэропорт, трансфер, первый день',
    route: '/life/arrival',
    bg: 'bg-primary/5 dark:bg-primary/10',
    iconBg: ICON_GRADIENT,
    iconColor: 'text-white',
    accentBorder: 'border-primary/15 dark:border-primary/20',
  },
  {
    code: 'living',
    icon: Home,
    titleEn: 'Daily Life',
    titleRu: 'Быт',
    descEn: 'Home, groceries, routines',
    descRu: 'Дом, быт, задачи',
    route: '/life/living',
    bg: 'bg-muted/50 dark:bg-muted/30',
    iconBg: ICON_GRADIENT,
    iconColor: 'text-white',
    accentBorder: 'border-border/60 dark:border-border/30',
  },
  {
    code: 'leisure',
    icon: Palmtree,
    titleEn: 'Leisure',
    titleRu: 'Отдых',
    descEn: 'Tours, yachts, activities',
    descRu: 'Туры, яхты, активности',
    route: '/life/leisure',
    bg: 'bg-accent/50 dark:bg-accent/30',
    iconBg: ICON_GRADIENT,
    iconColor: 'text-white',
    accentBorder: 'border-border/60 dark:border-border/30',
  },
  {
    code: 'health',
    icon: Heart,
    titleEn: 'Health',
    titleRu: 'Здоровье',
    descEn: 'Clinics, insurance, pharmacy',
    descRu: 'Клиники, страховка, аптека',
    route: '/life/health',
    bg: 'bg-primary/5 dark:bg-primary/10',
    iconBg: ICON_GRADIENT,
    iconColor: 'text-white',
    accentBorder: 'border-primary/15 dark:border-primary/20',
  },
  {
    code: 'family',
    icon: Users,
    titleEn: 'Family',
    titleRu: 'Семья',
    descEn: 'Childcare, schools, activities',
    descRu: 'Няни, школы, занятия',
    route: '/life/family',
    bg: 'bg-muted/50 dark:bg-muted/30',
    iconBg: ICON_GRADIENT,
    iconColor: 'text-white',
    accentBorder: 'border-border/60 dark:border-border/30',
  },
  {
    code: 'property',
    icon: Building,
    titleEn: 'Property',
    titleRu: 'Недвижимость',
    descEn: 'Rent, buy, manage',
    descRu: 'Аренда, покупка, управление',
    route: '/life/property',
    bg: 'bg-accent/50 dark:bg-accent/30',
    iconBg: ICON_GRADIENT,
    iconColor: 'text-white',
    accentBorder: 'border-border/60 dark:border-border/30',
  },
  {
    code: 'relocation',
    icon: FileText,
    titleEn: 'Relocation',
    titleRu: 'Переезд',
    descEn: 'Visa, banking, legal help',
    descRu: 'Виза, банки, юрист',
    route: '/life/relocation',
    bg: 'bg-primary/5 dark:bg-primary/10',
    iconBg: ICON_GRADIENT,
    iconColor: 'text-white',
    accentBorder: 'border-primary/15 dark:border-primary/20',
  },
  {
    code: 'business',
    icon: Briefcase,
    titleEn: 'Business',
    titleRu: 'Бизнес',
    descEn: 'Coworking, company setup',
    descRu: 'Коворкинг, компания',
    route: '/life/business',
    bg: 'bg-muted/50 dark:bg-muted/30',
    iconBg: ICON_GRADIENT,
    iconColor: 'text-white',
    accentBorder: 'border-border/60 dark:border-border/30',
  },
];

/** Secondary — compact row items */
const SECONDARY_SITUATIONS: Array<{
  code: string;
  icon: React.ElementType;
  titleEn: string;
  titleRu: string;
  descEn: string;
  descRu: string;
  route: string;
}> = [
  { code: 'sports', icon: Dumbbell, titleEn: 'Sports & Fitness', titleRu: 'Спорт и фитнес', descEn: 'Gyms, yoga, water sports', descRu: 'Залы, йога, водный спорт', route: '/life/sports' },
  { code: 'nightlife', icon: Music, titleEn: 'Nightlife', titleRu: 'Ночная жизнь', descEn: 'Clubs, bars, events', descRu: 'Клубы, бары, события', route: '/life/nightlife' },
  { code: 'shopping', icon: ShoppingBag, titleEn: 'Shopping', titleRu: 'Шопинг', descEn: 'Markets, delivery, flowers', descRu: 'Маркеты, доставка, цветы', route: '/life/shopping' },
  { code: 'education', icon: GraduationCap, titleEn: 'Education', titleRu: 'Образование', descEn: 'Schools, courses, tutors', descRu: 'Школы, курсы, репетиторы', route: '/life/education' },
  { code: 'pets', icon: PawPrint, titleEn: 'Pet Care', titleRu: 'Питомцы', descEn: 'Vets, shops, pet sitting', descRu: 'Ветклиники, зоомагазины', route: '/life/pets' },
  { code: 'visa_travel', icon: MapPin, titleEn: 'Visa & Travel', titleRu: 'Виза и поездки', descEn: 'Visa runs, insurance, transfers', descRu: 'Виза-раны, страховка, трансферы', route: '/life/visa_travel' },
  { code: 'planning', icon: CalendarCheck, titleEn: 'Vacation Planning', titleRu: 'Планирование отпуска', descEn: 'Prepare before you arrive', descRu: 'Жильё, билеты, страховка', route: '/life/planning' },
  { code: 'wedding_event', icon: PartyPopper, titleEn: 'Wedding & Events', titleRu: 'Свадьба и праздники', descEn: 'Venues, flowers, catering', descRu: 'Площадки, цветы, кейтеринг', route: '/life/wedding_event' },
  { code: 'retirement_living', icon: Armchair, titleEn: 'Retirement', titleRu: 'Пенсия на Пхукете', descEn: 'Healthcare, housing, insurance', descRu: 'Медицина, жильё, страховка', route: '/life/retirement_living' },
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
  const [showMore, setShowMore] = useState(false);

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-bold text-foreground">
        {isRu ? 'Жизненные ситуации' : 'Life Situations'}
      </h2>

      {/* Primary 2×4 grid */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 gap-3"
      >
        {PRIMARY_SITUATIONS.map((s) => {
          const Icon = s.icon;
          return (
            <motion.button
              key={s.code}
              variants={itemVariant}
              whileTap={{ scale: 0.96 }}
              onClick={() => { triggerHaptic('light'); navigate(s.route); }}
              className={cn(
                "relative flex flex-col items-start gap-3 p-4 rounded-none text-left group cursor-pointer",
                "border shadow-sm min-h-[130px]",
                "hover:shadow-lg transition-all duration-300",
                s.bg,
                s.accentBorder,
              )}
              style={{ touchAction: 'manipulation' }}
            >
              <div className={cn(
                "w-11 h-11 rounded-none flex items-center justify-center shadow-md",
                "group-hover:shadow-lg transition-all duration-300",
                s.iconBg,
              )}>
                <Icon className={cn("w-5 h-5", s.iconColor)} />
              </div>
              <div className="space-y-0.5 flex-1">
                <h3 className="text-[14px] font-bold text-foreground leading-tight">
                  {isRu ? s.titleRu : s.titleEn}
                </h3>
                <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2">
                  {isRu ? s.descRu : s.descEn}
                </p>
              </div>
              <div className="absolute top-3.5 right-3.5 w-6 h-6 rounded-full bg-foreground/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowUpRight className="w-3.5 h-3.5 text-foreground/40" />
              </div>
            </motion.button>
          );
        })}
      </motion.div>

      {/* "Show more" toggle */}
      <button
        onClick={() => { setShowMore(!showMore); triggerHaptic('light'); }}
        className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-none text-sm font-medium text-primary hover:bg-primary/5 transition-all touch-manipulation"
      >
        <span>{isRu ? (showMore ? 'Свернуть' : `Ещё ${SECONDARY_SITUATIONS.length} ситуаций`) : (showMore ? 'Show less' : `${SECONDARY_SITUATIONS.length} more situations`)}</span>
        <ChevronDown className={cn("w-4 h-4 transition-transform duration-200", showMore && "rotate-180")} />
      </button>

      {/* Secondary compact list */}
      <AnimatePresence>
        {showMore && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="space-y-1.5">
              {SECONDARY_SITUATIONS.map((s) => {
                const Icon = s.icon;
                return (
                  <button
                    key={s.code}
                    onClick={() => { triggerHaptic('light'); navigate(s.route); }}
                    className="w-full flex items-center gap-3 p-3 rounded-none bg-card border border-border/50 hover:border-primary/30 transition-all touch-manipulation text-left group"
                  >
                    <div className={cn(
                      "w-9 h-9 rounded-none flex items-center justify-center flex-shrink-0",
                      ICON_GRADIENT,
                    )}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-foreground leading-tight">
                        {isRu ? s.titleRu : s.titleEn}
                      </h3>
                      <p className="text-[11px] text-muted-foreground leading-snug truncate">
                        {isRu ? s.descRu : s.descEn}
                      </p>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary/60 transition-colors flex-shrink-0" />
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
});
