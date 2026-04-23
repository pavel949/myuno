/**
 * Home quick actions: persona catalogs, merge scoring, and group metadata
 * for investor / business primary layouts.
 */
import type { ElementType } from 'react';
import {
  Anchor,
  Plane,
  Flower2,
  Home,
  Utensils,
  Compass,
  Stethoscope,
  ShoppingBag,
  MoreHorizontal,
  Scale,
  Shield,
  Sparkles,
  Car,
  GraduationCap,
  Briefcase,
  Banknote,
  Calendar,
  Wrench,
  Building2,
  Building,
  Key,
  Droplets,
  TrendingUp,
  Users,
  BarChart3,
  ClipboardList,
  Lock,
  LayoutDashboard,
  Baby,
  Heart,
  Music,
  Dumbbell,
  Laptop,
  Wifi,
  PawPrint,
  Calculator,
  Store,
  PenLine,
  BookOpen,
  PhoneCall,
  LayoutGrid,
  Pill,
  CalendarDays,
} from 'lucide-react';
import { APP_ROUTES } from '@/lib/config/routes';
import type { UserPersona } from '@/hooks/useUserPersonas';

export type QuickActionGroupId =
  | 'capital'
  | 'diligence'
  | 'company_setup'
  | 'workspace'
  | 'ops'
  | 'growth'
  | 'general';

export interface CatalogQuickAction {
  id: string;
  icon: ElementType;
  label: string;
  labelRu: string;
  /** Thai — optional; often resolved via `APP_REGISTRY` + `getAppEntryLabel` */
  labelTh?: string;
  path: string;
  isUrgent?: boolean;
  accentColor?: string;
  requiresFullAccess?: boolean;
  groupId: QuickActionGroupId;
  intents?: string[];
}

export const GROUP_LABELS: Record<QuickActionGroupId, { ru: string; en: string; th: string }> = {
  capital: { ru: 'Капитал', en: 'Capital', th: 'เงินทุน' },
  diligence: {
    ru: 'Сервисы сделки и аналитика',
    en: 'Diligence & deal support',
    th: 'วิเคราะห์ดีล',
  },
  company_setup: {
    ru: 'Компания и комплаенс',
    en: 'Company & compliance',
    th: 'บริษัทและกฎระเบียบ',
  },
  workspace: { ru: 'Помещение и работа', en: 'Workspace', th: 'พื้นที่ทำงาน' },
  ops: { ru: 'Эксплуатация', en: 'Operations', th: 'ปฏิบัติการ' },
  growth: { ru: 'Рост и партнёрства', en: 'Growth', th: 'การเติบโต' },
  general: { ru: 'Быстрые действия', en: 'Quick actions', th: 'ทางลัด' },
};

const PRIMARY_PERSONA_SCORE_BOOST = 14;
const DUPLICATE_STACK_BONUS = 5;
const MAX_QUICK_ACTIONS = 7;
const MAX_PER_GROUP_WHEN_GROUPED = 2;

const GROUP_FILL_ORDER: QuickActionGroupId[] = [
  'capital',
  'diligence',
  'company_setup',
  'workspace',
  'ops',
  'growth',
  'general',
];

export const TOURIST_ACTIONS: CatalogQuickAction[] = [
  { id: 'property', icon: Home, label: 'Housing', labelRu: 'Жильё', path: APP_ROUTES.PROPERTY, accentColor: 'hsl(var(--brand-navy-700))', groupId: 'general' },
  { id: 'transfer', icon: Plane, label: 'Transfer', labelRu: 'Трансфер', path: APP_ROUTES.AIRPORT_TRANSFER, accentColor: 'hsl(var(--brand-navy-700))', groupId: 'general' },
  { id: 'flowers', icon: Flower2, label: 'Flowers', labelRu: 'Цветы', path: APP_ROUTES.FLOWERS, accentColor: 'hsl(var(--accent))', groupId: 'general' },
  { id: 'delivery', icon: Droplets, label: 'Delivery', labelRu: 'Доставка', path: `${APP_ROUTES.MARKET}?category=groceries`, accentColor: 'hsl(var(--brand-navy-700))', groupId: 'general' },
  { id: 'transport', icon: Car, label: 'Transport', labelRu: 'Транспорт', path: APP_ROUTES.TRANSPORT, accentColor: 'hsl(var(--accent))', groupId: 'general' },
  { id: 'experiences', icon: Compass, label: 'Experiences', labelRu: 'Впечатления', path: APP_ROUTES.EXPERIENCES, accentColor: 'hsl(var(--brand-navy-700))', groupId: 'general' },
  { id: 'yachts', icon: Anchor, label: 'Charters', labelRu: 'Чартер', path: APP_ROUTES.YACHTS, accentColor: 'hsl(var(--brand-navy-700))', groupId: 'general' },
  { id: 'restaurants', icon: Utensils, label: 'Food', labelRu: 'Еда', path: APP_ROUTES.RESTAURANTS, accentColor: 'hsl(var(--accent))', groupId: 'general' },
  { id: 'events', icon: CalendarDays, label: 'Events', labelRu: 'События', path: APP_ROUTES.EVENTS, accentColor: 'hsl(var(--accent))', groupId: 'general' },
];

