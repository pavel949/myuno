/**
 * TripPlannerPage - LifeOS "Trip to Phuket" Arrival Planner
 * Helps users prepare for arrival with an interactive checklist
 * and integration with myUNO services.
 */
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { TripPositioningHero } from '@/components/trip-planner/TripPositioningHero';
import { TripChecklist } from '@/components/trip-planner/TripChecklist';
import { Palmtree } from 'lucide-react';
import { BackButton } from '@/components/uno/BackButton';
import { APP_ROUTES } from '@/lib/config/routes';
import { motion } from 'framer-motion';
import { WhatsAppConciergeBlock } from '@/components/life-flow/WhatsAppConciergeBlock';

export default function TripPlannerPage() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';

  return (
    <AppLayout>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b border-border/50">
          <div>
            <div className="flex items-center gap-3 p-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                className="shrink-0"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="px-4 pb-5"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-primary/8">
                  <Palmtree className="w-7 h-7 text-primary" />
                </div>
                <div className="flex-1 pt-0.5">
                  <h1 className="text-lg font-bold">
                    {isRu ? 'Поездка на Пхукет' : 'Trip to Phuket'}
                  </h1>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {isRu
                      ? 'Планировщик прибытия'
                      : 'Arrival Planner'}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          <TripPositioningHero />
          <TripChecklist />

          {/* WhatsApp concierge CTA */}
          <WhatsAppConciergeBlock context="trip" />

          {/* Footer */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-center text-xs text-muted-foreground/60 pt-2 pb-4"
          >
            {isRu
              ? 'Мы — ваш локальный эксперт по Пхукету. Если нужна помощь — напишите нам.'
              : "We're your local Phuket experts. Need help? Reach out anytime."}
          </motion.p>
        </div>
      </div>
    </AppLayout>
  );
}
