/**
 * @module MasterTaxonomy
 * @description Canonical Master Taxonomy v1.0 (SSOT)
 *
 * Источник истины: /docs/canonical/00-master-taxonomy.md
 *
 * ВАЖНО — два разных слоя:
 *
 *  1. SURFACES (NavCluster, 6) — навигационные «дома»: Arrive / Live /
 *     Manage / Invest / Legal / Build. Это физические маршруты, нижнее
 *     меню, RLS-гейты. Источник: src/lib/catalog/taxonomy.ts.
 *
 *  2. JTBD CLUSTERS (этот файл, 10, A..J) — функциональные классификаторы
 *     «работ»: Arrival, Visa, Settlement, Investment, Transaction,
 *     Operations, Compliance, Emergency, Lifestyle, Exit. Используются
 *     для тегирования услуг, AI-маршрутизации, lifecycle-аналитики и
 *     SEO-лендингов. Не маршруты.
 *
 * Никогда не путай ClusterId (surface) и JtbdClusterId (functional).
 */

// ============= JTBD CLUSTERS (A..J) =============

export const JTBD_CLUSTER_CODES = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J',
] as const;

export type JtbdClusterId = typeof JTBD_CLUSTER_CODES[number];

export interface JtbdCluster {
  id: JtbdClusterId;
  slug: string;             // kebab-case, used in /landings/:slug
  labelRu: string;
  labelEn: string;
  shortRu: string;
  shortEn: string;
  /** Surface(s) where services from this JTBD typically live */
  primarySurface: 'arrive' | 'live' | 'manage' | 'invest' | 'legal' | 'build';
  /** Personas most affected by this JTBD */
  primaryPersonas: PersonaCode[];
}

// Forward declaration — populated below
export type PersonaCode =
  | 'P01_first_time_tourist'
  | 'P02_repeat_tourist'
  | 'P03_long_stay_tourist'
  | 'P04_digital_nomad'
  | 'P05_remote_worker_family'
  | 'P06_snowbird'
  | 'P07_retiree'
  | 'P08_relocator_family'
  | 'P09_relocator_solo'
  | 'P10_returnee'
  | 'P11_student'
  | 'P12_business_owner_local'
  | 'P13_employee_expat'
  | 'P14_medical_tourist'
  | 'P15_wedding_couple'
  | 'P16_athlete_training'
  | 'P17_halal_traveler'
  | 'P18_lgbtq_traveler'
  | 'P19_accessibility_needs'
  | 'P20_passive_investor'
  | 'P21_active_investor'
  | 'P22_developer_partner'
  | 'P23_property_owner'
  | 'P24_management_company'
  | 'P25_service_vendor';

