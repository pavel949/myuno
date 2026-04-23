/**
 * VendorOnboardingChecklist - Progressive completion checklist (6 items)
 * Benchmark: Stripe Dashboard, Shopify Onboarding
 */
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle2, Circle, ChevronDown, ChevronUp,
  Store, Package, Image, Clock, CreditCard, FileText,
  Rocket, X
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { motion, AnimatePresence } from 'framer-motion';

interface OnboardingStep {
  id: string;
  titleEn: string;
  titleRu: string;
  descriptionEn: string;
  descriptionRu: string;
  icon: React.ElementType;
  action?: () => void;
  actionLabelEn?: string;
  actionLabelRu?: string;
  isComplete: boolean;
}

interface VendorOnboardingChecklistProps {
  completedSteps?: string[];
  onDismiss?: () => void;
  className?: string;
}

export function VendorOnboardingChecklist({ 
  completedSteps = [],
  onDismiss,
  className 
}: VendorOnboardingChecklistProps) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);
  const isRu = language === 'ru';

  const steps: OnboardingStep[] = useMemo(() => [
    {
      id: 'account',
      titleEn: 'Create account',
      titleRu: 'Создать аккаунт',
      descriptionEn: 'Sign up and verify your email',
      descriptionRu: 'Зарегистрируйтесь и подтвердите email',
      icon: Store,
      isComplete: true, // Always complete if they're seeing this
    },
    {
      id: 'first-listing',
      titleEn: 'Add first listing',
      titleRu: 'Добавить первое объявление',
      descriptionEn: 'Create a product or service to start selling',
      descriptionRu: 'Создайте товар или услугу для продажи',
      icon: Package,
      action: () => navigate('/vendor/services'),
      actionLabelEn: 'Add Listing',
      actionLabelRu: 'Добавить',
      isComplete: completedSteps.includes('first-listing'),
    },
    {
      id: 'description',
      titleEn: 'Add business description',
      titleRu: 'Добавить описание бизнеса',
      descriptionEn: 'Help customers understand what you offer',
      descriptionRu: 'Помогите клиентам понять, что вы предлагаете',
      icon: FileText,
      action: () => navigate('/vendor/settings'),
      actionLabelEn: 'Edit Profile',
      actionLabelRu: 'Редактировать',
      isComplete: completedSteps.includes('description'),
    },
    {
      id: 'photos',
      titleEn: 'Upload logo & cover photo',
      titleRu: 'Загрузить логотип и обложку',
      descriptionEn: 'Good photos increase bookings by 40%',
      descriptionRu: 'Хорошие фото увеличивают заказы на 40%',
      icon: Image,
      action: () => navigate('/vendor/settings'),
      actionLabelEn: 'Upload Photos',
      actionLabelRu: 'Загрузить',
      isComplete: completedSteps.includes('photos'),
    },
    {
      id: 'hours',
      titleEn: 'Set working hours',
      titleRu: 'Указать часы работы',
      descriptionEn: 'Let customers know when you\'re available',
      descriptionRu: 'Сообщите клиентам, когда вы работаете',
      icon: Clock,
      action: () => navigate('/vendor/settings'),
      actionLabelEn: 'Set Hours',
      actionLabelRu: 'Настроить',
      isComplete: completedSteps.includes('hours'),
    },
    {
      id: 'payment',
      titleEn: 'Add payment details',
      titleRu: 'Добавить реквизиты оплаты',
      descriptionEn: 'Set up how you receive payments',
      descriptionRu: 'Настройте способ получения оплаты',
      icon: CreditCard,
      action: () => navigate('/vendor/settings'),
      actionLabelEn: 'Add Payment',
      actionLabelRu: 'Настроить',
      isComplete: completedSteps.includes('payment'),
    },
  ], [completedSteps, navigate, user]);

  const completedCount = steps.filter(s => s.isComplete).length;
  const progress = (completedCount / steps.length) * 100;
  const isAllComplete = completedCount === steps.length;

  if (isDismissed || isAllComplete) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, height: 0 }}
      >
        <Card className={cn('border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5', className)}>
          <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Rocket className="h-4 w-4 text-primary" />
                  {isRu ? 'Начало работы' : 'Getting Started'}
                  <span className="text-sm font-normal text-muted-foreground">
                    {completedCount}/{steps.length}
                  </span>
                </CardTitle>
                <div className="flex items-center gap-1">
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </CollapsibleTrigger>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setIsDismissed(true); onDismiss?.(); }}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Progress value={progress} className="h-2 mt-2" />
            </CardHeader>
            
            <CollapsibleContent>
              <CardContent className="pt-2 space-y-2">
                {steps.map((step) => (
                  <div
                    key={step.id}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-none transition-all",
                      step.isComplete 
                        ? "bg-primary/5 border border-primary/15" 
                        : "bg-muted/30 border border-transparent hover:border-muted"
                    )}
                  >
                    <div className={cn(
                      "mt-0.5 shrink-0",
                      step.isComplete ? "text-primary" : "text-muted-foreground"
                    )}>
                      {step.isComplete ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <Circle className="h-5 w-5" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "font-medium text-sm",
                        step.isComplete && "line-through text-muted-foreground"
                      )}>
                        {isRu ? step.titleRu : step.titleEn}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {isRu ? step.descriptionRu : step.descriptionEn}
                      </p>
                    </div>

                    {!step.isComplete && step.action && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={step.action}
                        className="shrink-0"
                      >
                        {isRu ? step.actionLabelRu : step.actionLabelEn}
                      </Button>
                    )}
                  </div>
                ))}
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
