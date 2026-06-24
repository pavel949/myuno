/**
 * ThaiServicesIndex — B2C catalogue for Thai local businesses.
 *
 * Feature-flag gated (`thai_business_layer`). Uses MiniAppLayout's built-in
 * search + category rail + List/Map toggle; renders filter chips + business
 * cards as children. Chat opens in a bottom sheet.
 */
import { useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Store } from 'lucide-react';
import { MiniAppLayout, type MiniAppCategory } from '@/components/miniapp/MiniAppLayout';
import { Skeleton } from '@/components/ui/skeleton';
import { useFeatureFlag } from '@/hooks/useFeatureFlags';
import { useLanguage } from '@/contexts/LanguageContext';
import { pickLang } from '@/lib/i18n/pickLang';
import { APP_ROUTES } from '@/lib/config/routes';
import { useThaiBusinesses, type ThaiBusinessFilters } from '@/hooks/thaiServices/useThaiServices';
import { thaiBusinessesToMarkers } from '@/lib/thaiServices/mapMarkerAdapter';
import { ThaiBusinessCard } from '@/components/thaiServices/ThaiBusinessCard';
import { ThaiChatSheet } from '@/components/thaiServices/ThaiChatSheet';
import {
  THAI_CATEGORIES, THAI_DISTRICTS, THAI_PAYMENT_METHODS,
  type ThaiBusiness, type ThaiCategory, type ThaiDistrict, type ThaiPaymentMethod,
} from '@/types/thaiBusiness';
import { cn } from '@/lib/utils';

export default function ThaiServicesIndex() {
  const enabled = useFeatureFlag('THAI_BUSINESS_LAYER');
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<ThaiCategory | null>(null);
  const [district, setDistrict] = useState<ThaiDistrict | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<ThaiPaymentMethod | null>(null);
  const [thaiOwnedOnly, setThaiOwnedOnly] = useState(false);
  const [chatBusiness, setChatBusiness] = useState<ThaiBusiness | null>(null);

  const filters: ThaiBusinessFilters = { category, district, paymentMethod, thaiOwnedOnly, search };
  const { data: businesses = [], isLoading } = useThaiBusinesses(filters);

  const markers = useMemo(() => thaiBusinessesToMarkers(businesses), [businesses]);
  const categories: MiniAppCategory[] = useMemo(
    () => [
      { id: 'all', labelEn: 'All', labelRu: 'Все', labelTh: 'ทั้งหมด', icon: 'store' },
      ...THAI_CATEGORIES.map((c) => ({ id: c.id, labelEn: c.en, labelRu: c.ru, labelTh: c.th, icon: c.icon })),
    ],
    [],
  );

  if (!enabled) return <Navigate to={APP_ROUTES.DISCOVER} replace />;

  return (
    <MiniAppLayout
      title={t('thai.title')}
      subtitle={t('thai.subtitle')}
      heroIcon={Store}
      showHero={false}
      showSearch
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder={t('thai.search.placeholder')}
      categories={categories}
      selectedCategory={category ?? 'all'}
      onCategoryChange={(id) => setCategory(id === 'all' ? null : (id as ThaiCategory))}
      mapMarkers={markers}
      onMapMarkerSelect={(id) => navigate(APP_ROUTES.THAI_SERVICES_DETAIL(id))}
      mapIconChar="🏪"
      isLoading={isLoading}
      resultsCount={businesses.length}
    >
      {/* Secondary filter chips */}
      <div className="flex flex-wrap gap-2 mb-4">
        <FilterChips
          value={district}
          options={THAI_DISTRICTS.map((d) => ({ id: d, label: d }))}
          onChange={(v) => setDistrict(v as ThaiDistrict | null)}
          allLabel={t('thai.filter.allDistricts')}
        />
        <FilterChips
          value={paymentMethod}
          options={THAI_PAYMENT_METHODS.map((p) => ({ id: p.id, label: pickLang(language, p) }))}
          onChange={(v) => setPaymentMethod(v as ThaiPaymentMethod | null)}
          allLabel={t('thai.filter.payment')}
        />
        <button
          type="button"
          onClick={() => setThaiOwnedOnly((v) => !v)}
          className={cn(
            'text-xs rounded-full border px-3 py-1.5',
            thaiOwnedOnly ? 'border-primary bg-primary/10 text-primary' : 'border-border text-foreground',
          )}
        >
          {t('thai.filter.thaiOwnedOnly')}
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-64" />)}
        </div>
      ) : businesses.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">{t('thai.empty')}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {businesses.map((b) => (
            <ThaiBusinessCard key={b.id} business={b} onMessage={setChatBusiness} />
          ))}
        </div>
      )}

      {chatBusiness && (
        <ThaiChatSheet
          businessId={chatBusiness.id}
          businessName={chatBusiness.name_ru || chatBusiness.name_th}
          open={!!chatBusiness}
          onOpenChange={(o) => !o && setChatBusiness(null)}
        />
      )}
    </MiniAppLayout>
  );
}

function FilterChips({
  value, options, onChange, allLabel,
}: {
  value: string | null;
  options: { id: string; label: string }[];
  onChange: (v: string | null) => void;
  allLabel: string;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <Chip active={value === null} onClick={() => onChange(null)}>{allLabel}</Chip>
      {options.map((o) => (
        <Chip key={o.id} active={value === o.id} onClick={() => onChange(value === o.id ? null : o.id)}>
          {o.label}
        </Chip>
      ))}
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'text-xs rounded-full border px-3 py-1.5',
        active ? 'border-primary bg-primary/10 text-primary' : 'border-border text-foreground',
      )}
    >
      {children}
    </button>
  );
}
