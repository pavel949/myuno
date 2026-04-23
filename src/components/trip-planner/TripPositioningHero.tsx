import { useLanguage } from '@/contexts/LanguageContext';
import { Sparkles, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

export function TripPositioningHero() {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const benefits = isRu
    ? [
        'Авиабилеты — оптимальные маршруты и время покупки',
        'Страховка — подберём и поможем при страховом случае',
        'Arrival Card — заполним за вас или подскажем как',
        'Трансфер, аренда, фаст-трек — всё в одном месте',
      ]
    : [
        'Flights — best routes and when to book',
        'Insurance — we help you choose and assist with claims',
        'Arrival Card — we fill it for you or guide you through',
        'Transfer, rentals, fast track — all in one place',
      ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/10 p-5"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-primary" />
        </div>
        <span className="text-xs font-semibold uppercase tracking-wider text-primary">
          {isRu ? 'Всё в одном месте' : 'All in one place'}
        </span>
      </div>

      <p className="text-sm font-medium text-foreground mb-3">
        {isRu
          ? 'Подготовка к поездке — всё в одном месте.'
          : 'Trip planning — everything in one place.'}
      </p>

      <ul className="space-y-2">
        {benefits.map((b, i) => (
          <li key={i} className="flex items-start gap-2 text-xs text-foreground/80">
            <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
            <span>{b}</span>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}
