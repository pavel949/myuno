import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stethoscope, Heart, Pill, Baby, Bone, Eye, MapPin, Clock, Phone } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { MiniAppLayout, ItemCard, MiniAppQuickGrid, type MiniAppCategory, type QuickGridItem } from '@/components/miniapp';
import { medicalFilterConfig, FilterValues } from '@/components/filters';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const clinics = [
  {
    id: 'clinic-1',
    name: 'Bangkok Hospital Phuket',
    nameRu: 'Бангкок Госпиталь Пхукет',
    type: 'hospital',
    specialty: 'general',
    image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600',
    rating: 4.9,
    reviewCount: 892,
    location: 'Phuket Town',
    locationRu: 'Пхукет Таун',
    price: 1500,
    isVerified: true,
    isFeatured: true,
    isOpen: true,
    languages: ['EN', 'TH', 'RU', 'CN'],
  },
  {
    id: 'clinic-2',
    name: 'Phuket Dental Signature',
    nameRu: 'Пхукет Дентал Сигнатюр',
    type: 'clinic',
    specialty: 'dental',
    image: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=600',
    rating: 4.8,
    reviewCount: 234,
    location: 'Patong',
    locationRu: 'Патонг',
    price: 800,
    isVerified: true,
    isOpen: true,
    languages: ['EN', 'TH', 'RU'],
  },
  {
    id: 'clinic-3',
    name: 'Heart Center Phuket',
    nameRu: 'Кардиоцентр Пхукет',
    type: 'clinic',
    specialty: 'cardio',
    image: 'https://images.unsplash.com/photo-1551076805-e1869033e561?w=600',
    rating: 4.9,
    reviewCount: 156,
    location: 'Kata',
    locationRu: 'Ката',
    price: 2500,
    isVerified: true,
    isOpen: true,
    languages: ['EN', 'TH'],
  },
  {
    id: 'clinic-4',
    name: 'Kids Health Clinic',
    nameRu: 'Детская Клиника',
    type: 'clinic',
    specialty: 'pediatric',
    image: 'https://images.unsplash.com/photo-1581594693702-fbdc51b2763b?w=600',
    rating: 4.7,
    reviewCount: 189,
    location: 'Rawai',
    locationRu: 'Равай',
    price: 1200,
    isVerified: true,
    isOpen: false,
    languages: ['EN', 'TH', 'RU'],
  },
  {
    id: 'clinic-5',
    name: 'Phuket Eye Center',
    nameRu: 'Глазной Центр Пхукет',
    type: 'clinic',
    specialty: 'eye',
    image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600',
    rating: 4.8,
    reviewCount: 145,
    location: 'Phuket Town',
    locationRu: 'Пхукет Таун',
    price: 1000,
    isVerified: true,
    isOpen: true,
    languages: ['EN', 'TH'],
  },
];

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
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');
  const [filterValues, setFilterValues] = useState<FilterValues>({});

  const filteredClinics = useMemo(() => {
    return clinics.filter(clinic => {
      const name = language === 'ru' ? clinic.nameRu : clinic.name;
      const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSpecialty = selectedSpecialty === 'all' || clinic.specialty === selectedSpecialty;
      if (filterValues.clinicType && clinic.type !== filterValues.clinicType) return false;
      if (filterValues.availability === 'open' && !clinic.isOpen) return false;
      return matchesSearch && matchesSpecialty;
    });
  }, [clinics, searchQuery, selectedSpecialty, filterValues, language]);

  const quickItems: QuickGridItem[] = [
    { icon: '💊', label: language === 'ru' ? 'Аптеки' : 'Pharmacy', onClick: () => navigate('/pharmacy') },
    { icon: '🏥', label: language === 'ru' ? 'Терапевт' : 'General', onClick: () => setSelectedSpecialty('general') },
    { icon: '🦷', label: language === 'ru' ? 'Стоматолог' : 'Dental', onClick: () => setSelectedSpecialty('dental') },
    { icon: '❤️', label: language === 'ru' ? 'Кардиолог' : 'Cardio', onClick: () => setSelectedSpecialty('cardio') },
    { icon: '👶', label: language === 'ru' ? 'Педиатр' : 'Pediatric', onClick: () => setSelectedSpecialty('pediatric') },
  ];

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
      isLoading={false}
      isEmpty={filteredClinics.length === 0}
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
          <Button variant="destructive" size="sm" className="gap-1">
            <Phone className="w-4 h-4" />
            {language === 'ru' ? 'Позвонить' : 'Call Now'}
          </Button>
        </div>
      </div>

      <MiniAppQuickGrid items={quickItems} columns={5} className="mb-6" />
      
      <div className="grid gap-4">
        {filteredClinics.map((clinic) => (
          <ItemCard
            key={clinic.id}
            image={clinic.image}
            title={language === 'ru' ? clinic.nameRu : clinic.name}
            rating={clinic.rating}
            reviewCount={clinic.reviewCount}
            price={clinic.price}
            pricePrefix={language === 'ru' ? 'от' : 'from'}
            currency="฿"
            location={language === 'ru' ? clinic.locationRu : clinic.location}
            isVerified={clinic.isVerified}
            isFeatured={clinic.isFeatured}
            badge={clinic.isOpen 
              ? { text: language === 'ru' ? 'Открыто' : 'Open', className: 'bg-green-500 text-white' }
              : { text: language === 'ru' ? 'Закрыто' : 'Closed', className: 'bg-muted text-muted-foreground' }
            }
            tags={clinic.languages}
            onClick={() => navigate(`/medical/clinic/${clinic.id}`)}
          />
        ))}
      </div>
    </MiniAppLayout>
  );
}