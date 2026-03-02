import React, { useState, memo } from 'react';
import { resolveIcon } from '@/lib/iconMap';
import { useLanguage } from '@/contexts/LanguageContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Switch } from '@/components/ui/switch';
import { 
  Layers, Eye, Sofa, ChevronDown, ChevronUp,
  Tv, WashingMachine, Refrigerator, Microwave, Coffee,
  Wind, Wifi, Car, UtensilsCrossed, Bath, Bed, 
  Baby, Briefcase, Gamepad2, Dumbbell, Thermometer,
  Lock, ShieldCheck, Flame, Waves, Sun, TreePine,
  Music, Monitor, Printer, Fan, Snowflake, Heater,
  Cigarette, Dog, Accessibility, PartyPopper,
  Building2, Home, Ruler, ArrowUpDown
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Property type categories
const STANDALONE_TYPES = ['villa', 'house', 'townhouse'];
const MULTI_UNIT_TYPES = ['apartment', 'condo', 'studio', 'penthouse'];

interface UnitFieldsProps {
  propertyType?: string;
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
  // Multi-unit handlers
  onFloorChange?: (floor: number | undefined) => void;
  onUnitNumberChange?: (unitNumber: string) => void;
  // Standalone handlers
  onTotalFloorsChange?: (floors: number | undefined) => void;
  onPlotSizeChange?: (size: number | undefined) => void;
  onHasElevatorChange?: (hasElevator: boolean) => void;
  onParkingTypeChange?: (type: string) => void;
  onPoolTypeChange?: (type: string) => void;
  onGardenTypeChange?: (type: string) => void;
  // Common handlers
  onViewTypeChange: (viewType: string) => void;
  onFurnishingLevelChange: (level: string) => void;
  onEquipmentChange: (equipment: string[]) => void;
}

const viewTypes = [
  { id: 'sea', labelEn: 'Sea View', labelRu: 'Вид на море' },
  { id: 'pool', labelEn: 'Pool View', labelRu: 'Вид на бассейн' },
  { id: 'garden', labelEn: 'Garden View', labelRu: 'Вид на сад' },
  { id: 'mountain', labelEn: 'Mountain View', labelRu: 'Вид на горы' },
  { id: 'city', labelEn: 'City View', labelRu: 'Вид на город' },
  { id: 'parking', labelEn: 'Parking View', labelRu: 'Вид на парковку' },
  { id: 'interior', labelEn: 'Interior View', labelRu: 'Внутренний вид' },
  // Additional views for standalone properties
  { id: 'panoramic', labelEn: 'Panoramic View', labelRu: 'Панорамный вид' },
  { id: 'jungle', labelEn: 'Jungle / Forest View', labelRu: 'Вид на джунгли' },
];

const furnishingLevels = [
  { id: 'unfurnished', labelEn: 'Unfurnished', labelRu: 'Без мебели' },
  { id: 'partially', labelEn: 'Partially Furnished', labelRu: 'Частичная меблировка' },
  { id: 'fully', labelEn: 'Fully Furnished', labelRu: 'Полная меблировка' },
  { id: 'luxury', labelEn: 'Luxury Furnished', labelRu: 'Люкс меблировка' },
];

// Options for standalone property characteristics
const parkingTypes = [
  { id: 'garage', labelEn: 'Private Garage', labelRu: 'Частный гараж' },
  { id: 'carport', labelEn: 'Carport', labelRu: 'Навес для авто' },
  { id: 'open', labelEn: 'Open Parking', labelRu: 'Открытая парковка' },
  { id: 'street', labelEn: 'Street Parking', labelRu: 'Уличная парковка' },
  { id: 'none', labelEn: 'No Parking', labelRu: 'Нет парковки' },
];

const poolTypes = [
  { id: 'private', labelEn: 'Private Pool', labelRu: 'Частный бассейн' },
  { id: 'infinity', labelEn: 'Infinity Pool', labelRu: 'Инфинити-бассейн' },
  { id: 'plunge', labelEn: 'Plunge Pool', labelRu: 'Плунж-бассейн' },
  { id: 'shared', labelEn: 'Shared Pool', labelRu: 'Общий бассейн' },
  { id: 'none', labelEn: 'No Pool', labelRu: 'Нет бассейна' },
];

const gardenTypes = [
  { id: 'private', labelEn: 'Private Garden', labelRu: 'Частный сад' },
  { id: 'tropical', labelEn: 'Tropical Garden', labelRu: 'Тропический сад' },
  { id: 'shared', labelEn: 'Shared Garden', labelRu: 'Общий сад' },
  { id: 'rooftop', labelEn: 'Rooftop Terrace', labelRu: 'Терраса на крыше' },
  { id: 'courtyard', labelEn: 'Courtyard', labelRu: 'Внутренний двор' },
  { id: 'none', labelEn: 'No Garden', labelRu: 'Нет сада' },
];

// Airbnb-style amenity categories
interface AmenityItem {
  id: string;
  labelEn: string;
  labelRu: string;
  icon?: React.ReactNode;
}

interface AmenityCategory {
  id: string;
  labelEn: string;
  labelRu: string;
  icon: React.ReactNode;
  items: AmenityItem[];
}

const amenityCategories: AmenityCategory[] = [
  {
    id: 'essentials',
    labelEn: 'Essentials',
    labelRu: 'Основные удобства',
    icon: <Bed className="h-4 w-4" />,
    items: [
      { id: 'wifi', labelEn: 'WiFi', labelRu: 'WiFi', icon: <Wifi className="h-4 w-4" /> },
      { id: 'ac', labelEn: 'Air Conditioning', labelRu: 'Кондиционер', icon: <Snowflake className="h-4 w-4" /> },
      { id: 'heating', labelEn: 'Heating', labelRu: 'Отопление', icon: <Heater className="h-4 w-4" /> },
      { id: 'hot_water', labelEn: 'Hot Water', labelRu: 'Горячая вода', icon: <Thermometer className="h-4 w-4" /> },
      { id: 'towels', labelEn: 'Towels', labelRu: 'Полотенца' },
      { id: 'bed_linens', labelEn: 'Bed Linens', labelRu: 'Постельное бельё' },
      { id: 'extra_pillows', labelEn: 'Extra Pillows & Blankets', labelRu: 'Дополнительные подушки и одеяла' },
      { id: 'hangers', labelEn: 'Hangers', labelRu: 'Вешалки' },
      { id: 'iron', labelEn: 'Iron', labelRu: 'Утюг' },
      { id: 'closet', labelEn: 'Closet / Wardrobe', labelRu: 'Шкаф / Гардероб' },
    ]
  },
  {
    id: 'kitchen',
    labelEn: 'Kitchen & Dining',
    labelRu: 'Кухня и столовая',
    icon: <UtensilsCrossed className="h-4 w-4" />,
    items: [
      { id: 'kitchen', labelEn: 'Full Kitchen', labelRu: 'Полноценная кухня' },
      { id: 'kitchenette', labelEn: 'Kitchenette', labelRu: 'Мини-кухня' },
      { id: 'fridge', labelEn: 'Refrigerator', labelRu: 'Холодильник', icon: <Refrigerator className="h-4 w-4" /> },
      { id: 'freezer', labelEn: 'Freezer', labelRu: 'Морозильник' },
      { id: 'microwave', labelEn: 'Microwave', labelRu: 'Микроволновка', icon: <Microwave className="h-4 w-4" /> },
      { id: 'oven', labelEn: 'Oven', labelRu: 'Духовка' },
      { id: 'stove', labelEn: 'Stove', labelRu: 'Плита' },
      { id: 'induction', labelEn: 'Induction Cooktop', labelRu: 'Индукционная плита' },
      { id: 'dishwasher', labelEn: 'Dishwasher', labelRu: 'Посудомоечная машина' },
      { id: 'coffee_machine', labelEn: 'Coffee Machine', labelRu: 'Кофемашина', icon: <Coffee className="h-4 w-4" /> },
      { id: 'kettle', labelEn: 'Electric Kettle', labelRu: 'Электрочайник' },
      { id: 'toaster', labelEn: 'Toaster', labelRu: 'Тостер' },
      { id: 'blender', labelEn: 'Blender', labelRu: 'Блендер' },
      { id: 'rice_cooker', labelEn: 'Rice Cooker', labelRu: 'Рисоварка' },
      { id: 'dishes', labelEn: 'Dishes & Silverware', labelRu: 'Посуда и приборы' },
      { id: 'cookware', labelEn: 'Pots & Pans', labelRu: 'Кастрюли и сковородки' },
      { id: 'wine_glasses', labelEn: 'Wine Glasses', labelRu: 'Бокалы для вина' },
      { id: 'dining_table', labelEn: 'Dining Table', labelRu: 'Обеденный стол' },
      { id: 'bar_counter', labelEn: 'Bar Counter', labelRu: 'Барная стойка' },
    ]
  },
  {
    id: 'bathroom',
    labelEn: 'Bathroom',
    labelRu: 'Ванная комната',
    icon: <Bath className="h-4 w-4" />,
    items: [
      { id: 'bathtub', labelEn: 'Bathtub', labelRu: 'Ванна' },
      { id: 'shower', labelEn: 'Shower', labelRu: 'Душ' },
      { id: 'rain_shower', labelEn: 'Rain Shower', labelRu: 'Тропический душ' },
      { id: 'hair_dryer', labelEn: 'Hair Dryer', labelRu: 'Фен' },
      { id: 'shampoo', labelEn: 'Shampoo', labelRu: 'Шампунь' },
      { id: 'body_soap', labelEn: 'Body Soap', labelRu: 'Гель для душа' },
      { id: 'conditioner', labelEn: 'Conditioner', labelRu: 'Кондиционер для волос' },
      { id: 'bidet', labelEn: 'Bidet', labelRu: 'Биде' },
      { id: 'toilet_paper', labelEn: 'Toilet Paper', labelRu: 'Туалетная бумага' },
      { id: 'cleaning_supplies', labelEn: 'Cleaning Supplies', labelRu: 'Чистящие средства' },
    ]
  },
  {
    id: 'laundry',
    labelEn: 'Laundry',
    labelRu: 'Стирка',
    icon: <WashingMachine className="h-4 w-4" />,
    items: [
      { id: 'washer', labelEn: 'Washing Machine', labelRu: 'Стиральная машина' },
      { id: 'dryer', labelEn: 'Dryer', labelRu: 'Сушильная машина' },
      { id: 'washer_dryer', labelEn: 'Washer/Dryer Combo', labelRu: 'Стирально-сушильная машина' },
      { id: 'drying_rack', labelEn: 'Drying Rack', labelRu: 'Сушилка для белья' },
      { id: 'ironing_board', labelEn: 'Ironing Board', labelRu: 'Гладильная доска' },
      { id: 'laundry_detergent', labelEn: 'Laundry Detergent', labelRu: 'Стиральный порошок' },
    ]
  },
  {
    id: 'entertainment',
    labelEn: 'Entertainment',
    labelRu: 'Развлечения',
    icon: <Tv className="h-4 w-4" />,
    items: [
      { id: 'tv', labelEn: 'TV', labelRu: 'Телевизор', icon: <Tv className="h-4 w-4" /> },
      { id: 'smart_tv', labelEn: 'Smart TV', labelRu: 'Smart TV' },
      { id: 'netflix', labelEn: 'Netflix', labelRu: 'Netflix' },
      { id: 'youtube', labelEn: 'YouTube', labelRu: 'YouTube' },
      { id: 'cable_tv', labelEn: 'Cable TV', labelRu: 'Кабельное ТВ' },
      { id: 'sound_system', labelEn: 'Sound System', labelRu: 'Аудиосистема', icon: <Music className="h-4 w-4" /> },
      { id: 'bluetooth_speaker', labelEn: 'Bluetooth Speaker', labelRu: 'Bluetooth-колонка' },
      { id: 'game_console', labelEn: 'Game Console', labelRu: 'Игровая консоль', icon: <Gamepad2 className="h-4 w-4" /> },
      { id: 'books', labelEn: 'Books', labelRu: 'Книги' },
      { id: 'board_games', labelEn: 'Board Games', labelRu: 'Настольные игры' },
    ]
  },
  {
    id: 'workspace',
    labelEn: 'Work Space',
    labelRu: 'Рабочее место',
    icon: <Briefcase className="h-4 w-4" />,
    items: [
      { id: 'desk', labelEn: 'Dedicated Workspace', labelRu: 'Рабочее место' },
      { id: 'office_chair', labelEn: 'Ergonomic Chair', labelRu: 'Эргономичное кресло' },
      { id: 'monitor', labelEn: 'External Monitor', labelRu: 'Внешний монитор', icon: <Monitor className="h-4 w-4" /> },
      { id: 'printer', labelEn: 'Printer', labelRu: 'Принтер', icon: <Printer className="h-4 w-4" /> },
      { id: 'fast_wifi', labelEn: 'High-Speed WiFi (100+ Mbps)', labelRu: 'Скоростной WiFi (100+ Мбит/с)' },
    ]
  },
  {
    id: 'outdoor',
    labelEn: 'Outdoor & Views',
    labelRu: 'На свежем воздухе',
    icon: <Sun className="h-4 w-4" />,
    items: [
      { id: 'balcony', labelEn: 'Balcony', labelRu: 'Балкон' },
      { id: 'terrace', labelEn: 'Terrace', labelRu: 'Терраса' },
      { id: 'patio', labelEn: 'Patio', labelRu: 'Патио' },
      { id: 'garden', labelEn: 'Private Garden', labelRu: 'Частный сад', icon: <TreePine className="h-4 w-4" /> },
      { id: 'rooftop', labelEn: 'Rooftop Access', labelRu: 'Доступ на крышу' },
      { id: 'outdoor_furniture', labelEn: 'Outdoor Furniture', labelRu: 'Уличная мебель' },
      { id: 'bbq', labelEn: 'BBQ Grill', labelRu: 'Гриль / Барбекю', icon: <Flame className="h-4 w-4" /> },
      { id: 'outdoor_dining', labelEn: 'Outdoor Dining Area', labelRu: 'Зона для ужина на улице' },
      { id: 'sun_loungers', labelEn: 'Sun Loungers', labelRu: 'Шезлонги' },
      { id: 'hammock', labelEn: 'Hammock', labelRu: 'Гамак' },
    ]
  },
  {
    id: 'pool_spa',
    labelEn: 'Pool & Spa',
    labelRu: 'Бассейн и спа',
    icon: <Waves className="h-4 w-4" />,
    items: [
      { id: 'private_pool', labelEn: 'Private Pool', labelRu: 'Частный бассейн' },
      { id: 'infinity_pool', labelEn: 'Infinity Pool', labelRu: 'Инфинити-бассейн' },
      { id: 'plunge_pool', labelEn: 'Plunge Pool', labelRu: 'Плунж-бассейн' },
      { id: 'heated_pool', labelEn: 'Heated Pool', labelRu: 'Подогреваемый бассейн' },
      { id: 'jacuzzi', labelEn: 'Hot Tub / Jacuzzi', labelRu: 'Джакузи' },
      { id: 'sauna', labelEn: 'Sauna', labelRu: 'Сауна' },
      { id: 'steam_room', labelEn: 'Steam Room', labelRu: 'Хамам / Парная' },
    ]
  },
  {
    id: 'family',
    labelEn: 'Family',
    labelRu: 'Для семьи',
    icon: <Baby className="h-4 w-4" />,
    items: [
      { id: 'crib', labelEn: 'Crib / Baby Bed', labelRu: 'Детская кроватка' },
      { id: 'high_chair', labelEn: 'High Chair', labelRu: 'Детский стульчик' },
      { id: 'baby_bath', labelEn: 'Baby Bath', labelRu: 'Детская ванночка' },
      { id: 'baby_monitor', labelEn: 'Baby Monitor', labelRu: 'Видеоняня' },
      { id: 'kids_toys', labelEn: 'Kids Toys', labelRu: 'Детские игрушки' },
      { id: 'kids_books', labelEn: 'Kids Books', labelRu: 'Детские книги' },
      { id: 'child_safety', labelEn: 'Child Safety Gates', labelRu: 'Детские ворота безопасности' },
      { id: 'pool_fence', labelEn: 'Pool Fence', labelRu: 'Ограждение бассейна' },
    ]
  },
  {
    id: 'fitness',
    labelEn: 'Fitness',
    labelRu: 'Фитнес',
    icon: <Dumbbell className="h-4 w-4" />,
    items: [
      { id: 'home_gym', labelEn: 'Home Gym', labelRu: 'Домашний спортзал' },
      { id: 'yoga_mat', labelEn: 'Yoga Mat', labelRu: 'Коврик для йоги' },
      { id: 'weights', labelEn: 'Free Weights', labelRu: 'Свободные веса' },
      { id: 'exercise_bike', labelEn: 'Exercise Bike', labelRu: 'Велотренажёр' },
      { id: 'treadmill', labelEn: 'Treadmill', labelRu: 'Беговая дорожка' },
    ]
  },
  {
    id: 'parking',
    labelEn: 'Parking & Transport',
    labelRu: 'Парковка и транспорт',
    icon: <Car className="h-4 w-4" />,
    items: [
      { id: 'free_parking', labelEn: 'Free Parking', labelRu: 'Бесплатная парковка' },
      { id: 'paid_parking', labelEn: 'Paid Parking', labelRu: 'Платная парковка' },
      { id: 'garage', labelEn: 'Private Garage', labelRu: 'Частный гараж' },
      { id: 'covered_parking', labelEn: 'Covered Parking', labelRu: 'Крытая парковка' },
      { id: 'ev_charger', labelEn: 'EV Charger', labelRu: 'Зарядка для электромобиля' },
      { id: 'bicycles', labelEn: 'Bicycles', labelRu: 'Велосипеды' },
      { id: 'scooter', labelEn: 'Scooter / Motorbike', labelRu: 'Скутер / Мотобайк' },
    ]
  },
  {
    id: 'safety',
    labelEn: 'Safety & Security',
    labelRu: 'Безопасность',
    icon: <ShieldCheck className="h-4 w-4" />,
    items: [
      { id: 'safe', labelEn: 'Safe', labelRu: 'Сейф', icon: <Lock className="h-4 w-4" /> },
      { id: 'smoke_detector', labelEn: 'Smoke Detector', labelRu: 'Детектор дыма' },
      { id: 'carbon_detector', labelEn: 'Carbon Monoxide Detector', labelRu: 'Детектор угарного газа' },
      { id: 'fire_extinguisher', labelEn: 'Fire Extinguisher', labelRu: 'Огнетушитель' },
      { id: 'first_aid', labelEn: 'First Aid Kit', labelRu: 'Аптечка первой помощи' },
      { id: 'security_cameras', labelEn: 'Security Cameras (exterior)', labelRu: 'Камеры (снаружи)' },
      { id: 'smart_lock', labelEn: 'Smart Lock', labelRu: 'Умный замок' },
      { id: 'deadbolt', labelEn: 'Deadbolt Lock', labelRu: 'Замок-засов' },
    ]
  },
  {
    id: 'climate',
    labelEn: 'Climate Control',
    labelRu: 'Климат',
    icon: <Fan className="h-4 w-4" />,
    items: [
      { id: 'ceiling_fan', labelEn: 'Ceiling Fan', labelRu: 'Потолочный вентилятор', icon: <Fan className="h-4 w-4" /> },
      { id: 'portable_fan', labelEn: 'Portable Fan', labelRu: 'Переносной вентилятор' },
      { id: 'dehumidifier', labelEn: 'Dehumidifier', labelRu: 'Осушитель воздуха' },
      { id: 'humidifier', labelEn: 'Humidifier', labelRu: 'Увлажнитель воздуха' },
      { id: 'mosquito_net', labelEn: 'Mosquito Net', labelRu: 'Москитная сетка' },
      { id: 'blackout_curtains', labelEn: 'Blackout Curtains', labelRu: 'Светонепроницаемые шторы' },
    ]
  },
  {
    id: 'accessibility',
    labelEn: 'Accessibility',
    labelRu: 'Доступность',
    icon: <Accessibility className="h-4 w-4" />,
    items: [
      { id: 'elevator_access', labelEn: 'Elevator Access', labelRu: 'Доступ к лифту' },
      { id: 'step_free', labelEn: 'Step-Free Access', labelRu: 'Вход без ступеней' },
      { id: 'wide_doorways', labelEn: 'Wide Doorways', labelRu: 'Широкие дверные проёмы' },
      { id: 'roll_in_shower', labelEn: 'Roll-in Shower', labelRu: 'Душ для инвалидов' },
      { id: 'grab_bars', labelEn: 'Grab Bars', labelRu: 'Поручни' },
      { id: 'wheelchair_accessible', labelEn: 'Wheelchair Accessible', labelRu: 'Доступ для колясок' },
    ]
  },
  {
    id: 'policies',
    labelEn: 'House Features',
    labelRu: 'Особенности',
    icon: <PartyPopper className="h-4 w-4" />,
    items: [
      { id: 'smoking_allowed', labelEn: 'Smoking Allowed', labelRu: 'Курение разрешено', icon: <Cigarette className="h-4 w-4" /> },
      { id: 'pets_allowed', labelEn: 'Pets Allowed', labelRu: 'Можно с животными', icon: <Dog className="h-4 w-4" /> },
      { id: 'events_allowed', labelEn: 'Events Allowed', labelRu: 'Мероприятия разрешены' },
      { id: 'long_term_stays', labelEn: 'Suitable for Long Stays', labelRu: 'Подходит для долгосрочного проживания' },
    ]
  },
];

function UnitFieldsInner({
  propertyType = 'apartment',
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
  equipment = [],
  onFloorChange,
  onUnitNumberChange,
  onTotalFloorsChange,
  onPlotSizeChange,
  onHasElevatorChange,
  onParkingTypeChange,
  onPoolTypeChange,
  onGardenTypeChange,
  onViewTypeChange,
  onFurnishingLevelChange,
  onEquipmentChange,
}: UnitFieldsProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['essentials', 'kitchen']);

  const isStandalone = STANDALONE_TYPES.includes(propertyType);
  const isMultiUnit = MULTI_UNIT_TYPES.includes(propertyType);

  const handleEquipmentToggle = (equipmentId: string) => {
    if (equipment.includes(equipmentId)) {
      onEquipmentChange(equipment.filter(e => e !== equipmentId));
    } else {
      onEquipmentChange([...equipment, equipmentId]);
    }
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(c => c !== categoryId)
        : [...prev, categoryId]
    );
  };

  const getSelectedCountForCategory = (category: AmenityCategory) => {
    return category.items.filter(item => equipment.includes(item.id)).length;
  };

  const totalSelected = equipment.length;

  // Get property type label for header
  const getPropertyTypeLabel = () => {
    if (isStandalone) {
      return isRu ? 'Характеристики объекта' : 'Property Details';
    }
    return isRu ? 'Характеристики юнита' : 'Unit Details';
  };

  // Get header icon based on property type
  const HeaderIcon = isStandalone ? Home : Layers;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <HeaderIcon className="h-4 w-4" />
          {getPropertyTypeLabel()}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Multi-Unit Fields: Floor and Unit Number */}
        {isMultiUnit && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                {isRu ? 'Этаж' : 'Floor'}
              </Label>
              <Input
                type="number"
                min={-2}
                max={100}
                value={floor ?? ''}
                onChange={(e) => onFloorChange?.(e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="5"
              />
            </div>
            <div className="space-y-2">
              <Label>{isRu ? 'Номер квартиры' : 'Unit Number'}</Label>
              <Input
                value={unitNumber ?? ''}
                onChange={(e) => onUnitNumberChange?.(e.target.value)}
                placeholder="A-501"
              />
            </div>
          </div>
        )}

        {/* Standalone Fields: Building characteristics */}
        {isStandalone && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                  {isRu ? 'Этажей в здании' : 'Number of Floors'}
                </Label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={totalFloors ?? ''}
                  onChange={(e) => onTotalFloorsChange?.(e.target.value ? parseInt(e.target.value) : undefined)}
                  placeholder="2"
                />
                <p className="text-xs text-muted-foreground">
                  {isRu ? 'Сколько этажей в вилле/доме' : 'How many floors in the building'}
                </p>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Ruler className="h-3.5 w-3.5 text-muted-foreground" />
                  {isRu ? 'Участок (м²)' : 'Plot Size (m²)'}
                </Label>
                <Input
                  type="number"
                  min={0}
                  value={plotSizeSqm ?? ''}
                  onChange={(e) => onPlotSizeChange?.(e.target.value ? parseFloat(e.target.value) : undefined)}
                  placeholder="500"
                />
                <p className="text-xs text-muted-foreground">
                  {isRu ? 'Площадь земельного участка' : 'Land plot area'}
                </p>
              </div>
            </div>

            {/* Elevator for multi-story villas */}
            {(totalFloors ?? 0) > 1 && (
              <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                <div className="space-y-0.5">
                  <Label className="font-medium">{isRu ? 'Есть лифт' : 'Has Elevator'}</Label>
                  <p className="text-xs text-muted-foreground">
                    {isRu ? 'Лифт в многоэтажной вилле' : 'Elevator in multi-story villa'}
                  </p>
                </div>
                <Switch
                  checked={hasElevator ?? false}
                  onCheckedChange={(checked) => onHasElevatorChange?.(checked)}
                />
              </div>
            )}

            {/* Standalone property characteristics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Car className="h-3.5 w-3.5 text-muted-foreground" />
                  {isRu ? 'Паркинг' : 'Parking'}
                </Label>
                <Select value={parkingType || ''} onValueChange={(v) => onParkingTypeChange?.(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder={isRu ? 'Выберите' : 'Select'} />
                  </SelectTrigger>
                  <SelectContent>
                    {parkingTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {isRu ? type.labelRu : type.labelEn}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Waves className="h-3.5 w-3.5 text-muted-foreground" />
                  {isRu ? 'Бассейн' : 'Pool'}
                </Label>
                <Select value={poolType || ''} onValueChange={(v) => onPoolTypeChange?.(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder={isRu ? 'Выберите' : 'Select'} />
                  </SelectTrigger>
                  <SelectContent>
                    {poolTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {isRu ? type.labelRu : type.labelEn}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <TreePine className="h-3.5 w-3.5 text-muted-foreground" />
                  {isRu ? 'Сад / Территория' : 'Garden / Grounds'}
                </Label>
                <Select value={gardenType || ''} onValueChange={(v) => onGardenTypeChange?.(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder={isRu ? 'Выберите' : 'Select'} />
                  </SelectTrigger>
                  <SelectContent>
                    {gardenTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {isRu ? type.labelRu : type.labelEn}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </>
        )}

        {/* View Type - Common for all */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            {isRu ? 'Вид из окна' : 'View Type'}
          </Label>
          <Select value={viewType || ''} onValueChange={onViewTypeChange}>
            <SelectTrigger>
              <SelectValue placeholder={isRu ? 'Выберите' : 'Select'} />
            </SelectTrigger>
            <SelectContent>
              {viewTypes.map((view) => (
                <SelectItem key={view.id} value={view.id}>
                  {isRu ? view.labelRu : view.labelEn}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Furnishing Level - Common for all */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Sofa className="h-4 w-4" />
            {isRu ? 'Уровень меблировки' : 'Furnishing Level'}
          </Label>
          <Select value={furnishingLevel || ''} onValueChange={onFurnishingLevelChange}>
            <SelectTrigger>
              <SelectValue placeholder={isRu ? 'Выберите' : 'Select'} />
            </SelectTrigger>
            <SelectContent>
              {furnishingLevels.map((level) => (
                <SelectItem key={level.id} value={level.id}>
                  {isRu ? level.labelRu : level.labelEn}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Amenities - Airbnb Style */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>{isRu ? 'Удобства и оснащение' : 'Amenities & Equipment'}</Label>
            <div className="flex items-center gap-2">
              {totalSelected > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {totalSelected} {isRu ? 'выбрано' : 'selected'}
                </Badge>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs h-7"
                onClick={() => {
                  const allIds = amenityCategories.flatMap(c => c.items.map(i => i.id));
                  const allSelected = allIds.every(id => equipment.includes(id));
                  onEquipmentChange(allSelected ? [] : allIds);
                }}
              >
                {amenityCategories.flatMap(c => c.items.map(i => i.id)).every(id => equipment.includes(id))
                  ? (isRu ? 'Снять все' : 'Deselect All')
                  : (isRu ? 'Отметить все' : 'Select All')
                }
              </Button>
            </div>
          </div>
          
          <div className="space-y-2">
            {amenityCategories.map((category) => {
              const selectedCount = getSelectedCountForCategory(category);
              const isExpanded = expandedCategories.includes(category.id);
              
              return (
                <Collapsible 
                  key={category.id} 
                  open={isExpanded}
                  onOpenChange={() => toggleCategory(category.id)}
                >
                  <CollapsibleTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      className={cn(
                        "w-full justify-between px-3 py-2 h-auto font-normal hover:bg-muted/50",
                        selectedCount > 0 && "bg-primary/5"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        {category.icon}
                        <span className="text-sm font-medium">
                          {isRu ? category.labelRu : category.labelEn}
                        </span>
                        {selectedCount > 0 && (
                          <Badge variant="secondary" className="text-xs h-5 px-1.5">
                            {selectedCount}
                          </Badge>
                        )}
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="px-3 py-2 border-l-2 border-muted ml-3">
                      {/* Per-category select all */}
                      <button
                        type="button"
                        className="text-xs text-primary hover:underline mb-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          const catIds = category.items.map(i => i.id);
                          const allCatSelected = catIds.every(id => equipment.includes(id));
                          if (allCatSelected) {
                            onEquipmentChange(equipment.filter(id => !catIds.includes(id)));
                          } else {
                            const merged = new Set([...equipment, ...catIds]);
                            onEquipmentChange(Array.from(merged));
                          }
                        }}
                      >
                        {category.items.every(i => equipment.includes(i.id))
                          ? (isRu ? 'Снять все' : 'Deselect all')
                          : (isRu ? 'Выбрать все' : 'Select all')
                        }
                      </button>
                      <div className="grid grid-cols-2 gap-1">
                        {category.items.map((item) => (
                          <div 
                            key={item.id} 
                            className="flex items-center space-x-2 py-1"
                          >
                            <Checkbox
                              id={`amenity-${item.id}`}
                              checked={equipment.includes(item.id)}
                              onCheckedChange={() => handleEquipmentToggle(item.id)}
                            />
                            <label
                              htmlFor={`amenity-${item.id}`}
                              className="text-sm cursor-pointer leading-tight"
                            >
                              {isRu ? item.labelRu : item.labelEn}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </div>
          
          {/* Quick actions */}
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setExpandedCategories(amenityCategories.map(c => c.id))}
              className="text-xs"
            >
              {isRu ? 'Развернуть всё' : 'Expand All'}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setExpandedCategories([])}
              className="text-xs"
            >
              {isRu ? 'Свернуть всё' : 'Collapse All'}
            </Button>
            {totalSelected > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onEquipmentChange([])}
                className="text-xs text-muted-foreground ml-auto"
              >
                {isRu ? 'Сбросить' : 'Clear All'}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export const UnitFields = memo(UnitFieldsInner);
