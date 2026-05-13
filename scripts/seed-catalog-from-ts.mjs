// One-shot seeder: TS catalog (src/lib/catalog/taxonomy.ts) → DB (category_groups + categories)
// Source of truth flips: TS becomes the seed, DB becomes runtime SSOT.
// Generates SQL we then feed via insert tool.

import fs from 'node:fs';

// Read the TS file and extract CLUSTERS + CATEGORIES via regex (no transpile needed)
const src = fs.readFileSync('src/lib/catalog/taxonomy.ts', 'utf8');

// We re-derive structure manually from known shape — taxonomy.ts is well-known.
// This script only emits SQL. The actual data is below (mirror of CLUSTERS/CATEGORIES).

const CLUSTERS = [
  { id:'arrive', labelEn:'Arrival',     labelRu:'Прибытие',      icon:'Plane',     color:'#00D68F', sortOrder:1, valueRu:'Туристы и новые резиденты: дорога из аэропорта, связь, деньги, мобильность.', valueEn:'Tourists & new residents: airport, connectivity, money, getting around.' },
  { id:'live',   labelEn:'Live',        labelRu:'Жизнь',         icon:'Home',      color:'#4E7BFF', sortOrder:2, valueRu:'Дом, здоровье, еда, семья, питомцы — повседневность без хаоса.', valueEn:'Home, health, food, family, pets — everyday life sorted.' },
  { id:'manage', labelEn:'Manage',      labelRu:'Управление',    icon:'Building2', color:'#06B6D4', sortOrder:3, valueRu:'Собственники и управляющие: брони, финансы, операции.', valueEn:'Hosts & managers: bookings, money, operations — one workspace.' },
  { id:'invest', labelEn:'Invest',      labelRu:'Инвестиции',    icon:'TrendingUp',color:'#A855F7', sortOrder:4, valueRu:'Недвижимость: каталог, новостройки, вторичка, ROI.', valueEn:'Real estate: search, off-plan, resale, ROI, due diligence.' },
  { id:'legal',  labelEn:'Legal & Visa',labelRu:'Право и визы',  icon:'Scale',     color:'#F59E0B', sortOrder:5, valueRu:'Визы, налоги, договоры, страховки, банк, образование.', valueEn:'Visa, taxes, contracts, insurance, banking, education.' },
  { id:'build',  labelEn:'Build',       labelRu:'Застройщикам',  icon:'HardHat',   color:'#F43F5E', sortOrder:6, valueRu:'B2B: портал застройщика, лиды, витрина проектов.', valueEn:'B2B: developer portal, leads, project showcase.' },
];