export const JTBD_CLUSTERS: readonly JtbdCluster[] = [
  {
    id: 'A',
    slug: 'arrival',
    labelRu: 'Прилёт и обустройство',
    labelEn: 'Arrival & Setup',
    shortRu: 'Прилёт',
    shortEn: 'Arrive',
    primarySurface: 'arrive',
    primaryPersonas: ['P01_first_time_tourist', 'P02_repeat_tourist', 'P08_relocator_family'],
  },
  {
    id: 'B',
    slug: 'extension',
    labelRu: 'Виза и продление',
    labelEn: 'Visa & Extension',
    shortRu: 'Виза',
    shortEn: 'Visa',
    primarySurface: 'legal',
    primaryPersonas: ['P03_long_stay_tourist', 'P04_digital_nomad', 'P07_retiree', 'P11_student'],
  },
  {
    id: 'C',
    slug: 'settlement',
    labelRu: 'Долгосрочное обустройство',
    labelEn: 'Long-term Settlement',
    shortRu: 'Жизнь',
    shortEn: 'Settle',
    primarySurface: 'live',
    primaryPersonas: ['P05_remote_worker_family', 'P08_relocator_family', 'P09_relocator_solo', 'P10_returnee'],
  },
  {
    id: 'D',
    slug: 'investment',
    labelRu: 'Инвестиционное решение',
    labelEn: 'Investment Decision',
    shortRu: 'Инвест',
    shortEn: 'Invest',
    primarySurface: 'invest',
    primaryPersonas: ['P20_passive_investor', 'P21_active_investor', 'P22_developer_partner'],
  },
  {
    id: 'E',
    slug: 'transaction',
    labelRu: 'Сделка с недвижимостью',
    labelEn: 'Real Estate Transaction',
    shortRu: 'Сделка',
    shortEn: 'Deal',
    primarySurface: 'invest',
    primaryPersonas: ['P20_passive_investor', 'P21_active_investor', 'P08_relocator_family', 'P23_property_owner'],
  },
  {
    id: 'F',
    slug: 'operations',
    labelRu: 'Управление недвижимостью',
    labelEn: 'Property Operations',
    shortRu: 'PMS',
    shortEn: 'Ops',
    primarySurface: 'manage',
    primaryPersonas: ['P23_property_owner', 'P24_management_company', 'P25_service_vendor'],
  },
  {
    id: 'G',
    slug: 'compliance',
    labelRu: 'Налоги и соответствие',
    labelEn: 'Tax & Compliance',
    shortRu: 'Налоги',
    shortEn: 'Tax',
    primarySurface: 'legal',
    primaryPersonas: ['P12_business_owner_local', 'P13_employee_expat', 'P23_property_owner', 'P24_management_company'],
  },
  {
    id: 'H',
    slug: 'emergency',
    labelRu: 'Экстренная помощь',
    labelEn: 'Emergency & Support',
    shortRu: 'SOS',
    shortEn: 'SOS',
    primarySurface: 'live',
    primaryPersonas: ['P01_first_time_tourist', 'P14_medical_tourist', 'P19_accessibility_needs', 'P07_retiree'],
  },
  {
    id: 'I',
    slug: 'lifestyle',
    labelRu: 'Образ жизни и семья',
    labelEn: 'Lifestyle & Family',
    shortRu: 'Стиль',
    shortEn: 'Life',
    primarySurface: 'live',
    primaryPersonas: [
      'P05_remote_worker_family', 'P15_wedding_couple', 'P16_athlete_training',
      'P17_halal_traveler', 'P18_lgbtq_traveler', 'P19_accessibility_needs',
      'P14_medical_tourist',
    ],
  },
  {
    id: 'J',
    slug: 'exit',
    labelRu: 'Выезд и репатриация',
    labelEn: 'Exit & Repatriation',
    shortRu: 'Выезд',
    shortEn: 'Exit',
    primarySurface: 'manage',
    primaryPersonas: ['P10_returnee', 'P23_property_owner', 'P09_relocator_solo'],
  },
] as const;

// ============= 25 CANONICAL PERSONAS =============

export const PERSONA_CODES: readonly PersonaCode[] = [
  'P01_first_time_tourist', 'P02_repeat_tourist', 'P03_long_stay_tourist',
  'P04_digital_nomad', 'P05_remote_worker_family', 'P06_snowbird',
  'P07_retiree', 'P08_relocator_family', 'P09_relocator_solo',
  'P10_returnee', 'P11_student', 'P12_business_owner_local',
  'P13_employee_expat', 'P14_medical_tourist', 'P15_wedding_couple',
  'P16_athlete_training', 'P17_halal_traveler', 'P18_lgbtq_traveler',
  'P19_accessibility_needs', 'P20_passive_investor', 'P21_active_investor',
  'P22_developer_partner', 'P23_property_owner', 'P24_management_company',
  'P25_service_vendor',
] as const;

export interface PersonaDefinition {
  code: PersonaCode;
  shortCode: string;        // P01..P25
  slug: string;             // for /landings/persona/:slug
  labelRu: string;
  labelEn: string;
  /** Lifecycle stages this persona typically progresses through */
  lifecycleStages: readonly string[];
  /** Top JTBD clusters for this persona */
  topJtbd: readonly JtbdClusterId[];
  /** Active in current production phase (if false, enum-only) */
  active: boolean;
}

