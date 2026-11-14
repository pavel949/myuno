import React, { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { APP_ROUTES } from '@/lib/config/routes';
import { useUserListings } from '@/hooks/useUserListings';
import { UserListingDraft, ItemCondition } from '@/types/userListing';
import { useMarketplaceCategories } from '@/hooks/useMarketplace';
import { isUserListingStepComplete, validateUserListingDraft } from '@/lib/userListingValidation';
import { toast } from 'sonner';

import { SellBasicInfoStep } from './steps/SellBasicInfoStep';
import { SellConditionStep } from './steps/SellConditionStep';
import { SellPhotosStep } from './steps/SellPhotosStep';
import { SellPricingStep } from './steps/SellPricingStep';
import { SellContactStep } from './steps/SellContactStep';
import { SellReviewStep } from './steps/SellReviewStep';
import { SellSuccessStep } from './steps/SellSuccessStep';

const STEPS = [
  { id: 'basic', titleEn: 'What are you selling?', titleRu: 'Что вы продаёте?' },
  { id: 'condition', titleEn: 'Item condition', titleRu: 'Состояние товара' },
  { id: 'photos', titleEn: 'Add photos', titleRu: 'Добавьте фото' },
  { id: 'pricing', titleEn: 'Set your price', titleRu: 'Установите цену' },
  { id: 'contact', titleEn: 'Contact info', titleRu: 'Контакты' },
  { id: 'review', titleEn: 'Review & Publish', titleRu: 'Проверка и публикация' },
];

const initialDraft: UserListingDraft = {
  title_en: '',
  title_ru: '',
  description_en: '',
  description_ru: '',
  category_slug: '',
  subcategory: '',
  price: undefined,
  currency: 'THB',
  is_negotiable: true,
  condition: 'good',
  cover_image: '',
  images: [],
  location: '',
  contact_phone: '',
  contact_whatsapp: '',
  show_phone: false,
};

const SELLER_DRAFT_STORAGE_KEY = 'myuno:seller-listing-draft:v1';
const SELLER_DRAFT_TTL_MS = 1000 * 60 * 60 * 24 * 30;
type PersistedSellerDraft = {
  savedAt: number;
  step: number;
  draft: UserListingDraft;
  listingId: string | null;
};

function loadPersistedDraft(): PersistedSellerDraft {
  try {
    const raw = localStorage.getItem(SELLER_DRAFT_STORAGE_KEY);
    if (!raw) return { savedAt: Date.now(), step: 0, draft: initialDraft, listingId: null };
    const parsed = JSON.parse(raw) as Partial<PersistedSellerDraft>;
    if (!parsed.savedAt || Date.now() - parsed.savedAt > SELLER_DRAFT_TTL_MS || !parsed.draft) {
      localStorage.removeItem(SELLER_DRAFT_STORAGE_KEY);
      return { savedAt: Date.now(), step: 0, draft: initialDraft, listingId: null };
    }
    return {
      savedAt: parsed.savedAt,
      step: typeof parsed.step === 'number' ? Math.max(0, Math.min(parsed.step, STEPS.length - 1)) : 0,
      draft: { ...initialDraft, ...parsed.draft },
      listingId: typeof parsed.listingId === 'string' ? parsed.listingId : null,
    };
  } catch {
    return { savedAt: Date.now(), step: 0, draft: initialDraft, listingId: null };
  }
}

export function SellItemWizard() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { createListing, updateListing, publishListing } = useUserListings();
  const { categories } = useMarketplaceCategories();
  
  const [persistedDraft] = useState(loadPersistedDraft);
  const [currentStep, setCurrentStep] = useState(persistedDraft.step);
  const [draft, setDraft] = useState<UserListingDraft>(persistedDraft.draft);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [createdListingId, setCreatedListingId] = useState<string | null>(persistedDraft.listingId);

  const persistDraft = useCallback(() => {
    try {
      localStorage.setItem(SELLER_DRAFT_STORAGE_KEY, JSON.stringify({
        savedAt: Date.now(),
        step: currentStep,
        draft,
        listingId: createdListingId,
      } satisfies PersistedSellerDraft));
    } catch {
      // Draft persistence is best effort; the form remains usable if storage is blocked.
    }
  }, [currentStep, draft, createdListingId]);

  useEffect(() => {
    persistDraft();
  }, [persistDraft]);
  
  const progress = ((currentStep + 1) / STEPS.length) * 100;
  const currentStepData = STEPS[currentStep];
  
  const updateDraft = (updates: Partial<UserListingDraft>) => {
    setDraft(prev => ({ ...prev, ...updates }));
  };
  
  const nextStep = () => {
    if (!isUserListingStepComplete(draft, currentStep)) {
      toast.error(isRu ? 'Заполните обязательные поля' : 'Complete the required fields before continuing');
      return;
    }
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };
  
  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };
  
  const goToStep = (step: number) => {
    setCurrentStep(step);
  };
  
  const handleSubmit = async () => {
    const validation = validateUserListingDraft(draft);
    if ('message' in validation) {
      toast.error(isRu ? 'Объявление заполнено не полностью' : 'Listing is incomplete', { description: validation.message });
      return;
    }
    setIsSubmitting(true);
    try {
      let listingId = createdListingId;
      if (listingId) {
        const saved = await updateListing(listingId, draft);
        if (!saved) return;
      } else {
        const listing = await createListing(draft);
        if (!listing) return;
        listingId = listing.id;
        setCreatedListingId(listingId);
      }
      if (listingId && await publishListing(listingId)) {
        try {
          localStorage.removeItem(SELLER_DRAFT_STORAGE_KEY);
        } catch {
          // A blocked storage implementation must not hide a confirmed publish.
        }
        setIsSubmitted(true);
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleClose = () => {
    persistDraft();
    navigate(APP_ROUTES.SELL);
  };
  
  if (isSubmitted) {
    return <SellSuccessStep listingId={createdListingId} />;
  }
  
  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <SellBasicInfoStep
            draft={draft}
            categories={categories}
            onChange={updateDraft}
            onNext={nextStep}
          />
        );
      case 1:
        return (
          <SellConditionStep
            condition={draft.condition}
            onChange={(condition) => updateDraft({ condition })}
            onNext={nextStep}
            onBack={prevStep}
          />
        );
      case 2:
        return (
          <SellPhotosStep
            draft={draft}
            onChange={updateDraft}
            onNext={nextStep}
            onBack={prevStep}
          />
        );
      case 3:
        return (
          <SellPricingStep
            draft={draft}
            onChange={updateDraft}
            onNext={nextStep}
            onBack={prevStep}
          />
        );
      case 4:
        return (
          <SellContactStep
            draft={draft}
            onChange={updateDraft}
            onNext={nextStep}
            onBack={prevStep}
          />
        );
      case 5:
        return (
          <SellReviewStep
            draft={draft}
            categories={categories}
            onEdit={goToStep}
            onSubmit={handleSubmit}
            onBack={prevStep}
            isLoading={isSubmitting}
          />
        );
      default:
        return null;
    }
  };
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 border-b">
        <div className="flex items-center justify-between px-4 h-14">
          {currentStep > 0 ? (
            <Button variant="ghost" size="icon" onClick={prevStep} aria-label={isRu ? 'Назад' : 'Back'}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
          ) : (
            <div className="w-10" />
          )}
          
          <span className="text-sm font-medium text-muted-foreground">
            {currentStep + 1} / {STEPS.length}
          </span>
          
          <Button variant="ghost" size="icon" onClick={handleClose} aria-label={isRu ? 'Закрыть' : 'Close'}>
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
    </div>
  );
}
