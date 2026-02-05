/**
 * Intelligent icon mapper for catalog items
 * Maps item names to relevant Lucide icons based on keywords
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
  { keywords: ['кофе', 'coffee', 'капучино', 'латте', 'эспрессо'], icon: Coffee, color: 'text-amber-700' },
  { keywords: ['вино', 'wine', 'напиток', 'drink', 'коктейль', 'cocktail'], icon: Wine, color: 'text-purple-600' },
  { keywords: ['пицца', 'pizza'], icon: Pizza, color: 'text-orange-500' },
  { keywords: ['торт', 'cake', 'десерт', 'dessert', 'выпечка', 'bakery'], icon: Cake, color: 'text-pink-500' },
  { keywords: ['мороженое', 'ice cream', 'gelato'], icon: IceCream, color: 'text-cyan-400' },
  { keywords: ['яблок', 'apple', 'фрукт', 'fruit'], icon: Apple, color: 'text-red-500' },
  { keywords: ['овощ', 'vegetable', 'морков', 'carrot', 'салат'], icon: Carrot, color: 'text-orange-400' },
  { keywords: ['рыб', 'fish', 'морепродукт', 'seafood', 'суши', 'sushi'], icon: Fish, color: 'text-blue-400' },
  { keywords: ['мясо', 'meat', 'стейк', 'steak', 'говядин', 'beef'], icon: Beef, color: 'text-red-700' },
  { keywords: ['ресторан', 'restaurant', 'еда', 'food', 'кухня', 'cuisine'], icon: Utensils, color: 'text-amber-600' },
  
  // Electronics & Tech
  { keywords: ['ноутбук', 'laptop', 'компьютер', 'computer', 'macbook'], icon: Laptop, color: 'text-slate-600' },
  { keywords: ['телефон', 'phone', 'смартфон', 'smartphone', 'iphone', 'android'], icon: Phone, color: 'text-blue-500' },
  { keywords: ['камер', 'camera', 'фото', 'photo'], icon: Camera, color: 'text-gray-700' },
  { keywords: ['наушник', 'headphone', 'airpods', 'earbuds'], icon: Headphones, color: 'text-indigo-500' },
  { keywords: ['час', 'watch', 'время', 'time'], icon: Watch, color: 'text-amber-500' },
  { keywords: ['монитор', 'monitor', 'экран', 'display', 'screen'], icon: Monitor, color: 'text-slate-500' },
  { keywords: ['клавиатур', 'keyboard'], icon: Keyboard, color: 'text-gray-600' },
  { keywords: ['мышь', 'мышк', 'mouse'], icon: Mouse, color: 'text-gray-500' },
  { keywords: ['принтер', 'printer'], icon: Printer, color: 'text-gray-700' },
  { keywords: ['колонк', 'speaker', 'динамик'], icon: Speaker, color: 'text-zinc-600' },
  { keywords: ['wifi', 'вайфай', 'роутер', 'router', 'интернет'], icon: Wifi, color: 'text-blue-500' },
  { keywords: ['телевизор', 'tv', 'television'], icon: Tv, color: 'text-slate-700' },
  { keywords: ['геймпад', 'gamepad', 'игр', 'game', 'playstation', 'xbox'], icon: Gamepad2, color: 'text-purple-500' },
  
  // Fashion & Accessories
  { keywords: ['одежд', 'cloth', 'рубашк', 'shirt', 'футболк', 't-shirt', 'платье', 'dress'], icon: Shirt, color: 'text-indigo-500' },
  { keywords: ['украшен', 'jewelry', 'кольц', 'ring', 'серьг', 'earring', 'брасле', 'bracelet'], icon: Gem, color: 'text-pink-400' },
  { keywords: ['очки', 'glasses', 'солнцезащитн'], icon: Glasses, color: 'text-amber-600' },
  { keywords: ['сумк', 'bag', 'рюкзак', 'backpack'], icon: Backpack, color: 'text-emerald-600' },
  { keywords: ['зонт', 'umbrella'], icon: Umbrella, color: 'text-violet-500' },
  { keywords: ['чемодан', 'luggage', 'багаж'], icon: Luggage, color: 'text-brown-500' },
  
  // Health & Beauty
  { keywords: ['лекарств', 'medicine', 'таблетк', 'pill', 'витамин', 'vitamin'], icon: Pill, color: 'text-green-500' },
  { keywords: ['врач', 'doctor', 'медицин', 'medical', 'клиник', 'clinic'], icon: Stethoscope, color: 'text-blue-600' },
  { keywords: ['уход', 'care', 'косметик', 'cosmetic', 'красот', 'beauty'], icon: Sparkles, color: 'text-pink-400' },
  { keywords: ['маникюр', 'manicure', 'педикюр', 'pedicure', 'ногт', 'nail'], icon: Sparkles, color: 'text-rose-400' },
  { keywords: ['массаж', 'massage', 'спа', 'spa', 'релакс'], icon: HandHeart, color: 'text-purple-400' },
  { keywords: ['парикмахер', 'hairdresser', 'стрижк', 'haircut', 'волос', 'hair', 'барбер', 'barber'], icon: Scissors, color: 'text-slate-600' },
  { keywords: ['фитнес', 'fitness', 'спорт', 'sport', 'трениров', 'training', 'gym', 'зал'], icon: Dumbbell, color: 'text-orange-500' },
  
  // Home & Living
  { keywords: ['диван', 'sofa', 'мебел', 'furniture', 'кресл'], icon: Sofa, color: 'text-amber-700' },
  { keywords: ['кроват', 'bed', 'матрас', 'mattress', 'спальн'], icon: Bed, color: 'text-indigo-400' },
  { keywords: ['ванн', 'bath', 'душ', 'shower'], icon: Bath, color: 'text-cyan-500' },
  { keywords: ['холодильник', 'refrigerator', 'fridge'], icon: Refrigerator, color: 'text-slate-500' },
  { keywords: ['стиральн', 'washing', 'стирк'], icon: WashingMachine, color: 'text-blue-400' },
  
  // Transport
  { keywords: ['авто', 'car', 'машин', 'vehicle', 'транспорт'], icon: Car, color: 'text-blue-600' },
  { keywords: ['велосипед', 'bike', 'bicycle', 'самокат', 'scooter'], icon: Bike, color: 'text-green-500' },
  { keywords: ['яхт', 'yacht', 'лодк', 'boat', 'катер'], icon: Ship, color: 'text-blue-500' },
  { keywords: ['самолет', 'plane', 'авиа', 'flight', 'билет'], icon: Plane, color: 'text-sky-500' },
  
  // Property
  { keywords: ['квартир', 'apartment', 'апартамент'], icon: Building2, color: 'text-slate-600' },
  { keywords: ['дом', 'house', 'вилл', 'villa', 'коттедж'], icon: Home, color: 'text-emerald-600' },
  { keywords: ['ключ', 'key', 'аренд', 'rent'], icon: Key, color: 'text-amber-500' },
  
  // Services
  { keywords: ['ремонт', 'repair', 'починк'], icon: Wrench, color: 'text-gray-600' },
  { keywords: ['электрик', 'electric', 'электро'], icon: Zap, color: 'text-yellow-500' },
  { keywords: ['сантехник', 'plumb', 'вод', 'water'], icon: Droplets, color: 'text-blue-400' },
  { keywords: ['отоплен', 'heating', 'газ', 'gas'], icon: Flame, color: 'text-orange-500' },
  { keywords: ['кондиционер', 'air condition', 'вентиляц', 'ventilation'], icon: Wind, color: 'text-cyan-400' },
  { keywords: ['покраск', 'paint', 'малярн'], icon: Paintbrush, color: 'text-purple-500' },
  { keywords: ['строител', 'construct', 'build'], icon: Hammer, color: 'text-amber-600' },
  
  // Entertainment & Leisure
  { keywords: ['музык', 'music', 'концерт', 'concert'], icon: Music, color: 'text-pink-500' },
  { keywords: ['фильм', 'film', 'movie', 'кино', 'cinema'], icon: Film, color: 'text-purple-600' },
  { keywords: ['книг', 'book', 'чтен', 'reading'], icon: Book, color: 'text-amber-700' },
  { keywords: ['искусств', 'art', 'картин', 'painting', 'галере'], icon: Palette, color: 'text-violet-500' },
  
  // Nature & Outdoors
  { keywords: ['цвет', 'flower', 'букет', 'bouquet', 'роз', 'rose'], icon: Flower2, color: 'text-pink-500' },
  { keywords: ['палатк', 'tent', 'кемпинг', 'camping'], icon: Tent, color: 'text-green-600' },
  { keywords: ['гор', 'mountain', 'хайкинг', 'hiking'], icon: Mountain, color: 'text-slate-600' },
  { keywords: ['пляж', 'beach', 'море', 'sea', 'океан', 'ocean'], icon: Waves, color: 'text-blue-400' },
  { keywords: ['лес', 'forest', 'природ', 'nature', 'парк', 'park'], icon: TreePine, color: 'text-green-600' },
  { keywords: ['эко', 'eco', 'органик', 'organic', 'био', 'bio'], icon: Leaf, color: 'text-green-500' },
  
  // Kids & Pets
  { keywords: ['детск', 'child', 'kid', 'ребен', 'baby', 'малыш', 'игрушк', 'toy'], icon: Baby, color: 'text-pink-400' },
  { keywords: ['собак', 'dog', 'щенок', 'puppy', 'пёс'], icon: Dog, color: 'text-amber-600' },
  { keywords: ['кошк', 'cat', 'котен', 'kitten', 'кот'], icon: Cat, color: 'text-orange-400' },
  
  // Education & Learning
  { keywords: ['обучен', 'education', 'курс', 'course', 'урок', 'lesson'], icon: GraduationCap, color: 'text-blue-600' },
  { keywords: ['школ', 'school'], icon: School, color: 'text-indigo-500' },
  { keywords: ['библиотек', 'library'], icon: Library, color: 'text-amber-700' },
  
  // Business & Finance
  { keywords: ['банк', 'bank', 'финанс', 'finance'], icon: Banknote, color: 'text-green-600' },
  { keywords: ['инвест', 'invest', 'акци', 'stock'], icon: TrendingUp, color: 'text-emerald-500' },
  { keywords: ['бизнес', 'business', 'офис', 'office'], icon: BarChart3, color: 'text-blue-600' },
  { keywords: ['карт', 'card', 'оплат', 'payment'], icon: CreditCard, color: 'text-slate-600' },
  
  // Gifts & Special
  { keywords: ['подарок', 'gift', 'сюрприз', 'surprise'], icon: Gift, color: 'text-red-500' },
  { keywords: ['премиум', 'premium', 'vip', 'люкс', 'luxury'], icon: Crown, color: 'text-amber-500' },
  { keywords: ['акци', 'sale', 'скидк', 'discount', 'распродаж'], icon: Tag, color: 'text-red-500' },
  { keywords: ['новинк', 'new', 'новый'], icon: Sparkles, color: 'text-violet-500' },
  { keywords: ['топ', 'top', 'лучш', 'best', 'популярн', 'popular'], icon: Trophy, color: 'text-amber-500' },
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
    service: { icon: Package, color: 'text-blue-500' },
    product: { icon: ShoppingCart, color: 'text-green-500' },
    property: { icon: Home, color: 'text-orange-500' },
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
