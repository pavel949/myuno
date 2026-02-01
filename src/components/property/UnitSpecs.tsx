import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Badge } from '@/components/ui/badge';
import { 
  Layers, Eye, Sofa, Tv, WashingMachine, Refrigerator, 
  Microwave, Coffee, Wind, LockKeyhole, Car, Waves, TreePine,
  ArrowUpDown, Ruler, Building2
} from 'lucide-react';
import { 
  VIEW_TYPES, 
  FURNISHING_LEVELS, 
  getAmenityIcon, 
  normalizeAmenityId 
} from '@/lib/propertyTaxonomy';

interface UnitSpecsProps {
  // Multi-unit fields
  floor?: number;
  unitNumber?: string;
  // Standalone fields
  totalFloors?: number;
  plotSizeSqm?: number;
  hasElevator?: boolean;
  parkingType?: string;
  poolType?: string;
  gardenType?: string;
  // Common fields
  viewType?: string;
  furnishingLevel?: string;
  equipment?: string[];
  propertyType?: string;
  className?: string;
}

// Property type categories
const STANDALONE_TYPES = ['villa', 'house', 'townhouse'];

// View type labels derived from taxonomy
const viewTypeLabels: Record<string, { en: string; ru: string }> = Object.fromEntries(
  VIEW_TYPES.map(v => [v.id, { en: v.labelEn, ru: v.labelRu }])
);

// Furnishing labels derived from taxonomy
const furnishingLabels: Record<string, { en: string; ru: string }> = Object.fromEntries(
  FURNISHING_LEVELS.map(f => [f.id, { en: f.labelEn, ru: f.labelRu }])
);

const parkingTypeLabels: Record<string, { en: string; ru: string }> = {
  garage: { en: 'Garage', ru: 'Гараж' },
  carport: { en: 'Carport', ru: 'Навес' },
  open: { en: 'Open Parking', ru: 'Открытая парковка' },
  street: { en: 'Street Parking', ru: 'Уличная' },
  none: { en: 'No Parking', ru: 'Нет' },
};

const poolTypeLabels: Record<string, { en: string; ru: string }> = {
  private: { en: 'Private Pool', ru: 'Частный бассейн' },
  infinity: { en: 'Infinity Pool', ru: 'Инфинити' },
  plunge: { en: 'Plunge Pool', ru: 'Плунж' },
  shared: { en: 'Shared Pool', ru: 'Общий бассейн' },
  none: { en: 'No Pool', ru: 'Нет' },
};

const gardenTypeLabels: Record<string, { en: string; ru: string }> = {
  private: { en: 'Private Garden', ru: 'Частный сад' },
  tropical: { en: 'Tropical Garden', ru: 'Тропический' },
  shared: { en: 'Shared Garden', ru: 'Общий сад' },
  rooftop: { en: 'Rooftop', ru: 'Крыша' },
  courtyard: { en: 'Courtyard', ru: 'Двор' },
  none: { en: 'No Garden', ru: 'Нет' },
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
  totalFloors,
  plotSizeSqm,
  hasElevator,
  parkingType,
  poolType,
  gardenType,
  viewType, 
  furnishingLevel, 
  equipment,
  propertyType,
  className 
}: UnitSpecsProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  
  // Handle null/undefined equipment from database
  const safeEquipment = equipment ?? [];
  const isStandalone = STANDALONE_TYPES.includes(propertyType || '');

  const hasAnyData = floor !== undefined || unitNumber || viewType || furnishingLevel || 
    safeEquipment.length > 0 || totalFloors !== undefined || plotSizeSqm !== undefined ||
    parkingType || poolType || gardenType;
  
  if (!hasAnyData) return null;

  return (
    <div className={className}>
      {/* Unit/Property identifier */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        {/* Multi-unit: Floor and Unit Number */}
        {!isStandalone && floor !== undefined && (
          <Badge variant="outline" className="gap-1">
            <Building2 className="h-3 w-3" />
            {isRu ? `${floor} этаж` : `Floor ${floor}`}
          </Badge>
        )}
        {!isStandalone && unitNumber && (
          <Badge variant="outline">
            {isRu ? `Кв. ${unitNumber}` : `Unit ${unitNumber}`}
          </Badge>
        )}

        {/* Standalone: Building characteristics */}
        {isStandalone && totalFloors !== undefined && (
          <Badge variant="outline" className="gap-1">
            <ArrowUpDown className="h-3 w-3" />
            {isRu ? `${totalFloors} этаж${totalFloors > 1 ? 'а' : ''}` : `${totalFloors} floor${totalFloors > 1 ? 's' : ''}`}
          </Badge>
        )}
        {isStandalone && plotSizeSqm !== undefined && (
          <Badge variant="outline" className="gap-1">
            <Ruler className="h-3 w-3" />
            {plotSizeSqm} {isRu ? 'м² участок' : 'm² plot'}
          </Badge>
        )}
        {isStandalone && hasElevator && (
          <Badge variant="outline" className="gap-1">
            <Layers className="h-3 w-3" />
            {isRu ? 'Лифт' : 'Elevator'}
          </Badge>
        )}

        {/* Standalone: Pool, Parking, Garden */}
        {isStandalone && poolType && poolType !== 'none' && poolTypeLabels[poolType] && (
          <Badge variant="secondary" className="gap-1">
            <Waves className="h-3 w-3" />
            {isRu ? poolTypeLabels[poolType].ru : poolTypeLabels[poolType].en}
          </Badge>
        )}
        {isStandalone && parkingType && parkingType !== 'none' && parkingTypeLabels[parkingType] && (
          <Badge variant="secondary" className="gap-1">
            <Car className="h-3 w-3" />
            {isRu ? parkingTypeLabels[parkingType].ru : parkingTypeLabels[parkingType].en}
          </Badge>
        )}
        {isStandalone && gardenType && gardenType !== 'none' && gardenTypeLabels[gardenType] && (
          <Badge variant="secondary" className="gap-1">
            <TreePine className="h-3 w-3" />
            {isRu ? gardenTypeLabels[gardenType].ru : gardenTypeLabels[gardenType].en}
          </Badge>
        )}

        {/* Common: View and Furnishing */}
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
      {safeEquipment.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {safeEquipment.map((item) => (
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
