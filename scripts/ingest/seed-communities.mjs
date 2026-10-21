#!/usr/bin/env node
// Seeds public.communities with embassies, Phuket consulates, key religion sites and expat clubs.
// Idempotent (UPSERT by slug). Uses psql via env PG*.

import fs from 'node:fs';
import { execSync } from 'node:child_process';

const countries = JSON.parse(fs.readFileSync('/tmp/country_names.json', 'utf8'));
const phrases = JSON.parse(fs.readFileSync('/tmp/embassy_phrases.json', 'utf8'));

// Phuket consulates per Wikipedia 2026: Australia, China, Kazakhstan, Russia
const PHUKET_CONSULATES = new Set(['AU', 'CN', 'KZ', 'RU']);
const NON_EMBASSY = { TW: 'consulate_general', UZ: 'consulate_general' };

const rows = [];

// ─── 1. Bangkok embassies (and special missions) ─────────────────────────
for (const code of Object.keys(phrases)) {
  if (code === 'UZ') continue; // Bangkok consulate (handled below)
  const ph = phrases[code];
  const consulate_type = NON_EMBASSY[code] || 'embassy';
  const slug = `embassy-${code.toLowerCase()}-bangkok`;
  rows.push({
    slug,
    kind: 'consulate',
    name_en: ph.en,
    name_ru: ph.ru,
    name_th: ph.th,
    country_code: code,
    consulate_type,
    city: 'Bangkok',
    province: 'Bangkok',
    source_url: 'https://en.wikipedia.org/wiki/List_of_diplomatic_missions_in_Thailand',
  });
}

// Uzbekistan = consulate-general in Bangkok
const uz = countries.UZ;
rows.push({
  slug: 'consulate-uz-bangkok',
  kind: 'consulate',
  name_en: `Consulate-General of ${uz.en} in Bangkok`,
  name_ru: `Генеральное консульство Узбекистана в Бангкоке`,
  name_th: `สถานกงสุลใหญ่${uz.th}ในกรุงเทพฯ`,
  country_code: 'UZ',
  consulate_type: 'consulate_general',
  city: 'Bangkok',
  province: 'Bangkok',
  source_url: 'https://en.wikipedia.org/wiki/List_of_diplomatic_missions_in_Thailand',
});

// ─── 2. Phuket consulates ────────────────────────────────────────────────
const PHUKET_RU = { AU: 'Австралии', CN: 'Китая', KZ: 'Казахстана', RU: 'России' };
for (const code of PHUKET_CONSULATES) {
  const n = countries[code];
  rows.push({
    slug: `consulate-${code.toLowerCase()}-phuket`,
    kind: 'consulate',
    name_en: `Consulate of ${n.en} in Phuket`,
    name_ru: `Консульство ${PHUKET_RU[code]} на Пхукете`,
    name_th: `สถานกงสุล${n.th}ในภูเก็ต`,
    country_code: code,
    consulate_type: 'consulate_general',
    city: 'Phuket Town',
    province: 'Phuket',
    source_url: 'https://en.wikipedia.org/wiki/List_of_diplomatic_missions_in_Thailand',
  });
}

