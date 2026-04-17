import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Layers, Eye, Sofa, Tv, WashingMachine, Refrigerator, 
  Microwave, Coffee, Wind, LockKeyhole, Car, Waves, TreePine,
  ArrowUpDown, Ruler, Building2, Wifi, UtensilsCrossed, Flame,
  ShowerHead, BedDouble, Shirt, DoorOpen, Dumbbell, Baby,
  Sun, ParkingMeter, Shield, Moon, Blinds, ChevronDown, ChevronUp
} from 'lucide-react';
import { 
  VIEW_TYPES, 
  FURNISHING_LEVELS,
  getAmenityById,
  getAmenityIcon,
} from '@/lib/taxonomies';
import { normalizeEquipmentId } from '@/lib/propertyAttributeRegistry';
import { normalizeFurnishingLevel } from '@/lib/propertyFormNormalizers';
import { resolveIcon } from '@/lib/iconMap';
import { PropertyAttributeChip } from '@/components/property/PropertyAttributeChip';

interface UnitSpecsProps {
  floor?: number;
  unitNumber?: string;
  totalFloors?: number;
  plotSizeSqm?: number;
  hasElevator?: boolean;
  parkingType?: string;
  poolType?: string;
  gardenType?: string;
  viewTypes?: string[];
  furnishingLevel?: string;
  equipment?: string[];
  propertyType?: string;
  className?: string;
}

const STANDALONE_TYPES = ['villa', 'house', 'townhouse'];

const viewTypeLabels: Record<string, { en: string; ru: string }> = Object.fromEntries(
  VIEW_TYPES.map(v => [v.id, { en: v.labelEn, ru: v.labelRu }])
);

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

// ============= COMPREHENSIVE EQUIPMENT LABELS =============
interface EquipmentMeta {
  en: string;
  ru: string;
  icon: React.ReactNode;
  group: 'connectivity' | 'climate' | 'kitchen' | 'bathroom' | 'bedroom' | 'laundry' | 'living' | 'outdoor' | 'fitness' | 'kids' | 'parking' | 'safety' | 'other';
}

const GROUP_LABELS: Record<string, { en: string; ru: string }> = {
  connectivity: { en: 'Connectivity', ru: 'Связь' },
  climate: { en: 'Climate', ru: 'Климат' },
  kitchen: { en: 'Kitchen', ru: 'Кухня' },
  bathroom: { en: 'Bathroom', ru: 'Ванная' },
  bedroom: { en: 'Bedroom', ru: 'Спальня' },
  laundry: { en: 'Laundry', ru: 'Стирка' },
  living: { en: 'Living', ru: 'Гостиная' },
  outdoor: { en: 'Outdoor', ru: 'На улице' },
  fitness: { en: 'Fitness', ru: 'Фитнес' },
  kids: { en: 'For kids', ru: 'Для детей' },
  parking: { en: 'Parking', ru: 'Парковка' },
  safety: { en: 'Safety', ru: 'Безопасность' },
  other: { en: 'Other', ru: 'Прочее' },
};

const ICON_SIZE = "h-4 w-4";

