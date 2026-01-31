import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stethoscope, Phone } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { MiniAppLayout, ItemCard, MiniAppQuickGrid, type MiniAppCategory, type QuickGridItem } from '@/components/miniapp';
import { medicalFilterConfig, FilterValues } from '@/components/filters';
import { Button } from '@/components/ui/button';
import { useClinics } from '@/hooks/useClinics';

const SPECIALTY_CATEGORIES: MiniAppCategory[] = [
  { id: 'all', labelEn: 'All', labelRu: 'Все' },
  { id: 'general', labelEn: 'General', labelRu: 'Терапевт' },
  { id: 'dental', labelEn: 'Dental', labelRu: 'Стоматолог' },
  { id: 'cardio', labelEn: 'Cardio', labelRu: 'Кардиолог' },
  { id: 'pediatric', labelEn: 'Pediatric', labelRu: 'Педиатр' },
  { id: 'eye', labelEn: 'Eye', labelRu: 'Офтальмолог' },
];

export default function MedicalIndex() {
  const { language } = useLanguage();
  const { currencyInfo } = useCurrency();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');
  const [filterValues, setFilterValues] = useState<FilterValues>({});

  const { clinics, isLoading } = useClinics({
    specialty: selectedSpecialty,
    clinicType: filterValues.clinicType as string | undefined,
    is24h: filterValues.availability === 'open' ? true : undefined,
    searchQuery,
  });

  const quickItems: QuickGridItem[] = [
    { icon: '💊', label: language === 'ru' ? 'Аптеки' : 'Pharmacy', onClick: () => navigate('/pharmacy') },
    { icon: '🏥', label: language === 'ru' ? 'Терапевт' : 'General', onClick: () => setSelectedSpecialty('general') },
    { icon: '🦷', label: language === 'ru' ? 'Стоматолог' : 'Dental', onClick: () => setSelectedSpecialty('dental') },
    { icon: '❤️', label: language === 'ru' ? 'Кардиолог' : 'Cardio', onClick: () => setSelectedSpecialty('cardio') },
    { icon: '👶', label: language === 'ru' ? 'Педиатр' : 'Pediatric', onClick: () => setSelectedSpecialty('pediatric') },
  ];

  // Check if clinic is currently open based on working_hours
  const isClinicOpen = (workingHours: Record<string, string>, is24h: boolean): boolean => {
    if (is24h) return true;
    
    const now = new Date();
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const today = days[now.getDay()];
    const hours = workingHours[today];
    
    if (!hours) return false;
    
    const [open, close] = hours.split('-');
    if (!open || !close) return false;
    
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const [openH, openM] = open.split(':').map(Number);
    const [closeH, closeM] = close.split(':').map(Number);
    const openMinutes = openH * 60 + openM;
    const closeMinutes = closeH * 60 + closeM;
    
    return currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
  };

  return (
    <MiniAppLayout
      title={language === 'ru' ? 'Медицина' : 'Medical'}
      subtitle={language === 'ru' ? 'Клиники, врачи, запись' : 'Clinics, doctors, appointments'}
      heroIcon={Stethoscope}
      heroTitle={language === 'ru' ? 'Медицинская помощь' : 'Medical Care'}
      heroSubtitle={language === 'ru' ? 'Лучшие клиники и врачи на Пхукете' : 'Best clinics and doctors in Phuket'}
      heroImage="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800"
      heroGradient={{ from: 'from-teal-500/20', via: 'via-cyan-500/20', to: 'to-primary/20' }}
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder={language === 'ru' ? 'Поиск клиник...' : 'Search clinics...'}
      categories={SPECIALTY_CATEGORIES}
      selectedCategory={selectedSpecialty}
      onCategoryChange={setSelectedSpecialty}
      filterConfig={medicalFilterConfig}
      filterValues={filterValues}
      onFilterChange={setFilterValues}
      isLoading={isLoading}
      isEmpty={clinics.length === 0}
      emptyIcon={Stethoscope}
      emptyText={language === 'ru' ? 'Клиники не найдены' : 'No clinics found'}
    >
      {/* Emergency Banner */}
      <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-red-500">
              {language === 'ru' ? 'Экстренная помощь' : 'Emergency'}
            </p>
            <p className="text-sm text-muted-foreground">
              {language === 'ru' ? 'Звоните 1669' : 'Call 1669'}
            </p>
          </div>
          <Button variant="destructive" size="sm" className="gap-1" asChild>
            <a href="tel:1669">
              <Phone className="w-4 h-4" />
              {language === 'ru' ? 'Позвонить' : 'Call Now'}
            </a>
          </Button>
        </div>
      </div>

      <MiniAppQuickGrid items={quickItems} columns={5} className="mb-6" />
      
      <div className="grid gap-4">
        {clinics.map((clinic) => {
          const isOpen = isClinicOpen(clinic.working_hours || {}, clinic.is_24h);
          
          return (
            <ItemCard
              key={clinic.id}
              image={clinic.cover_image || 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600'}
              title={language === 'ru' ? clinic.name_ru : clinic.name_en}
              rating={clinic.rating}
              reviewCount={clinic.review_count}
              price={clinic.consultation_price || 0}
              pricePrefix={language === 'ru' ? 'от' : 'from'}
              currency={currencyInfo.symbol}
              location={clinic.district || clinic.address || ''}
              isVerified={clinic.is_verified}
              isFeatured={clinic.is_featured}
              badge={isOpen 
                ? { text: language === 'ru' ? 'Открыто' : 'Open', className: 'bg-green-500 text-white' }
                : { text: language === 'ru' ? 'Закрыто' : 'Closed', className: 'bg-muted text-muted-foreground' }
              }
              tags={clinic.languages}
              onClick={() => navigate(`/medical/clinic/${clinic.id}`)}
            />
          );
        })}
      </div>
    </MiniAppLayout>
  );
}
