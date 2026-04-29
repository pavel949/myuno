/**
 * Auto-split from personaLandings.ts (Wave 1.B cleanup, 2026-04).
 * Original file became 1689 lines — each persona lives in its own module.
 * The barrel file personaLandings.ts keeps the public API stable.
 */
import type { PersonaLanding } from '@/lib/landings/types';
import { OG_DEFAULT } from './_shared';

export const P24_CREATIVES: PersonaLanding = {
  personaCode: 'P24',
  slug: 'creatives',
  status: 'live',
  h1: { ru: 'Creative class на Пхукете', en: 'Creative class on Phuket' },
  subtitle: { ru: 'Дизайнеры, продюсеры, фотографы, артисты — площадка для жизни, коллабораций и съёмок на острове.', en: 'Designers, producers, photographers, artists — a base for living, collaborating and shooting on the island.' },
  pains: [
    { ru: 'Нет базы локаций, людей и студий — каждый ресёрч с нуля.', en: 'No base of locations, people and studios — every research from scratch.' },
    { ru: 'Сложно собрать команду на проект (камера, MUA, локейшн).', en: 'Hard to assemble a project crew (camera, MUA, location).' },
    { ru: 'Нужна виза для творческой работы — не все знают про DTV.', en: 'You need a visa for creative work — not everyone knows DTV.' },
    { ru: 'Хочется community: meetups, выставки, lab-сессии.', en: 'You want community: meetups, exhibitions, lab sessions.' },
  ],
  services: [
    { slug: 'locations', label: { ru: 'База локаций', en: 'Location library' }, oneLiner: { ru: 'Виллы, студии, природа — с rate card.', en: 'Villas, studios, nature — with rate cards.' }, href: '/property/rent' },
    { slug: 'crew', label: { ru: 'Сборка команды', en: 'Crew booking' }, oneLiner: { ru: 'Камера, MUA, стилист, PA — за 24 ч.', en: 'Camera, MUA, stylist, PA — within 24 h.' }, href: '/contact' },
    { slug: 'dtv-visa', label: { ru: 'DTV для creators', en: 'DTV for creators' }, oneLiner: { ru: 'Destination Thailand Visa: 5 лет, 180 дн.', en: 'Destination Thailand Visa: 5 years, 180 days.' }, href: '/visa/quiz' },
    { slug: 'community', label: { ru: 'Community и события', en: 'Community & events' }, oneLiner: { ru: 'Meetups, лабы, открытые студии.', en: 'Meetups, labs, open studios.' }, href: '/cluster/lifestyle' },
  ],
  faq: [
    { q: { ru: 'Можно ли работать на иностранных клиентов?', en: 'Can I work for foreign clients?' }, a: { ru: 'Да — DTV специально для удалённой работы, выплат от иностранных клиентов через Wise/Stripe.', en: 'Yes — DTV is built for remote work and payments from foreign clients via Wise/Stripe.' } },
    { q: { ru: 'Где собираются креаторы?', en: 'Where does the creative scene gather?' }, a: { ru: 'Phuket Town (Old Town), Cherngtalay, Rawai. Регулярные арт-маркеты и meetups.', en: 'Phuket Town (Old Town), Cherngtalay, Rawai. Regular art markets and meetups.' } },
  ],
  primaryCta: { label: { ru: 'Подобрать локацию', en: 'Find a location' }, href: '/property/rent' },
  secondaryCta: { label: { ru: 'Получить DTV', en: 'Get DTV' }, href: '/visa/quiz' },
  seo: {
    metaTitle: { ru: 'Creative Phuket: локации, команда, DTV — myUNO', en: 'Creative Phuket: locations, crew, DTV — myUNO' },
    metaDescription: { ru: 'Площадка для дизайнеров, продюсеров и фотографов на Пхукете: локации, сборка команды, DTV и community.', en: 'A base for designers, producers and photographers on Phuket: locations, crew, DTV visa and community.' },
    ogImage: OG_DEFAULT,
    canonicalPath: '/for/creatives',
    hreflangAlternates: [
      { lang: 'ru', href: 'https://myuno.app/for/creatives?lang=ru' },
      { lang: 'en', href: 'https://myuno.app/for/creatives?lang=en' },
    ],
  },
};