export const RESIDENT_ACTIONS: CatalogQuickAction[] = [
  { id: 'visa', icon: Briefcase, label: 'Visa', labelRu: 'Визы', path: APP_ROUTES.VISA_IMMIGRATION, accentColor: 'hsl(var(--brand-navy-700))', groupId: 'general' },
  { id: 'property', icon: Home, label: 'Property', labelRu: 'Жильё', path: APP_ROUTES.PROPERTY, accentColor: 'hsl(var(--brand-navy-700))', groupId: 'general' },
  { id: 'education', icon: GraduationCap, label: 'Education', labelRu: 'Обучение', path: APP_ROUTES.EDUCATION, accentColor: 'hsl(var(--accent))', groupId: 'general' },
  { id: 'medical', icon: Stethoscope, label: 'Medical', labelRu: 'Медицина', path: APP_ROUTES.MEDICAL, accentColor: 'hsl(var(--accent))', groupId: 'general' },
  { id: 'pharmacy', icon: Pill, label: 'Pharmacy', labelRu: 'Аптека', path: APP_ROUTES.PHARMACY, accentColor: 'hsl(var(--success))', groupId: 'general' },
  { id: 'legal', icon: Scale, label: 'Legal', labelRu: 'Юрист', path: APP_ROUTES.LEGAL, accentColor: 'hsl(var(--brand-navy-700))', groupId: 'general' },
  { id: 'insurance', icon: Shield, label: 'Insurance', labelRu: 'Страховка', path: APP_ROUTES.INSURANCE, accentColor: 'hsl(var(--brand-navy-700))', groupId: 'general' },
  { id: 'banking', icon: Banknote, label: 'Banking', labelRu: 'Банки', path: APP_ROUTES.BANKING, accentColor: 'hsl(var(--brand-navy-700))', groupId: 'general' },
];

export const OWNER_ACTIONS: CatalogQuickAction[] = [
  { id: 'my-properties', icon: Key, label: 'My Properties', labelRu: 'Мои объекты', path: APP_ROUTES.MC, accentColor: 'hsl(var(--brand-navy-700))', groupId: 'general' },
  { id: 'owner-crm', icon: Users, label: 'CRM', labelRu: 'CRM', path: APP_ROUTES.MC_CRM_DASHBOARD, accentColor: 'hsl(var(--brand-navy-700))', requiresFullAccess: true, groupId: 'general' },
  { id: 'owner-calendar', icon: Calendar, label: 'Calendar', labelRu: 'Календарь', path: APP_ROUTES.MC_CALENDAR, accentColor: 'hsl(var(--brand-navy-700))', requiresFullAccess: true, groupId: 'general' },
  { id: 'owner-finance', icon: BarChart3, label: 'Finance', labelRu: 'Финансы', path: APP_ROUTES.MC_FINANCE, accentColor: 'hsl(var(--brand-navy-700))', requiresFullAccess: true, groupId: 'general' },
  { id: 'owner-tasks', icon: ClipboardList, label: 'Tasks', labelRu: 'Задачи', path: APP_ROUTES.MC_TASKS, accentColor: 'hsl(var(--accent))', requiresFullAccess: true, groupId: 'general' },
  { id: 'cleaning', icon: Sparkles, label: 'Cleaning', labelRu: 'Клининг', path: APP_ROUTES.CLEANING, accentColor: 'hsl(var(--brand-navy-700))', groupId: 'general' },
  { id: 'services', icon: Wrench, label: 'Services', labelRu: 'Сервис', path: APP_ROUTES.SERVICES, accentColor: 'hsl(var(--accent))', groupId: 'general' },
];

export const INVESTOR_ACTIONS: CatalogQuickAction[] = [
  { id: 'invest', icon: TrendingUp, label: 'Investment', labelRu: 'Инвестиции', path: APP_ROUTES.INVEST, accentColor: 'hsl(var(--brand-navy-700))', groupId: 'capital', intents: ['deploy_capital'] },
  { id: 'offplan', icon: Building2, label: 'Off-Plan', labelRu: 'Новостройки', path: APP_ROUTES.OFFPLAN, accentColor: 'hsl(var(--brand-navy-700))', groupId: 'capital', intents: ['deploy_capital'] },
  { id: 'property-buy', icon: Building, label: 'Buy Property', labelRu: 'Купить', path: `${APP_ROUTES.PROPERTY}?mode=buy`, accentColor: 'hsl(var(--brand-navy-700))', groupId: 'capital', intents: ['deploy_capital'] },
  { id: 'legal-invest', icon: Scale, label: 'Legal & tax', labelRu: 'Право и налоги', path: `${APP_ROUTES.LEGAL}?context=invest`, accentColor: 'hsl(var(--accent))', groupId: 'diligence', intents: ['deal_support'] },
  { id: 'banking', icon: Briefcase, label: 'Banking', labelRu: 'Банкинг', path: APP_ROUTES.BANKING, accentColor: 'hsl(var(--brand-navy-700))', groupId: 'diligence', intents: ['deal_support'] },
  { id: 'insurance', icon: Shield, label: 'Insurance', labelRu: 'Страховка', path: APP_ROUTES.INSURANCE, accentColor: 'hsl(var(--brand-navy-700))', groupId: 'diligence', intents: ['deal_support'] },
  { id: 'market-data', icon: BarChart3, label: 'Market Data', labelRu: 'Рынок', path: APP_ROUTES.INVEST, accentColor: 'hsl(var(--accent))', groupId: 'diligence', intents: ['deploy_capital'] },
  { id: 'roi-calc', icon: Calculator, label: 'ROI Calc', labelRu: 'ROI', path: `${APP_ROUTES.PROPERTY}?tab=roi`, accentColor: 'hsl(var(--brand-navy-700))', groupId: 'diligence', intents: ['deploy_capital'] },
];

