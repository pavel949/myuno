import type { UserPersona } from '@/hooks/useUserPersonas';

/**
 * What myUNO closes for each role — facts + concrete mechanism.
 * Tone: calm infrastructure. No promises, no superlatives.
 * 4 points per role; component shows 3 when two roles are visible.
 */
export const ROLE_VALUE_POINTS: Record<UserPersona, { ru: string[]; en: string[] }> = {
  tourist: {
    ru: [
      'Трансфер и SIM при прилёте',
      'Аренда транспорта и жильё на короткий срок',
      'Рестораны, экскурсии, яхты с RU-поддержкой',
      'SOS и страховка 24/7',
    ],
    en: [
      'Transfer and SIM on arrival',
      'Vehicle rental and short-term stays',
      'Restaurants, tours, yachts with RU support',
      'SOS and insurance, 24/7',
    ],
  },
  resident: {
    ru: [
      'Виза, TM30, налоги — напоминания и юрист',
      'Быт: уборка, доставка, ветеринар',
      'Школы, клиники, банки в каталоге RU',
      'Долгосрочная аренда без посредников',
    ],
    en: [
      'Visa, TM30, taxes — reminders and lawyer',
      'Daily essentials: cleaning, delivery, vet',
      'Schools, clinics, banks in RU catalog',
      'Long-term rent without intermediaries',
    ],
  },
  property_owner: {
    ru: [
      'Календарь и каналы продаж в одном месте',
      'Уборки и ТО по расписанию',
      'Отчёт собственнику и выплаты ежемесячно',
      'Команда и доступы по ролям',
    ],
    en: [
      'Calendar and sales channels in one place',
      'Cleaning and maintenance on schedule',
      'Owner statement and monthly payouts',
      'Team and role-based access',
    ],
  },
  investor: {
    ru: [
      'Каталог новостроек с проверенной доходностью',
      'Юридическая чистота сделки и налоги',
      'Управление объектом после покупки',
      'Вторичный рынок и переуступки',
    ],
    en: [
      'New developments with verified yield',
      'Clean legal title and tax handling',
      'Property management after purchase',
      'Secondary market and assignments',
    ],
  },
  real_estate_developer: {
    ru: [
      'Размещение проекта в каталоге',
      'Заявки и воронка продаж',
      'Аналитика просмотров и конверсии',
      'Доступ к команде агентов платформы',
    ],
    en: [
      'Project listing in the catalog',
      'Inbound leads and sales pipeline',
      'Views and conversion analytics',
      'Access to the platform agent network',
    ],
  },
  local_services_provider: {
    ru: [
      'Профиль и заявки от клиентов',
      'Платежи и выплаты прозрачно',
      'Подписка вместо комиссии за лид',
      'Календарь занятости и команда',
    ],
    en: [
      'Public profile and inbound requests',
      'Payments and payouts, transparent',
      'Subscription instead of per-lead commission',
      'Availability calendar and team',
    ],
  },
  family: {
    ru: [
      'Школы и детские активности',
      'Медицина и страховка для детей',
      'Семейное жильё на длительно',
      'Няни и доставка проверенные',
    ],
    en: [
      'Schools and kids activities',
      'Pediatric care and insurance',
      'Family housing for long stays',
      'Vetted nannies and delivery',
    ],
  },
  business: {
    ru: [
      'Регистрация компании и бухучёт',
      'Виза и WP для команды',
      'Офис, склад, юридический адрес',
      'Платёжные рельсы и комплаенс',
    ],
    en: [
      'Company setup and accounting',
      'Visa and work permits for the team',
      'Office, warehouse, legal address',
      'Payment rails and compliance',
    ],
  },
  nomad: {
    ru: [
      'Коворкинги и быстрый интернет',
      'Виза LTR / DTV — статус и продление',
      'Жильё помесячно с гибким выездом',
      'Налоговое резидентство — консультация',
    ],
    en: [
      'Coworking and fast internet',
      'LTR / DTV visa — status and renewal',
      'Monthly stays with flexible checkout',
      'Tax residency — advisory',
    ],
  },
  relocation: {
    ru: [
      'Виза и легализация документов',
      'Жильё, школа, медицина первой недели',
      'Перевозка вещей и питомцев',
      'Открытие банковского счёта',
    ],
    en: [
      'Visa and document legalization',
      'Housing, school, clinic in week one',
      'Belongings and pet relocation',
      'Bank account opening',
    ],
  },
  couple: {
    ru: [
      'Рестораны и спа на двоих',
      'Виллы и романтические маршруты',
      'Бронирование сюрпризов и трансфера',
    ],
    en: [
      'Restaurants and spa for two',
      'Villas and romantic itineraries',
      'Surprise booking and transfer',
    ],
  },
  active: {
    ru: [
      'Серфинг, MMA, фитнес — расписание',
      'Аренда снаряжения и тренеры',
      'Маршруты и экскурсии активного отдыха',
    ],
    en: [
      'Surf, MMA, gym — schedules',
      'Gear rental and trainers',
      'Active outdoor routes and tours',
    ],
  },
  nightlife: {
    ru: [
      'Клубы, бары, VIP-резервы',
      'Трансфер ночью и обратно',
      'События и афиша на неделю',
    ],
    en: [
      'Clubs, bars, VIP reservations',
      'Late-night transfer both ways',
      'Weekly events and lineup',
    ],
  },
  pet_owner: {
    ru: [
      'Ветеринар и груминг рядом',
      'Жильё и отели pet-friendly',
      'Перевозка и сопровождение питомца',
    ],
    en: [
      'Vet and grooming nearby',
      'Pet-friendly housing and hotels',
      'Pet transport and travel support',
    ],
  },
};
