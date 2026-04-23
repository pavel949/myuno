import { useCallback, useEffect, useRef } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePropertyWizard } from '@/hooks/usePropertyWizard';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { PropertyWizard } from '@/components/owner/PropertyWizard';
import { PropertySubmissionSuccess } from '@/components/owner/PropertySubmissionSuccess';
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
import { Button } from '@/components/ui/button';
import { Copy, MapPin, Plus, Save } from 'lucide-react';
import { toast } from 'sonner';
import { GOOGLE_MAPS_API_KEY } from '@/lib/googleMaps';
import { useCrmContact } from '@/hooks/useCrmContacts';
import { APP_ROUTES } from '@/lib/config/routes';

export default function AddProperty() {
  const { language } = useLanguage();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const isRu = language === 'ru';

  // All form logic from the hook
  const wizard = usePropertyWizard();

  const ownerContactId = searchParams.get('owner_contact_id');
  const { data: ownerContact } = useCrmContact(ownerContactId ?? undefined);
  const ownerPrefillApplied = useRef<string | null>(null);

  // Apply prefill data from AI Intake or OTA import
  const prefillData = (location.state as any)?.prefillData;
  useEffect(() => {
    if (prefillData && !wizard.isCloneDataApplied) {
      wizard.applyPrefillData(prefillData);
    }
  }, [prefillData, wizard.isCloneDataApplied, wizard.applyPrefillData]);

  useEffect(() => {
    if (!ownerContactId || !ownerContact) return;
    if (ownerPrefillApplied.current === ownerContactId) return;
    ownerPrefillApplied.current = ownerContactId;
    wizard.updateOwnershipData({
      ownership_type: 'verbal',
      actual_owner_name: `${ownerContact.first_name} ${ownerContact.last_name}`.trim(),
      actual_owner_phone: ownerContact.phone || ownerContact.mobile || ownerContact.whatsapp || '',
      actual_owner_email: ownerContact.email || '',
    });
  }, [ownerContactId, ownerContact, wizard.updateOwnershipData]);

  const handleNewObject = useCallback(() => {
    wizard.resetForm();
    toast.info(isRu ? 'Форма очищена — создайте новый объект' : 'Form cleared — create a new property');
  }, [wizard.resetForm, isRu]);

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
        onAddAnother={handleNewObject}
      />
    );
  }

  // Loading state for clone or latest server draft
  if ((wizard.cloneFromId && wizard.isLoadingSource) || wizard.isLoadingDraft) {
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

  // Check if form has data (for showing "New Object" button)
  const hasFormData = !!(wizard.formData.title || wizard.formData.title_ru || wizard.formData.images.length > 0);

  return (
    <PageContainer>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <PageHeader 
          title={isRu ? 'Добавить объект' : 'Add Property'}
          subtitle={isRu ? 'Заполните информацию о вашей недвижимости' : 'Fill in your property information'}
          showBack
          fallbackPath="/mc/properties"
        />
        
        {/* Action buttons */}
        <div className="flex gap-2">
          {hasFormData && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={wizard.handleSaveDraft}
                disabled={wizard.isSavingDraft || wizard.isSubmitting}
              >
                <Save className="h-4 w-4 mr-1" />
                {isRu ? 'Сохранить черновик' : 'Save Draft'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNewObject}
                disabled={wizard.isSubmitting}
              >
                <Plus className="h-4 w-4 mr-1" />
                {isRu ? 'Новый объект' : 'New Object'}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Import Panels */}
      <div className="grid gap-3 sm:grid-cols-2">
        <OtaImportPanel onDataExtracted={wizard.applyPrefillData} />
        <AIIntakePanel onDataExtracted={wizard.applyPrefillData} />
      </div>

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

      {ownerContactId && (
        <Alert className="bg-muted/50 border-border">
          <AlertDescription className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm">
            <span>
              {ownerContact
                ? (isRu
                  ? `Владелец предзаполнен из CRM: ${ownerContact.first_name} ${ownerContact.last_name}. После сохранения объекта свяжите его с контактом на карточке.`
                  : `Owner prefilled from CRM: ${ownerContact.first_name} ${ownerContact.last_name}. After saving, link the property from the contact card.`)
                : (isRu ? 'Загрузка данных контакта…' : 'Loading contact…')}
            </span>
            <Button variant="outline" size="sm" asChild className="shrink-0 w-full sm:w-auto">
              <Link to={APP_ROUTES.MC_CONTACT_DETAIL(ownerContactId)}>
                {isRu ? 'К карточке контакта' : 'Open contact'}
              </Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Main Wizard with Live Preview */}
      <div className="lg:grid lg:grid-cols-[1fr,320px] lg:gap-6 mt-6" onBlurCapture={wizard.saveDraftOnBlur}>
        <PropertyWizard
          onSubmit={wizard.handleSubmit}
          isSubmitting={wizard.isSubmitting}
          validateStep={wizard.validateStep}
          onSaveDraft={wizard.handleSaveDraft}
          lastSaved={wizard.lastSaved}
          saveState={wizard.saveState}
        >
          {renderStep}
        </PropertyWizard>

        {/* Desktop Preview + Map */}
        <div className="hidden lg:block sticky top-24 h-fit space-y-4">
          <LivePropertyPreview data={wizard.previewData} />
          
          {/* Map preview when coordinates are set */}
          {wizard.formData.lat && wizard.formData.lng && (
            <div className="rounded-none overflow-hidden border">
              {GOOGLE_MAPS_API_KEY && (
                <img
                  src={`https://maps.googleapis.com/maps/api/staticmap?center=${wizard.formData.lat},${wizard.formData.lng}&zoom=14&size=320x200&scale=2&markers=color:red%7C${wizard.formData.lat},${wizard.formData.lng}&key=${GOOGLE_MAPS_API_KEY}`}
                  alt="Property location"
                  className="w-full h-[200px] object-cover bg-muted"
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              )}
              <div className="bg-muted/30 px-3 py-1.5 text-[10px] text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {wizard.formData.lat.toFixed(4)}, {wizard.formData.lng.toFixed(4)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Preview */}
      <div className="lg:hidden mt-6">
        <LivePropertyPreview data={wizard.previewData} />
      </div>
    </PageContainer>
  );
}