// ─── 3. Religion sites in Phuket (curated MVP set) ───────────────────────
const religion = [
  { slug: 'wat-chalong',       religion: 'buddhist', name_en: 'Wat Chalong (Wat Chaiyathararam)', name_ru: 'Храм Ват Чалонг', name_th: 'วัดฉลอง', city: 'Chalong', address: 'Chao Fah Tawan Tok Rd, Chalong, Mueang Phuket' },
  { slug: 'big-buddha-phuket', religion: 'buddhist', name_en: 'Big Buddha Phuket (Mingmongkol Buddha)', name_ru: 'Большой Будда Пхукета', name_th: 'พระพุทธมิ่งมงคลเอกนาคคีรี', city: 'Chalong', address: 'Soi Yot Sane 1, Karon, Mueang Phuket' },
  { slug: 'wat-phra-thong',    religion: 'buddhist', name_en: 'Wat Phra Thong', name_ru: 'Храм Ват Пхра Тхонг', name_th: 'วัดพระทอง', city: 'Thalang', address: 'Phra Phuket Kaeo Rd, Thep Krasattri, Thalang' },
  { slug: 'wat-srisoonthorn',  religion: 'buddhist', name_en: 'Wat Srisoonthorn', name_ru: 'Храм Ват Срисунтхорн', name_th: 'วัดศรีสุนทร', city: 'Thalang', address: 'Srisoonthorn Rd, Thalang' },
  { slug: 'cathedral-immaculate-conception-phuket', religion: 'christian_catholic', name_en: 'Immaculate Conception Cathedral', name_ru: 'Собор Непорочного Зачатия', name_th: 'อาสนวิหารแม่พระปฏิสนธินิรมล', city: 'Phuket Town', address: '74 Dibuk Rd, Talad Yai, Mueang Phuket' },
  { slug: 'phuket-christian-centre', religion: 'christian_protestant', name_en: 'Phuket Christian Centre', name_ru: 'Христианский центр Пхукета', name_th: 'ศูนย์คริสเตียนภูเก็ต', city: 'Phuket Town', address: 'Mae Luan Rd, Phuket Town' },
  { slug: 'rcc-phuket',        religion: 'christian_orthodox', name_en: 'Russian Orthodox Parish of the Holy Trinity', name_ru: 'Свято-Троицкий приход РПЦ', name_th: 'โบสถ์ออร์โธดอกซ์รัสเซียในภูเก็ต', city: 'Chalong', address: 'Chalong, Mueang Phuket' },
  { slug: 'masjid-mukaram-bangtao', religion: 'muslim', name_en: 'Masjid Mukaram Bang Tao', name_ru: 'Мечеть Мукарам Банг Тао', name_th: 'มัสยิดมุการ์รอม บางเทา', city: 'Cherng Talay', address: 'Bang Tao, Cherng Talay, Thalang' },
  { slug: 'masjid-nurul-iman-kamala', religion: 'muslim', name_en: 'Masjid Nurul Iman Kamala', name_ru: 'Мечеть Нурул Иман Камала', name_th: 'มัสยิดนูรุลอีมาน กมลา', city: 'Kamala', address: 'Kamala, Kathu' },
  { slug: 'masjid-mukaram-phuket-town', religion: 'muslim', name_en: 'Masjid Mukaram Phuket Town', name_ru: 'Центральная мечеть Пхукет-Тауна', name_th: 'มัสยิดกลางจังหวัดภูเก็ต', city: 'Phuket Town', address: 'Mae Luan Rd, Phuket Town' },
  { slug: 'jui-tui-shrine',    religion: 'other', name_en: 'Jui Tui Shrine (Taoist)', name_ru: 'Святилище Джуй Туй (даосское)', name_th: 'ศาลเจ้าจุ้ยตุ่ย', city: 'Phuket Town', address: 'Ranong Rd, Talad Yai, Mueang Phuket' },
];
for (const r of religion) {
  rows.push({
    slug: r.slug,
    kind: 'religion',
    name_en: r.name_en,
    name_ru: r.name_ru,
    name_th: r.name_th,
    religion: r.religion,
    city: r.city,
    province: 'Phuket',
    address: r.address,
    source_url: 'https://www.phuket.com/religion',
  });
}

