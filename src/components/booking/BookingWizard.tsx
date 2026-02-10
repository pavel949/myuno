/**
 * BookingWizard — P1.3 Unified Booking Flow
 * 
 * Fixed step skeleton with vertical-specific content as plug-ins.
 * Replaces all XxxBooking.tsx flow logic with ONE orchestrator.
 * 
 * Mandatory steps:
 * 1. Confirmation of intent (what you're booking)
 * 2. Details / options (vertical-specific plug-in)
 * 3. Pricing transparency (summary)
 * 4. Payment
 * 5. What happens next (confirmation)
 */
import React, { useState, useCallback, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLifeSituationContext } from '@/contexts/LifeSituationContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { BookingStepProgress, BookingStep } from '@/components/booking/BookingStepProgress';
import { BookingContactForm, ContactFormData } from '@/components/booking/BookingContactForm';
import { BookingPaymentSelect, PaymentMethod } from '@/components/booking/BookingPaymentSelect';
import { BookingSummary } from '@/components/booking/BookingSummary';
import { BookingBottomBar } from '@/components/booking/BookingBottomBar';
import { BookingConfirmation } from '@/components/booking/BookingConfirmation';
import { BackButton } from '@/components/uno/BackButton';
import { ActiveSituationBanner } from '@/components/life-os/ActiveSituationBanner';
import { PreBookingClarity } from '@/components/trust/PreBookingClarity';
import { cn } from '@/lib/utils';
import { NextStepNudge } from '@/components/hints/NextStepNudge';

// ────────────────────────────────────
// TYPES
// ────────────────────────────────────

export interface BookingWizardConfig {
  /** Entity title (displayed in header and confirmation) */
  title: string;
  /** Entity image */
  image?: string;
  /** Vertical identifier for routing */
  vertical: string;
  /** Route to go back to listing */
  backPath: string;
  /** Continue browsing path after booking */
  continuePath: string;
  continueLabelEn?: string;
  continueLabelRu?: string;
  /** P2.3 — Pre-booking clarity */
  included?: string[];
  excluded?: string[];
  afterPaymentNote?: string;
  confirmationTime?: string;
}

export interface BookingWizardPricing {
  /** Line items for summary */
  items: Array<{
    label: string;
    amount: number;
  }>;
  /** Total */
  total: number;
  /** Currency code */
  currency: string;
}

export interface BookingWizardCallbacks {
  /** Validate before proceeding to payment step */
  onValidate?: () => string | null; // returns error message or null
  /** Submit the booking */
  onSubmit: (data: {
    contact: ContactFormData;
    paymentMethod: PaymentMethod;
  }) => Promise<{ bookingId: string } | null>;
}

export interface BookingWizardProps {
  config: BookingWizardConfig;
  pricing: BookingWizardPricing;
  callbacks: BookingWizardCallbacks;
  /** Vertical-specific details step (plug-in content) */
  detailsStep: ReactNode;
  /** Optional: step after details before summary (e.g. add-ons) */
  optionsStep?: ReactNode;
  /** Additional steps labels */
  extraStepLabels?: BookingStep[];
}

// ────────────────────────────────────
// DEFAULT STEPS
// ────────────────────────────────────

const DEFAULT_STEPS: BookingStep[] = [
  { id: 'details', labelEn: 'Details', labelRu: 'Детали' },
  { id: 'contact', labelEn: 'Contact', labelRu: 'Контакт' },
  { id: 'payment', labelEn: 'Payment', labelRu: 'Оплата' },
  { id: 'confirm', labelEn: 'Done', labelRu: 'Готово' },
];

// ────────────────────────────────────
// COMPONENT
// ────────────────────────────────────

