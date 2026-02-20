import { useState, useEffect, ReactNode } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useOwnerProperty, useUpdateOwnerProperty } from '@/hooks/usePropertyCare';
import { usePropertyAvailabilityManagement } from '@/hooks/usePropertyAvailabilityManagement';
import { PageContainer } from '@/components/uno/PageContainer';
import { BackButton } from '@/components/uno/BackButton';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { createErrorHandler } from '@/lib/errorHandler';
import { cn } from '@/lib/utils';
import { 
  Home, Image, Calendar, DollarSign, FileText, 
  Users, MapPin, Zap, Bed, Settings, Save,
  ChevronLeft, Loader2, Eye, CheckCircle2, Megaphone, MoreHorizontal, TrendingUp
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Section components
import { PropertyManageListingSection } from '@/components/owner/property-manage/ListingSection';
import { PropertyManageCalendarSection } from '@/components/owner/property-manage/CalendarSection';
import { PropertyManagePricingSection } from '@/components/owner/property-manage/PricingSection';
import { PropertyManageRulesSection } from '@/components/owner/property-manage/RulesSection';
import { PropertyManageInvestmentSection } from '@/components/owner/property-manage/InvestmentSection';
import { PropertyManageMarketingSection } from '@/components/owner/marketing';

interface MenuSection {
  id: string;
  label: string;
  labelRu: string;
  icon: React.ReactNode;
  badge?: string;
}

// All menu sections - first 4 shown in mobile nav, rest in overflow
const MENU_SECTIONS: MenuSection[] = [
  { id: 'listing', label: 'Listing', labelRu: 'Объявление', icon: <Home className="h-4 w-4" /> },
  { id: 'photos', label: 'Photos', labelRu: 'Фото', icon: <Image className="h-4 w-4" /> },
  { id: 'calendar', label: 'Calendar', labelRu: 'Календарь', icon: <Calendar className="h-4 w-4" /> },
  { id: 'pricing', label: 'Pricing', labelRu: 'Цены', icon: <DollarSign className="h-4 w-4" /> },
  { id: 'rules', label: 'Policies & Rules', labelRu: 'Правила', icon: <FileText className="h-4 w-4" /> },
  { id: 'investment', label: 'Investment', labelRu: 'Инвестиции', icon: <TrendingUp className="h-4 w-4" />, badge: 'NEW' },
  { id: 'marketing', label: 'Marketing', labelRu: 'Продвижение', icon: <Megaphone className="h-4 w-4" /> },
];

// Mobile nav: 4 main items + overflow menu (HIG recommendation: max 5 items)
const MOBILE_NAV_ITEMS = MENU_SECTIONS.slice(0, 4);
const OVERFLOW_ITEMS = MENU_SECTIONS.slice(4);

export default function PropertyManage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { toast } = useToast();
  const isRu = language === 'ru';
  const errorLog = createErrorHandler('PropertyManage');
  const activeSection = searchParams.get('section') || 'listing';
  
  const { data: property, isLoading } = useOwnerProperty(id);
  const updateProperty = useUpdateOwnerProperty();
  const { availability, syncAvailability, isSaving: isSavingAvailability } = usePropertyAvailabilityManagement(id);

  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formInitialized, setFormInitialized] = useState(false);

  // Form state that all sections can update
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [localAvailability, setLocalAvailability] = useState(availability || []);

  // Initialize form data from property — only once, not on every refetch
  useEffect(() => {
    if (property && !formInitialized) {
      setFormData({
        title: property.title || '',
        title_ru: property.title_ru || '',
        property_type: property.property_type || 'apartment',
        bedrooms: property.bedrooms || 1,
        bathrooms: property.bathrooms || 1,
        area_sqm: property.area_sqm,
        description: property.description || '',
        description_ru: property.description_ru || '',
        highlights: property.highlights || [],
        address: property.address || '',
        district: property.district || '',
        lat: property.lat,
        lng: property.lng,
        cover_image: property.cover_image || '',
        images: property.images || [],
        rooms: property.rooms || [],
        price_per_night: property.price_per_night,
        deposit_amount: property.deposit_amount,
        deposit_currency: property.deposit_currency || 'THB',
        deposit_type: property.deposit_type || 'fixed',
        weekly_discount: property.weekly_discount || 0,
        monthly_discount: property.monthly_discount || 0,
        seasonal_pricing: property.seasonal_pricing || [],
        min_stay_nights: property.min_stay_nights || 1,
        max_guests: property.max_guests || 2,
        instant_booking: property.instant_booking || false,
        cancellation_policy: property.cancellation_policy || 'flexible',
        check_in_time: property.check_in_time || '14:00',
        check_out_time: property.check_out_time || '12:00',
        early_checkin_price: property.early_checkin_price,
        late_checkout_price: property.late_checkout_price,
        key_handover: property.key_handover || 'in_person',
        check_in_instructions: property.check_in_instructions || '',
        check_in_instructions_ru: property.check_in_instructions_ru || '',
        house_rules: property.house_rules || '',
        house_rules_ru: property.house_rules_ru || '',
        electricity_included: property.electricity_included || false,
        electricity_unit_price: property.electricity_unit_price || 7,
        water_included: property.water_included ?? true,
        cleaning_included: property.cleaning_included ?? true,
        cleaning_frequency: property.cleaning_frequency || 'weekly',
        parking_included: property.parking_included ?? true,
        parking_spaces: property.parking_spaces || 1,
        pets_allowed: property.pets_allowed || false,
        pet_deposit: property.pet_deposit,
        children_friendly: property.children_friendly ?? true,
        quiet_hours_start: property.quiet_hours_start || '22:00',
        quiet_hours_end: property.quiet_hours_end || '08:00',
        parties_allowed: property.parties_allowed || false,
        smoking_penalty: property.smoking_penalty,
      });
      setFormInitialized(true);
    }
  }, [property, formInitialized]);

  // Sync availability when loaded
  useEffect(() => {
    if (availability) {
      setLocalAvailability(availability);
    }
  }, [availability]);

  const updateFormData = (updates: Record<string, any>) => {
    setFormData(prev => ({ ...prev, ...updates }));
    setHasChanges(true);
  };

  const handleSectionChange = (sectionId: string) => {
    setSearchParams({ section: sectionId });
  };

  const handleSave = async () => {
    if (!id) return;
    
    setIsSaving(true);
    try {
      // Prepare data for update
      await updateProperty.mutateAsync({
        id,
        ...formData,
        area_sqm: formData.area_sqm ? Number(formData.area_sqm) : null,
        price_per_night: formData.price_per_night ? Number(formData.price_per_night) : null,
        deposit_amount: formData.deposit_amount ? Number(formData.deposit_amount) : null,
        weekly_discount: Number(formData.weekly_discount) || 0,
        monthly_discount: Number(formData.monthly_discount) || 0,
        min_stay_nights: Number(formData.min_stay_nights) || 1,
        max_guests: Number(formData.max_guests) || 2,
        early_checkin_price: formData.early_checkin_price ? Number(formData.early_checkin_price) : null,
        late_checkout_price: formData.late_checkout_price ? Number(formData.late_checkout_price) : null,
        electricity_unit_price: formData.electricity_unit_price ? Number(formData.electricity_unit_price) : null,
        parking_spaces: formData.parking_spaces ? Number(formData.parking_spaces) : 1,
        pet_deposit: formData.pet_deposit ? Number(formData.pet_deposit) : null,
        smoking_penalty: formData.smoking_penalty ? Number(formData.smoking_penalty) : null,
      });

      // Save availability changes
      if (localAvailability.length > 0) {
        await syncAvailability(localAvailability);
      }

      toast({
        title: isRu ? 'Сохранено' : 'Saved',
        description: isRu ? 'Все изменения сохранены' : 'All changes saved successfully',
      });
      
      setHasChanges(false);
      setFormInitialized(false); // Allow re-sync from server after save
    } catch (error) {
      errorLog.error(error, 'save_property');
    } finally {
      setIsSaving(false);
    }
  };

  const renderSection = (): ReactNode => {
    switch (activeSection) {
      case 'listing':
      case 'photos':
        return (
          <PropertyManageListingSection
            formData={formData}
            updateFormData={updateFormData}
            activeTab={activeSection === 'photos' ? 'photos' : 'details'}
          />
        );
      case 'calendar':
        return (
          <PropertyManageCalendarSection
            availability={localAvailability}
            onChange={(newAvailability) => {
              setLocalAvailability(newAvailability);
              setHasChanges(true);
            }}
            basePrice={formData.price_per_night || 0}
            currency={formData.deposit_currency || 'THB'}
          />
        );
      case 'pricing':
        return (
          <PropertyManagePricingSection
            formData={formData}
            updateFormData={updateFormData}
          />
        );
      case 'rules':
        return (
          <PropertyManageRulesSection
            formData={formData}
            updateFormData={updateFormData}
          />
        );
      case 'marketing':
        return id ? (
          <PropertyManageMarketingSection propertyId={id} />
        ) : null;
      case 'investment':
        return id ? (
          <PropertyManageInvestmentSection propertyId={id} />
        ) : null;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <PageContainer className="px-0">
        <div className="flex items-center gap-4 px-4 mb-4">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <Skeleton className="h-6 w-48" />
        </div>
        <Skeleton className="h-[calc(100vh-120px)] w-full" />
      </PageContainer>
    );
  }

  if (!property) {
    return (
      <PageContainer>
        <BackButton />
        <div className="text-center py-12">
          <Home className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg font-medium">{isRu ? 'Объект не найден' : 'Property not found'}</p>
        </div>
      </PageContainer>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Fixed Header */}
      <header className="sticky top-0 z-50 bg-background border-b">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(`/owner/properties/${id}`)}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="truncate">
              <h1 className="text-sm font-medium truncate max-w-[150px] xs:max-w-[200px] sm:max-w-none">
                {isRu && property.title_ru ? property.title_ru : property.title}
              </h1>
              <p className="text-xs text-muted-foreground">
                {isRu ? 'Редактирование' : 'Editing'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/property/${property.marketplace_property_id || id}`)}
              disabled={!property.marketplace_property_id}
            >
              <Eye className="h-4 w-4 mr-1" />
              {isRu ? 'Превью' : 'Preview'}
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
              className="gap-1"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : hasChanges ? (
                <Save className="h-4 w-4" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              {isSaving 
                ? (isRu ? 'Сохранение...' : 'Saving...') 
                : hasChanges 
                  ? (isRu ? 'Сохранить' : 'Save') 
                  : (isRu ? 'Сохранено' : 'Saved')}
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Navigation */}
        <aside className="w-56 border-r bg-muted/30 hidden md:block">
          <ScrollArea className="h-[calc(100vh-56px)]">
            <nav className="p-3 space-y-1">
              {MENU_SECTIONS.map((section) => (
                <button
                  key={section.id}
                  onClick={() => handleSectionChange(section.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left",
                    activeSection === section.id || (section.id === 'listing' && activeSection === 'photos')
                      ? "bg-primary text-primary-foreground font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  {section.icon}
                  <span>{isRu ? section.labelRu : section.label}</span>
                  {section.badge && (
                    <Badge variant="secondary" className="ml-auto text-[10px]">
                      {section.badge}
                    </Badge>
                  )}
                </button>
              ))}
            </nav>
          </ScrollArea>
        </aside>

        {/* Mobile Bottom Navigation - 4 items + overflow menu (HIG compliant) */}
        <div className="fixed bottom-0 left-0 right-0 md:hidden bg-background border-t z-40 px-2 pb-safe">
          <div className="flex justify-around py-2">
            {MOBILE_NAV_ITEMS.map((section) => (
              <button
                key={section.id}
                onClick={() => handleSectionChange(section.id)}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors",
                  activeSection === section.id || (section.id === 'listing' && activeSection === 'photos')
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              >
                {section.icon}
                <span className="text-[10px]">{isRu ? section.labelRu : section.label}</span>
              </button>
            ))}
            
            {/* Overflow menu for additional items */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={cn(
                    "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors",
                    OVERFLOW_ITEMS.some(s => s.id === activeSection)
                      ? "text-primary"
                      : "text-muted-foreground"
                  )}
                >
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="text-[10px]">{isRu ? 'Ещё' : 'More'}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {OVERFLOW_ITEMS.map((section) => (
                  <DropdownMenuItem
                    key={section.id}
                    onClick={() => handleSectionChange(section.id)}
                    className={cn(
                      "flex items-center gap-2",
                      activeSection === section.id && "bg-accent"
                    )}
                  >
                    {section.icon}
                    <span>{isRu ? section.labelRu : section.label}</span>
                    {section.badge && (
                      <Badge variant="secondary" className="ml-auto text-[10px]">
                        {section.badge}
                      </Badge>
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto pb-20 md:pb-6">
          <div className="p-4 md:p-6 max-w-4xl mx-auto">
            {renderSection()}
          </div>
        </main>
      </div>
    </div>
  );
}
