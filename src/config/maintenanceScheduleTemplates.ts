/**
 * Preventive Maintenance Schedule Templates
 * 
 * Industry-standard templates for property maintenance in tropical climates.
 * Based on best practices from Buildium, AppFolio, Breezeway.
 */

import {
  Snowflake, Droplets, Zap, Waves, Bug, SparklesIcon,
  Home, TreePine, Shield, CookingPot, type LucideIcon
} from 'lucide-react';

export type MaintenanceCategory =
  | 'ac' | 'plumbing' | 'electrical' | 'pool'
  | 'pest' | 'deep_clean' | 'roof' | 'garden'
  | 'security' | 'appliances';

export type MaintenanceFrequency =
  | 'weekly' | 'biweekly' | 'monthly'
  | 'quarterly' | 'biannual' | 'annual';

export interface MaintenanceTemplate {
  category: MaintenanceCategory;
  titleEn: string;
  titleRu: string;
  descriptionEn: string;
  descriptionRu: string;
  icon: LucideIcon;
  defaultFrequency: MaintenanceFrequency;
  estimatedCost: number;
  currency: string;
  /** Semantic color token */
  color: string;
  bgColor: string;
}

export const FREQUENCY_LABELS: Record<MaintenanceFrequency, { en: string; ru: string }> = {
  weekly:    { en: 'Weekly',      ru: 'Еженедельно' },
  biweekly:  { en: 'Biweekly',    ru: 'Раз в 2 недели' },
  monthly:   { en: 'Monthly',     ru: 'Ежемесячно' },
  quarterly: { en: 'Quarterly',   ru: 'Раз в квартал' },
  biannual:  { en: 'Every 6 mo',  ru: 'Раз в полгода' },
  annual:    { en: 'Annually',    ru: 'Ежегодно' },
};

export const MAINTENANCE_TEMPLATES: MaintenanceTemplate[] = [
  {
    category: 'ac',
    titleEn: 'AC Service',
    titleRu: 'Обслуживание кондиционера',
    descriptionEn: 'Filter cleaning, refrigerant check, drain inspection',
    descriptionRu: 'Чистка фильтров, проверка фреона, осмотр дренажа',
    icon: Snowflake,
    defaultFrequency: 'quarterly',
    estimatedCost: 2000,
    currency: 'THB',
    color: 'text-info',
    bgColor: 'bg-info/10',
  },
  {
    category: 'plumbing',
    titleEn: 'Plumbing Check',
    titleRu: 'Проверка сантехники',
    descriptionEn: 'Leak inspection, drain cleaning, water heater check',
    descriptionRu: 'Проверка протечек, чистка сифонов, осмотр бойлера',
    icon: Droplets,
    defaultFrequency: 'biannual',
    estimatedCost: 1500,
    currency: 'THB',
    color: 'text-info',
    bgColor: 'bg-info/10',
  },
  {
    category: 'electrical',
    titleEn: 'Electrical Inspection',
    titleRu: 'Проверка электрики',
    descriptionEn: 'RCD test, wiring check, sensor battery replacement',
    descriptionRu: 'Проверка УЗО, состояние проводки, замена батарей',
    icon: Zap,
    defaultFrequency: 'annual',
    estimatedCost: 2000,
    currency: 'THB',
    color: 'text-warning',
    bgColor: 'bg-warning/10',
  },
  {
    category: 'pool',
    titleEn: 'Pool Maintenance',
    titleRu: 'Обслуживание бассейна',
    descriptionEn: 'Water chemistry, filter cleaning, pump inspection',
    descriptionRu: 'Химия воды, чистка фильтров, проверка насоса',
    icon: Waves,
    defaultFrequency: 'weekly',
    estimatedCost: 500,
    currency: 'THB',
    color: 'text-info',
    bgColor: 'bg-info/10',
  },
  {
    category: 'pest',
    titleEn: 'Pest Control',
    titleRu: 'Борьба с вредителями',
    descriptionEn: 'Termite, cockroach, and ant treatment',
    descriptionRu: 'Обработка от термитов, тараканов, муравьёв',
    icon: Bug,
    defaultFrequency: 'quarterly',
    estimatedCost: 1500,
    currency: 'THB',
    color: 'text-destructive',
    bgColor: 'bg-destructive/10',
  },
  {
    category: 'deep_clean',
    titleEn: 'Deep Cleaning',
    titleRu: 'Генеральная уборка',
    descriptionEn: 'Deep clean, window washing, upholstery cleaning',
    descriptionRu: 'Глубокая чистка, мытьё окон, чистка мебели',
    icon: SparklesIcon,
    defaultFrequency: 'biannual',
    estimatedCost: 5000,
    currency: 'THB',
    color: 'text-success',
    bgColor: 'bg-success/10',
  },
  {
    category: 'roof',
    titleEn: 'Roof & Facade Inspection',
    titleRu: 'Осмотр крыши и фасада',
    descriptionEn: 'Leak check, gutter cleaning, facade wash',
    descriptionRu: 'Проверка протечек, чистка водостоков, мойка фасада',
    icon: Home,
    defaultFrequency: 'annual',
    estimatedCost: 2000,
    currency: 'THB',
    color: 'text-muted-foreground',
    bgColor: 'bg-muted',
  },
  {
    category: 'garden',
    titleEn: 'Garden Service',
    titleRu: 'Уход за садом',
    descriptionEn: 'Mowing, watering, tree trimming',
    descriptionRu: 'Стрижка, полив, обрезка деревьев',
    icon: TreePine,
    defaultFrequency: 'biweekly',
    estimatedCost: 1000,
    currency: 'THB',
    color: 'text-success',
    bgColor: 'bg-success/10',
  },
  {
    category: 'security',
    titleEn: 'Security Check',
    titleRu: 'Проверка безопасности',
    descriptionEn: 'Locks, cameras, alarm, fire extinguishers',
    descriptionRu: 'Замки, камеры, сигнализация, огнетушители',
    icon: Shield,
    defaultFrequency: 'biannual',
    estimatedCost: 1000,
    currency: 'THB',
    color: 'text-primary',
    bgColor: 'bg-primary/10',
  },
  {
    category: 'appliances',
    titleEn: 'Appliance Service',
    titleRu: 'Обслуживание техники',
    descriptionEn: 'Washing machine, fridge, oven inspection',
    descriptionRu: 'Чистка стиралки, проверка холодильника, духовки',
    icon: CookingPot,
    defaultFrequency: 'annual',
    estimatedCost: 3000,
    currency: 'THB',
    color: 'text-accent-foreground',
    bgColor: 'bg-accent',
  },
];

export function getTemplateByCategory(cat: MaintenanceCategory): MaintenanceTemplate | undefined {
  return MAINTENANCE_TEMPLATES.find(t => t.category === cat);
}