export function BookingWizard({
  config,
  pricing,
  callbacks,
  detailsStep,
  optionsStep,
  extraStepLabels,
}: BookingWizardProps) {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isRu = language === 'ru';

  // Build steps array
  const steps = extraStepLabels
    ? [...extraStepLabels, ...DEFAULT_STEPS.slice(1)]
    : DEFAULT_STEPS;

  const [currentStep, setCurrentStep] = useState(0);
  const [contactData, setContactData] = useState<ContactFormData>({
    name: '', phone: '', email: '', notes: '',
  });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [bookingResult, setBookingResult] = useState<{ bookingId: string } | null>(null);

  const totalSteps = steps.length;
  const isLastActionStep = currentStep === totalSteps - 2; // payment step
  const isConfirmStep = currentStep === totalSteps - 1;

  const handleNext = useCallback(() => {
    // Validate on details step if validator provided
    if (currentStep === 0 && callbacks.onValidate) {
      const error = callbacks.onValidate();
      if (error) {
        setValidationError(error);
        return;
      }
    }
    setValidationError(null);
    setCurrentStep(prev => Math.min(prev + 1, totalSteps - 1));
  }, [currentStep, callbacks, totalSteps]);

  const handleBack = useCallback(() => {
    setValidationError(null);
    if (currentStep === 0) {
      navigate(config.backPath);
    } else {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep, navigate, config.backPath]);

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    try {
      const result = await callbacks.onSubmit({
        contact: contactData,
        paymentMethod,
      });
      if (result) {
        setBookingResult(result);
        setCurrentStep(totalSteps - 1); // go to confirmation
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [callbacks, contactData, paymentMethod, totalSteps]);

  // ── Confirmation screen ──
  if (bookingResult) {
    return (
      <BookingConfirmation
        bookingId={bookingResult.bookingId}
        title={config.title}
        total={pricing.total}
        currency={pricing.currency}
        onViewBookings={() => navigate('/bookings')}
        continuePath={config.continuePath}
        continueLabel={isRu
          ? (config.continueLabelRu || 'Продолжить')
          : (config.continueLabelEn || 'Continue browsing')}
      />
    );
  }

  // ── Determine step content ──
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            {detailsStep}
            {validationError && (
              <p className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-lg p-3">
                {validationError}
              </p>
            )}
          </div>
        );
      
      case 1:
        // Contact step (or options step if provided)
        if (optionsStep && currentStep === 1) {
          return optionsStep;
        }
        return (
          <div className="space-y-4">
            <h3 className="text-base font-semibold">
              {isRu ? 'Контактные данные' : 'Contact Information'}
            </h3>
            <BookingContactForm
              data={contactData}
              onChange={setContactData}
            />
          </div>
        );
      
      case totalSteps - 2:
        // Payment + Summary step
        return (
          <div className="space-y-6">
            {/* P2.3 — Expectation clarity before payment */}
            <PreBookingClarity
              included={config.included}
              excluded={config.excluded}
              afterPayment={config.afterPaymentNote}
              confirmationTime={config.confirmationTime}
            />
            <BookingSummary
              title={config.title}
              image={config.image}
              price={pricing.total}
              sourceCurrency={pricing.currency}
            />
            <div className="space-y-3">
              <h3 className="text-base font-semibold">
                {isRu ? 'Способ оплаты' : 'Payment Method'}
              </h3>
              <BookingPaymentSelect
                selected={paymentMethod}
                onSelect={setPaymentMethod}
                amount={pricing.total}
                currency={pricing.currency}
              />
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  // ── Bottom bar button config ──
  const getBottomBarAction = () => {
    if (isLastActionStep) {
      return {
        label: isRu ? 'Подтвердить и оплатить' : 'Confirm & Pay',
        onClick: handleSubmit,
        isLoading: isSubmitting,
      };
    }
    return {
      label: isRu ? 'Далее' : 'Next',
      onClick: handleNext,
    };
  };

  const bottomAction = getBottomBarAction();

  return (
    <AppLayout showSituationBanner>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="sticky top-0 z-30 bg-background border-b border-border">
          <div className="flex items-center gap-3 p-4">
            <BackButton onClick={handleBack} />
            <div className="flex-1 min-w-0">
              <h1 className="text-base font-semibold truncate">{config.title}</h1>
            </div>
          </div>
          <div className="px-4 pb-2">
            <BookingStepProgress steps={steps} currentStep={currentStep} />
          </div>
        </div>

        {/* Content */}
        <div className="p-4 pb-28 space-y-6">
          {renderStepContent()}

          {/* Nudge on details step when no validation error */}
          {currentStep === 0 && !validationError && (
            <NextStepNudge
              message={isRu ? 'Всё готово — нажмите Далее' : 'All set — tap Next'}
              direction="down"
              visible={true}
              hintId={`booking-wizard-details-${config.vertical}`}
              className="w-fit mx-auto"
            />
          )}
        </div>

        {!isConfirmStep && (
          <BookingBottomBar
            total={pricing.total}
            onSubmit={bottomAction.onClick}
            isSubmitting={bottomAction.isLoading}
            submitLabel={bottomAction.label}
            step={currentStep}
            totalSteps={totalSteps}
          />
        )}
      </div>
    </AppLayout>
  );
}

export default BookingWizard;
