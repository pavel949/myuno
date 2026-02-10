/**
 * MedicalIndex — Airbnb-style medical catalog
 */
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stethoscope, Star, MapPin, Phone, ShieldAlert, MessageCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { CatalogHeader } from '@/components/shared/CatalogHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/uno/EmptyState';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { useClinics } from '@/hooks/useClinics';
import { cn } from '@/lib/utils';

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
  const { currencyInfo } = useCurrency();
  const navigate = useNavigate();
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const isRu = language === 'ru';

  const { clinics, isLoading } = useClinics({
    specialty: selectedSpecialty,
    searchQuery,
  });

  const categories = SPECIALTIES.map(c => ({ id: c.id, label: isRu ? c.labelRu : c.labelEn }));

  return (
    <AppLayout showHeader={false} showBottomNav>
      <CatalogHeader
        title={isRu ? 'Медицина' : 'Healthcare'}
        subtitle={`${clinics.length} ${isRu ? 'клиник' : 'clinics'}`}
        fallbackPath="/discover"
        categories={categories}
        selectedCategory={selectedSpecialty}
        onCategoryChange={setSelectedSpecialty}
      />

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-4 pb-24 space-y-4">
        {/* Emergency banner */}
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
              const name = isRu ? clinic.name_ru : clinic.name_en;
              const openNow = isClinicOpen(
                (clinic.working_hours as Record<string, string>) || {},
                clinic.is_24h ?? false
              );
              return (
                <div
                  key={clinic.id}
                  className="cursor-pointer group"
                  onClick={() => navigate(`/medical/${clinic.id}`)}
                >
                  <div className="relative aspect-[4/3] rounded-xl overflow-hidden mb-2">
                    <OptimizedImage
                      src={clinic.cover_image || 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=400'}
                      alt={name}
                      width={400}
                      height={300}
                      className="w-full h-full group-hover:scale-105 transition-transform duration-300"
                      quality={80}
                    />
                    {clinic.is_24h && (
                      <Badge className="absolute top-2 left-2 bg-green-600 text-white text-[10px]">24/7</Badge>
                    )}
                    {openNow && !clinic.is_24h && (
                      <Badge className="absolute top-2 left-2 bg-green-600/90 text-white text-[10px]">
                        {isRu ? 'Открыто' : 'Open'}
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center justify-between gap-1">
                      <h3 className="font-semibold text-sm truncate">{name}</h3>
                      {(clinic.rating ?? 0) > 0 && (
                        <span className="flex items-center gap-0.5 text-xs font-medium shrink-0">
                          <Star className="w-3 h-3 fill-foreground" />
                          {clinic.rating?.toFixed(1)}
                        </span>
                      )}
                    </div>
                    {clinic.address && (
                      <p className="text-xs text-muted-foreground flex items-center gap-0.5 truncate">
                        <MapPin className="w-3 h-3 shrink-0" />
                        {clinic.address}
                      </p>
                    )}
                    {clinic.languages?.includes('Russian') && (
                      <p className="text-xs text-primary flex items-center gap-0.5">
                        <MessageCircle className="w-3 h-3" />
                        {isRu ? 'Русскоговорящий персонал' : 'Russian-speaking staff'}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