export const FAMILY_ACTIONS: CatalogQuickAction[] = [
  { id: 'education', icon: GraduationCap, label: 'Schools', labelRu: 'Школы', path: APP_ROUTES.EDUCATION, accentColor: 'hsl(var(--accent))', groupId: 'general' },
  { id: 'medical', icon: Stethoscope, label: 'Pediatrics', labelRu: 'Педиатр', path: APP_ROUTES.MEDICAL, accentColor: 'hsl(var(--accent))', groupId: 'general' },
  { id: 'pharmacy', icon: Pill, label: 'Pharmacy', labelRu: 'Аптека', path: APP_ROUTES.PHARMACY, accentColor: 'hsl(var(--success))', groupId: 'general' },
  { id: 'baby', icon: Baby, label: 'Nanny', labelRu: 'Няня', path: `${APP_ROUTES.SERVICES}?category=childcare`, accentColor: 'hsl(var(--accent))', groupId: 'general' },
  { id: 'experiences', icon: Compass, label: 'Kids Fun', labelRu: 'Для детей', path: `${APP_ROUTES.EXPERIENCES}?tag=family`, accentColor: 'hsl(var(--brand-navy-700))', groupId: 'general' },
  { id: 'restaurants', icon: Utensils, label: 'Family Dining', labelRu: 'Рестораны', path: `${APP_ROUTES.RESTAURANTS}?tag=family`, accentColor: 'hsl(var(--accent))', groupId: 'general' },
  { id: 'property', icon: Home, label: 'Housing', labelRu: 'Жильё', path: APP_ROUTES.PROPERTY, accentColor: 'hsl(var(--brand-navy-700))', groupId: 'general' },
  { id: 'insurance', icon: Shield, label: 'Insurance', labelRu: 'Страховка', path: APP_ROUTES.INSURANCE, accentColor: 'hsl(var(--brand-navy-700))', groupId: 'general' },
];

export const COUPLE_ACTIONS: CatalogQuickAction[] = [
  { id: 'spa', icon: Sparkles, label: 'Spa', labelRu: 'Спа', path: `${APP_ROUTES.BEAUTY}?category=spa`, accentColor: 'hsl(var(--accent))', groupId: 'general' },
  { id: 'restaurants', icon: Utensils, label: 'Dining', labelRu: 'Рестораны', path: `${APP_ROUTES.RESTAURANTS}?tag=romantic`, accentColor: 'hsl(var(--accent))', groupId: 'general' },
  { id: 'yachts', icon: Anchor, label: 'Yacht', labelRu: 'Яхта', path: APP_ROUTES.YACHTS, accentColor: 'hsl(var(--brand-navy-700))', groupId: 'general' },
  { id: 'experiences', icon: Heart, label: 'Romance', labelRu: 'Романтика', path: `${APP_ROUTES.EXPERIENCES}?tag=romantic`, accentColor: 'hsl(var(--accent))', groupId: 'general' },
  { id: 'events', icon: CalendarDays, label: 'Events', labelRu: 'События', path: APP_ROUTES.EVENTS, accentColor: 'hsl(var(--brand-navy-700))', groupId: 'general' },
  { id: 'flowers', icon: Flower2, label: 'Flowers', labelRu: 'Цветы', path: APP_ROUTES.FLOWERS, accentColor: 'hsl(var(--accent))', groupId: 'general' },
  { id: 'property', icon: Home, label: 'Villas', labelRu: 'Виллы', path: `${APP_ROUTES.PROPERTY}?type=villa`, accentColor: 'hsl(var(--brand-navy-700))', groupId: 'general' },
];

