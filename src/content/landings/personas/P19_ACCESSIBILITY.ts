/**
 * Auto-split from personaLandings.ts (Wave 1.B cleanup, 2026-04).
 * Wave 3 expansion (2026-05): brought to production-grade parity with P14/P15.
 */
import type { PersonaLanding } from '@/lib/landings/types';
import { OG_DEFAULT } from './_shared';

export const P19_ACCESSIBILITY: PersonaLanding = {
  personaCode: 'P19',
  slug: 'accessibility',
  status: 'live',
  h1: {
    ru: 'Пхукет для путешественников с ограниченными возможностями',
    en: 'Phuket for accessibility-first travellers',
  },
  subtitle: {
    ru: 'Step-free виллы, трансфер с пандусом, прокат электроколяски, медицинская поддержка 24/7, accessible diving — путешествие без преград.',
    en: 'Step-free villas, ramp-equipped transfer, power wheelchair rental, 24/7 medical support, accessible diving — travel without barriers.',
  },
  pains: [
    { ru: 'Сложно найти виллу или кондо с настоящим step-free доступом, а не «1 ступенька».', en: 'Hard to find a truly step-free villa or condo, not “just one step”.' },
    { ru: 'Нужен трансфер, в который влезает электроколяска весом 80+ кг.', en: 'You need a transfer that fits an 80+ kg power wheelchair.' },
    { ru: 'Не понятно, какие пляжи реально доступны и где работает beach mat.', en: 'It’s unclear which beaches are actually accessible and where beach mats are deployed.' },
    { ru: 'Хочется заранее знать, есть ли врач, сиделка и медоборудование по вызову.', en: 'You want to know in advance if a doctor, carer and medical equipment are on call.' },
  ],
  services: [
    { slug: 'accessible-stays', label: { ru: 'Step-free жильё', en: 'Step-free stays' }, oneLiner: { ru: 'Roll-in shower, поручни, прокат коляски от ฿1 500/день.', en: 'Roll-in shower, grab rails, wheelchair rental from ฿1,500/day.' }, href: '/property/rent' },
    { slug: 'wheelchair-transfer', label: { ru: 'Трансфер с пандусом', en: 'Wheelchair transfer' }, oneLiner: { ru: 'Toyota Hiace с гидролифтом, водитель обучен. ฿2 800 в одну сторону.', en: 'Toyota Hiace with hydraulic lift, trained driver. ฿2,800 one-way.' }, href: '/landing/airport-transfer' },
    { slug: 'beach-guide', label: { ru: 'Доступные пляжи', en: 'Accessible beaches' }, oneLiner: { ru: 'Surin, Bang Tao, Kata Yai — beach mat, тень, accessible toilet.', en: 'Surin, Bang Tao, Kata Yai — beach mat, shade, accessible toilet.' }, href: '/map' },
    { slug: 'medical-on-call', label: { ru: 'Врач и сиделка 24/7', en: 'Doctor & carer 24/7' }, oneLiner: { ru: 'Bangkok Hospital home-visit ฿2 500, лицензированные сиделки ฿1 200/8ч.', en: 'Bangkok Hospital home visit ฿2,500, licensed carers ฿1,200/8h.' }, href: '/cluster/health' },
    { slug: 'accessible-diving', label: { ru: 'Accessible diving', en: 'Accessible diving' }, oneLiner: { ru: 'PADI Adaptive Support diver, hoist на dive boat. От ฿8 500/день.', en: 'PADI Adaptive Support divers, hoist-equipped dive boat. From ฿8,500/day.' }, href: '/water-activities' },
    { slug: 'medical-evac', label: { ru: 'Medical evacuation', en: 'Medical evacuation' }, oneLiner: { ru: 'AirAmbulance до Бангкока ($18–28K) или домой через Allianz/Cigna.', en: 'Air ambulance to Bangkok ($18–28K) or home via Allianz/Cigna.' }, href: '/services/insurance/liaison' },
  ],
  faq: [
    { q: { ru: 'Какой район самый удобный?', en: 'Which area is most convenient?' }, a: { ru: 'Bang Tao, Laguna, Cherngtalay — ровные тротуары и новая застройка с лифтами и широкими дверями. Patong — много step-free отелей, но шумно. Kata/Karon — есть accessible-curated отели (Centara Grand). Old Town — узкие тротуары, не рекомендуем.', en: 'Bang Tao, Laguna, Cherngtalay — flat sidewalks and modern buildings with lifts and wide doors. Patong — many step-free hotels but noisy. Kata/Karon — curated accessible hotels (Centara Grand). Old Town — narrow sidewalks, not recommended.' } },
    { q: { ru: 'Можно ли арендовать электроколяску?', en: 'Can I rent a power wheelchair?' }, a: { ru: 'Да — Phuket Mobility и Bangkok Hospital Equipment Rental: электроколяска ฿1 800–2 800/день, кресло-каталка ฿800/день, hospital-bed ฿1 500/день, кислородный концентратор ฿2 200/день. Доставка к вилле и инструктаж включены.', en: 'Yes — Phuket Mobility and Bangkok Hospital Equipment Rental: power wheelchair ฿1,800–2,800/day, manual wheelchair ฿800/day, hospital bed ฿1,500/day, oxygen concentrator ฿2,200/day. Villa delivery and briefing included.' } },
    { q: { ru: 'Что со страховкой и эвакуацией?', en: 'What about insurance and evacuation?' }, a: { ru: 'Обязательно travel-страховка с rider на pre-existing condition (Allianz Care, Cigna Global, IMG). Покрытие медэвакуации $250K минимум. Бюджетная World Nomads подходит только для лёгких случаев. Bangkok Hospital — direct billing с топ-страховщиками.', en: 'Mandatory travel insurance with pre-existing condition rider (Allianz Care, Cigna Global, IMG). Medical evacuation cover $250K minimum. Budget World Nomads works only for mild cases. Bangkok Hospital direct-bills major carriers.' } },
    { q: { ru: 'Виза для путешественников с инвалидностью?', en: 'Visa for travellers with disability?' }, a: { ru: 'Стандартная visa-on-arrival 30 дней или Tourist Visa 60 дней. На сопровождающего отдельная виза. Для длительного лечения — Medical Treatment Visa (до 1 года) через рекомендацию Bangkok Hospital. Подаём пакет документов мы.', en: 'Standard visa-on-arrival 30 days or Tourist Visa 60 days. Separate visa for a carer. For long-term treatment — Medical Treatment Visa (up to 1 year) via a Bangkok Hospital referral. We file the document package.' } },
    { q: { ru: 'Есть ли диализ-клиники для гостевого режима?', en: 'Are there dialysis clinics for visitor scheduling?' }, a: { ru: 'Да — Bangkok Hospital Phuket и BIH принимают гостевой диализ. Стоимость сессии ฿4 500–6 500 (3–4 раза в неделю). Бронировать слот за 30 дней до приезда. Координатор myUNO согласовывает с вашим нефрологом.', en: 'Yes — Bangkok Hospital Phuket and BIH accept visitor dialysis. Session ฿4,500–6,500 (3–4 times/week). Book the slot 30 days before arrival. The myUNO coordinator liaises with your nephrologist.' } },
    { q: { ru: 'Есть ли услуги переводчика жестового языка?', en: 'Is sign language interpreting available?' }, a: { ru: 'ASL и International Sign — по запросу через Phuket Disabled Persons Foundation, ฿2 500–3 500/час, бронь за 7 дней. Тайский жестовый — стандартно в государственных клиниках. Lip-reading consultations в Bangkok Hospital — без доплаты.', en: 'ASL and International Sign — on request via Phuket Disabled Persons Foundation, ฿2,500–3,500/hr, 7-day notice. Thai sign language — standard at public hospitals. Lip-reading consultations at Bangkok Hospital — no surcharge.' } },
  ],
  primaryCta: { label: { ru: 'Подобрать жильё и план', en: 'Find a stay & plan' }, href: '/property/rent', subtitle: { ru: 'Подбор с инспекцией доступности — за 48 часов.', en: 'Shortlist with accessibility inspection — within 48 hours.' } },
  secondaryCta: { label: { ru: 'Заказать трансфер', en: 'Book a transfer' }, href: '/landing/airport-transfer' },
  seo: {
    metaTitle: { ru: 'Доступный Пхукет: жильё, трансфер, врачи — myUNO', en: 'Accessible Phuket: stays, transfer, doctors — myUNO' },
    metaDescription: { ru: 'Step-free виллы, трансфер с пандусом, прокат электроколяски, accessible diving и медицинская поддержка 24/7 для путешественников с ограниченными возможностями.', en: 'Step-free villas, ramp transfer, power wheelchair rental, accessible diving and 24/7 medical support for accessibility-first travellers on Phuket.' },
    ogImage: OG_DEFAULT,
    canonicalPath: '/for/accessibility',
    hreflangAlternates: [
      { lang: 'ru', href: 'https://myuno.app/for/accessibility?lang=ru' },
      { lang: 'en', href: 'https://myuno.app/for/accessibility?lang=en' },
    ],
  },
};
