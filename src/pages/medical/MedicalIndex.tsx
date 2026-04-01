/**
 * MedicalIndex — MiniAppLayout + CatalogCard
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stethoscope, Phone, ShieldAlert } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useClinics } from '@/hooks/useClinics';
import { MiniAppLayout } from '@/components/miniapp/MiniAppLayout';
import { CatalogCard } from '@/components/miniapp/CatalogCard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/uno/EmptyState';
import { mapClinicToCatalogCard } from '@/lib/adapters/catalogCardAdapters';

const SPECIALTIES = [
  { id: 'all', labelEn: 'All', labelRu: 'Все' },
  { id: 'general', labelEn: 'General', labelRu: 'Терапевт' },
  { id: 'dental', labelEn: 'Dental', labelRu: 'Стоматолог' },
  { id: 'cardio', labelEn: 'Cardio', labelRu: 'Кардиолог' },
  { id: 'pediatric', labelEn: 'Pediatric', labelRu: 'Педиатр' },
  { id: 'eye', labelEn: 'Eye', labelRu: 'Офтальмолог' },
];

function isClinicOpen(workingHours: Record<string, string>, is24h: boolean): boolean {
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
  return currentMinutes >= openH * 60 + openM && currentMinutes <= closeH * 60 + closeM;
}

export default function MedicalIndex() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');
  const isRu = language === 'ru';

  const { clinics, isLoading } = useClinics({
    specialty: selectedSpecialty,
    searchQuery: '',
  });

  const emergencyBanner = (
    <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/30">
      <div className="flex items-center gap-2 mb-1">
        <ShieldAlert className="w-4 h-4 text-destructive shrink-0" />
        <span className="text-sm font-semibold text-destructive">{isRu ? 'Скорая помощь' : 'Emergency'}</span>
      </div>
      <p className="text-xs text-muted-foreground mb-2">
        {isRu ? 'Для экстренной медицинской помощи звоните 1669' : 'For medical emergencies call 1669'}
      </p>
      <Button
        variant="destructive"
        size="sm"
        className="text-xs"
        onClick={() => window.location.href = 'tel:1669'}
      >
        <Phone className="w-3 h-3 mr-1" />
        1669
      </Button>
    </div>
  );

  return (
    <MiniAppLayout
      title={isRu ? 'Медицина' : 'Healthcare'}
      subtitle={`${clinics.length} ${isRu ? 'клиник' : 'clinics'}`}
      fallbackPath="/discover"
      categories={SPECIALTIES}
      selectedCategory={selectedSpecialty}
      onCategoryChange={setSelectedSpecialty}
      showHero={false}
      showSearch={false}
      showFilter={false}
      quickActions={emergencyBanner}
    >
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-[4/3] rounded-xl" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      ) : clinics.length === 0 ? (
        <EmptyState
          icon={Stethoscope}
          title={isRu ? 'Клиники не найдены' : 'No clinics found'}
          description={isRu ? 'Попробуйте изменить фильтры' : 'Try adjusting your filters'}
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {clinics.map(clinic => {
            const openNow = isClinicOpen(
              (clinic.working_hours as Record<string, string>) || {},
              clinic.is_24h ?? false
            );
            return (
              <CatalogCard key={clinic.id} {...mapClinicToCatalogCard(clinic, language, navigate, openNow)} />
            );
          })}
        </div>
      )}
    </MiniAppLayout>
  );
}
