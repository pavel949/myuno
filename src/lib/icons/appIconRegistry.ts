/**
 * Canonical app/vertical → LucideIcon map.
 * SSOT for UI surfaces that must render an app icon by id.
 *
 * Per design bible §730 (docs/canonical/05-visual-design-system.md):
 * "Lucide React — единственная разрешённая библиотека иконок. Никаких emoji-иконок в UI."
 *
 * Usage: `<AppIcon id="property" />` (see src/components/ui/AppIcon.tsx)
 */
import {
  Building2, Sparkles, Baby, PawPrint, Flower2,
  PlaneLanding, Car, Plane, Smartphone, ArrowLeftRight,
  Utensils, Compass, Anchor, Waves, CalendarDays, Dumbbell,
  Scissors, Stethoscope, Pill, ShieldCheck,
  Scale, GraduationCap, Landmark, Globe, Briefcase, FileSearch,
  Calculator, BookOpen, LayoutGrid, Shirt, Wrench, Hammer, Plug,
  Wind, KeyRound, TreePine, Warehouse, Bug, ShoppingBag, Bike,
  Crown, AlertTriangle, LifeBuoy, HardHat, Building, BarChart3,
  TrendingUp, Calendar, CheckSquare, DollarSign, Users, FileText,
  Phone, Heart, Boxes,
  type LucideIcon,
} from 'lucide-react';

/**
 * id → LucideIcon. Keys are: appRegistry ids, vertical ids, and a few
 * navigational aliases. Adding a new key here is cheaper than reaching
 * into Lucide ad-hoc in components.
 */
export const APP_ICONS: Record<string, LucideIcon> = {
  // Home & Living
  property: Building2,
  cleaning: Sparkles,
  babysitter: Baby,
  pets: PawPrint,
  pet_service: PawPrint,
  flowers: Flower2,
  flower: Flower2,

  // Transport
  transfer: PlaneLanding,
  vehicle: Car,
  'fast-track': Plane,
  sim: Smartphone,
  exchange: ArrowLeftRight,

  // Leisure & Activities
  restaurant: Utensils,
  experience: Compass,
  yacht: Anchor,
  'water-activity': Waves,
  water_activity: Waves,
  event: CalendarDays,
  fitness: Dumbbell,

  // Health & Wellness
  beauty: Scissors,
  medical: Stethoscope,
  pharmacy: Pill,
  veterinary: Stethoscope,
  insurance: ShieldCheck,

  // Documents & Finance
  legal: Scale,
  education: GraduationCap,
  banking: Landmark,
  bank: Landmark,
  visa: Globe,
  relocate: Briefcase,
  tax: Calculator,
  'contract-ai': FileSearch,
  knowledge: BookOpen,

  // Home Maintenance (services-*)
  services: LayoutGrid,
  'services-laundry': Shirt,
  'services-plumbing': Wrench,
  'services-handyman': Hammer,
  'services-electrical': Plug,
  'services-ac': Wind,
  'services-locksmith': KeyRound,
  'services-gardening': TreePine,
  'services-pest': Bug,

  // Market & Delivery
  market: ShoppingBag,
  delivery: Bike,

  // Help
  'vip-concierge': Crown,
  sos: AlertTriangle,
  support: LifeBuoy,

  // Invest
  offplan: HardHat,
  resale: Building,
  developers: Building2,
  'invest-hub': TrendingUp,

  // Manage
  mc: Calendar,
  'mc-calendar': Calendar,
  'mc-tasks': CheckSquare,
  'mc-finance': DollarSign,
  'mc-reports': BarChart3,
  'mc-crm': Users,

  // Build / For Developers
  'developer-portal': Building2,
  'for-developers': FileText,
  newbuilds: HardHat,
  consultation: Phone,

  // Lifestyle
  'school-finder': GraduationCap,
  wedding: Heart,
  kids: Baby,
};

/** Returns Lucide component for the given id, with `Boxes` fallback. */
export function getAppIcon(id: string | undefined | null): LucideIcon {
  if (!id) return Boxes;
  return APP_ICONS[id] ?? Boxes;
}
