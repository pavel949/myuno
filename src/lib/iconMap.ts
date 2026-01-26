import {
  Palmtree, UtensilsCrossed, Scissors, Hospital, Hotel, Plane, GraduationCap,
  Pill, Heart, Baby, Bone, Eye, Ear, Stethoscope, Music, PartyPopper, Sailboat,
  Mountain, Theater, Leaf, Waves, Clock, Truck, Car, Bike, Truck as Van,
  Sparkles, Zap, Scale, BarChart3, Wallet, Stamp, Building, Shield, Users,
  Brush, Package, Droplets, Snowflake, Bug, TreeDeciduous, Dog, Syringe,
  Anchor, Ship, Crown, Gem, Sun, Camera, Fish, Shell, Flower2, Gift, Calendar,
  Star, Dumbbell, PawPrint, Home, Building2, BedDouble, MapPin, Phone,
  HandMetal, Footprints, SprayCan, Smile, Wrench, Key, Briefcase,
  // New imports for extended coverage
  Brain, Wind, Palette, PenTool, Moon, Flame, AlertCircle, CheckCircle, Video,
  Croissant, Activity, Bandage, Microscope, FlaskConical, ParkingCircle, Mic,
  Tent, Martini, Volume2, ShoppingCart, Wifi, Coffee, CircleUserRound, CircleDollarSign,
  RefreshCw, Shirt, Package as Box, CalendarDays, CircleDot, Sunrise,
  Pizza, Soup, Utensils, ChefHat, CupSoda, Wine, Salad, Sandwich,
  Beef, Cookie, Apple, Wheat,
  Trophy, Globe, BookOpen, Laptop,
  Backpack, PersonStanding, User, UsersRound, MessageSquare,
  Send, Lock, ShieldCheck, Receipt, Infinity,
  Armchair, Hammer, Plug, TreePine, Cat,
  Flower, SunMedium, CloudSun,
  Church, Bird, CircleHelp, UserRound, Bell,
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
  '🌲': TreePine,
  '⛰️': Mountain,
  
  // Food & Dining
  '🍴': UtensilsCrossed,
  '🍽️': UtensilsCrossed,
  '🥢': Utensils,
  '🍣': Fish,
  '🍕': Pizza,
  '🍔': Sandwich,
  '🍛': Soup,
  '🥡': Box,
  '🥐': Croissant,
  '🌮': Utensils,
  '🫒': Leaf, // Olive → Leaf fallback
  '🍜': Soup,
  '🍷': Wine,
  '🍸': Martini,
  '🍾': Wine,
  '🥤': CupSoda,
  '🧀': Utensils,
  '🦐': Fish, // Shrimp → Fish fallback
  '🥗': Salad,
  '🌱': Leaf,
  '🍖': Beef,
  '🌾': Wheat,
  
  // Beauty & Personal
  '✂️': Scissors,
  '💇': Scissors,
  '💇‍♀️': Scissors,
  '💇‍♂️': Scissors,
  '✨': Sparkles,
  '💎': Gem,
  '💅': HandMetal,
  '💆': Smile,
  '💆‍♀️': Smile,
  '🧖': Sparkles,
  '🧖‍♀️': Sparkles,
  '💄': SprayCan,
  '🦶': Footprints,
  '🪨': Gem,
  '💧': Droplets,
  '🌸': Flower2,
  '💨': Wind,
  '🎨': Palette,
  '🖌️': PenTool,
  '👰': Crown,
  '🌙': Moon,
  '🌃': Moon,
  
  // Medical & Health
  '🏥': Hospital,
  '💊': Pill,
  '❤️': Heart,
  '👶': Baby,
  '🦴': Bone,
  '👁️': Eye,
  '👂': Ear,
  '👩‍⚕️': Stethoscope,
  '👨‍⚕️': Stethoscope,
  '🦷': Stethoscope,
  '🧴': Droplets,
  '💉': Syringe,
  '🩺': Stethoscope,
  '🧠': Brain,
  '🩹': Bandage,
  '🔬': Microscope,
  '🧪': FlaskConical,
  '🧘': Activity,
  
  // Accommodation
  '🏨': Hotel,
  '🏠': Home,
  '🏡': Home,
  '🏢': Building,
  '🏬': Building2,
  '🏘️': Home,
  '🛏️': BedDouble,
  '🌆': Building2,
  '🛋️': Armchair,
  
  // Transport
  '✈️': Plane,
  '🚗': Car,
  '🏍️': Bike,
  '🚙': Car,
  '🚐': Van,
  '🏎️': Car,
  '⚡': Zap,
  '🚚': Truck,
  '🛵': Bike,
  '🚤': Ship,
  '🛥️': Ship,
  '🛳️': Ship,
  
  // Education
  '🎓': GraduationCap,
  '📚': BookOpen,
  '💻': Laptop,
  '🌍': Globe,
  '⚽': Activity,
  '📖': BookOpen,
  '🗣️': MessageSquare,
  
  // Entertainment & Events
  '🎵': Music,
  '🎉': PartyPopper,
  '🎭': Theater,
  '🎤': Mic,
  '🎪': Tent,
  '🎬': Camera,
  '🔥': Flame,
  '🎊': PartyPopper,
  '🥊': Activity,
  '🥋': Activity,
  '🔞': Lock,
  '👑': Crown,
  
  // Water & Boats
  '⛵': Sailboat,
  '⚓': Anchor,
  '🏄': Waves,
  '🏄‍♂️': Waves,
  '🏄‍♀️': Waves,
  '🌊': Waves,
  '🐠': Fish,
  '🐬': Fish,
  '🪸': Shell,
  '🤿': Waves,
  '🥽': Eye,
  '🛶': Sailboat,
  '🪂': Wind,
  '🏂': Activity,
  '🎣': Fish,
  '🔊': Volume2,
  
  // Pets
  '🐾': PawPrint,
  '🐕': Dog,
  '🐶': Dog,
  '🐱': Cat,
  '🦜': PawPrint,
  '🦎': PawPrint,
  
  // Services & Cleaning
  '🧹': Brush,
  '🧺': Package,
  '🔧': Wrench,
  '🔨': Hammer,
  '🚿': Droplets,
  '❄️': Snowflake,
  '🐜': Bug,
  '🔑': Key,
  '👔': Shirt,
  '🧥': Shirt,
  '📦': Box,
  
  // Business & Legal
  '⚖️': Scale,
  '📊': BarChart3,
  '💰': Wallet,
  '💵': CircleDollarSign,
  '🛂': Stamp,
  '🛡️': Shield,
  '👥': Users,
  '💼': Briefcase,
  '💯': CheckCircle,
  
  // Time & Scheduling
  '🕐': Clock,
  '📅': Calendar,
  '🗓️': CalendarDays,
  '📆': CalendarDays,
  '⏰': Clock,
  '⏱️': Clock,
  '🌅': Sunrise,
  '🌤️': SunMedium,
  '☀️': Sun,
  
  // Flowers & Gifts
  '💐': Flower2,
  '🌹': Flower2,
  '🌷': Flower2,
  '🪻': Flower2,
  '🌺': Flower2,
  '🌻': Sun,
  '🎁': Gift,
  '🎂': Gift,
  '💑': Users,
  '💒': Church,
  '🕊️': Bird,
  '🙏': Heart,
  '🏺': Box,
  '⏳': Clock,
  
  // Ratings & Status
  '⭐': Star,
  '🏆': Trophy,
  '🚨': AlertCircle,
  '✅': CheckCircle,
  '📹': Video,
  '📸': Camera,
  '🆓': Gift,
  '🟢': CircleDot,
  '🟡': CircleDot,
  '🟠': CircleDot,
  '🔴': CircleDot,
  '🔵': CircleDot,
  '⚪': CircleDot,
  '🩷': Heart,
  '🟣': CircleDot,
  '🌈': Sparkles,
  
  // Fitness & Sports
  '🏋️': Dumbbell,
  '💪': Dumbbell,
  '🏊': Waves,
  '🤸': Activity,
  '💃': Music,
  '👨‍🏫': User,
  '🏃': PersonStanding,
  
  // Location & Navigation
  '📍': MapPin,
  '📞': Phone,
  '📶': Wifi,
  '🚀': Send,
  '🌐': Globe,
  '♿': CircleUserRound,
  
  // Parking & Infrastructure
  '🅿️': ParkingCircle,
  '🔒': Lock,
  '🛎️': Bell,
  '🚪': Key,
  '🎠': Activity,
  '🍳': ChefHat,
  '🛁': Droplets,
  
  // People & Groups
  '👤': User,
  '👨‍👩‍👧': UsersRound,
  '👨‍👩‍👧‍👦': UsersRound,
  '👨‍✈️': User,
  '👧': User,
  '🧑': User,
  '👨': User,
  '🧒': Baby,
  '🎒': Backpack,
  
  // Misc
  '🔄': RefreshCw,
  '1️⃣': CircleDot,
  '2️⃣': CircleDot,
  '3️⃣': CircleDot,
  '4️⃣': CircleDot,
  '☕': Coffee,
  '∞': Infinity,
  '🎛️': Activity,
  '🛕': Building,
  '🧗': Mountain,
  '🏙️': Building2,
  '🗺️': MapPin,
  '🇬🇧': Globe,
  '🇷🇺': Globe,
  '🇹🇭': Globe,
  '🇨🇳': Globe,
  
  // Property specific
  '🐢': PawPrint,
  '⛱️': Sun,
  '🏌️': Activity,
  '🐚': Shell,
  '🛫': Plane,
  '🏷️': Receipt,
  '🔐': Lock,
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