// Categories: cluster, slug, names, icon, color, JTBD, personas, services
const CATEGORIES = [
  // ARRIVE
  { cluster:'arrive', slug:'cat-emergency',         en:'Emergency',          ru:'Экстренные случаи',     icon:'AlertTriangle', color:'#EF4444', jtbd:['B'],     personas:['P01','P02'],
    services:[
      { slug:'sos',           en:'SOS',           ru:'SOS',           icon:'AlertTriangle', path:'/sos',           status:'available' },
      { slug:'vip-concierge', en:'VIP Concierge', ru:'VIP-консьерж',  icon:'Sparkles',      path:'/vip-concierge', status:'available' },
      { slug:'support',       en:'Support',       ru:'Поддержка',      icon:'ClipboardList', path:'/support',       status:'available' },
    ]},
  { cluster:'arrive', slug:'cat-transport',         en:'Transport',          ru:'Транспорт',             icon:'Car',           color:'#3B82F6', jtbd:['A'],     personas:['P01','P02','P03'],
    services:[
      { slug:'transfer',   en:'Transfers',  ru:'Трансферы',   icon:'Car',           path:'/airport-transfer', status:'available' },
      { slug:'fast-track', en:'Fast Track', ru:'Fast Track',  icon:'Zap',           path:'/fast-track',       status:'available' },
      { slug:'vehicle',    en:'Car & bike', ru:'Авто и байки',icon:'Car',           path:'/transport',        status:'available' },
      { slug:'sim',        en:'SIM cards',  ru:'SIM-карты',   icon:'Smartphone',    path:'/sim',              status:'available' },
      { slug:'exchange',   en:'Exchange',   ru:'Курсы валют', icon:'ArrowLeftRight',path:'/exchange',         status:'available' },
    ]},
  { cluster:'arrive', slug:'cat-tourism',           en:'Tourism & Activities',ru:'Туризм и активности', icon:'Compass',       color:'#06B6D4', jtbd:['A','D'], personas:['P01','P02','P17'],
    services:[
      { slug:'experience', en:'Experiences',         ru:'Впечатления',           icon:'Compass',     path:'/experiences',                status:'available' },
      { slug:'tours',      en:'Tours',               ru:'Туры',                  icon:'Route',       path:'/experiences?type=tour',      status:'available' },
      { slug:'water',      en:'Water & activities',  ru:'Вода и активности',     icon:'Waves',       path:'/experiences?type=activity',  status:'available' },
      { slug:'yacht',      en:'Yachts',              ru:'Яхты',                  icon:'Anchor',      path:'/yachts',                     status:'available' },
      { slug:'event',      en:'Events',              ru:'События',               icon:'CalendarDays',path:'/events',                     status:'available' },
    ]},
  // LIVE
  { cluster:'live', slug:'cat-home-living',        en:'Home & Living',       ru:'Дом и быт',             icon:'Home',         color:'#10B981', jtbd:['C'],     personas:['P03','P04','P05','P14'],
    services:[
      { slug:'cleaning',     en:'Cleaning',     ru:'Уборка',         icon:'Sparkles', path:'/cleaning',                          status:'available' },
      { slug:'services',     en:'Services hub', ru:'Все услуги',     icon:'Wrench',   path:'/services',                          status:'available' },
      { slug:'laundry',      en:'Laundry',      ru:'Прачечная',      icon:'Package',  path:'/services?category=laundry',         status:'available' },
      { slug:'handyman',     en:'Handyman',     ru:'Мастер на час',  icon:'Hammer',   path:'/services?category=handyman',        status:'available' },
      { slug:'plumbing',     en:'Plumbing',     ru:'Сантехника',     icon:'Wrench',   path:'/services?category=plumbing',        status:'available' },
      { slug:'electrical',   en:'Electrical',   ru:'Электрика',      icon:'Zap',      path:'/services?category=electrical',      status:'available' },
      { slug:'ac-repair',    en:'AC repair',    ru:'Кондиционеры',   icon:'Wind',     path:'/services?category=ac-repair',       status:'available' },
      { slug:'gardening',    en:'Gardening',    ru:'Сад',            icon:'TreePine', path:'/services?category=gardening',       status:'available' },
      { slug:'pest-control', en:'Pest control', ru:'Дезинсекция',    icon:'Bug',      path:'/services?category=pest-control',    status:'available' },
      { slug:'locksmith',    en:'Locksmith',    ru:'Замки',          icon:'KeyRound', path:'/services?category=locksmith',       status:'available' },
      { slug:'storage',      en:'Storage',      ru:'Хранение',       icon:'Warehouse',path:'/services?category=storage',         status:'available' },
      { slug:'flowers',      en:'Flowers',      ru:'Цветы',          icon:'Sparkles', path:'/flowers',                           status:'available' },
    ]},
  { cluster:'live', slug:'cat-food-entertainment', en:'Food & Entertainment',ru:'Еда и развлечения',   icon:'Utensils',     color:'#F59E0B', jtbd:['D'],     personas:['P02','P03','P04'],
    services:[
      { slug:'restaurant', en:'Restaurants', ru:'Рестораны', icon:'Utensils',    path:'/restaurants', status:'available' },
      { slug:'market',     en:'Market',      ru:'Маркет',    icon:'ShoppingBag', path:'/market',      status:'available' },
      { slug:'delivery',   en:'Delivery',    ru:'Доставка',  icon:'Truck',       path:'/delivery',    status:'available' },
    ]},
  { cluster:'live', slug:'cat-health-wellness',   en:'Health & Wellness',   ru:'Здоровье и велнес',     icon:'Stethoscope',  color:'#EC4899', jtbd:['D'],     personas:['P04','P05','P14','P19'],
    services:[
      { slug:'medical',   en:'Medical',   ru:'Медицина',  icon:'Stethoscope',path:'/medical',   status:'available' },
      { slug:'pharmacy',  en:'Pharmacy',  ru:'Аптеки',    icon:'Bandage',    path:'/pharmacy',  status:'available' },
      { slug:'beauty',    en:'Beauty',    ru:'Красота',   icon:'Palette',    path:'/beauty',    status:'available' },
      { slug:'insurance', en:'Insurance', ru:'Страховка', icon:'Shield',     path:'/insurance', status:'available' },
    ]},
  { cluster:'live', slug:'cat-family-kids',       en:'Family & Kids',       ru:'Семья и дети',          icon:'Baby',         color:'#F472B6', jtbd:['D'],     personas:['P04','P05'],
    services:[
      { slug:'babysitter',    en:'Babysitters',  ru:'Няни',         icon:'Baby',         path:'/babysitter',    status:'available' },
      { slug:'school-finder', en:'School finder',ru:'Школы',        icon:'Search',       path:'/school-finder', status:'available' },
      { slug:'education',     en:'Education',    ru:'Образование',  icon:'GraduationCap',path:'/education',     status:'available' },
      { slug:'kids',          en:'Kids',         ru:'Дети',         icon:'Baby',         path:'/kids',          status:'available' },
    ]},
  { cluster:'live', slug:'cat-pet-services',      en:'Pet Services',        ru:'Сервисы для питомцев',  icon:'PawPrint',     color:'#A78BFA', jtbd:['D'],     personas:['P11'],
    services:[
      { slug:'pets',       en:'Pets',       ru:'Питомцы',     icon:'PawPrint', path:'/pets',       status:'available' },
      { slug:'veterinary', en:'Veterinary', ru:'Ветеринары',  icon:'Bandage',  path:'/veterinary', status:'available' },
    ]},
  { cluster:'live', slug:'cat-sports',            en:'Sports & Athletic',   ru:'Спорт и тренировки',    icon:'Dumbbell',     color:'#22C55E', jtbd:['D'],     personas:['P17'],
    services:[
      { slug:'fitness', en:'Fitness', ru:'Фитнес', icon:'Dumbbell', path:'/fitness', status:'available' },
    ]},
  { cluster:'live', slug:'cat-community',         en:'Community',           ru:'Сообщество',            icon:'Users',        color:'#0EA5E9', jtbd:['D'],     personas:['P03','P04'],
    services:[
      { slug:'community', en:'Coming soon', ru:'Скоро', icon:'Users', path:'/', status:'soon' },
    ]},
  { cluster:'live', slug:'cat-wedding-events',    en:'Wedding & Events',    ru:'Свадьбы и события',     icon:'CalendarDays', color:'#F43F5E', jtbd:['D'],     personas:['P15'],
    services:[
      { slug:'wedding', en:'Weddings', ru:'Свадьбы', icon:'CalendarDays', path:'/wedding', status:'available' },
    ]},
  // INVEST
  { cluster:'invest', slug:'cat-real-estate',      en:'Real Estate',         ru:'Недвижимость',          icon:'Building2',    color:'#8B5CF6', jtbd:['F','G','H'], personas:['P06','P07','P08','P09','P10'],
    services:[
      { slug:'property',     en:'Property',      ru:'Поиск',                 icon:'Search',   path:'/property',                  status:'available' },
      { slug:'rent-short',   en:'Short rent',    ru:'Краткосрочная аренда',  icon:'KeyRound', path:'/property/rent/short-term',  status:'available' },
      { slug:'rent-long',    en:'Long rent',     ru:'Долгосрочная аренда',   icon:'Home',     path:'/property/rent/long-term',   status:'available' },
      { slug:'offplan',      en:'Off-plan',      ru:'Новостройки',           icon:'Building2',path:'/property/offplan',          status:'available' },
      { slug:'resale',       en:'Resale',        ru:'Вторичка',              icon:'Building2',path:'/property/resale',           status:'available' },
      { slug:'developers',   en:'Developers',    ru:'Застройщики',           icon:'Users',    path:'/property/developers',       status:'available' },
      { slug:'roi-hub',      en:'ROI Hub',       ru:'ROI Hub',               icon:'BarChart3',path:'/invest',                    status:'available' },
      { slug:'due-diligence',en:'Due Diligence', ru:'Due Diligence',         icon:'Shield',   path:'/invest',                    status:'soon' },
    ]},
  // LEGAL
  { cluster:'legal', slug:'cat-business-legal',   en:'Business & Legal',    ru:'Бизнес и право',        icon:'Scale',        color:'#6366F1', jtbd:['E','I'], personas:['P12','P13'],
    services:[
      { slug:'visa',        en:'Visas',      ru:'Визы',          icon:'Globe',     path:'/visa/immigration',    status:'available' },
      { slug:'legal',       en:'Legal',      ru:'Юристы',        icon:'Scale',     path:'/legal',               status:'available' },
      { slug:'contract-ai', en:'ContractAI', ru:'ContractAI',    icon:'FileSearch',path:'/contract-analysis',   status:'available' },
      { slug:'relocate',    en:'Relocation', ru:'Релокация',     icon:'Briefcase', path:'/relocate',            status:'available' },
      { slug:'knowledge',   en:'Knowledge',  ru:'База знаний',   icon:'BookOpen',  path:'/knowledge',           status:'available' },
    ]},
  { cluster:'legal', slug:'cat-finance',          en:'Finance',             ru:'Финансы',               icon:'DollarSign',   color:'#14B8A6', jtbd:['E'],     personas:['P12'],
    services:[
      { slug:'banking', en:'Banking', ru:'Банк',   icon:'Landmark',   path:'/banking', status:'available' },
      { slug:'tax',     en:'Taxes',   ru:'Налоги', icon:'Calculator', path:'/tax',     status:'available' },
    ]},
  { cluster:'legal', slug:'cat-halal-faith',      en:'Halal & Faith',       ru:'Халяль и вероисповедание',icon:'Heart',      color:'#84CC16', jtbd:['D'],     personas:['P17'],
    services:[
      { slug:'halal-persona', en:'Halal traveller hub', ru:'Халяль-путешественник', icon:'Compass', path:'/for/halal', status:'available' },
      { slug:'halal-stay', en:'Halal-friendly stay', ru:'Жильё с учётом практик', icon:'Home', path:'/property/for/halal', status:'available' },
      { slug:'halal-dining', en:'Halal dining', ru:'Рестораны (халяль)', icon:'Utensils', path:'/restaurants', status:'available' },
      { slug:'halal-knowledge', en:'Faith & customs guides', ru:'Вера и обычаи', icon:'BookOpen', path:'/knowledge', status:'available' },
    ]},
  // BUILD
  { cluster:'build', slug:'cat-partner-portal',   en:'Partner Portal',      ru:'Партнёры и B2B',        icon:'Building',     color:'#F97316', jtbd:['J'],     personas:['P22','P25'],
    services:[
      { slug:'developer-portal', en:'Portal',    ru:'Портал',       icon:'Building',  path:'/developer/portal',          status:'available' },
      { slug:'program',          en:'Program',   ru:'Программа',    icon:'LineChart', path:'/for/real-estate-developers',status:'available' },
      { slug:'newbuilds',        en:'Showcase',  ru:'Витрина',      icon:'Building2', path:'/newbuilds',                 status:'available' },
      { slug:'advisory',         en:'Advisory',  ru:'Консультация', icon:'PenTool',   path:'/property/consultation',     status:'available' },
    ]},
];

