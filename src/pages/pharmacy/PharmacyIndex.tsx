/**
 * PharmacyIndex — migrated to UnifiedCatalogShell.
 * Provides search, filters, list/map toggle, URL state out of the box.
 */
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePharmacies } from '@/hooks/usePharmacy';
import { Pill } from 'lucide-react';
import { ItemCard } from '@/components/miniapp';
import { UnifiedCatalogShell } from '@/components/catalog';
import { PLACEHOLDER_IMAGES } from '@/lib/config/placeholders';
import { withGeoSection, pharmacyFilterConfig } from '@/components/filters';
import { rowToMarker } from '@/lib/adapters/mapMarkerAdapter';

const PHARMACY_CATEGORIES = [
  { id: 'all', labelEn: 'All Pharmacies', labelRu: 'Все аптеки' },
  { id: '24h', labelEn: '24/7 Open', labelRu: 'Круглосуточные' },
  { id: 'delivery', labelEn: 'With Delivery', labelRu: 'С доставкой' },
];

export default function PharmacyIndex() {
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const { pharmacies, isLoading } = usePharmacies();
  const isRu = language === 'ru';

  return (
    <UnifiedCatalogShell
      title={isRu ? 'Аптеки' : 'Pharmacies'}
      fallbackPath="/discover"
      items={pharmacies}
      isLoading={isLoading}
      categories={PHARMACY_CATEGORIES}
      filterConfig={withGeoSection(pharmacyFilterConfig)}
      searchPlaceholder={isRu ? 'Найти аптеку...' : 'Search pharmacies...'}
      mapIconChar="P"
      onMarkerSelect={(id) => navigate(`/pharmacy/${id}`)}
      toMarker={(p) =>
        rowToMarker({
          id: p.id,
          lat: p.lat,
          lng: p.lng,
          name_en: p.name_en,
          name_ru: p.name_ru,
          rating: p.rating,
          cover_image: p.cover_image,
        })
      }
      applyFilters={(items, { search, category, filters }) => {
        const q = search.trim().toLowerCase();
        return items.filter((pharmacy) => {
          // category
          const matchesCategory =
            category === 'all' ||
            (category === '24h' && pharmacy.is_24h) ||
            (category === 'delivery' && pharmacy.delivery_available);
          if (!matchesCategory) return false;

          // search
          if (q) {
            const hay = `${pharmacy.name_en} ${pharmacy.name_ru} ${pharmacy.address ?? ''}`.toLowerCase();
            if (!hay.includes(q)) return false;
          }

          // feature filters
          const features = filters.features as string[] | undefined;
          if (features?.length) {
            if (features.includes('24h') && !pharmacy.is_24h) return false;
            if (features.includes('delivery') && !pharmacy.delivery_available) return false;
            if (features.includes('pharmacist') && !pharmacy.has_pharmacist) return false;
            if (features.includes('verified') && !pharmacy.is_verified) return false;
          }

          // rating filter
          const ratingFilter = filters.rating as string | undefined;
          if (ratingFilter) {
            const minRating = parseFloat(ratingFilter);
            if ((pharmacy.rating || 0) < minRating) return false;
          }

          return true;
        });
      }}
      emptyIcon={Pill}
      emptyText={t('pharmacy.noPharmaciesFound')}
      renderItem={(pharmacy) => (
        <ItemCard
          image={pharmacy.cover_image || PLACEHOLDER_IMAGES.pharmacy}
          title={isRu ? pharmacy.name_ru : pharmacy.name_en}
          rating={pharmacy.rating ?? undefined}
          reviewCount={pharmacy.review_count ?? undefined}
          location={pharmacy.address ?? undefined}
          isVerified={pharmacy.is_verified ?? undefined}
          badge={
            pharmacy.is_24h
              ? { text: '24/7', className: 'bg-success text-white' }
              : undefined
          }
          tags={[
            ...(pharmacy.delivery_available ? [t('pharmacy.delivery')] : []),
            ...(pharmacy.has_pharmacist ? [t('pharmacy.consultation')] : []),
          ]}
          onClick={() => navigate(`/pharmacy/${pharmacy.id}`)}
        />
      )}
    />
  );
}
