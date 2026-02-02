import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import type { ListingType } from '@/hooks/useListingApplication';

interface SuccessStepProps {
  listingType: ListingType;
}

export function SuccessStep({ listingType }: SuccessStepProps) {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isRu = language === 'ru';
  
  const getNextSteps = () => {
    if (listingType === 'property') {
      return {
        dashboardPath: '/owner',
        dashboardLabel: isRu ? 'Кабинет владельца' : 'Owner Dashboard',
      };
    }
    return {
      dashboardPath: '/vendor',
      dashboardLabel: isRu ? 'Кабинет продавца' : 'Vendor Dashboard',
    };
  };
  
  const { dashboardPath, dashboardLabel } = getNextSteps();
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
      >
        <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-6">
          <CheckCircle2 className="h-10 w-10 text-green-600" />
        </div>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-4"
      >
        <h1 className="text-2xl font-bold">
          {isRu ? 'Заявка отправлена!' : 'Application Submitted!'}
        </h1>
        
        <p className="text-muted-foreground max-w-sm">
          {isRu 
            ? 'Мы рассмотрим вашу заявку и свяжемся с вами в течение 24-48 часов.'
            : 'We\'ll review your application and get back to you within 24-48 hours.'}
        </p>
        
        <div className="bg-muted/50 rounded-xl p-4 text-sm text-left space-y-2 mt-6">
          <p className="font-medium">{isRu ? 'Что дальше:' : 'What\'s next:'}</p>
          <ul className="space-y-1 text-muted-foreground">
            <li>• {isRu ? 'Проверьте email для подтверждения' : 'Check your email for confirmation'}</li>
            <li>• {isRu ? 'Мы можем запросить дополнительную информацию' : 'We may request additional information'}</li>
            <li>• {isRu ? 'После одобрения вы получите доступ к панели управления' : 'Once approved, you\'ll get access to your dashboard'}</li>
          </ul>
        </div>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8 space-y-3 w-full max-w-xs"
      >
        <Button onClick={() => navigate('/account')} className="w-full" size="lg">
          {isRu ? 'Мой кабинет' : 'My Account'}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
        
        <Button 
          variant="outline" 
          onClick={() => navigate('/')} 
          className="w-full"
        >
          {isRu ? 'На главную' : 'Go to Home'}
        </Button>
      </motion.div>
    </div>
  );
}
