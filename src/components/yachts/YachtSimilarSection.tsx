import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { ItemCard } from '@/components/miniapp';
import { mapYachtToCardProps } from '@/lib/adapters/yachtAdapters';
import type { Yacht } from '@/hooks/useYachts';

interface YachtSimilarSectionProps {
  currentYacht: Yacht;
  allYachts: Yacht[];
}

export function YachtSimilarSection({ currentYacht, allYachts }: YachtSimilarSectionProps) {
  const navigate = useNavigate();
  const { language } = useLanguage();

  // Same type, has pricing, different id, prefer similar price range
  const similar = allYachts
    .filter(y =>
      y.id !== currentYacht.id &&
      (y.price_full_day || y.price_half_day) &&
      (y.yacht_type === currentYacht.yacht_type || 
       Math.abs((y.length_meters || 0) - (currentYacht.length_meters || 0)) < 10)
    )
    .sort((a, b) => {
      // Prefer same type first
      const aTypeMatch = a.yacht_type === currentYacht.yacht_type ? 0 : 1;
      const bTypeMatch = b.yacht_type === currentYacht.yacht_type ? 0 : 1;
      if (aTypeMatch !== bTypeMatch) return aTypeMatch - bTypeMatch;
      // Then by price similarity
      const refPrice = currentYacht.price_full_day || currentYacht.price_half_day || 0;
      const aDiff = Math.abs((a.price_full_day || a.price_half_day || 0) - refPrice);
      const bDiff = Math.abs((b.price_full_day || b.price_half_day || 0) - refPrice);
      return aDiff - bDiff;
    })
    .slice(0, 4);

  if (similar.length === 0) return null;

  return (
    <div className="mb-32">
      <h3 className="font-semibold text-lg mb-4">
        {language === 'ru' ? 'Похожие яхты' : 'Similar Yachts'}
      </h3>
      <div className="grid gap-4">
        {similar.map((y) => {
          const card = mapYachtToCardProps(y, language);
          return (
            <ItemCard
              key={y.id}
              title={card.title}
              image={card.image}
              price={card.price || 0}
              priceLabel={card.priceLabel}
              rating={card.rating}
              reviewCount={card.reviewCount}
              location={card.location}
              meta={card.meta.map(m => ({ icon: m.icon, value: m.label }))}
              tags={card.tags}
              isFeatured={card.isFeatured}
              isVerified={card.isVerified}
              onClick={() => navigate(`/yachts/${y.id}`)}
            />
          );
        })}
      </div>
    </div>
  );
}
