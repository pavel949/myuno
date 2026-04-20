import type { UserPersona } from '@/hooks/useUserPersonas';

/**
 * Available services per profile category.
 *
 * Tone: service cabinet (Госуслуги / ГосТех). See mem://style/gov-tone-standard.
 * - Impersonal phrasing. No "you receive / you get".
 * - Every abbreviation is decoded on first mention.
 * - No marketing metaphors.
 * 4 entries per category; the component renders 3 when two categories are visible.
 */
export const ROLE_VALUE_POINTS: Record<UserPersona, { ru: string[]; en: string[] }> = {
  tourist: {
    ru: [
      'Трансфер и SIM-карта при прилёте',
      'Аренда транспорта и краткосрочное жильё',
      'Рестораны, экскурсии, яхты — каталог с поддержкой на русском',
      'Экстренная помощь и страхование, круглосуточно',
    ],
    en: [
      'Transfer and SIM card on arrival',
      'Vehicle rental and short-term accommodation',
      'Restaurants, tours, yachts — catalog with Russian-language support',
      'Emergency assistance and insurance, around the clock',
    ],
  },
  resident: {
    ru: [
      'Виза, уведомление о месте пребывания (TM30), налоги — напоминания и подача через юриста',
      'Бытовые сервисы: уборка, доставка, ветеринарная помощь',
      'Школы, клиники, банки — каталог на русском',
      'Долгосрочная аренда — подбор без посредников',
    ],
    en: [
      'Visa, place-of-stay notice (TM30), taxes — reminders and lawyer-assisted filing',
      'Household services: cleaning, delivery, veterinary care',
      'Schools, clinics, banks — Russian-language catalog',
      'Long-term housing — direct selection without intermediaries',
    ],
  },
  property_owner: {
    ru: [
      'Календарь бронирований и размещение в одном кабинете',
      'Уборка и техническое обслуживание по графику',
      'Отчёт собственнику и выплаты ежемесячно',
      'Управление командой и доступами по ролям',
    ],
    en: [
      'Booking calendar and listing distribution in one cabinet',
      'Cleaning and technical maintenance on schedule',
      'Owner statement and monthly payouts',
      'Team management and role-based access',
    ],
  },
  investor: {
    ru: [
      'Каталог объектов на стадии строительства с проверенной доходностью',
      'Юридическое сопровождение сделки и расчёт налогов',
      'Управление объектом после приобретения',
      'Вторичный рынок и переуступки',
    ],
    en: [
      'Catalog of properties under construction with verified yield',
      'Legal support of the transaction and tax calculation',
      'Property management after acquisition',
      'Secondary market and assignments',
    ],
  },
  real_estate_developer: {
    ru: [
      'Размещение проекта в каталоге',
      'Приём входящих заявок и обработка',
      'Аналитика просмотров и заявок',
      'Доступ к агентской сети сервиса',
    ],
    en: [
      'Project listing in the catalog',
      'Inbound applications and processing',
      'Views and applications analytics',
      'Access to the platform agent network',
    ],
  },
  local_services_provider: {
    ru: [
      'Профиль исполнителя и приём заявок от клиентов',
      'Платежи и выплаты по прозрачному регламенту',
      'Подписка на сервис вместо комиссии за заявку',
      'Календарь занятости и управление командой',
    ],
    en: [
      'Provider profile and inbound client requests',
      'Payments and payouts under transparent rules',
      'Subscription to the service instead of per-lead commission',
      'Availability calendar and team management',
    ],
  },
  family: {
    ru: [
      'Школы и детские образовательные программы',
      'Педиатрическая помощь и медицинское страхование',
      'Семейное жильё на длительный срок',
      'Проверенные няни и службы доставки',
    ],
    en: [
      'Schools and educational programs for children',
      'Pediatric care and medical insurance',
      'Family housing for long-term stays',
      'Verified nannies and delivery services',
    ],
  },
  business: {
    ru: [
      'Регистрация компании и бухгалтерское сопровождение',
      'Виза и разрешение на работу для сотрудников',
      'Офис, склад, юридический адрес',
      'Платёжная инфраструктура и комплаенс',
    ],
    en: [
      'Company registration and accounting support',
      'Visa and work permits for employees',
      'Office, warehouse, registered legal address',
      'Payment infrastructure and compliance',
    ],
  },
  nomad: {
    ru: [
      'Рабочие пространства и проверенный интернет-доступ',
      'Долгосрочная виза LTR и виза цифрового кочевника DTV — статус и продление',
      'Жильё помесячно с гибкими сроками выезда',
      'Налоговое резидентство — консультация специалиста',
    ],
    en: [
      'Workspaces and verified internet access',
      'Long-term visa (LTR) and digital nomad visa (DTV) — status and renewal',
      'Monthly accommodation with flexible checkout',
      'Tax residency — specialist consultation',
    ],
  },
  relocation: {
    ru: [
      'Виза и легализация документов',
      'Жильё, школа, медицинская помощь в первую неделю',
      'Перевозка имущества и сопровождение питомцев',
      'Открытие банковского счёта',
    ],
    en: [
      'Visa and document legalization',
      'Housing, school, medical care during the first week',
      'Belongings transport and pet relocation support',
      'Bank account opening',
    ],
  },
  couple: {
    ru: [
      'Рестораны и спа-программы для двоих',
      'Виллы и подбор маршрутов на двоих',
      'Бронирование сюрпризов и трансфер',
    ],
    en: [
      'Restaurants and spa programs for two',
      'Villas and curated itineraries for two',
      'Surprise booking and transfer',
    ],
  },
  active: {
    ru: [
      'Сёрфинг, единоборства, фитнес — расписание занятий',
      'Аренда снаряжения и подбор тренеров',
      'Маршруты активного отдыха и экскурсии',
    ],
    en: [
      'Surfing, martial arts, fitness — training schedule',
      'Equipment rental and trainer selection',
      'Active outdoor routes and tours',
    ],
  },
  nightlife: {
    ru: [
      'Клубы, бары, бронирование VIP-зон',
      'Ночной трансфер в обе стороны',
      'События и афиша на неделю',
    ],
    en: [
      'Clubs, bars, VIP area reservations',
      'Late-night transfer in both directions',
      'Weekly events and lineup',
    ],
  },
  pet_owner: {
    ru: [
      'Ветеринарная помощь и груминг рядом',
      'Жильё и отели, принимающие питомцев',
      'Перевозка и сопровождение питомца',
    ],
    en: [
      'Veterinary care and grooming nearby',
      'Pet-friendly housing and hotels',
      'Pet transport and travel support',
    ],
  },
};