export const NIGHTLIFE_ACTIONS: CatalogQuickAction[] = [
  { id: 'clubs', icon: Music, label: 'Clubs', labelRu: 'Клубы', path: `${APP_ROUTES.EXPERIENCES}?tag=nightlife`, accentColor: 'hsl(var(--brand-navy-700))', groupId: 'general' },
  { id: 'events', icon: CalendarDays, label: 'Events', labelRu: 'События', path: APP_ROUTES.EVENTS, accentColor: 'hsl(var(--accent))', groupId: 'general' },
  { id: 'yachts', icon: Anchor, label: 'Yacht Party', labelRu: 'Яхт-пати', path: APP_ROUTES.YACHTS, accentColor: 'hsl(var(--brand-navy-700))', groupId: 'general' },
  { id: 'restaurants', icon: Utensils, label: 'Late Dining', labelRu: 'Рестораны', path: `${APP_ROUTES.RESTAURANTS}?tag=late`, accentColor: 'hsl(var(--accent))', groupId: 'general' },
  { id: 'transport', icon: Car, label: 'Taxi', labelRu: 'Такси', path: APP_ROUTES.TRANSPORT, accentColor: 'hsl(var(--accent))', groupId: 'general' },
  { id: 'beauty', icon: Sparkles, label: 'Beauty', labelRu: 'Красота', path: APP_ROUTES.BEAUTY, accentColor: 'hsl(var(--accent))', groupId: 'general' },
  { id: 'spa', icon: Heart, label: 'Recovery', labelRu: 'Восстановление', path: `${APP_ROUTES.BEAUTY}?category=spa`, accentColor: 'hsl(var(--brand-navy-700))', groupId: 'general' },
];

export const ACTIVE_ACTIONS: CatalogQuickAction[] = [
  { id: 'fitness', icon: Dumbbell, label: 'Fitness', labelRu: 'Фитнес', path: APP_ROUTES.FITNESS, accentColor: 'hsl(var(--accent))', groupId: 'general' },
  { id: 'experiences', icon: Compass, label: 'Surfing', labelRu: 'Серфинг', path: `${APP_ROUTES.EXPERIENCES}?tag=surf`, accentColor: 'hsl(var(--brand-navy-700))', groupId: 'general' },
  { id: 'mma', icon: Shield, label: 'Muay Thai', labelRu: 'Муай-тай', path: `${APP_ROUTES.EXPERIENCES}?tag=mma`, accentColor: 'hsl(var(--accent))', groupId: 'general' },
  { id: 'diving', icon: Anchor, label: 'Diving', labelRu: 'Дайвинг', path: `${APP_ROUTES.EXPERIENCES}?tag=diving`, accentColor: 'hsl(var(--brand-navy-700))', groupId: 'general' },
  { id: 'events', icon: CalendarDays, label: 'Events', labelRu: 'События', path: APP_ROUTES.EVENTS, accentColor: 'hsl(var(--accent))', groupId: 'general' },
  { id: 'bike', icon: Car, label: 'Bike Rent', labelRu: 'Байк', path: `${APP_ROUTES.TRANSPORT}?type=bike`, accentColor: 'hsl(var(--brand-navy-700))', groupId: 'general' },
  { id: 'medical', icon: Stethoscope, label: 'Sports Med', labelRu: 'Спортмед', path: APP_ROUTES.MEDICAL, accentColor: 'hsl(var(--brand-navy-700))', groupId: 'general' },
];

export const BUSINESS_ACTIONS: CatalogQuickAction[] = [
  { id: 'legal-business', icon: Scale, label: 'Legal', labelRu: 'Юрист', path: `${APP_ROUTES.LEGAL}?context=business`, accentColor: 'hsl(var(--brand-navy-700))', groupId: 'company_setup', intents: ['incorporate_run', 'deal_support'] },
  { id: 'banking', icon: Banknote, label: 'Banking', labelRu: 'Банки', path: APP_ROUTES.BANKING, accentColor: 'hsl(var(--brand-navy-700))', groupId: 'company_setup', intents: ['deal_support'] },
  { id: 'visa', icon: Briefcase, label: 'Work Permit', labelRu: 'Разрешения', path: APP_ROUTES.VISA_IMMIGRATION, accentColor: 'hsl(var(--accent))', groupId: 'company_setup', intents: ['incorporate_run'] },
  { id: 'corp-services', icon: Calculator, label: 'Accounting', labelRu: 'Бухгалтерия', path: `${APP_ROUTES.SERVICES}?category=business`, accentColor: '#78716C', groupId: 'company_setup', intents: ['incorporate_run'] },
  { id: 'workspace-office', icon: Building, label: 'Office lease', labelRu: 'Офис долгосрок', path: `${APP_ROUTES.PROPERTY}?type=office`, accentColor: 'hsl(var(--accent))', groupId: 'workspace', intents: ['operate_asset'] },
  { id: 'workspace-retail', icon: Store, label: 'Retail space', labelRu: 'Ритейл', path: `${APP_ROUTES.PROPERTY}?type=commercial`, accentColor: '#EA580C', groupId: 'workspace', intents: ['operate_asset'] },
  { id: 'coworking', icon: Laptop, label: 'Coworking', labelRu: 'Коворкинг', path: `${APP_ROUTES.SERVICES}?category=coworking`, accentColor: 'hsl(var(--brand-navy-700))', groupId: 'workspace', intents: ['operate_asset'] },
  { id: 'workspace-flex', icon: LayoutGrid, label: 'Flex desk', labelRu: 'Гибкий стол', path: `${APP_ROUTES.SERVICES}?category=coworking&term=flex`, accentColor: '#6366F1', groupId: 'workspace', intents: ['operate_asset'] },
  { id: 'insurance', icon: Shield, label: 'Insurance', labelRu: 'Страховка', path: APP_ROUTES.INSURANCE, accentColor: 'hsl(var(--brand-navy-700))', groupId: 'ops', intents: ['operate_asset'] },
  { id: 'office-services', icon: Wrench, label: 'Facility services', labelRu: 'Сервис офиса', path: `${APP_ROUTES.SERVICES}?category=maintenance`, accentColor: 'hsl(var(--accent))', groupId: 'ops', intents: ['operate_asset'] },
  { id: 'provider-growth', icon: Store, label: 'Become partner', labelRu: 'Партнёрство', path: APP_ROUTES.FOR_LOCAL_SERVICE_PROVIDERS, accentColor: '#22C55E', groupId: 'growth', intents: ['growth'] },
];

