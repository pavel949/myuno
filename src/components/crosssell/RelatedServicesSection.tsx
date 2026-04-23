import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRelatedEntities, type RelatedEntity } from '@/hooks/useRelatedEntities';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { cn } from '@/lib/utils';

interface RelatedServicesCardProps {
  entity: RelatedEntity;
  index: number;
}

const RelatedServicesCard = memo(function RelatedServicesCard({ entity, index }: RelatedServicesCardProps) {
  const navigate = useNavigate();
  const { language } = useLanguage();

  const formatPrice = (price: number | null) => {
    if (!price) return null;
    return `฿${price.toLocaleString()}`;
  };

  return (
    <motion.button
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.08, duration: 0.3 }}
      onClick={() => navigate(entity.path)}
      className="flex-shrink-0 w-[200px] bg-card border border-border rounded-none overflow-hidden hover:shadow-lg hover:border-primary/30 transition-all duration-200 text-left snap-start"
    >
      {/* Image */}
      <div className="relative h-[120px] w-full overflow-hidden">
        {entity.image ? (
          <OptimizedImage
            src={entity.image}
            alt={entity.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <span className="text-muted-foreground text-xs">No image</span>
          </div>
        )}
        {entity.rating && entity.rating > 0 && (
          <div className="absolute top-2 right-2 flex items-center gap-0.5 bg-background/80 text-foreground text-xs px-1.5 py-0.5 rounded-full backdrop-blur-sm">
            <Star className="w-3 h-3 fill-accent text-accent" />
            {entity.rating.toFixed(1)}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        <h4 className="font-medium text-sm text-foreground line-clamp-1">
          {entity.title}
        </h4>
        <div className="flex items-center justify-between mt-2">
          {entity.price && (
            <span className="text-sm font-semibold text-primary">
              {formatPrice(entity.price)}
            </span>
          )}
          <span className="text-xs text-primary font-medium flex items-center gap-0.5 ml-auto">
            {language === 'ru' ? entity.ctaRu : entity.ctaEn}
            <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </motion.button>
  );
});

interface RelatedServicesSectionProps {
  currentVertical: string;
  className?: string;
  title?: {
    en: string;
    ru: string;
  };
}

export const RelatedServicesSection = memo(function RelatedServicesSection({
  currentVertical,
  className,
  title,
}: RelatedServicesSectionProps) {
  const { language } = useLanguage();
  const { data: entities, isLoading } = useRelatedEntities(currentVertical);

  if (isLoading || !entities || entities.length === 0) return null;

  const sectionTitle = title || {
    en: 'Complete Your Day',
    ru: 'Дополните ваш день',
  };

  return (
    <section className={cn('py-6', className)}>
      <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
        <span className="text-lg">✨</span>
        {language === 'ru' ? sectionTitle.ru : sectionTitle.en}
      </h3>

      <div className="flex gap-3 pb-2 overflow-x-auto scrollbar-hide -mx-4 px-4 touch-pan-y snap-x snap-proximity">
        {entities.map((entity, index) => (
          <RelatedServicesCard
            key={`${entity.vertical}-${entity.id}`}
            entity={entity}
            index={index}
          />
        ))}
      </div>
    </section>
  );
});
