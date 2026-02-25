/**
 * Intelligent icon mapper for catalog items
 * Maps item names to relevant Lucide icons based on keywords
 * Uses semantic design tokens for colors
 */

import {
  Package, ShoppingCart, Home, Car, Utensils, Shirt, Laptop, Phone,
  Camera, Headphones, Watch, Gem, Flower2, Gift, Book, Palette,
  Dumbbell, Heart, Baby, Dog, Cat, Plane, Ship, Bike, Scissors,
  Wrench, Zap, Droplets, Flame, Wind, Sun, Moon, Music, Film,
  Gamepad2, Trophy, Globe, MapPin, Building2, Key, Bed, Bath,
  Sofa, Tv, Refrigerator, WashingMachine, Coffee, Wine, Pizza,
  Cake, IceCream, Apple, Carrot, Fish, Beef, Pill, Stethoscope,
  Syringe, Thermometer, Glasses, Umbrella, Backpack, Luggage,
  Tent, Mountain, Waves, TreePine, Leaf, Sparkles, Crown, Medal,
  Rocket, Lightbulb, PenTool, Brush, Hammer, Drill, Paintbrush,
  Printer, Monitor, Keyboard, Mouse, Wifi, Battery, Speaker,
  Radio, Mic, Video, Image, FileText, Folder, Mail, Send,
  MessageCircle, Bell, Calendar, Clock, Timer, Calculator,
  CreditCard, Wallet, Banknote, PiggyBank, TrendingUp, BarChart3,
  Lock, Shield, Eye, Search, Star, HandHeart, Users, UserCheck,
  GraduationCap, School, Library, Microscope, FlaskConical, Atom,
  Sticker, Stamp, Tag, Bookmark, Flag, Award, Target, Crosshair,
  type LucideIcon
} from 'lucide-react';

interface IconMapping {
  keywords: string[];
  icon: LucideIcon;
  color: string;
}