const esc = (s) => (s ?? '').replace(/'/g, "''");
const arr = (xs) => xs && xs.length ? `ARRAY[${xs.map(x=>`'${x}'`).join(',')}]` : 'ARRAY[]::text[]';

let sql = '-- Generated by scripts/seed-catalog-from-ts.mjs\nBEGIN;\n\n';

// 1. Upsert cluster groups (the 6 surfaces). Sub-groups stay as legacy.
sql += '-- Surfaces (canonical 6)\n';
for (const c of CLUSTERS) {
  sql += `INSERT INTO public.category_groups (slug, name_en, name_ru, icon, color, sort_order, is_active, is_surface, surface_id, description_en, description_ru)
VALUES ('${c.id}','${esc(c.labelEn)}','${esc(c.labelRu)}','${c.icon}','${c.color}',${c.sortOrder},true,true,'${c.id}','${esc(c.valueEn)}','${esc(c.valueRu)}')
ON CONFLICT (slug) DO UPDATE SET
  name_en=EXCLUDED.name_en, name_ru=EXCLUDED.name_ru, icon=EXCLUDED.icon,
  color=EXCLUDED.color, sort_order=EXCLUDED.sort_order, is_active=true,
  is_surface=true, surface_id=EXCLUDED.surface_id,
  description_en=EXCLUDED.description_en, description_ru=EXCLUDED.description_ru;
`;
}

// 2. Upsert categories — re-link group_id to the 6 surfaces directly
sql += '\n-- Categories (16 canonical) → linked to surface group\n';
let sortCat = 0;
for (const cat of CATEGORIES) {
  sortCat += 10;
  sql += `INSERT INTO public.categories (slug, name_en, name_ru, icon, color, group_id, sort_order, is_active, app_path, jtbd_clusters, persona_codes, status)
VALUES (
  '${cat.slug}','${esc(cat.en)}','${esc(cat.ru)}','${cat.icon}','${cat.color}',
  (SELECT id FROM public.category_groups WHERE slug='${cat.cluster}'),
  ${sortCat}, true, NULL,
  ${cat.jtbd.length ? `ARRAY[${cat.jtbd.map(j=>`'${j}'::jtbd_cluster`).join(',')}]` : `ARRAY[]::jtbd_cluster[]`},
  ${cat.personas.length ? `ARRAY[${cat.personas.map(p=>`'${p}'::app_persona`).join(',')}]` : `ARRAY[]::app_persona[]`},
  'available'
)
ON CONFLICT (slug) DO UPDATE SET
  name_en=EXCLUDED.name_en, name_ru=EXCLUDED.name_ru, icon=EXCLUDED.icon,
  color=EXCLUDED.color, group_id=EXCLUDED.group_id, sort_order=EXCLUDED.sort_order,
  is_active=true, jtbd_clusters=EXCLUDED.jtbd_clusters, persona_codes=EXCLUDED.persona_codes,
  status='available';
`;
}

// 3. Services: each service is also a row in `categories` with parent_id = its category
sql += '\n-- Services (~80) — parented to category, app_path filled\n';
let sortSvc = 0;
for (const cat of CATEGORIES) {
  for (const s of cat.services) {
    sortSvc += 5;
    // For services we use slug = service slug; collisions across categories handled by DB unique slug — services have unique slugs above.
    sql += `INSERT INTO public.categories (slug, name_en, name_ru, icon, color, group_id, parent_id, sort_order, is_active, app_path, jtbd_clusters, persona_codes, status)
VALUES (
  '${s.slug}','${esc(s.en)}','${esc(s.ru)}','${s.icon}','${cat.color}',
  (SELECT id FROM public.category_groups WHERE slug='${cat.cluster}'),
  (SELECT id FROM public.categories WHERE slug='${cat.slug}' LIMIT 1),
  ${sortSvc}, true, '${esc(s.path)}',
  ${cat.jtbd.length ? `ARRAY[${cat.jtbd.map(j=>`'${j}'::jtbd_cluster`).join(',')}]` : `ARRAY[]::jtbd_cluster[]`},
  ${cat.personas.length ? `ARRAY[${cat.personas.map(p=>`'${p}'::app_persona`).join(',')}]` : `ARRAY[]::app_persona[]`},
  '${s.status}'
)
ON CONFLICT (slug) DO UPDATE SET
  name_en=EXCLUDED.name_en, name_ru=EXCLUDED.name_ru, icon=EXCLUDED.icon, color=EXCLUDED.color,
  group_id=EXCLUDED.group_id, parent_id=EXCLUDED.parent_id, sort_order=EXCLUDED.sort_order,
  is_active=true, app_path=EXCLUDED.app_path, jtbd_clusters=EXCLUDED.jtbd_clusters,
  persona_codes=EXCLUDED.persona_codes, status=EXCLUDED.status;
`;
  }
}

sql += '\nCOMMIT;\n';

fs.mkdirSync('/tmp', { recursive: true });
fs.writeFileSync('/tmp/seed-catalog.sql', sql);
console.log(`Wrote /tmp/seed-catalog.sql (${sql.length} chars, ${CLUSTERS.length} clusters, ${CATEGORIES.length} categories, ${CATEGORIES.reduce((a,c)=>a+c.services.length,0)} services)`);