const EQUIPMENT_META: Record<string, EquipmentMeta> = {
  // Connectivity
  wifi: { en: 'WiFi', ru: 'WiFi', icon: <Wifi className={ICON_SIZE} />, group: 'connectivity' },
  
  // Climate
  ac: { en: 'Air Conditioning', ru: 'Кондиционер', icon: <Wind className={ICON_SIZE} />, group: 'climate' },
  fan: { en: 'Fan', ru: 'Вентилятор', icon: <Wind className={ICON_SIZE} />, group: 'climate' },
  heater: { en: 'Heater', ru: 'Обогреватель', icon: <Flame className={ICON_SIZE} />, group: 'climate' },
  
  // Kitchen
  kitchen: { en: 'Full Kitchen', ru: 'Полная кухня', icon: <UtensilsCrossed className={ICON_SIZE} />, group: 'kitchen' },
  fridge: { en: 'Refrigerator', ru: 'Холодильник', icon: <Refrigerator className={ICON_SIZE} />, group: 'kitchen' },
  microwave: { en: 'Microwave', ru: 'Микроволновка', icon: <Microwave className={ICON_SIZE} />, group: 'kitchen' },
  oven: { en: 'Oven', ru: 'Духовка', icon: <Flame className={ICON_SIZE} />, group: 'kitchen' },
  stove: { en: 'Stove', ru: 'Плита', icon: <Flame className={ICON_SIZE} />, group: 'kitchen' },
  coffee_machine: { en: 'Coffee Machine', ru: 'Кофемашина', icon: <Coffee className={ICON_SIZE} />, group: 'kitchen' },
  kettle: { en: 'Kettle', ru: 'Чайник', icon: <Coffee className={ICON_SIZE} />, group: 'kitchen' },
  toaster: { en: 'Toaster', ru: 'Тостер', icon: <UtensilsCrossed className={ICON_SIZE} />, group: 'kitchen' },
  dishes: { en: 'Dishes & Cutlery', ru: 'Посуда и приборы', icon: <UtensilsCrossed className={ICON_SIZE} />, group: 'kitchen' },
  wine_glasses: { en: 'Wine Glasses', ru: 'Бокалы для вина', icon: <UtensilsCrossed className={ICON_SIZE} />, group: 'kitchen' },
  cookware: { en: 'Cookware', ru: 'Кухонная утварь', icon: <UtensilsCrossed className={ICON_SIZE} />, group: 'kitchen' },
  dining_table: { en: 'Dining Table', ru: 'Обеденный стол', icon: <UtensilsCrossed className={ICON_SIZE} />, group: 'kitchen' },
  dishwasher: { en: 'Dishwasher', ru: 'Посудомоечная машина', icon: <UtensilsCrossed className={ICON_SIZE} />, group: 'kitchen' },
  blender: { en: 'Blender', ru: 'Блендер', icon: <UtensilsCrossed className={ICON_SIZE} />, group: 'kitchen' },
  rice_cooker: { en: 'Rice Cooker', ru: 'Рисоварка', icon: <UtensilsCrossed className={ICON_SIZE} />, group: 'kitchen' },
  water_filter: { en: 'Water Filter', ru: 'Фильтр для воды', icon: <UtensilsCrossed className={ICON_SIZE} />, group: 'kitchen' },
  
  // Bathroom
  hot_water: { en: 'Hot Water', ru: 'Горячая вода', icon: <ShowerHead className={ICON_SIZE} />, group: 'bathroom' },
  towels: { en: 'Towels', ru: 'Полотенца', icon: <ShowerHead className={ICON_SIZE} />, group: 'bathroom' },
  hair_dryer: { en: 'Hair Dryer', ru: 'Фен', icon: <Wind className={ICON_SIZE} />, group: 'bathroom' },
  bathtub: { en: 'Bathtub', ru: 'Ванна', icon: <ShowerHead className={ICON_SIZE} />, group: 'bathroom' },
  bidet: { en: 'Bidet', ru: 'Биде', icon: <ShowerHead className={ICON_SIZE} />, group: 'bathroom' },
  toiletries: { en: 'Toiletries', ru: 'Туалетные принадлежности', icon: <ShowerHead className={ICON_SIZE} />, group: 'bathroom' },
  steam_room: { en: 'Steam Room', ru: 'Хамам', icon: <ShowerHead className={ICON_SIZE} />, group: 'bathroom' },
  
  // Bedroom
  bed_linens: { en: 'Bed Linens', ru: 'Постельное бельё', icon: <BedDouble className={ICON_SIZE} />, group: 'bedroom' },
  extra_pillows: { en: 'Extra Pillows', ru: 'Доп. подушки', icon: <BedDouble className={ICON_SIZE} />, group: 'bedroom' },
  blackout_curtains: { en: 'Blackout Curtains', ru: 'Шторы блэкаут', icon: <Blinds className={ICON_SIZE} />, group: 'bedroom' },
  hangers: { en: 'Hangers', ru: 'Вешалки', icon: <Shirt className={ICON_SIZE} />, group: 'bedroom' },
  closet: { en: 'Closet', ru: 'Шкаф', icon: <DoorOpen className={ICON_SIZE} />, group: 'bedroom' },
  
  // Laundry
  washer: { en: 'Washing Machine', ru: 'Стиральная машина', icon: <WashingMachine className={ICON_SIZE} />, group: 'laundry' },
  dryer: { en: 'Dryer', ru: 'Сушильная машина', icon: <WashingMachine className={ICON_SIZE} />, group: 'laundry' },
  iron: { en: 'Iron', ru: 'Утюг', icon: <Shirt className={ICON_SIZE} />, group: 'laundry' },
  ironing_board: { en: 'Ironing Board', ru: 'Гладильная доска', icon: <Shirt className={ICON_SIZE} />, group: 'laundry' },
  
  // Living
  tv: { en: 'TV', ru: 'Телевизор', icon: <Tv className={ICON_SIZE} />, group: 'living' },
  smart_tv: { en: 'Smart TV', ru: 'Smart TV', icon: <Tv className={ICON_SIZE} />, group: 'living' },
  netflix: { en: 'Netflix', ru: 'Netflix', icon: <Tv className={ICON_SIZE} />, group: 'living' },
  bluetooth_speaker: { en: 'Bluetooth Speaker', ru: 'Bluetooth-колонка', icon: <Tv className={ICON_SIZE} />, group: 'living' },
  safe: { en: 'Safe', ru: 'Сейф', icon: <LockKeyhole className={ICON_SIZE} />, group: 'living' },
  desk: { en: 'Work Desk', ru: 'Рабочий стол', icon: <Sofa className={ICON_SIZE} />, group: 'living' },
  sofa: { en: 'Sofa', ru: 'Диван', icon: <Sofa className={ICON_SIZE} />, group: 'living' },
  
  // Outdoor
  balcony: { en: 'Balcony', ru: 'Балкон', icon: <Sun className={ICON_SIZE} />, group: 'outdoor' },
  terrace: { en: 'Terrace', ru: 'Терраса', icon: <Sun className={ICON_SIZE} />, group: 'outdoor' },
  private_pool: { en: 'Private Pool', ru: 'Частный бассейн', icon: <Waves className={ICON_SIZE} />, group: 'outdoor' },
  garden: { en: 'Garden', ru: 'Сад', icon: <TreePine className={ICON_SIZE} />, group: 'outdoor' },
  bbq: { en: 'BBQ', ru: 'Барбекю', icon: <Flame className={ICON_SIZE} />, group: 'outdoor' },
  outdoor_furniture: { en: 'Outdoor Furniture', ru: 'Уличная мебель', icon: <Sofa className={ICON_SIZE} />, group: 'outdoor' },
  outdoor_shower: { en: 'Outdoor Shower', ru: 'Уличный душ', icon: <ShowerHead className={ICON_SIZE} />, group: 'outdoor' },
  sun_loungers: { en: 'Sun Loungers', ru: 'Шезлонги', icon: <Sun className={ICON_SIZE} />, group: 'outdoor' },
  
  // Fitness
  gym: { en: 'Gym', ru: 'Тренажёрный зал', icon: <Dumbbell className={ICON_SIZE} />, group: 'fitness' },
  weights: { en: 'Weights', ru: 'Гантели', icon: <Dumbbell className={ICON_SIZE} />, group: 'fitness' },
  treadmill: { en: 'Treadmill', ru: 'Беговая дорожка', icon: <Dumbbell className={ICON_SIZE} />, group: 'fitness' },
  exercise_bike: { en: 'Exercise Bike', ru: 'Велотренажёр', icon: <Dumbbell className={ICON_SIZE} />, group: 'fitness' },
  yoga_mat: { en: 'Yoga Mat', ru: 'Коврик для йоги', icon: <Dumbbell className={ICON_SIZE} />, group: 'fitness' },
  
  // Kids
  crib: { en: 'Crib', ru: 'Детская кроватка', icon: <Baby className={ICON_SIZE} />, group: 'kids' },
  high_chair: { en: 'High Chair', ru: 'Детский стульчик', icon: <Baby className={ICON_SIZE} />, group: 'kids' },
  baby_bath: { en: 'Baby Bath', ru: 'Детская ванночка', icon: <Baby className={ICON_SIZE} />, group: 'kids' },
  toys: { en: 'Toys', ru: 'Игрушки', icon: <Baby className={ICON_SIZE} />, group: 'kids' },
  
  // Parking
  free_parking: { en: 'Free Parking', ru: 'Бесплатная парковка', icon: <Car className={ICON_SIZE} />, group: 'parking' },
  covered_parking: { en: 'Covered Parking', ru: 'Крытая парковка', icon: <Car className={ICON_SIZE} />, group: 'parking' },
  garage: { en: 'Garage', ru: 'Гараж', icon: <Car className={ICON_SIZE} />, group: 'parking' },
  
  // Safety
  smoke_detector: { en: 'Smoke Detector', ru: 'Датчик дыма', icon: <Shield className={ICON_SIZE} />, group: 'safety' },
  fire_extinguisher: { en: 'Fire Extinguisher', ru: 'Огнетушитель', icon: <Shield className={ICON_SIZE} />, group: 'safety' },
  first_aid: { en: 'First Aid Kit', ru: 'Аптечка', icon: <Shield className={ICON_SIZE} />, group: 'safety' },
  security_camera: { en: 'Security Camera', ru: 'Камера наблюдения', icon: <Shield className={ICON_SIZE} />, group: 'safety' },
  elevator_access: { en: 'Elevator', ru: 'Лифт', icon: <Layers className={ICON_SIZE} />, group: 'safety' },
  
  // Other
  long_term_stays: { en: 'Long-term stays', ru: 'Долгосрочная аренда', icon: <Moon className={ICON_SIZE} />, group: 'other' },
  pet_friendly: { en: 'Pet Friendly', ru: 'Можно с питомцами', icon: <Sun className={ICON_SIZE} />, group: 'other' },
};

