import {
  Palmtree, UtensilsCrossed, Scissors, Hospital, Hotel, Plane, GraduationCap,
  Pill, Heart, Baby, Bone, Eye, Ear, Stethoscope, Music, PartyPopper, Sailboat,
  Mountain, Theater, Leaf, Waves, Clock, Truck, Car, Bike, Truck as Van,
  Sparkles, Zap, Scale, BarChart3, Wallet, Stamp, Building, Shield, Users,
  Brush, Package, Droplets, Snowflake, Bug, TreeDeciduous, Dog, Syringe,
  Anchor, Ship, Crown, Gem, Sun, Camera, Fish, Shell, Flower2, Gift, Calendar,
  Star, Dumbbell, PawPrint, Home, Building2, BedDouble, MapPin, Phone,
  HandMetal, Footprints, SprayCan, Smile, Wrench, Key, Briefcase,
  type LucideIcon
} from 'lucide-react';

// Comprehensive emoji to Lucide icon mapping
export const emojiToIconMap: Record<string, LucideIcon> = {
  // Travel & Nature
  '🏝️': Palmtree,
  '🌴': Palmtree,
  '🏖️': Sun,
  '🏔️': Mountain,
  '🌿': Leaf,
  '🌳': TreeDeciduous,
  
  // Food & Dining
  '🍴': UtensilsCrossed,
  '🍽️': UtensilsCrossed,
  
  // Beauty & Personal
  '✂️': Scissors,
  '💇': Scissors,
  '💇‍♀️': Scissors,
  '✨': Sparkles,
  '💎': Gem,
  '💅': HandMetal,
  '💆': Smile,
  '💆‍♀️': Smile,
  '🧖': Sparkles,
  '🧖‍♀️': Sparkles,
  '💄': SprayCan,
  
  // Medical & Health
  '🏥': Hospital,
  '💊': Pill,
  '❤️': Heart,
  '👶': Baby,
  '🦴': Bone,
  '👁️': Eye,
  '👂': Ear,
  '👩‍⚕️': Stethoscope,
  '🦷': Stethoscope,
  '🧴': Droplets,
  '💉': Syringe,
  '👨‍⚕️': Stethoscope,
  
  // Accommodation
  '🏨': Hotel,
  '🏠': Home,
  '🏡': Home,
  '🏢': Building,
  '🏬': Building2,
  '🏘️': Home,
  '🛏️': BedDouble,
  
  // Transport
  '✈️': Plane,
  '🚗': Car,
  '🏍️': Bike,
  '🚙': Car,
  '🚐': Van,
  '🏎️': Car,
  '⚡': Zap,
  
  // Education
  '🎓': GraduationCap,
  
  // Entertainment & Events
  '🎵': Music,
  '🎉': PartyPopper,
  '🎭': Theater,
  
  // Water & Boats
  '⛵': Sailboat,
  '🚤': Ship,
  '🛳️': Ship,
  '🛥️': Ship,
  '⚓': Anchor,
  '🏄': Waves,
  '🌊': Waves,
  '🐠': Fish,
  '🐬': Fish,
  '🪸': Shell,
  '🎬': Camera,
  
  // Pets
  '🐾': PawPrint,
  '🐕': Dog,
  '🐶': Dog,
  
  // Services
  '🧹': Brush,
  '🧺': Package,
  '🔧': Wrench,
  '🚿': Droplets,
  '❄️': Snowflake,
  '🐜': Bug,
  '🔑': Key,
  
  // Business & Legal
  '⚖️': Scale,
  '📊': BarChart3,
  '💰': Wallet,
  '🛂': Stamp,
  '🛡️': Shield,
  '👥': Users,
  
  // Time & Scheduling
  '🕐': Clock,
  '📅': Calendar,
  '🚚': Truck,
  
  // Flowers
  '🌸': Flower2,
  '💐': Flower2,
  '🎁': Gift,
  
  // Ratings
  '⭐': Star,
  
  // Fitness
  '🏋️': Dumbbell,
  '💪': Dumbbell,
  
  // Location
  '📍': MapPin,
  '📞': Phone,
};

// Get Lucide icon for an emoji, with fallback
export function getIconForEmoji(emoji: string): LucideIcon | null {
  return emojiToIconMap[emoji] || null;
}

// Check if a string is an emoji
export function isEmoji(str: string): boolean {
  const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/u;
  return emojiRegex.test(str);
}

// Standardized icon sizes for consistent UI across the app
export const iconSizes = {
  xs: 'w-3 h-3',      // 12px - very small inline icons
  sm: 'w-3.5 h-3.5',  // 14px - small icons in badges/chips
  md: 'w-4 h-4',      // 16px - default icon size
  lg: 'w-5 h-5',      // 20px - medium emphasis
  xl: 'w-6 h-6',      // 24px - high emphasis, quick actions
  '2xl': 'w-8 h-8',   // 32px - hero icons
  '3xl': 'w-12 h-12', // 48px - placeholder icons
} as const;

export type IconSize = keyof typeof iconSizes;
