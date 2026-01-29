import { useLanguage } from '@/contexts/LanguageContext';
import { useProductAttributes, getAttributeLabel } from '@/hooks/useProductAttributes';
import { Badge } from '@/components/ui/badge';
import { Leaf, Thermometer, MapPin, Tag } from 'lucide-react';

interface ProductAttributesProps {
  productId: string;
  compact?: boolean;
}

const ATTRIBUTE_ICONS: Record<string, React.ReactNode> = {
  organic: <Leaf className="w-3.5 h-3.5" />,
  storage: <Thermometer className="w-3.5 h-3.5" />,
  origin: <MapPin className="w-3.5 h-3.5" />,
  brand: <Tag className="w-3.5 h-3.5" />,
};

export function ProductAttributes({ productId, compact = false }: ProductAttributesProps) {
  const { language } = useLanguage();
  const { attributes, isLoading } = useProductAttributes(productId);

  if (isLoading || attributes.length === 0) return null;

  if (compact) {
    return (
      <div className="flex flex-wrap gap-1.5">
        {attributes.slice(0, 3).map((attr) => (
          <Badge 
            key={attr.key} 
            variant="secondary" 
            className="text-xs font-normal gap-1"
          >
            {ATTRIBUTE_ICONS[attr.key]}
            {attr.value}
          </Badge>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-sm text-foreground">
        {language === 'ru' ? 'Характеристики' : 'Specifications'}
      </h3>
      <div className="grid grid-cols-2 gap-2 text-sm">
        {attributes.map((attr) => (
          <div 
            key={attr.key} 
            className="flex items-start gap-2 p-2 rounded-lg bg-muted/50"
          >
            <span className="text-muted-foreground shrink-0 mt-0.5">
              {ATTRIBUTE_ICONS[attr.key] || <Tag className="w-3.5 h-3.5" />}
            </span>
            <div className="min-w-0">
              <div className="text-muted-foreground text-xs">
                {getAttributeLabel(attr.key, language as 'en' | 'ru')}
              </div>
              <div className="font-medium truncate">{attr.value}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