export const NOMAD_ACTIONS: CatalogQuickAction[] = [
  { id: 'wifi', icon: Wifi, label: 'SIM & WiFi', labelRu: 'SIM и WiFi', path: `${APP_ROUTES.SERVICES}?category=connectivity`, accentColor: 'hsl(var(--brand-navy-700))', groupId: 'general' },
  { id: 'property', icon: Home, label: 'Long-term', labelRu: 'Долгосрок', path: `${APP_ROUTES.PROPERTY}?mode=long-term`, accentColor: 'hsl(var(--brand-navy-700))', groupId: 'general' },
  { id: 'restaurants', icon: Utensils, label: 'Cafés', labelRu: 'Кафе', path: `${APP_ROUTES.RESTAURANTS}?tag=cafe`, accentColor: 'hsl(var(--accent))', groupId: 'general' },
  { id: 'coworking', icon: Laptop, label: 'Coworking', labelRu: 'Коворкинг', path: `${APP_ROUTES.SERVICES}?category=coworking`, accentColor: 'hsl(var(--brand-navy-700))', groupId: 'general' },
  { id: 'visa', icon: Briefcase, label: 'Visa', labelRu: 'Виза', path: APP_ROUTES.VISA_IMMIGRATION, accentColor: 'hsl(var(--accent))', groupId: 'general' },
  { id: 'fitness', icon: Dumbbell, label: 'Fitness', labelRu: 'Фитнес', path: APP_ROUTES.FITNESS, accentColor: 'hsl(var(--accent))', groupId: 'general' },
  { id: 'banking', icon: Banknote, label: 'Banking', labelRu: 'Банки', path: APP_ROUTES.BANKING, accentColor: 'hsl(var(--brand-navy-700))', groupId: 'general' },
  { id: 'knowledge', icon: BookOpen, label: 'Knowledge', labelRu: 'База знаний', path: APP_ROUTES.KNOWLEDGE, accentColor: '#78716C', groupId: 'general' },
];

export const PET_OWNER_ACTIONS: CatalogQuickAction[] = [
  { id: 'pets', icon: PawPrint, label: 'Pet Services', labelRu: 'Питомцы', path: APP_ROUTES.PETS, accentColor: 'hsl(var(--accent))', groupId: 'general' },
  { id: 'veterinary', icon: Stethoscope, label: 'Veterinary', labelRu: 'Ветеринар', path: `${APP_ROUTES.PETS}?category=veterinary`, accentColor: 'hsl(var(--accent))', groupId: 'general' },
  { id: 'grooming', icon: Sparkles, label: 'Grooming', labelRu: 'Груминг', path: `${APP_ROUTES.PETS}?category=grooming`, accentColor: 'hsl(var(--brand-navy-700))', groupId: 'general' },
  { id: 'pet-hotel', icon: Home, label: 'Pet Hotel', labelRu: 'Отель', path: `${APP_ROUTES.PETS}?category=hotel`, accentColor: 'hsl(var(--brand-navy-700))', groupId: 'general' },
  { id: 'pet-transport', icon: Car, label: 'Transport', labelRu: 'Перевозка', path: `${APP_ROUTES.PETS}?category=transport`, accentColor: 'hsl(var(--brand-navy-700))', groupId: 'general' },
  { id: 'pet-shop', icon: ShoppingBag, label: 'Pet Shop', labelRu: 'Зоомагазин', path: `${APP_ROUTES.MARKET}?category=pets`, accentColor: 'hsl(var(--brand-navy-700))', groupId: 'general' },
  { id: 'insurance', icon: Shield, label: 'Pet Insurance', labelRu: 'Страховка', path: `${APP_ROUTES.INSURANCE}?type=pet`, accentColor: 'hsl(var(--accent))', groupId: 'general' },
];