export const PERSONAS: Readonly<Record<PersonaCode, PersonaDefinition>> = {
  P01_first_time_tourist: { code:'P01_first_time_tourist', shortCode:'P01', slug:'first-time-tourist', labelRu:'Первый раз на Пхукете', labelEn:'First-time tourist', lifecycleStages:['tourist'], topJtbd:['A','H'], active:true },
  P02_repeat_tourist:     { code:'P02_repeat_tourist', shortCode:'P02', slug:'repeat-tourist', labelRu:'Возвращающийся турист', labelEn:'Repeat tourist', lifecycleStages:['tourist'], topJtbd:['A','I'], active:true },
  P03_long_stay_tourist:  { code:'P03_long_stay_tourist', shortCode:'P03', slug:'long-stay-tourist', labelRu:'Долгосрочный турист', labelEn:'Long-stay tourist', lifecycleStages:['tourist','snowbird'], topJtbd:['A','B','I'], active:true },
  P04_digital_nomad:      { code:'P04_digital_nomad', shortCode:'P04', slug:'digital-nomad', labelRu:'Цифровой кочевник', labelEn:'Digital nomad', lifecycleStages:['nomad','tourist'], topJtbd:['B','C','I'], active:true },
  P05_remote_worker_family:{code:'P05_remote_worker_family', shortCode:'P05', slug:'remote-family', labelRu:'Семья на удалёнке', labelEn:'Remote-worker family', lifecycleStages:['nomad','settler'], topJtbd:['C','I','B'], active:true },
  P06_snowbird:           { code:'P06_snowbird', shortCode:'P06', slug:'snowbird', labelRu:'Зимовщик', labelEn:'Snowbird', lifecycleStages:['snowbird'], topJtbd:['A','I','B'], active:true },
  P07_retiree:            { code:'P07_retiree', shortCode:'P07', slug:'retiree', labelRu:'Пенсионер-резидент', labelEn:'Retiree', lifecycleStages:['resident','settler'], topJtbd:['B','C','H','G'], active:true },
  P08_relocator_family:   { code:'P08_relocator_family', shortCode:'P08', slug:'relocator-family', labelRu:'Семья-релокант', labelEn:'Relocator (family)', lifecycleStages:['settler','resident'], topJtbd:['C','E','I'], active:true },
  P09_relocator_solo:     { code:'P09_relocator_solo', shortCode:'P09', slug:'relocator-solo', labelRu:'Соло-релокант', labelEn:'Relocator (solo)', lifecycleStages:['settler','resident'], topJtbd:['C','B','I'], active:true },
  P10_returnee:           { code:'P10_returnee', shortCode:'P10', slug:'returnee', labelRu:'Возвращенец', labelEn:'Returnee', lifecycleStages:['returnee','absentee'], topJtbd:['J','C'], active:true },
  P11_student:            { code:'P11_student', shortCode:'P11', slug:'student', labelRu:'Студент', labelEn:'Student', lifecycleStages:['settler','tourist'], topJtbd:['B','C','I'], active:true },
  P12_business_owner_local:{code:'P12_business_owner_local', shortCode:'P12', slug:'business-owner', labelRu:'Местный бизнес', labelEn:'Local business owner', lifecycleStages:['resident'], topJtbd:['G','C'], active:true },
  P13_employee_expat:     { code:'P13_employee_expat', shortCode:'P13', slug:'employee-expat', labelRu:'Экспат-сотрудник', labelEn:'Expat employee', lifecycleStages:['settler','resident'], topJtbd:['B','C','G'], active:true },
  P14_medical_tourist:    { code:'P14_medical_tourist', shortCode:'P14', slug:'medical-tourist', labelRu:'Медицинский турист', labelEn:'Medical tourist', lifecycleStages:['tourist'], topJtbd:['I','H','A'], active:true },
  P15_wedding_couple:     { code:'P15_wedding_couple', shortCode:'P15', slug:'wedding-couple', labelRu:'Свадебная пара', labelEn:'Wedding couple', lifecycleStages:['tourist'], topJtbd:['I','A'], active:true },
  P16_athlete_training:   { code:'P16_athlete_training', shortCode:'P16', slug:'athlete', labelRu:'Атлет на сборах', labelEn:'Athlete (training camp)', lifecycleStages:['tourist','snowbird'], topJtbd:['I','A','H'], active:true },
  P17_halal_traveler:     { code:'P17_halal_traveler', shortCode:'P17', slug:'halal-traveler', labelRu:'Халяль-путешественник', labelEn:'Halal traveler', lifecycleStages:['tourist'], topJtbd:['I','A'], active:true },
  P18_lgbtq_traveler:     { code:'P18_lgbtq_traveler', shortCode:'P18', slug:'lgbtq-traveler', labelRu:'LGBTQ+ путешественник', labelEn:'LGBTQ+ traveler', lifecycleStages:['tourist'], topJtbd:['I','A'], active:true },
  P19_accessibility_needs:{ code:'P19_accessibility_needs', shortCode:'P19', slug:'accessibility', labelRu:'Спец. потребности', labelEn:'Accessibility needs', lifecycleStages:['tourist','settler'], topJtbd:['I','H','A'], active:true },
  P20_passive_investor:   { code:'P20_passive_investor', shortCode:'P20', slug:'passive-investor', labelRu:'Пассивный инвестор', labelEn:'Passive investor', lifecycleStages:['absentee'], topJtbd:['D','E','F'], active:true },
  P21_active_investor:    { code:'P21_active_investor', shortCode:'P21', slug:'active-investor', labelRu:'Активный инвестор', labelEn:'Active investor', lifecycleStages:['resident','absentee'], topJtbd:['D','E','F','J'], active:true },
  P22_developer_partner:  { code:'P22_developer_partner', shortCode:'P22', slug:'developer-partner', labelRu:'Девелопер-партнёр', labelEn:'Developer partner', lifecycleStages:['resident'], topJtbd:['D','E'], active:true },
  P23_property_owner:     { code:'P23_property_owner', shortCode:'P23', slug:'property-owner', labelRu:'Собственник', labelEn:'Property owner', lifecycleStages:['resident','absentee'], topJtbd:['F','G','J'], active:true },
  P24_management_company: { code:'P24_management_company', shortCode:'P24', slug:'management-company', labelRu:'УК', labelEn:'Management company', lifecycleStages:['resident'], topJtbd:['F','G'], active:true },
  P25_service_vendor:     { code:'P25_service_vendor', shortCode:'P25', slug:'service-vendor', labelRu:'Поставщик услуг', labelEn:'Service vendor', lifecycleStages:['resident'], topJtbd:['F'], active:true },
};