// Group order for display
const GROUP_ORDER = ['connectivity', 'climate', 'kitchen', 'bathroom', 'bedroom', 'laundry', 'living', 'outdoor', 'fitness', 'kids', 'parking', 'safety', 'other'];

export function UnitSpecs({ 
  floor, 
  unitNumber, 
  totalFloors,
  plotSizeSqm,
  hasElevator,
  parkingType,
  poolType,
  gardenType,
  viewTypes = [], 
  furnishingLevel, 
  equipment,
  propertyType,
  className 
}: UnitSpecsProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const [showAll, setShowAll] = useState(false);
  
  const safeEquipment = equipment ?? [];
  const isStandalone = STANDALONE_TYPES.includes(propertyType || '');
  const normalizedFurnishingLevel = normalizeFurnishingLevel(furnishingLevel);

  const hasPropertyBadges = floor !== undefined || unitNumber || viewTypes.length > 0 || normalizedFurnishingLevel || 
    totalFloors !== undefined || plotSizeSqm !== undefined ||
    parkingType || poolType || gardenType;

  const hasAnyData = hasPropertyBadges || safeEquipment.length > 0;
  
  if (!hasAnyData) return null;

  // Group equipment by category (canonical snake_case keys)
  const grouped: Record<string, string[]> = {};
  safeEquipment.forEach((item) => {
    const key = normalizeEquipmentId(item);
    const meta = EQUIPMENT_META[key] ?? EQUIPMENT_META[item];
    const group = meta?.group || 'other';
    if (!grouped[group]) grouped[group] = [];
    if (!grouped[group].includes(key)) grouped[group].push(key);
  });

  const orderedGroups = GROUP_ORDER.filter(g => grouped[g]?.length);
  const COLLAPSED_GROUPS = 3;
  const visibleGroups = showAll ? orderedGroups : orderedGroups.slice(0, COLLAPSED_GROUPS);
  const hiddenCount = orderedGroups.length - COLLAPSED_GROUPS;

  return (
    <div className={className}>
      {/* Property badges */}
      {hasPropertyBadges && (
        <div className="flex flex-wrap items-center gap-2 mb-4">
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
          {viewTypes
            .filter((viewType) => viewTypeLabels[viewType])
            .map((viewType) => (
              <Badge key={viewType} variant="secondary" className="gap-1">
                <Eye className="h-3 w-3" />
                {isRu ? viewTypeLabels[viewType].ru : viewTypeLabels[viewType].en}
              </Badge>
            ))}
          {normalizedFurnishingLevel && furnishingLabels[normalizedFurnishingLevel] && (
            <Badge className="gap-1 bg-primary/10 text-primary border-primary/20">
              <Sofa className="h-3 w-3" />
              {isRu ? furnishingLabels[normalizedFurnishingLevel].ru : furnishingLabels[normalizedFurnishingLevel].en}
            </Badge>
          )}
        </div>
      )}

      {/* Grouped Equipment */}
      {safeEquipment.length > 0 && (
        <div className="space-y-4">
          {visibleGroups.map(groupKey => (
            <div key={groupKey}>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                {isRu ? GROUP_LABELS[groupKey].ru : GROUP_LABELS[groupKey].en}
              </h4>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                {grouped[groupKey].map((item) => {
                  const meta = EQUIPMENT_META[item];
                  if (meta) {
                    return (
                      <PropertyAttributeChip
                        key={item}
                        icon={<span className="text-muted-foreground shrink-0">{meta.icon}</span>}
                      >
                        <span>{isRu ? meta.ru : meta.en}</span>
                      </PropertyAttributeChip>
                    );
                  }
                  const fromTaxonomy = getAmenityById(item);
                  const label = fromTaxonomy
                    ? (isRu ? fromTaxonomy.labelRu : fromTaxonomy.labelEn)
                    : item.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
                  const IconComponent = resolveIcon(getAmenityIcon(item));
                  return (
                    <PropertyAttributeChip
                      key={item}
                      icon={
                        <span className="text-muted-foreground shrink-0">
                          <IconComponent className={ICON_SIZE} />
                        </span>
                      }
                    >
                      <span>{label}</span>
                    </PropertyAttributeChip>
                  );
                })}
              </div>
            </div>
          ))}

          {hiddenCount > 0 && !showAll && (
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-1"
              onClick={() => setShowAll(true)}
            >
              {isRu ? `Показать ещё ${hiddenCount} категорий` : `Show ${hiddenCount} more categories`}
              <ChevronDown className="h-4 w-4" />
            </Button>
          )}
          {showAll && orderedGroups.length > COLLAPSED_GROUPS && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full gap-1"
              onClick={() => setShowAll(false)}
            >
              {isRu ? 'Свернуть' : 'Show less'}
              <ChevronUp className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