export const REAL_ESTATE_DEVELOPER_ACTIONS: CatalogQuickAction[] = [
  { id: 'dev-landing', icon: PenLine, label: 'List a project', labelRu: 'Разместить проект', path: APP_ROUTES.FOR_REAL_ESTATE_DEVELOPERS, accentColor: '#0EA5E9', groupId: 'growth' },
  { id: 'dev-portal', icon: LayoutDashboard, label: 'My cabinet', labelRu: 'Мой кабинет', path: APP_ROUTES.DEVELOPER_PORTAL, accentColor: 'hsl(var(--brand-navy-700))', groupId: 'growth' },
  { id: 'dev-leads', icon: Users, label: 'My leads', labelRu: 'Мои лиды', path: APP_ROUTES.DEVELOPER_PORTAL_LEADS, accentColor: 'hsl(var(--brand-navy-700))', groupId: 'growth' },
  { id: 'dev-projects', icon: Building2, label: 'My projects', labelRu: 'Мои проекты', path: `${APP_ROUTES.DEVELOPER_PORTAL}/projects`, accentColor: 'hsl(var(--brand-navy-700))', groupId: 'general' },
  { id: 'developers-dir', icon: BookOpen, label: 'All developers', labelRu: 'Все застройщики', path: APP_ROUTES.DEVELOPERS, accentColor: '#78716C', groupId: 'general' },
  { id: 'consultation', icon: PhoneCall, label: 'Book a call', labelRu: 'Записаться на звонок', path: APP_ROUTES.PROPERTY_CONSULTATION, accentColor: 'hsl(var(--accent))', groupId: 'general' },
];

export const LOCAL_SERVICES_PROVIDER_ACTIONS: CatalogQuickAction[] = [
  { id: 'provider-landing', icon: Store, label: 'For providers', labelRu: 'Партнёрам', path: APP_ROUTES.FOR_LOCAL_SERVICE_PROVIDERS, accentColor: '#22C55E', groupId: 'general' },
  { id: 'vendor-join', icon: Wrench, label: 'Join', labelRu: 'Подключиться', path: APP_ROUTES.VENDOR_JOIN, accentColor: 'hsl(var(--brand-navy-700))', groupId: 'general' },
  { id: 'become-partner', icon: Shield, label: 'Partner', labelRu: 'Партнёрство', path: APP_ROUTES.BECOME_PARTNER, accentColor: 'hsl(var(--brand-navy-700))', groupId: 'general' },
  { id: 'list-with-us', icon: ClipboardList, label: 'List', labelRu: 'Разместить', path: APP_ROUTES.LIST_WITH_US, accentColor: 'hsl(var(--accent))', groupId: 'general' },
  { id: 'services-cat', icon: Sparkles, label: 'Services', labelRu: 'Услуги', path: APP_ROUTES.SERVICES, accentColor: 'hsl(var(--accent))', groupId: 'general' },
  { id: 'discover', icon: Compass, label: 'Discover', labelRu: 'Каталог', path: APP_ROUTES.DISCOVER, accentColor: 'hsl(var(--brand-navy-700))', groupId: 'general' },
];

export const RELOCATION_ACTIONS: CatalogQuickAction[] = [
  { id: 'relocate', icon: Compass, label: 'Roadmap', labelRu: 'Дорожная карта', path: APP_ROUTES.RELOCATE, accentColor: '#6366F1', groupId: 'general' },
  { id: 'visa', icon: Briefcase, label: 'Visa', labelRu: 'Виза', path: APP_ROUTES.VISA_IMMIGRATION, accentColor: 'hsl(var(--brand-navy-700))', groupId: 'general' },
  { id: 'property', icon: Home, label: 'Housing', labelRu: 'Жильё', path: `${APP_ROUTES.PROPERTY}?mode=long-term`, accentColor: 'hsl(var(--brand-navy-700))', groupId: 'general' },
  { id: 'education', icon: GraduationCap, label: 'Schools', labelRu: 'Школы', path: APP_ROUTES.EDUCATION, accentColor: 'hsl(var(--accent))', groupId: 'general' },
  { id: 'legal', icon: Scale, label: 'Legal', labelRu: 'Юрист', path: APP_ROUTES.LEGAL, accentColor: 'hsl(var(--brand-navy-700))', groupId: 'general' },
  { id: 'banking', icon: Banknote, label: 'Banking', labelRu: 'Банки', path: APP_ROUTES.BANKING, accentColor: 'hsl(var(--brand-navy-700))', groupId: 'general' },
  { id: 'medical', icon: Stethoscope, label: 'Medical', labelRu: 'Медицина', path: APP_ROUTES.MEDICAL, accentColor: 'hsl(var(--accent))', groupId: 'general' },
  { id: 'insurance', icon: Shield, label: 'Insurance', labelRu: 'Страховка', path: APP_ROUTES.INSURANCE, accentColor: 'hsl(var(--brand-navy-700))', groupId: 'general' },
  { id: 'knowledge', icon: BookOpen, label: 'Knowledge', labelRu: 'База знаний', path: APP_ROUTES.KNOWLEDGE, accentColor: '#78716C', groupId: 'general' },
];

