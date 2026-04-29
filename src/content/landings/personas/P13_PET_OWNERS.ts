/**
 * Auto-split from personaLandings.ts (Wave 1.B cleanup, 2026-04).
 * Original file became 1689 lines — each persona lives in its own module.
 * The barrel file personaLandings.ts keeps the public API stable.
 */
import type { PersonaLanding } from '@/lib/landings/types';

export const P13_PET_OWNERS: PersonaLanding = {
  personaCode: 'P13',
  slug: 'pet-owners',
  status: 'live',
  h1: { ru: 'Пхукет с питомцем: ввоз, виллы, ветеринар', en: 'Phuket with a pet: import, villas, vet' },
  subtitle: {
    ru: 'Помогаем оформить ввоз собаки или кошки, найти pet-friendly виллу и подключить ветеринара по-русски.',
    en: 'We help you import a dog or cat, find a pet-friendly villa and connect with a Russian-speaking vet.',
  },
  pains: [
    { ru: 'Не знаете, какие документы нужны для ввоза питомца в Таиланд.', en: 'You don’t know which papers are required to import a pet to Thailand.' },
    { ru: 'Большинство вилл и кондо отказывают животным или требуют большой депозит.', en: 'Most villas and condos refuse pets or demand a large deposit.' },
    { ru: 'Нужен ветеринар по-русски с круглосуточным дежурством.', en: 'You need a Russian-speaking vet on 24/7 standby.' },
    { ru: 'Хотите гулять, плавать и есть в кафе с питомцем — не везде это разрешено.', en: 'You want to walk, swim and eat out with your pet — but rules differ per spot.' },
  ],
  services: [
    { slug: 'pet-import', label: { ru: 'Ввоз питомца', en: 'Pet import' }, oneLiner: { ru: 'Полный пакет: чип, прививки, R7, перевозка из аэропорта.', en: 'Full pack: chip, shots, R7, airport pickup.' }, href: '/pets/import' },
    { slug: 'pet-friendly-villas', label: { ru: 'Pet-friendly виллы', en: 'Pet-friendly villas' }, oneLiner: { ru: 'Каталог проверенных вилл, где питомца действительно ждут.', en: 'Verified villas where pets are actually welcome.' }, href: '/property?petFriendly=1' },
    { slug: 'vet-network', label: { ru: 'Ветеринары по-русски', en: 'Russian-speaking vets' }, oneLiner: { ru: 'Сеть из 6 клиник, доступ 24/7, скидка участникам.', en: '6-clinic network, 24/7 access, member discount.' }, href: '/pets/vets' },
    { slug: 'grooming-care', label: { ru: 'Груминг и зоомагазины', en: 'Grooming & pet shops' }, oneLiner: { ru: 'Премиум-уход в Раваи и Чалонге, доставка корма.', en: 'Premium care in Rawai and Chalong, pet-food delivery.' }, href: '/pets/care' },
  ],
  faq: [
    { q: { ru: 'Какие документы нужны для ввоза собаки?', en: 'Which documents are needed to import a dog?' }, a: { ru: 'Микрочип, паспорт, прививка от бешенства не моложе 21 дня, справка из госветслужбы и разрешение R7 от тайского DLD.', en: 'Microchip, pet passport, rabies vaccine ≥21 days old, government vet certificate and an R7 permit from Thai DLD.' } },
    { q: { ru: 'Сколько стоит ввоз?', en: 'How much does import cost?' }, a: { ru: 'Госпошлина DLD — около 1 000 THB. Наша помощь с пакетом документов — 6 500 THB. Перевозка из карго — от 2 500 THB.', en: 'DLD fee — about 1,000 THB. Our paperwork help — 6,500 THB. Cargo transfer — from 2,500 THB.' } },
    { q: { ru: 'Есть ли карантин?', en: 'Is there quarantine?' }, a: { ru: 'При полном пакете и прививке от бешенства карантин не требуется — питомец едет с вами после оформления в аэропорту.', en: 'With a complete package and valid rabies shot, no quarantine — the pet leaves with you after airport clearance.' } },
    { q: { ru: 'Какие виллы реально принимают животных?', en: 'Which villas actually accept pets?' }, a: { ru: 'В каталоге 80+ объектов с подтверждённой политикой. Депозит за животное — 5 000–10 000 THB, возвращается при выезде.', en: 'The catalogue lists 80+ properties with confirmed policy. Pet deposit 5,000–10,000 THB, refunded on checkout.' } },
    { q: { ru: 'Можно ли с питомцем в кафе и на пляж?', en: 'Can I go to a café or beach with my pet?' }, a: { ru: 'Часть кафе в Раваи и Чалонге принимает собак. На большинстве пляжей — после 18:00, без ошейника штраф 1 000 THB.', en: 'Some cafés in Rawai and Chalong accept dogs. Most beaches — after 6pm; no collar = 1,000 THB fine.' } },
    { q: { ru: 'Что делать, если питомец заболел ночью?', en: 'What if my pet falls ill at night?' }, a: { ru: 'Дежурная клиника принимает 24/7. Напишите в чат — мы согласуем приём и при необходимости пришлём такси.', en: 'A 24/7 emergency clinic is on call. Message us — we’ll book the visit and dispatch a taxi if needed.' } },
  ],
  primaryCta: {
    label: { ru: 'Подобрать виллу с питомцем', en: 'Find a pet-friendly villa' },
    href: '/property?petFriendly=1',
    subtitle: { ru: '80+ проверенных объектов в каталоге.', en: '80+ verified properties in the catalogue.' },
  },
  secondaryCta: {
    label: { ru: 'Оформить ввоз', en: 'Start the import paperwork' },
    href: '/pets/import',
  },
  seo: {
    metaTitle: { ru: 'Пхукет с питомцем: ввоз, виллы, ветеринар — myUNO', en: 'Phuket with a pet: import, villas, vet — myUNO' },
    metaDescription: { ru: 'Pet-friendly виллы, ввоз собаки или кошки по правилам DLD, ветеринар по-русски и груминг. Чек-листы, цены в THB.', en: 'Pet-friendly villas, DLD-compliant cat or dog import, Russian-speaking vet and grooming. Checklists, THB pricing.' },
    ogImage: OG_DEFAULT,
    canonicalPath: '/for/pet-owners',
    hreflangAlternates: [
      { lang: 'ru', href: 'https://myuno.app/for/pet-owners?lang=ru' },
      { lang: 'en', href: 'https://myuno.app/for/pet-owners?lang=en' },
    ],
  },
};
