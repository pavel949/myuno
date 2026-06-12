/**
 * @module landings/personaTheme
 * @description Per-persona theming + iconography. Maps PersonaCode → icon, gradient,
 * cluster color. Keeps PersonaLandingPage visually distinct per audience without
 * ballooning the page component.
 */
import {
  Plane, Sun, Home, TrendingUp, Crown, Briefcase, Coins, PawPrint,
  Building2, Laptop, Baby, Stethoscope, Heart, Armchair, Globe,
  Dumbbell, MoonStar, Landmark, Building, Rainbow, Accessibility,
  Wrench, Code, Store, Camera, GraduationCap, Users, Leaf,
  type LucideIcon,
} from 'lucide-react';

export interface PersonaTheme {
  icon: LucideIcon;
  /** Primary gradient color token (semantic, e.g. 'accent-amber'). */
  color: string;
  /** Secondary gradient color token. */
  colorAccent: string;
  /** Tagline shown above H1 in the hero. */
  tagline: { ru: string; en: string };
  /** Trust strip: 3 short proof points. */
  proof: Array<{ ru: string; en: string }>;
}

const PROOF_DEFAULT = [
  { ru: '4.9★ из 1 200+ отзывов', en: '4.9★ across 1,200+ reviews' },
  { ru: '24/7 поддержка RU/EN', en: '24/7 RU/EN support' },
  { ru: 'Прозрачные цены, без комиссий', en: 'Transparent pricing, no hidden fees' },
];

