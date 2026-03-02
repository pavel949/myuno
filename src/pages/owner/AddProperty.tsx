import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePropertyWizard } from '@/hooks/usePropertyWizard';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { PropertyWizard } from '@/components/owner/PropertyWizard';
import { PropertySubmissionSuccess } from '@/components/owner/PropertySubmissionSuccess';
import { DraftRestorationBanner } from '@/components/vendor/DraftIndicator';
import { LivePropertyPreview } from '@/components/property/LivePropertyPreview';
import { 
  AIIntakePanel,
  OtaImportPanel,
  BasicInfoStep, 
  LocationStep, 
  PhotosStep, 
  PricingStep
} from '@/components/owner/property-wizard';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Copy } from 'lucide-react';
import { toast } from 'sonner';

export default function AddProperty() {
  const { language } = useLanguage();
  const location = useLocation();
  const isRu = language === 'ru';

  // All form logic from the hook
  const wizard = usePropertyWizard();

  // State for showing restoration banner (only on initial load)
  const [showRestorationBanner, setShowRestorationBanner] = useState(() => {
    const hasLocalDraft = localStorage.getItem('vendor_draft_owner_property_wizard');
    return !!hasLocalDraft && !wizard.cloneFromId;
  });

  // Apply prefill data from AI Intake or OTA import
  const prefillData = (location.state as any)?.prefillData;
  useEffect(() => {
    if (prefillData && !wizard.isCloneDataApplied) {
      wizard.applyPrefillData(prefillData);
    }
  }, [prefillData, wizard.isCloneDataApplied, wizard.applyPrefillData]);

  const handleRestoreDraft = useCallback(() => {
    wizard.restoreDraft();
    setShowRestorationBanner(false);
    toast.success(isRu ? 'Черновик восстановлен' : 'Draft restored');
  }, [wizard.restoreDraft, isRu]);

  const handleDiscardDraft = useCallback(() => {
    wizard.clearDraft();
    setShowRestorationBanner(false);
    toast.info(isRu ? 'Черновик удалён' : 'Draft discarded');
  }, [wizard.clearDraft, isRu]);

  // Render step content - streamlined 4-step wizard
  const renderStep = useCallback((stepId: string) => {
    switch (stepId) {
      case 'basic':
        return (
          <BasicInfoStep
            formData={wizard.formData}
            updateFormData={wizard.updateFormData}
            selectedProject={wizard.selectedProject}
            setSelectedProject={wizard.setSelectedProject}
            ownershipData={wizard.ownershipData}
            updateOwnershipData={wizard.updateOwnershipData}
          />
        );
      case 'location':
        return (
          <LocationStep
            formData={wizard.formData}
            updateFormData={wizard.updateFormData}
          />
        );
      case 'photos':
        return (
          <PhotosStep
            formData={wizard.formData}
            updateFormData={wizard.updateFormData}
          />
        );
      case 'pricing':
        return (
          <PricingStep
            formData={wizard.formData}
            updateFormData={wizard.updateFormData}
            selectedProject={wizard.selectedProject}
          />
        );
      default:
        return null;
    }
  }, [wizard]);

  // Show success screen after submission
  if (wizard.showSuccess) {
    return (
      <PropertySubmissionSuccess
        propertyId={wizard.createdPropertyId}
        propertyTitle={wizard.createdPropertyTitle}
      />
    );
  }

  // Loading state for clone
  if (wizard.cloneFromId && wizard.isLoadingSource) {
    return (
      <PageContainer>
        <PageHeader 
          title={isRu ? 'Добавить объект' : 'Add Property'}
          showBack
          fallbackPath="/mc/properties"
        />
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader 
        title={isRu ? 'Добавить объект' : 'Add Property'}
        subtitle={isRu ? 'Заполните информацию о вашей недвижимости' : 'Fill in your property information'}
        showBack
        fallbackPath="/mc/properties"
      />

      {/* Draft Restoration Banner */}
      {showRestorationBanner && (
        <DraftRestorationBanner
          onRestore={handleRestoreDraft}
          onDiscard={handleDiscardDraft}
        />
      )}

      {/* Import Panels */}
      {!wizard.cloneFromId && (
        <div className="grid gap-3 sm:grid-cols-2">
          <OtaImportPanel onDataExtracted={wizard.applyPrefillData} />
          <AIIntakePanel onDataExtracted={wizard.applyPrefillData} />
        </div>
      )}

      {/* Clone Notice */}
      {wizard.cloneFromId && wizard.sourceProperty && (
        <Alert className="bg-primary/5 border-primary/20">
          <Copy className="h-4 w-4" />
          <AlertDescription>
            {isRu 
              ? `Создание копии объекта "${wizard.sourceProperty.title || wizard.sourceProperty.title_ru}". Измените этаж и номер квартиры.`
              : `Creating a copy of "${wizard.sourceProperty.title || wizard.sourceProperty.title_ru}". Update floor and unit number.`}
          </AlertDescription>
        </Alert>
      )}

      {/* Main Wizard with Live Preview */}
      <div className="lg:grid lg:grid-cols-[1fr,320px] lg:gap-6 mt-6">
        <PropertyWizard
          onSubmit={wizard.handleSubmit}
          isSubmitting={wizard.isSubmitting}
          validateStep={wizard.validateStep}
        >
          {renderStep}
        </PropertyWizard>

        {/* Desktop Preview */}
        <div className="hidden lg:block sticky top-24 h-fit">
          <LivePropertyPreview data={wizard.previewData} />
        </div>
      </div>

      {/* Mobile Preview */}
      <div className="lg:hidden mt-6">
        <LivePropertyPreview data={wizard.previewData} />
      </div>
    </PageContainer>
  );
}