// ============= DEAL TYPES =============

export const DEAL_TYPES = [
  'rent_short', 'rent_mid', 'rent_long',
  'buy_resale', 'buy_offplan', 'buy_assignment',
  'sell',
  'invest_passive', 'invest_active',
  'urgent',
] as const;
export type DealType = typeof DEAL_TYPES[number];

// ============= CLEARVIEW GRADES (FULL SCALE) =============

export const CLEARVIEW_GRADES = [
  'AAA', 'AA', 'A', 'BBB', 'BB', 'B', 'CCC',
] as const;
export type ClearViewGrade = typeof CLEARVIEW_GRADES[number] | 'unrated';

// ============= HELPERS =============

export function getJtbdCluster(id: JtbdClusterId): JtbdCluster {
  const c = JTBD_CLUSTERS.find((x) => x.id === id);
  if (!c) throw new Error(`Unknown JTBD cluster: ${id}`);
  return c;
}

export function getPersona(code: PersonaCode): PersonaDefinition {
  return PERSONAS[code];
}

export function getPersonasByJtbd(cluster: JtbdClusterId): PersonaDefinition[] {
  return Object.values(PERSONAS).filter((p) => p.topJtbd.includes(cluster));
}

export function getJtbdBySurface(
  surface: JtbdCluster['primarySurface']
): JtbdCluster[] {
  return JTBD_CLUSTERS.filter((c) => c.primarySurface === surface);
}
