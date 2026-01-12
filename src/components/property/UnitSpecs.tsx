import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Badge } from '@/components/ui/badge';
import { 
  Layers, Eye, Sofa, Tv, WashingMachine, Refrigerator, 
  Microwave, Coffee, Wind, LockKeyhole
} from 'lucide-react';

interface UnitSpecsProps {
  floor?: number;
  unitNumber?: string;
  viewType?: string;
  furnishingLevel?: string;
  equipment?: string[];
  className?: string;
}

const viewTypeLabels: Record<string, { en: string; ru: string }> = {
  sea: { en: 'Sea View', ru: 'Вид на море' },
  pool: { en: 'Pool View', ru: 'Вид на бассейн' },
  garden: { en: 'Garden View', ru: 'Вид на сад' },
  mountain: { en: 'Mountain View', ru: 'Вид на горы' },
  city: { en: 'City View', ru: 'Вид на город' },
  parking: { en: 'Parking View', ru: 'Вид на парковку' },
  interior: { en: 'Interior View', ru: 'Внутренний вид' },
};

const furnishingLabels: Record<string, { en: string; ru: string }> = {
  unfurnished: { en: 'Unfurnished', ru: 'Без мебели' },
  partially: { en: 'Partially Furnished', ru: 'Частичная меблировка' },
  fully: { en: 'Fully Furnished', ru: 'Полная меблировка' },
  luxury: { en: 'Luxury Furnished', ru: 'Люкс меблировка' },
};

const equipmentIcons: Record<string, React.ReactNode> = {
  tv: <Tv className="h-3.5 w-3.5" />,
  washer: <WashingMachine className="h-3.5 w-3.5" />,
  fridge: <Refrigerator className="h-3.5 w-3.5" />,
  microwave: <Microwave className="h-3.5 w-3.5" />,
  coffee_machine: <Coffee className="h-3.5 w-3.5" />,
  ac: <Wind className="h-3.5 w-3.5" />,
  safe: <LockKeyhole className="h-3.5 w-3.5" />,
};

const equipmentLabels: Record<string, { en: string; ru: string }> = {
  tv: { en: 'TV', ru: 'Телевизор' },
  washer: { en: 'Washing Machine', ru: 'Стиральная машина' },
  dryer: { en: 'Dryer', ru: 'Сушильная машина' },
  dishwasher: { en: 'Dishwasher', ru: 'Посудомоечная машина' },
  fridge: { en: 'Refrigerator', ru: 'Холодильник' },
  microwave: { en: 'Microwave', ru: 'Микроволновка' },
  oven: { en: 'Oven', ru: 'Духовка' },
  coffee_machine: { en: 'Coffee Machine', ru: 'Кофемашина' },
  iron: { en: 'Iron', ru: 'Утюг' },
  hair_dryer: { en: 'Hair Dryer', ru: 'Фен' },
  safe: { en: 'Safe', ru: 'Сейф' },
  ac: { en: 'Air Conditioning', ru: 'Кондиционер' },
};

export function UnitSpecs({ 
  floor, 
  unitNumber, 
  viewType, 
  furnishingLevel, 
  equipment = [],
  className 
}: UnitSpecsProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const hasAnyData = floor !== undefined || unitNumber || viewType || furnishingLevel || equipment.length > 0;
  
  if (!hasAnyData) return null;

  return (
    <div className={className}>
      {/* Unit identifier */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        {floor !== undefined && (
          <Badge variant="outline" className="gap-1">
            <Layers className="h-3 w-3" />
            {isRu ? `${floor} этаж` : `Floor ${floor}`}
          </Badge>
        )}
        {unitNumber && (
          <Badge variant="outline">
            {isRu ? `Кв. ${unitNumber}` : `Unit ${unitNumber}`}
          </Badge>
        )}
        {viewType && viewTypeLabels[viewType] && (
          <Badge variant="secondary" className="gap-1">
            <Eye className="h-3 w-3" />
            {isRu ? viewTypeLabels[viewType].ru : viewTypeLabels[viewType].en}
          </Badge>
        )}
        {furnishingLevel && furnishingLabels[furnishingLevel] && (
          <Badge className="gap-1 bg-primary/10 text-primary border-primary/20">
            <Sofa className="h-3 w-3" />
            {isRu ? furnishingLabels[furnishingLevel].ru : furnishingLabels[furnishingLevel].en}
          </Badge>
        )}
      </div>

      {/* Equipment */}
      {equipment.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {equipment.map((item) => (
            <span
              key={item}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md bg-muted text-muted-foreground"
            >
              {equipmentIcons[item]}
              {equipmentLabels[item]
                ? (isRu ? equipmentLabels[item].ru : equipmentLabels[item].en)
                : item}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
