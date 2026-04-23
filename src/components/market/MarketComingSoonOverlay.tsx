import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, ArrowRight, Home } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';

/** Set to true when the marketplace is ready to launch */
export const MARKET_ENABLED = false;

export const MarketComingSoonOverlay: React.FC = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isRu = language === 'ru';

  if (MARKET_ENABLED) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[100] bg-background/80 flex flex-col items-center justify-center px-6 py-10"
    >
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.15, duration: 0.4, ease: 'easeOut' }}
        className="max-w-sm w-full text-center space-y-6"
      >
        {/* Icon */}
        <div className="mx-auto w-20 h-20 rounded-none bg-primary/10 flex items-center justify-center">
          <ShoppingBag className="w-10 h-10 text-primary" />
        </div>

        {/* Text */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-foreground">
            {isRu ? 'Маркет скоро откроется' : 'Market Coming Soon'}
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {isRu
              ? 'Готовим подборку товаров от проверенных продавцов. Скоро откроем доступ.'
              : 'We are curating products from verified sellers. Access opens soon.'}
          </p>
        </div>

        {/* CTAs */}
        <div className="flex flex-col gap-3">
          <Button
            size="lg"
            className="w-full gap-2 rounded-none"
            onClick={() => navigate('/services')}
          >
            {isRu ? 'Перейти к услугам' : 'Browse Services'}
            <ArrowRight className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="w-full gap-2 rounded-none"
            onClick={() => navigate('/')}
          >
            <Home className="w-4 h-4" />
            {isRu ? 'На главную' : 'Go Home'}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
};