const iconMappings: IconMapping[] = [
  // Food & Drinks
  { keywords: ['кофе', 'coffee', 'капучино', 'латте', 'эспрессо'], icon: Coffee, color: 'text-warning' },
  { keywords: ['вино', 'wine', 'напиток', 'drink', 'коктейль', 'cocktail'], icon: Wine, color: 'text-accent-purple' },
  { keywords: ['пицца', 'pizza'], icon: Pizza, color: 'text-accent-amber' },
  { keywords: ['торт', 'cake', 'десерт', 'dessert', 'выпечка', 'bakery'], icon: Cake, color: 'text-accent-coral' },
  { keywords: ['мороженое', 'ice cream', 'gelato'], icon: IceCream, color: 'text-accent-cyan' },
  { keywords: ['яблок', 'apple', 'фрукт', 'fruit'], icon: Apple, color: 'text-destructive' },
  { keywords: ['овощ', 'vegetable', 'морков', 'carrot', 'салат'], icon: Carrot, color: 'text-accent-amber' },
  { keywords: ['рыб', 'fish', 'морепродукт', 'seafood', 'суши', 'sushi'], icon: Fish, color: 'text-info' },
  { keywords: ['мясо', 'meat', 'стейк', 'steak', 'говядин', 'beef'], icon: Beef, color: 'text-destructive' },
  { keywords: ['ресторан', 'restaurant', 'еда', 'food', 'кухня', 'cuisine'], icon: Utensils, color: 'text-warning' },
  
  // Electronics & Tech
  { keywords: ['ноутбук', 'laptop', 'компьютер', 'computer', 'macbook'], icon: Laptop, color: 'text-muted-foreground' },
  { keywords: ['телефон', 'phone', 'смартфон', 'smartphone', 'iphone', 'android'], icon: Phone, color: 'text-info' },
  { keywords: ['камер', 'camera', 'фото', 'photo'], icon: Camera, color: 'text-muted-foreground' },
  { keywords: ['наушник', 'headphone', 'airpods', 'earbuds'], icon: Headphones, color: 'text-accent-purple' },
  { keywords: ['час', 'watch', 'время', 'time'], icon: Watch, color: 'text-warning' },
  { keywords: ['монитор', 'monitor', 'экран', 'display', 'screen'], icon: Monitor, color: 'text-muted-foreground' },
  { keywords: ['клавиатур', 'keyboard'], icon: Keyboard, color: 'text-muted-foreground' },
  { keywords: ['мышь', 'мышк', 'mouse'], icon: Mouse, color: 'text-muted-foreground' },
  { keywords: ['принтер', 'printer'], icon: Printer, color: 'text-muted-foreground' },
  { keywords: ['колонк', 'speaker', 'динамик'], icon: Speaker, color: 'text-muted-foreground' },
  { keywords: ['wifi', 'вайфай', 'роутер', 'router', 'интернет'], icon: Wifi, color: 'text-info' },
  { keywords: ['телевизор', 'tv', 'television'], icon: Tv, color: 'text-muted-foreground' },
  { keywords: ['геймпад', 'gamepad', 'игр', 'game', 'playstation', 'xbox'], icon: Gamepad2, color: 'text-accent-purple' },
  
  // Fashion & Accessories
  { keywords: ['одежд', 'cloth', 'рубашк', 'shirt', 'футболк', 't-shirt', 'платье', 'dress'], icon: Shirt, color: 'text-accent-purple' },
  { keywords: ['украшен', 'jewelry', 'кольц', 'ring', 'серьг', 'earring', 'брасле', 'bracelet'], icon: Gem, color: 'text-accent-coral' },
  { keywords: ['очки', 'glasses', 'солнцезащитн'], icon: Glasses, color: 'text-warning' },
  { keywords: ['сумк', 'bag', 'рюкзак', 'backpack'], icon: Backpack, color: 'text-success' },
  { keywords: ['зонт', 'umbrella'], icon: Umbrella, color: 'text-accent-purple' },
  { keywords: ['чемодан', 'luggage', 'багаж'], icon: Luggage, color: 'text-muted-foreground' },
  
  // Health & Beauty
  { keywords: ['лекарств', 'medicine', 'таблетк', 'pill', 'витамин', 'vitamin'], icon: Pill, color: 'text-success' },
  { keywords: ['врач', 'doctor', 'медицин', 'medical', 'клиник', 'clinic'], icon: Stethoscope, color: 'text-info' },
  { keywords: ['уход', 'care', 'косметик', 'cosmetic', 'красот', 'beauty'], icon: Sparkles, color: 'text-accent-coral' },
  { keywords: ['маникюр', 'manicure', 'педикюр', 'pedicure', 'ногт', 'nail'], icon: Sparkles, color: 'text-accent-coral' },
  { keywords: ['массаж', 'massage', 'спа', 'spa', 'релакс'], icon: HandHeart, color: 'text-accent-purple' },
  { keywords: ['парикмахер', 'hairdresser', 'стрижк', 'haircut', 'волос', 'hair', 'барбер', 'barber'], icon: Scissors, color: 'text-muted-foreground' },
  { keywords: ['фитнес', 'fitness', 'спорт', 'sport', 'трениров', 'training', 'gym', 'зал'], icon: Dumbbell, color: 'text-accent-amber' },
  
  // Home & Living
  { keywords: ['диван', 'sofa', 'мебел', 'furniture', 'кресл'], icon: Sofa, color: 'text-warning' },
  { keywords: ['кроват', 'bed', 'матрас', 'mattress', 'спальн'], icon: Bed, color: 'text-accent-purple' },
  { keywords: ['ванн', 'bath', 'душ', 'shower'], icon: Bath, color: 'text-accent-cyan' },
  { keywords: ['холодильник', 'refrigerator', 'fridge'], icon: Refrigerator, color: 'text-muted-foreground' },
  { keywords: ['стиральн', 'washing', 'стирк'], icon: WashingMachine, color: 'text-info' },
  
  // Transport
  { keywords: ['авто', 'car', 'машин', 'vehicle', 'транспорт'], icon: Car, color: 'text-info' },
  { keywords: ['велосипед', 'bike', 'bicycle', 'самокат', 'scooter'], icon: Bike, color: 'text-success' },
  { keywords: ['яхт', 'yacht', 'лодк', 'boat', 'катер'], icon: Ship, color: 'text-info' },
  { keywords: ['самолет', 'plane', 'авиа', 'flight', 'билет'], icon: Plane, color: 'text-info' },
  
  // Property
  { keywords: ['квартир', 'apartment', 'апартамент'], icon: Building2, color: 'text-muted-foreground' },
  { keywords: ['дом', 'house', 'вилл', 'villa', 'коттедж'], icon: Home, color: 'text-success' },
  { keywords: ['ключ', 'key', 'аренд', 'rent'], icon: Key, color: 'text-warning' },
  
  // Services
  { keywords: ['ремонт', 'repair', 'починк'], icon: Wrench, color: 'text-muted-foreground' },
  { keywords: ['электрик', 'electric', 'электро'], icon: Zap, color: 'text-warning' },
  { keywords: ['сантехник', 'plumb', 'вод', 'water'], icon: Droplets, color: 'text-info' },
  { keywords: ['отоплен', 'heating', 'газ', 'gas'], icon: Flame, color: 'text-accent-amber' },
  { keywords: ['кондиционер', 'air condition', 'вентиляц', 'ventilation'], icon: Wind, color: 'text-accent-cyan' },
  { keywords: ['покраск', 'paint', 'малярн'], icon: Paintbrush, color: 'text-accent-purple' },
  { keywords: ['строител', 'construct', 'build'], icon: Hammer, color: 'text-warning' },
  
  // Entertainment & Leisure
  { keywords: ['музык', 'music', 'концерт', 'concert'], icon: Music, color: 'text-accent-coral' },
  { keywords: ['фильм', 'film', 'movie', 'кино', 'cinema'], icon: Film, color: 'text-accent-purple' },
  { keywords: ['книг', 'book', 'чтен', 'reading'], icon: Book, color: 'text-warning' },
  { keywords: ['искусств', 'art', 'картин', 'painting', 'галере'], icon: Palette, color: 'text-accent-purple' },
  
  // Nature & Outdoors
  { keywords: ['цвет', 'flower', 'букет', 'bouquet', 'роз', 'rose'], icon: Flower2, color: 'text-accent-coral' },
  { keywords: ['палатк', 'tent', 'кемпинг', 'camping'], icon: Tent, color: 'text-success' },
  { keywords: ['гор', 'mountain', 'хайкинг', 'hiking'], icon: Mountain, color: 'text-muted-foreground' },
  { keywords: ['пляж', 'beach', 'море', 'sea', 'океан', 'ocean'], icon: Waves, color: 'text-info' },
  { keywords: ['лес', 'forest', 'природ', 'nature', 'парк', 'park'], icon: TreePine, color: 'text-success' },
  { keywords: ['эко', 'eco', 'органик', 'organic', 'био', 'bio'], icon: Leaf, color: 'text-success' },
  
  // Kids & Pets
  { keywords: ['детск', 'child', 'kid', 'ребен', 'baby', 'малыш', 'игрушк', 'toy'], icon: Baby, color: 'text-accent-coral' },
  { keywords: ['собак', 'dog', 'щенок', 'puppy', 'пёс'], icon: Dog, color: 'text-warning' },
  { keywords: ['кошк', 'cat', 'котен', 'kitten', 'кот'], icon: Cat, color: 'text-accent-amber' },
  
  // Education & Learning
  { keywords: ['обучен', 'education', 'курс', 'course', 'урок', 'lesson'], icon: GraduationCap, color: 'text-info' },
  { keywords: ['школ', 'school'], icon: School, color: 'text-accent-purple' },
  { keywords: ['библиотек', 'library'], icon: Library, color: 'text-warning' },
  
  // Business & Finance
  { keywords: ['банк', 'bank', 'финанс', 'finance'], icon: Banknote, color: 'text-success' },
  { keywords: ['инвест', 'invest', 'акци', 'stock'], icon: TrendingUp, color: 'text-success' },
  { keywords: ['бизнес', 'business', 'офис', 'office'], icon: BarChart3, color: 'text-info' },
  { keywords: ['карт', 'card', 'оплат', 'payment'], icon: CreditCard, color: 'text-muted-foreground' },
  
  // Gifts & Special
  { keywords: ['подарок', 'gift', 'сюрприз', 'surprise'], icon: Gift, color: 'text-destructive' },
  { keywords: ['премиум', 'premium', 'vip', 'люкс', 'luxury'], icon: Crown, color: 'text-warning' },
  { keywords: ['акци', 'sale', 'скидк', 'discount', 'распродаж'], icon: Tag, color: 'text-destructive' },
  { keywords: ['новинк', 'new', 'новый'], icon: Sparkles, color: 'text-accent-purple' },
  { keywords: ['топ', 'top', 'лучш', 'best', 'популярн', 'popular'], icon: Trophy, color: 'text-warning' },
];

export interface CatalogIconResult {
  icon: LucideIcon;
  color: string;
}

/**
 * Get an appropriate icon based on item name
 */
export function getCatalogItemIcon(
  name: string, 
  type: 'service' | 'product' | 'property'
): CatalogIconResult {
  const nameLower = name.toLowerCase();
  
  // Check all mappings
  for (const mapping of iconMappings) {
    for (const keyword of mapping.keywords) {
      if (nameLower.includes(keyword)) {
        return { icon: mapping.icon, color: mapping.color };
      }
    }
  }
  
  // Default icons by type
  const defaults: Record<string, CatalogIconResult> = {
    service: { icon: Package, color: 'text-info' },
    product: { icon: ShoppingCart, color: 'text-success' },
    property: { icon: Home, color: 'text-accent-amber' },
  };
  
  return defaults[type] || defaults.product;
}

/**
 * Get initials from name for fallback
 */
export function getNameInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map(word => word[0])
    .join('')
    .toUpperCase();
}