export const PERSONA_THEME: Record<string, PersonaTheme> = {
  tourists:           { icon: Plane,         color: 'cluster-arrive',  colorAccent: 'accent-cyan',   tagline: { ru: 'Для туристов', en: 'For tourists' },                proof: PROOF_DEFAULT },
  snowbirds:          { icon: Sun,           color: 'accent-amber',    colorAccent: 'accent-coral',  tagline: { ru: 'Для зимовщиков', en: 'For snowbirds' },             proof: PROOF_DEFAULT },
  'ru-expats':        { icon: Home,          color: 'cluster-live',    colorAccent: 'accent-purple', tagline: { ru: 'Для русскоязычных экспатов', en: 'For RU-speaking expats' }, proof: PROOF_DEFAULT },
  'passive-investors':{ icon: TrendingUp,    color: 'cluster-invest',  colorAccent: 'accent-cyan',   tagline: { ru: 'Для инвесторов', en: 'For investors' },             proof: [{ ru: 'ClearView™ AAA–CCC', en: 'ClearView™ AAA–CCC' }, { ru: 'Yield 5–8% в год', en: '5–8% annual yield' }, { ru: '300+ проектов в базе', en: '300+ projects tracked' }] },
  hnw:                { icon: Crown,         color: 'accent-amber',    colorAccent: 'cluster-invest',tagline: { ru: 'HNW · UHNW', en: 'HNW · UHNW' },                    proof: [{ ru: 'Off-market шорт-листы', en: 'Off-market shortlists' }, { ru: 'Private banking партнёры', en: 'Private banking partners' }, { ru: 'NDA по умолчанию', en: 'NDA by default' }] },
  operators:          { icon: Briefcase,     color: 'cluster-manage',  colorAccent: 'cluster-invest',tagline: { ru: 'Owner-Operators', en: 'Owner-Operators' },          proof: PROOF_DEFAULT },
  'mn-investors':     { icon: Coins,         color: 'accent-amber',    colorAccent: 'cluster-invest',tagline: { ru: 'Для инвесторов из Монголии', en: 'For Mongolian investors' }, proof: PROOF_DEFAULT },
  'pet-owners':       { icon: PawPrint,      color: 'accent-coral',    colorAccent: 'cluster-live',  tagline: { ru: 'С питомцем', en: 'With pets' },                     proof: PROOF_DEFAULT },
  'developer-partner':{ icon: Building2,     color: 'cluster-build',   colorAccent: 'accent-purple', tagline: { ru: 'Застройщикам', en: 'For developers' },              proof: [{ ru: '500+ верифицированных лидов/мес', en: '500+ verified leads/month' }, { ru: 'ClearView™ сертификация', en: 'ClearView™ certification' }, { ru: 'CRM для девелоперов', en: 'Developer CRM' }] },
  'digital-nomads':   { icon: Laptop,        color: 'success',         colorAccent: 'accent-cyan',   tagline: { ru: 'Для номадов', en: 'For nomads' },                   proof: PROOF_DEFAULT },
  families:           { icon: Baby,          color: 'accent-purple',   colorAccent: 'accent-coral',  tagline: { ru: 'Для семей с детьми', en: 'For families' },          proof: PROOF_DEFAULT },
  medical:            { icon: Stethoscope,   color: 'destructive',     colorAccent: 'accent-cyan',   tagline: { ru: 'Медицинский туризм', en: 'Medical tourism' },       proof: PROOF_DEFAULT },
  weddings:           { icon: Heart,         color: 'accent-coral',    colorAccent: 'accent-purple', tagline: { ru: 'Свадьба на Пхукете', en: 'Wedding in Phuket' },     proof: PROOF_DEFAULT },
  retirees:           { icon: Armchair,      color: 'accent-amber',    colorAccent: 'cluster-live',  tagline: { ru: 'Retirement', en: 'Retirement' },                    proof: PROOF_DEFAULT },
  'eu-guests':        { icon: Globe,         color: 'cluster-arrive',  colorAccent: 'accent-cyan',   tagline: { ru: 'Для гостей из ЕС', en: 'For EU guests' },           proof: PROOF_DEFAULT },
  athletes:           { icon: Dumbbell,      color: 'destructive',     colorAccent: 'success',       tagline: { ru: 'Спорт и тренировки', en: 'Sports & training' },     proof: PROOF_DEFAULT },
  halal:              { icon: MoonStar,      color: 'success',         colorAccent: 'accent-amber',  tagline: { ru: 'Halal-friendly', en: 'Halal-friendly' },            proof: PROOF_DEFAULT },
  'cn-investors':     { icon: Landmark,      color: 'destructive',     colorAccent: 'accent-amber',  tagline: { ru: '为中国投资者', en: 'For Chinese investors' },        proof: PROOF_DEFAULT },
  'bn-business':      { icon: Building,      color: 'cluster-invest',  colorAccent: 'accent-purple', tagline: { ru: 'Business networking', en: 'Business networking' },  proof: PROOF_DEFAULT },
  lgbtq:              { icon: Rainbow,       color: 'accent-purple',   colorAccent: 'accent-coral',  tagline: { ru: 'LGBTQ+ friendly', en: 'LGBTQ+ friendly' },          proof: PROOF_DEFAULT },
  accessibility:      { icon: Accessibility, color: 'cluster-arrive',  colorAccent: 'success',       tagline: { ru: 'Доступная среда', en: 'Accessible Phuket' },        proof: PROOF_DEFAULT },
  providers:          { icon: Wrench,        color: 'cluster-manage',  colorAccent: 'success',       tagline: { ru: 'Сервис-провайдерам', en: 'For service providers' },  proof: PROOF_DEFAULT },
  freelancers:        { icon: Code,          color: 'success',         colorAccent: 'accent-cyan',   tagline: { ru: 'Фрилансерам', en: 'For freelancers' },              proof: PROOF_DEFAULT },
  smb:                { icon: Store,         color: 'cluster-build',   colorAccent: 'cluster-invest',tagline: { ru: 'Малому бизнесу', en: 'For SMBs' },                  proof: PROOF_DEFAULT },
  creatives:          { icon: Camera,        color: 'accent-purple',   colorAccent: 'accent-coral',  tagline: { ru: 'Креативщикам', en: 'For creatives' },               proof: PROOF_DEFAULT },
  students:           { icon: GraduationCap, color: 'accent-cyan',     colorAccent: 'accent-amber',  tagline: { ru: 'Студентам', en: 'For students' },                   proof: PROOF_DEFAULT },
  'conscious-eaters': { icon: Leaf,           color: 'success',         colorAccent: 'accent-amber',  tagline: { ru: 'Vegan · Vegetarian · GF', en: 'Vegan · Vegetarian · GF' }, proof: [{ ru: '120+ растительных кафе', en: '120+ plant-based cafés' }, { ru: 'Verified vegan menus', en: 'Verified vegan menus' }, { ru: 'Кухни в виллах', en: 'Self-catering villas' }] },
};

export const DEFAULT_PERSONA_THEME: PersonaTheme = {
  icon: Users,
  color: 'primary',
  colorAccent: 'accent-cyan',
  tagline: { ru: 'Для вас', en: 'For you' },
  proof: PROOF_DEFAULT,
};

export function getPersonaTheme(slug: string): PersonaTheme {
  return PERSONA_THEME[slug] ?? DEFAULT_PERSONA_THEME;
}