export const VENDOR_ACTIONS: CatalogQuickAction[] = [
  { id: 'vendor-dashboard', icon: Building2, label: 'Dashboard', labelRu: 'Панель', path: APP_ROUTES.VENDOR, accentColor: 'hsl(var(--brand-navy-700))', groupId: 'general' },
  { id: 'vendor-orders', icon: ShoppingBag, label: 'Orders', labelRu: 'Заказы', path: APP_ROUTES.VENDOR_BOOKINGS, accentColor: 'hsl(var(--accent))', groupId: 'general' },
  { id: 'vendor-services', icon: Wrench, label: 'Services', labelRu: 'Услуги', path: APP_ROUTES.VENDOR_SERVICES, accentColor: 'hsl(var(--accent))', groupId: 'general' },
  { id: 'vendor-calendar', icon: Calendar, label: 'Calendar', labelRu: 'Календарь', path: `${APP_ROUTES.VENDOR}/calendar`, accentColor: 'hsl(var(--brand-navy-700))', groupId: 'general' },
  { id: 'market', icon: ShoppingBag, label: 'Market', labelRu: 'Маркет', path: APP_ROUTES.MARKET, accentColor: 'hsl(var(--accent))', groupId: 'general' },
  { id: 'banking', icon: Banknote, label: 'Banking', labelRu: 'Банкинг', path: APP_ROUTES.BANKING, accentColor: 'hsl(var(--brand-navy-700))', groupId: 'general' },
];

export const ADMIN_ACTIONS: CatalogQuickAction[] = [
  { id: 'admin-dashboard', icon: Shield, label: 'Admin', labelRu: 'Админ', path: APP_ROUTES.ADMIN, accentColor: 'hsl(var(--brand-navy-700))', groupId: 'general' },
  { id: 'team-dashboard', icon: Building2, label: 'Team', labelRu: 'Команда', path: APP_ROUTES.TEAM, accentColor: 'hsl(var(--brand-navy-700))', groupId: 'general' },
  { id: 'services', icon: Wrench, label: 'Services', labelRu: 'Сервисы', path: APP_ROUTES.SERVICES, accentColor: 'hsl(var(--accent))', groupId: 'general' },
  { id: 'property', icon: Home, label: 'Property', labelRu: 'Жильё', path: APP_ROUTES.PROPERTY, accentColor: 'hsl(var(--brand-navy-700))', groupId: 'general' },
  { id: 'market', icon: ShoppingBag, label: 'Market', labelRu: 'Маркет', path: APP_ROUTES.MARKET, accentColor: 'hsl(var(--accent))', groupId: 'general' },
  { id: 'legal', icon: Scale, label: 'Legal', labelRu: 'Юрист', path: APP_ROUTES.LEGAL, accentColor: 'hsl(var(--brand-navy-700))', groupId: 'general' },
];

export const DEFAULT_ACTIONS: CatalogQuickAction[] = [
  { id: 'property', icon: Home, label: 'Property', labelRu: 'Жильё', path: APP_ROUTES.PROPERTY, accentColor: 'hsl(var(--brand-navy-700))', groupId: 'general' },
  { id: 'transfer', icon: Plane, label: 'Transfer', labelRu: 'Трансфер', path: APP_ROUTES.AIRPORT_TRANSFER, accentColor: 'hsl(var(--brand-navy-700))', groupId: 'general' },
  { id: 'flowers', icon: Flower2, label: 'Flowers', labelRu: 'Цветы', path: APP_ROUTES.FLOWERS, accentColor: 'hsl(var(--accent))', groupId: 'general' },
  { id: 'transport', icon: Car, label: 'Transport', labelRu: 'Транспорт', path: APP_ROUTES.TRANSPORT, accentColor: 'hsl(var(--accent))', groupId: 'general' },
  { id: 'experiences', icon: Compass, label: 'Experiences', labelRu: 'Впечатления', path: APP_ROUTES.EXPERIENCES, accentColor: 'hsl(var(--brand-navy-700))', groupId: 'general' },
  { id: 'restaurants', icon: Utensils, label: 'Food', labelRu: 'Еда', path: APP_ROUTES.RESTAURANTS, accentColor: 'hsl(var(--accent))', groupId: 'general' },
  { id: 'beauty', icon: Sparkles, label: 'Beauty', labelRu: 'Красота', path: APP_ROUTES.BEAUTY, accentColor: 'hsl(var(--accent))', groupId: 'general' },
  { id: 'medical', icon: Stethoscope, label: 'Medical', labelRu: 'Медицина', path: APP_ROUTES.MEDICAL, accentColor: 'hsl(var(--brand-navy-700))', groupId: 'general' },
];

const PERSONA_TO_ACTIONS: Record<UserPersona, CatalogQuickAction[]> = {
  tourist: TOURIST_ACTIONS,
  resident: RESIDENT_ACTIONS,
  relocation: RELOCATION_ACTIONS,
  property_owner: OWNER_ACTIONS,
  investor: INVESTOR_ACTIONS,
  family: FAMILY_ACTIONS,
  couple: COUPLE_ACTIONS,
  nightlife: NIGHTLIFE_ACTIONS,
  active: ACTIVE_ACTIONS,
  business: BUSINESS_ACTIONS,
  nomad: NOMAD_ACTIONS,
  pet_owner: PET_OWNER_ACTIONS,
  real_estate_developer: REAL_ESTATE_DEVELOPER_ACTIONS,
  local_services_provider: LOCAL_SERVICES_PROVIDER_ACTIONS,
};

