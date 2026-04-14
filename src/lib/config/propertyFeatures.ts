/**
 * Comprehensive Property Features Taxonomy
 * 
 * Grouped by category for the property editor / wizard.
 * The search ribbon (PROPERTY_CATEGORIES) stays compact — this is the full catalog.
 * IDs are stable slugs stored in properties.highlights (string[]).
 */

import {
  Waves, Footprints, Eye, Mountain, TreePine, Building, Compass,
  Droplets, Lock, Infinity as InfinityIcon, Sparkles, Bath,
  Wifi, AirVent, WashingMachine, Tv, Monitor, UtensilsCrossed,
  Coffee, Shield, BedDouble, ShowerHead,
  Car, Fence, Trees, Sun, Flame, CloudRain,
  Cctv, KeyRound, Fingerprint, DoorOpen,
  Dumbbell, Flower2, Thermometer, PersonStanding,
  Baby, PawPrint, Gamepad2,
  Gem, Leaf, Hammer, Paintbrush, Palmtree, Minimize,
  Brush, ConciergeBell, Plane, Sandwich, Shirt,
  MapPin, ShoppingBag, Heart, GraduationCap, Navigation,
} from 'lucide-react';

export interface PropertyFeature {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  labelEn: string;
  labelRu: string;
}

export interface PropertyFeatureGroup {
  groupId: string;
  labelEn: string;
  labelRu: string;
  features: PropertyFeature[];
}

