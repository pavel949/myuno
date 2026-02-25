import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Rocket, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface SetupPromptBannerProps {
  propertyCount: number;
}

export function SetupPromptBanner({ propertyCount }: SetupPromptBannerProps) {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isRu = language === 'ru';

  // Don't show if user has properties and completed setup
  if (propertyCount > 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20">
        <CardContent className="pt-5 pb-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
              <Rocket className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base mb-1">
                {isRu ? 'Начните за 5 минут' : 'Get started in 5 minutes'}
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                {isRu
                  ? 'Пошаговый мастер поможет добавить объект, подключить каналы и настроить цены'
                  : 'Step-by-step wizard helps you add a property, connect channels and set pricing'}
              </p>
              <Button onClick={() => navigate('/owner/setup')} size="sm">
                {isRu ? 'Быстрый старт' : 'Quick Start'}
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