function actionsForPersona(persona: UserPersona, personas: UserPersona[]): CatalogQuickAction[] {
  if (persona === 'business' && personas.includes('local_services_provider')) {
    return BUSINESS_ACTIONS.filter((a) => a.id !== 'provider-growth');
  }
  return PERSONA_TO_ACTIONS[persona] ?? [];
}

function scoreMergedActions(personas: UserPersona[]): Map<string, { action: CatalogQuickAction; score: number }> {
  const primary = personas[0];
  const actionScores = new Map<string, { action: CatalogQuickAction; score: number }>();

  for (const persona of personas) {
    const actions = actionsForPersona(persona, personas);
    const primaryBoost = persona === primary ? PRIMARY_PERSONA_SCORE_BOOST : 0;
    actions.forEach((action, index) => {
      const positionScore = actions.length - index + primaryBoost;
      const existing = actionScores.get(action.id);
      if (existing) {
        existing.score += positionScore + DUPLICATE_STACK_BONUS;
      } else {
        actionScores.set(action.id, { action, score: positionScore });
      }
    });
  }

  return actionScores;
}

function pickGroupedInvestorBusiness(
  scored: Map<string, { action: CatalogQuickAction; score: number }>,
): CatalogQuickAction[] {
  const byGroup = new Map<QuickActionGroupId, { action: CatalogQuickAction; score: number }[]>();
  for (const { action, score } of scored.values()) {
    const g = action.groupId;
    const list = byGroup.get(g) ?? [];
    list.push({ action, score });
    byGroup.set(g, list);
  }
  for (const list of byGroup.values()) {
    list.sort((a, b) => b.score - a.score);
  }

  const picked = new Set<string>();
  const ordered: CatalogQuickAction[] = [];

  for (const gid of GROUP_FILL_ORDER) {
    if (ordered.length >= MAX_QUICK_ACTIONS) break;
    const list = byGroup.get(gid);
    if (!list?.length) continue;
    let n = 0;
    for (const { action, score: _s } of list) {
      if (ordered.length >= MAX_QUICK_ACTIONS) break;
      if (n >= MAX_PER_GROUP_WHEN_GROUPED) break;
      if (picked.has(action.id)) continue;
      ordered.push(action);
      picked.add(action.id);
      n += 1;
    }
  }

  const globalSorted = [...scored.values()].sort((a, b) => b.score - a.score);

  for (const { action } of globalSorted) {
    if (ordered.length >= MAX_QUICK_ACTIONS) break;
    if (picked.has(action.id)) continue;
    ordered.push(action);
    picked.add(action.id);
  }

  return ordered;
}

function pickFlatByScore(scored: Map<string, { action: CatalogQuickAction; score: number }>): CatalogQuickAction[] {
  return [...scored.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_QUICK_ACTIONS)
    .map((x) => x.action);
}

export type QuickActionGroupedSection = {
  groupId: QuickActionGroupId;
  actions: CatalogQuickAction[];
};

export type QuickActionSelection = {
  actions: CatalogQuickAction[];
  showGroupedLayout: boolean;
  /** Non-overlapping sections for group labels (investor / business primary only). */
  groupedSections: QuickActionGroupedSection[] | null;
};

function buildGroupedSections(actions: CatalogQuickAction[]): QuickActionGroupedSection[] {
  const sections: QuickActionGroupedSection[] = [];
  for (const action of actions) {
    const last = sections[sections.length - 1];
    if (last && last.groupId === action.groupId) {
      last.actions.push(action);
    } else {
      sections.push({ groupId: action.groupId, actions: [action] });
    }
  }
  return sections;
}

export function selectActionsForPersonas(personas: UserPersona[]): QuickActionSelection {
  if (personas.length === 0) {
    return {
      actions: DEFAULT_ACTIONS.slice(0, MAX_QUICK_ACTIONS),
      showGroupedLayout: false,
      groupedSections: null,
    };
  }

  const scored = scoreMergedActions(personas);
  const primary = personas[0];
  const useGroupedPicker =
    primary === 'investor' || primary === 'business' || primary === 'real_estate_developer';

  const actions = useGroupedPicker ? pickGroupedInvestorBusiness(scored) : pickFlatByScore(scored);

  const showGroupedLayout = useGroupedPicker;
  const groupedSections = showGroupedLayout ? buildGroupedSections(actions) : null;

  return { actions, showGroupedLayout, groupedSections };
}

export function getMoreAction(contentMode: 'services' | 'products'): CatalogQuickAction {
  return {
    id: 'more',
    icon: MoreHorizontal,
    label: 'More',
    labelRu: 'Ещё',
    path: contentMode === 'products' ? APP_ROUTES.MARKET : APP_ROUTES.DISCOVER,
    accentColor: '#7A8FA6',
    groupId: 'general',
  };
}