export const PROPERTY_FEATURE_GROUPS: PropertyFeatureGroup[] = [
  {
    groupId: 'location_views',
    labelEn: 'Location & Views',
    labelRu: 'Расположение и вид',
    features: [
      { id: 'beachfront', icon: Waves, labelEn: 'Beachfront', labelRu: 'На пляже' },
      { id: 'walk_to_beach', icon: Footprints, labelEn: 'Walk to beach', labelRu: 'Пешком до пляжа' },
      { id: 'sea_view', icon: Eye, labelEn: 'Sea view', labelRu: 'Вид на море' },
      { id: 'mountain_view', icon: Mountain, labelEn: 'Mountain view', labelRu: 'Вид на горы' },
      { id: 'garden_view', icon: TreePine, labelEn: 'Garden view', labelRu: 'Вид на сад' },
      { id: 'city_view', icon: Building, labelEn: 'City view', labelRu: 'Вид на город' },
      { id: 'lake_view', icon: Compass, labelEn: 'Lake / river view', labelRu: 'Вид на озеро / реку' },
      { id: 'panoramic_view', icon: Eye, labelEn: 'Panoramic view', labelRu: 'Панорамный вид' },
    ],
  },
  {
    groupId: 'pool_water',
    labelEn: 'Pool & Water',
    labelRu: 'Бассейн и вода',
    features: [
      { id: 'private_pool', icon: Lock, labelEn: 'Private pool', labelRu: 'Свой бассейн' },
      { id: 'pool', icon: Droplets, labelEn: 'Shared pool', labelRu: 'Общий бассейн' },
      { id: 'infinity_pool', icon: InfinityIcon, labelEn: 'Infinity pool', labelRu: 'Инфинити-бассейн' },
      { id: 'rooftop_pool', icon: Droplets, labelEn: 'Rooftop pool', labelRu: 'Бассейн на крыше' },
      { id: 'jacuzzi', icon: Bath, labelEn: 'Jacuzzi / Hot tub', labelRu: 'Джакузи' },
      { id: 'plunge_pool', icon: Droplets, labelEn: 'Plunge pool', labelRu: 'Погружной бассейн' },
      { id: 'kids_pool', icon: Baby, labelEn: 'Kids pool', labelRu: 'Детский бассейн' },
    ],
  },
  {
    groupId: 'indoor',
    labelEn: 'Indoor Amenities',
    labelRu: 'Внутренние удобства',
    features: [
      { id: 'wifi', icon: Wifi, labelEn: 'WiFi', labelRu: 'WiFi' },
      { id: 'air_conditioning', icon: AirVent, labelEn: 'Air conditioning', labelRu: 'Кондиционер' },
      { id: 'washer', icon: WashingMachine, labelEn: 'Washing machine', labelRu: 'Стиральная машина' },
      { id: 'dryer', icon: WashingMachine, labelEn: 'Dryer', labelRu: 'Сушильная машина' },
      { id: 'dishwasher', icon: UtensilsCrossed, labelEn: 'Dishwasher', labelRu: 'Посудомоечная машина' },
      { id: 'smart_tv', icon: Tv, labelEn: 'Smart TV', labelRu: 'Smart TV' },
      { id: 'workspace', icon: Monitor, labelEn: 'Work space', labelRu: 'Рабочее место' },
      { id: 'fully_equipped_kitchen', icon: UtensilsCrossed, labelEn: 'Full kitchen', labelRu: 'Полная кухня' },
      { id: 'coffee_machine', icon: Coffee, labelEn: 'Coffee machine', labelRu: 'Кофемашина' },
      { id: 'safe', icon: Shield, labelEn: 'Safe', labelRu: 'Сейф' },
      { id: 'king_bed', icon: BedDouble, labelEn: 'King-size bed', labelRu: 'Кровать king-size' },
      { id: 'bathtub', icon: Bath, labelEn: 'Bathtub', labelRu: 'Ванна' },
      { id: 'rain_shower', icon: ShowerHead, labelEn: 'Rain shower', labelRu: 'Тропический душ' },
      { id: 'iron', icon: Shirt, labelEn: 'Iron', labelRu: 'Утюг' },
    ],
  },
  {
    groupId: 'outdoor',
    labelEn: 'Outdoor & Parking',
    labelRu: 'Территория и парковка',
    features: [
      { id: 'parking', icon: Car, labelEn: 'Parking', labelRu: 'Парковка' },
      { id: 'garage', icon: Car, labelEn: 'Garage', labelRu: 'Гараж' },
      { id: 'garden', icon: Trees, labelEn: 'Garden', labelRu: 'Сад' },
      { id: 'terrace', icon: Sun, labelEn: 'Terrace', labelRu: 'Терраса' },
      { id: 'balcony', icon: Fence, labelEn: 'Balcony', labelRu: 'Балкон' },
      { id: 'rooftop', icon: Sun, labelEn: 'Rooftop area', labelRu: 'Зона на крыше' },
      { id: 'bbq', icon: Flame, labelEn: 'BBQ / Grill', labelRu: 'Барбекю / Гриль' },
      { id: 'outdoor_shower', icon: CloudRain, labelEn: 'Outdoor shower', labelRu: 'Уличный душ' },
      { id: 'sun_loungers', icon: Sun, labelEn: 'Sun loungers', labelRu: 'Шезлонги' },
      { id: 'tropical_garden', icon: Palmtree, labelEn: 'Tropical garden', labelRu: 'Тропический сад' },
    ],
  },
  {
    groupId: 'security',
    labelEn: 'Security & Access',
    labelRu: 'Безопасность и доступ',
    features: [
      { id: 'gated_community', icon: Fence, labelEn: 'Gated community', labelRu: 'Закрытая территория' },
      { id: 'cctv', icon: Cctv, labelEn: 'CCTV', labelRu: 'Видеонаблюдение' },
      { id: 'security_24h', icon: Shield, labelEn: '24h security', labelRu: 'Охрана 24/7' },
      { id: 'smart_lock', icon: Fingerprint, labelEn: 'Smart lock', labelRu: 'Умный замок' },
      { id: 'keypad_entry', icon: KeyRound, labelEn: 'Keypad entry', labelRu: 'Кодовый замок' },
      { id: 'elevator', icon: DoorOpen, labelEn: 'Elevator', labelRu: 'Лифт' },
    ],
  },
  {
    groupId: 'wellness',
    labelEn: 'Wellness & Sport',
    labelRu: 'Спорт и SPA',
    features: [
      { id: 'gym', icon: Dumbbell, labelEn: 'Gym', labelRu: 'Тренажёрный зал' },
      { id: 'spa', icon: Flower2, labelEn: 'Spa', labelRu: 'Спа' },
      { id: 'sauna', icon: Thermometer, labelEn: 'Sauna / Steam', labelRu: 'Сауна / хаммам' },
      { id: 'yoga_space', icon: PersonStanding, labelEn: 'Yoga area', labelRu: 'Зона для йоги' },
      { id: 'tennis', icon: Gamepad2, labelEn: 'Tennis court', labelRu: 'Теннисный корт' },
    ],
  },
  {
    groupId: 'family_pets',
    labelEn: 'Family & Pets',
    labelRu: 'Семья и питомцы',
    features: [
      { id: 'kid_friendly', icon: Baby, labelEn: 'Kid-friendly', labelRu: 'Для детей' },
      { id: 'pet_friendly', icon: PawPrint, labelEn: 'Pet-friendly', labelRu: 'Можно с питомцами' },
      { id: 'baby_crib', icon: Baby, labelEn: 'Baby crib', labelRu: 'Детская кроватка' },
      { id: 'high_chair', icon: Baby, labelEn: 'High chair', labelRu: 'Детский стульчик' },
      { id: 'playground', icon: Gamepad2, labelEn: 'Playground', labelRu: 'Игровая площадка' },
    ],
  },
  {
    groupId: 'character',
    labelEn: 'Property Character',
    labelRu: 'Характер объекта',
    features: [
      { id: 'luxury', icon: Gem, labelEn: 'Luxury', labelRu: 'Люкс' },
      { id: 'eco_friendly', icon: Leaf, labelEn: 'Eco-friendly', labelRu: 'Эко-дружественный' },
      { id: 'new_build', icon: Hammer, labelEn: 'New build', labelRu: 'Новострой' },
      { id: 'renovated', icon: Paintbrush, labelEn: 'Renovated', labelRu: 'Отремонтирован' },
      { id: 'traditional_thai', icon: Palmtree, labelEn: 'Thai style', labelRu: 'Тайский стиль' },
      { id: 'modern_design', icon: Sparkles, labelEn: 'Modern design', labelRu: 'Современный дизайн' },
      { id: 'minimalist', icon: Minimize, labelEn: 'Minimalist', labelRu: 'Минимализм' },
    ],
  },
  {
    groupId: 'services',
    labelEn: 'Services Included',
    labelRu: 'Включённые услуги',
    features: [
      { id: 'daily_cleaning', icon: Brush, labelEn: 'Daily cleaning', labelRu: 'Ежедневная уборка' },
      { id: 'weekly_cleaning', icon: Brush, labelEn: 'Weekly cleaning', labelRu: 'Еженедельная уборка' },
      { id: 'concierge', icon: ConciergeBell, labelEn: 'Concierge', labelRu: 'Консьерж' },
      { id: 'airport_transfer', icon: Plane, labelEn: 'Airport transfer', labelRu: 'Трансфер' },
      { id: 'breakfast', icon: Sandwich, labelEn: 'Breakfast included', labelRu: 'Завтрак включён' },
      { id: 'laundry_service', icon: Shirt, labelEn: 'Laundry service', labelRu: 'Услуга стирки' },
    ],
  },
  {
    groupId: 'nearby',
    labelEn: 'Nearby',
    labelRu: 'Рядом',
    features: [
      { id: 'near_restaurants', icon: MapPin, labelEn: 'Restaurants nearby', labelRu: 'Рестораны рядом' },
      { id: 'near_shopping', icon: ShoppingBag, labelEn: 'Shopping nearby', labelRu: 'Магазины рядом' },
      { id: 'near_hospital', icon: Heart, labelEn: 'Hospital nearby', labelRu: 'Больница рядом' },
      { id: 'near_school', icon: GraduationCap, labelEn: 'School nearby', labelRu: 'Школа рядом' },
      { id: 'near_airport', icon: Navigation, labelEn: 'Airport nearby', labelRu: 'Аэропорт рядом' },
      { id: 'golf_nearby', icon: MapPin, labelEn: 'Golf nearby', labelRu: 'Гольф рядом' },
    ],
  },
];

/** Flat list of all features for quick lookup */
export const ALL_PROPERTY_FEATURES: PropertyFeature[] = PROPERTY_FEATURE_GROUPS.flatMap(g => g.features);

/** Lookup map id → feature */
export const PROPERTY_FEATURE_MAP = new Map(ALL_PROPERTY_FEATURES.map(f => [f.id, f]));
