import { useLanguage } from '@/contexts/LanguageContext';
import { Plane, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

export function TripPositioningHero() {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/10 p-5"
    >
      <div className="absolute top-3 right-3 opacity-10">
        <Plane className="w-20 h-20 text-primary rotate-[-20deg]" />
      </div>

      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
          <MapPin className="w-4 h-4 text-primary" />
        </div>
        <span className="text-xs font-semibold uppercase tracking-wider text-primary">
          {isRu ? 'Наш подход' : 'Our approach'}
        </span>
      </div>

      <p className="text-sm text-foreground/80 leading-relaxed">
        {isRu
          ? 'myUNO не конкурирует с глобальными платформами бронирования авиабилетов. Наша специализация — Пхукет. Мы помогаем разобраться в лучших способах добраться до Пхукета и берём на себя всё, что происходит после приземления.'
          : 'myUNO does not compete with global flight booking platforms. Our specialization is Phuket. We help you understand the best ways to fly to Phuket and take care of everything that happens after you land.'}
      </p>
    </motion.div>
  );
}
