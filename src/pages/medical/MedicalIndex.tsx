/**
 * MedicalIndex — Airbnb-style medical catalog
 */
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stethoscope, Star, MapPin, Phone, ShieldAlert, MessageCircle, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { BackButton } from '@/components/uno/BackButton';
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

  return (
    <AppLayout showHeader={false} showBottomNav>
      {/* Sticky header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <BackButton fallbackPath="/discover" variant="ghost" size="sm" />
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold truncate">{isRu ? 'Медицина' : 'Healthcare'}</h1>
            <p className="text-xs text-muted-foreground">{clinics.length} {isRu ? 'клиник' : 'clinics'}</p>
          </div>
        </div>

        {/* Specialty ribbon */}
        <div className="max-w-7xl mx-auto px-4 pb-2.5 flex gap-2 overflow-x-auto scrollbar-hide">
          {SPECIALTIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedSpecialty(cat.id)}
              className={cn(
                "px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border",
                selectedSpecialty === cat.id
                  ? "bg-foreground text-background border-foreground"
                  : "bg-secondary text-foreground border-border hover:border-foreground/30"
              )}
            >
              {isRu ? cat.labelRu : cat.labelEn}
            </button>
          ))}
        </div>
      </header>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-4 pb-24 space-y-4">
        {/* Emergency banner */}
        <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-sm text-destructive">
                {isRu ? 'Экстренная помощь' : 'Emergency'}
              </p>
              <p className="text-xs text-muted-foreground">
                {isRu ? 'Скорая — 1669' : 'Ambulance — 1669'}
              </p>
            </div>
            <Button variant="destructive" size="sm" className="gap-1" asChild>
              <a href="tel:1669">
                <Phone className="w-4 h-4" />
                1669
              </a>
            </Button>
          </div>
        </div>

        {/* Clinics grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
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
              const isOpen = isClinicOpen(clinic.working_hours || {}, clinic.is_24h);
              return (
                <div
                  key={clinic.id}
                  className="cursor-pointer group"
                  onClick={() => navigate(`/medical/clinic/${clinic.id}`)}
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
                    <Badge className={cn(
                      "absolute top-2 left-2 text-[10px]",
                      isOpen
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    )}>
                      {isOpen ? (isRu ? 'Открыто' : 'Open') : (isRu ? 'Закрыто' : 'Closed')}
                    </Badge>
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center justify-between gap-1">
                      <h3 className="font-semibold text-sm truncate">{name}</h3>
                      {clinic.rating > 0 && (
                        <span className="flex items-center gap-0.5 text-xs font-medium shrink-0">
                          <Star className="w-3 h-3 fill-foreground" />
                          {clinic.rating.toFixed(1)}
                        </span>
                      )}
                    </div>
                    {clinic.languages?.length > 0 && (
                      <p className="text-xs text-muted-foreground truncate">
                        {clinic.languages.slice(0, 3).join(' · ')}
                      </p>
                    )}
                    {clinic.district && (
                      <p className="text-xs text-muted-foreground flex items-center gap-0.5">
                        <MapPin className="w-3 h-3 shrink-0" />
                        {clinic.district}
                      </p>
                    )}
                    {clinic.consultation_price > 0 && (
                      <p className="text-sm font-semibold">
                        {isRu ? 'от' : 'from'} {currencyInfo.symbol}{clinic.consultation_price}
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
