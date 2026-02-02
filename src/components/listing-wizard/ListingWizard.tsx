import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useListingApplication } from '@/hooks/useListingApplication';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';

import { ListingTypeStep } from './steps/ListingTypeStep';
import { BasicInfoStep } from './steps/BasicInfoStep';
import { DetailsStep } from './steps/DetailsStep';
import { PhotosStep } from './steps/PhotosStep';
import { PricingStep } from './steps/PricingStep';
import { ContactStep } from './steps/ContactStep';
import { ReviewStep } from './steps/ReviewStep';
import { SuccessStep } from './steps/SuccessStep';

const STEPS = [
  { id: 'type', titleEn: 'What are you listing?', titleRu: 'Что вы предлагаете?' },
  { id: 'basic', titleEn: 'Basic info', titleRu: 'Основная информация' },
  { id: 'details', titleEn: 'Details', titleRu: 'Детали' },
  { id: 'photos', titleEn: 'Photos', titleRu: 'Фотографии' },
  { id: 'pricing', titleEn: 'Pricing', titleRu: 'Цена' },
  { id: 'contact', titleEn: 'Contact info', titleRu: 'Контакты' },
  { id: 'review', titleEn: 'Review & Submit', titleRu: 'Проверка и отправка' },
];

export function ListingWizard() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  
  const {
    draft,
    currentStep,
    isLoading,
    isSaving,
    setListingType,
    updateDraft,
    saveDraft,
    submitApplication,
    nextStep,
    prevStep,
    goToStep,
  } = useListingApplication();
  
  const [isSubmitted, setIsSubmitted] = React.useState(false);
  
  const progress = ((currentStep + 1) / STEPS.length) * 100;
  const currentStepData = STEPS[currentStep];
  
  const handleSubmit = async () => {
    const success = await submitApplication();
    if (success) {
      setIsSubmitted(true);
    }
  };
  
  const handleClose = () => {
    if (currentStep > 0 && !isSubmitted) {
      saveDraft();
    }
    navigate(-1);
  };
  
  if (isSubmitted) {
    return <SuccessStep listingType={draft.listing_type} />;
  }
  
  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <ListingTypeStep
            value={draft.listing_type}
            onChange={setListingType}
            onNext={nextStep}
          />
        );
      case 1:
        return (
          <BasicInfoStep
            draft={draft}
            onChange={updateDraft}
            onNext={nextStep}
            onBack={prevStep}
          />
        );
      case 2:
        return (
          <DetailsStep
            draft={draft}
            onChange={updateDraft}
            onNext={nextStep}
            onBack={prevStep}
          />
        );
      case 3:
        return (
          <PhotosStep
            draft={draft}
            onChange={updateDraft}
            onNext={nextStep}
            onBack={prevStep}
          />
        );
      case 4:
        return (
          <PricingStep
            draft={draft}
            onChange={updateDraft}
            onNext={nextStep}
            onBack={prevStep}
          />
        );
      case 5:
        return (
          <ContactStep
            draft={draft}
            onChange={updateDraft}
            onNext={nextStep}
            onBack={prevStep}
          />
        );
      case 6:
        return (
          <ReviewStep
            draft={draft}
            onEdit={goToStep}
            onSubmit={handleSubmit}
            onBack={prevStep}
            isLoading={isLoading}
          />
        );
      default:
        return null;
    }
  };
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center justify-between px-4 h-14">
          {currentStep > 0 ? (
            <Button variant="ghost" size="icon" onClick={prevStep}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
          ) : (
            <div className="w-10" />
          )}
          
          <span className="text-sm font-medium text-muted-foreground">
            {currentStep + 1} / {STEPS.length}
          </span>
          
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        <Progress value={progress} className="h-1" />
      </header>
      
      {/* Content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-lg mx-auto px-4 py-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <h1 className="text-2xl font-bold mb-6">
                {isRu ? currentStepData.titleRu : currentStepData.titleEn}
              </h1>
              
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
      
      {/* Saving indicator */}
      {isSaving && (
        <div className="fixed bottom-4 left-4 bg-muted px-3 py-2 rounded-lg text-sm text-muted-foreground">
          {isRu ? 'Сохранение...' : 'Saving...'}
        </div>
      )}
    </div>
  );
}
