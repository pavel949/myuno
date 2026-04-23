export type VerticalContextType = 'weather' | 'market' | 'alert' | 'seasonal' | 'availability' | 'emergency';

export interface VerticalContextConfig {
  type: VerticalContextType;
  titleEn: string;
  titleRu: string;
  bodyEn: string;
  bodyRu: string;
  icon: string;
  ctaRoute?: string;
  ctaLabelEn?: string;
  ctaLabelRu?: string;
  dismissible: boolean;
}

export const VERTICAL_CONTEXT_CONFIG: Partial<Record<string, VerticalContextConfig>> = {
  yacht: {
    type: 'weather',
    icon: '⛵',
    titleEn: 'Charter Conditions This Week',
    titleRu: 'Условия для чартера',
    bodyEn: 'High season: calm seas, avg 2–3 Beaufort. Perfect for full-day island trips.',
    bodyRu: 'Высокий сезон: спокойное море, 2–3 балла. Идеально для дневных рейдов.',
    dismissible: true,
  },
  experience: {
    type: 'seasonal',
    icon: '🌤️',
    titleEn: 'Tour Season: Nov–Apr',
    titleRu: 'Сезон туров: ноябрь–апрель',
    bodyEn: 'Nov–Apr: dry season, all tours running. Book Phi Phi & Similan early — fills fast.',
    bodyRu: 'Ноябрь–Апрель: сухой сезон, все туры работают. Phi Phi и Симилан — бронируйте заранее.',
    ctaRoute: '/experiences?category=island',
    ctaLabelEn: 'Island Tours',
    ctaLabelRu: 'Туры на острова',
    dismissible: true,
  },
  property: {
    type: 'market',
    icon: '📊',
    titleEn: 'Phuket Rental Market',
    titleRu: 'Рынок аренды Пхукет',
    bodyEn: 'Avg 2BR long-term: ฿35,000–55,000/mo. High demand in Rawai & Cherngtalay.',
    bodyRu: 'Средняя 2BR долгосрочно: ฿35 000–55 000/мес. Высокий спрос: Раваи и Чернгталай.',
    dismissible: false,
  },
  restaurant: {
    type: 'availability',
    icon: '🍽️',
    titleEn: 'Book Ahead on Weekends',
    titleRu: 'Бронируйте заранее в выходные',
    bodyEn: 'Peak season: popular spots fill up by 7pm. Reserve 1–2 days ahead.',
    bodyRu: 'Высокий сезон: популярные места заняты к 19:00. Резервируйте за 1–2 дня.',
    dismissible: true,
  },
  medical: {
    type: 'emergency',
    icon: '🏥',
    titleEn: '24/7 Emergency Clinics',
    titleRu: 'Клиники 24/7',
    bodyEn: 'Bangkok Hospital Phuket: +66 76 254 425. Vachira Hospital (public): +66 76 361 234.',
    bodyRu: 'Bangkok Hospital Phuket: +66 76 254 425. Больница Вачира (гос.): +66 76 361 234.',
    dismissible: false,
  },
  legal: {
    type: 'alert',
    icon: '⚖️',
    titleEn: 'Visa & Stay Reminders',
    titleRu: 'Визовые напоминания',
    bodyEn: 'Tourist visa: 60 days + 30 day extension. TR→LTR upgrade available at myUNO.',
    bodyRu: 'Туристическая виза: 60 дней + 30 дней продление. Переход TR→LTR доступен через myUNO.',
    ctaRoute: '/visa',
    ctaLabelEn: 'Check Visa Options',
    ctaLabelRu: 'Варианты виз',
    dismissible: true,
  },
  insurance: {
    type: 'seasonal',
    icon: '🛡️',
    titleEn: 'Rainy Season Approaching',
    titleRu: 'Сезон дождей приближается',
    bodyEn: 'May–Oct: higher risk of accidents and medical incidents. Review your coverage.',
    bodyRu: 'Май–Октябрь: повышенный риск ДТП и медицинских случаев. Проверьте полис.',
    ctaRoute: '/insurance',
    ctaLabelEn: 'Get Covered',
    ctaLabelRu: 'Оформить страховку',
    dismissible: true,
  },
  fitness: {
    type: 'weather',
    icon: '🌅',
    titleEn: 'Outdoor Training: Before 10am',
    titleRu: 'Тренировки на улице: до 10:00',
    bodyEn: 'Today: 28°C, low humidity until 10am. Ideal for beach runs and Muay Thai.',
    bodyRu: 'Сегодня: 28°C, низкая влажность до 10:00. Отлично для пробежек и Муай Тай.',
    dismissible: true,
  },
  transfer: {
    type: 'availability',
    icon: '🚗',
    titleEn: 'Airport Transfer Time',
    titleRu: 'Время до аэропорта',
    bodyEn: 'HKT Airport: ~45 min from Patong, ~30 min from Phuket Town. Book in advance.',
    bodyRu: 'Аэропорт HKT: ~45 мин от Патонга, ~30 мин от Пхукет-Тауна. Бронируйте заранее.',
    dismissible: true,
  },
};
