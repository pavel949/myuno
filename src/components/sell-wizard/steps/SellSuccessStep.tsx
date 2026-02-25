import React from 'react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ArrowRight, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

interface SellSuccessStepProps {
  listingId: string | null;
}

export function SellSuccessStep({ listingId }: SellSuccessStepProps) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', duration: 0.5 }}
        className="mb-6"
      >
        <div className="w-24 h-24 rounded-full bg-success/10 flex items-center justify-center">
          <CheckCircle2 className="h-12 w-12 text-success" />
        </div>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-center max-w-sm"
      >
        <h1 className="text-2xl font-bold mb-2">
          {isRu ? 'Объявление отправлено!' : 'Listing Submitted!'}
        </h1>
        <p className="text-muted-foreground mb-8">
          {isRu 
            ? 'Ваше объявление отправлено на модерацию. Мы уведомим вас, когда оно будет опубликовано.' 
            : 'Your listing is now pending review. We\'ll notify you when it\'s published.'}
        </p>
        
        <div className="space-y-3">
          <Button 
            onClick={() => navigate('/profile/listings')} 
            className="w-full"
            size="lg"
          >
            {isRu ? 'Мои объявления' : 'My Listings'}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
          
          <Button 
            onClick={() => navigate('/sell')} 
            variant="outline"
            className="w-full"
            size="lg"
          >
            <Plus className="h-4 w-4 mr-2" />
            {isRu ? 'Добавить ещё' : 'Add Another'}
          </Button>
          
          <Button 
            onClick={() => navigate('/market')} 
            variant="ghost"
            className="w-full"
          >
            {isRu ? 'Вернуться в маркет' : 'Back to Market'}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