// ─── 4. Expat clubs & community organisations ────────────────────────────
const clubs = [
  { slug: 'bcct-phuket', name_en: 'British Chamber of Commerce Thailand — Phuket Chapter', name_ru: 'Британская торговая палата — отделение Пхукет', name_th: 'หอการค้าอังกฤษ-ไทย สาขาภูเก็ต', language_primary: 'en', tags: ['business','british','networking'] },
  { slug: 'amcham-phuket', name_en: 'AmCham Thailand Phuket Chapter', name_ru: 'Американская торговая палата — Пхукет', name_th: 'หอการค้าอเมริกัน สาขาภูเก็ต', language_primary: 'en', tags: ['business','american','networking'] },
  { slug: 'internations-phuket', name_en: 'InterNations Phuket Community', name_ru: 'Сообщество InterNations Пхукет', name_th: 'ชุมชน InterNations ภูเก็ต', language_primary: 'en', tags: ['expat','networking','meetups'] },
  { slug: 'russian-phuket-club', name_en: 'Russian Phuket Club', name_ru: 'Русский клуб Пхукета', name_th: 'ชมรมชาวรัสเซียในภูเก็ต', language_primary: 'ru', tags: ['russian','community','family'] },
  { slug: 'german-club-phuket', name_en: 'German Society of Phuket', name_ru: 'Немецкое общество Пхукета', name_th: 'สมาคมชาวเยอรมันในภูเก็ต', language_primary: 'de', tags: ['german','community'] },
  { slug: 'scandinavian-society-phuket', name_en: 'Scandinavian Society Siam', name_ru: 'Скандинавское общество Сиам', name_th: 'สมาคมชาวสแกนดิเนเวีย', language_primary: 'en', tags: ['scandinavian','community'] },
  { slug: 'phuket-yacht-club', name_en: 'Phuket Yacht Club', name_ru: 'Яхт-клуб Пхукета', name_th: 'สโมสรเรือยอชต์ภูเก็ต', language_primary: 'en', tags: ['yachting','sport'] },
  { slug: 'rotary-club-patong-beach', name_en: 'Rotary Club of Patong Beach', name_ru: 'Ротари-клуб Патонг-Бич', name_th: 'สโมสรโรตารีหาดป่าตอง', language_primary: 'en', tags: ['rotary','charity','networking'] },
  { slug: 'phuket-international-women-club', name_en: 'Phuket International Women\'s Club (PIWC)', name_ru: 'Международный женский клуб Пхукета', name_th: 'ชมรมสตรีนานาชาติภูเก็ต', language_primary: 'en', tags: ['women','charity','community'] },
  { slug: 'phuket-language-exchange', name_en: 'Phuket Language Exchange Meetup', name_ru: 'Языковой обмен Пхукета', name_th: 'ภาษาแลกเปลี่ยนภูเก็ต', language_primary: 'en', tags: ['language','meetup','social'], kind_override: 'meetup' },
];
for (const c of clubs) {
  rows.push({
    slug: c.slug,
    kind: c.kind_override || 'club',
    name_en: c.name_en,
    name_ru: c.name_ru,
    name_th: c.name_th,
    language_primary: c.language_primary,
    tags: c.tags,
    city: 'Phuket',
    province: 'Phuket',
    source_url: 'curated',
  });
}

// ─── INSERT via psql ─────────────────────────────────────────────────────
const escape = (v) => {
  if (v === null || v === undefined) return 'NULL';
  if (Array.isArray(v)) return `ARRAY[${v.map((x) => `'${String(x).replace(/'/g, "''")}'`).join(',')}]::text[]`;
  if (typeof v === 'object') return `'${JSON.stringify(v).replace(/'/g, "''")}'::jsonb`;
  return `'${String(v).replace(/'/g, "''")}'`;
};

const cols = ['slug','kind','name_en','name_ru','name_th','religion','country_code','consulate_type','language_primary','tags','address','city','province','source_url'];
const values = rows.map((r) =>
  '(' + cols.map((c) => escape(r[c] ?? null)).join(',') + ')'
).join(',\n');

const sql = `
INSERT INTO public.communities (${cols.join(',')})
VALUES
${values}
ON CONFLICT (slug) DO UPDATE SET
  name_en = EXCLUDED.name_en,
  name_ru = EXCLUDED.name_ru,
  name_th = EXCLUDED.name_th,
  religion = EXCLUDED.religion,
  country_code = EXCLUDED.country_code,
  consulate_type = EXCLUDED.consulate_type,
  language_primary = EXCLUDED.language_primary,
  tags = EXCLUDED.tags,
  address = EXCLUDED.address,
  city = EXCLUDED.city,
  province = EXCLUDED.province,
  source_url = EXCLUDED.source_url,
  updated_at = now();
SELECT kind, COUNT(*) FROM public.communities GROUP BY kind ORDER BY 1;
`;

fs.writeFileSync('/tmp/seed_communities.sql', sql);
console.log(`Generated ${rows.length} rows → /tmp/seed_communities.sql`);
execSync(`psql -f /tmp/seed_communities.sql`, { stdio: 'inherit' });
