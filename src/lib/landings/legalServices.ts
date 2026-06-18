export type LegalServiceId = 'visa' | 'company' | 'tax';

export interface LegalServiceConfig {
  id: LegalServiceId;
  emoji: string;
  hero: {
    ru: { eyebrow: string; title: string; subtitle: string };
    en: { eyebrow: string; title: string; subtitle: string };
  };
  bullets: { ru: string[]; en: string[] };
  ctaPrimary: { ru: string; en: string; href: string };
  faq: Array<{ q_ru: string; a_ru: string; q_en: string; a_en: string }>;
}

export const LEGAL_SERVICES: Record<LegalServiceId, LegalServiceConfig> = {
  visa: {
    id: 'visa', emoji: '🛂',
    hero: {
      ru: { eyebrow: 'ВИЗА · ТАИЛАНД', title: 'Виза в Таиланд — без посредников и нервов', subtitle: 'DTV, LTR, Education, Retirement, Marriage. Юрист с опытом 8+ лет, документы под ключ, сопровождение в Immigration.' },
      en: { eyebrow: 'VISA · THAILAND', title: 'Thai visa — no middlemen, no stress', subtitle: 'DTV, LTR, Education, Retirement, Marriage. 8+ years lawyer experience, turnkey paperwork, Immigration escort.' },
    },
    bullets: {
      ru: ['Подбор визового маршрута за 15 минут', 'Полный пакет документов на тайском и английском', 'Сопровождение в Immigration в Пхукет-Тауне', 'Продление и conversion без выезда из страны'],
      en: ['Visa pathway picked in 15 minutes', 'Full document pack in Thai and English', 'Escort at Phuket Town Immigration', 'Renewal and conversion without leaving Thailand'],
    },
    ctaPrimary: { ru: 'Пройти квиз и получить план', en: 'Take the quiz and get your plan', href: '/legal/visa-quiz' },
    faq: [
      { q_ru: 'Сколько стоит консультация?', a_ru: '฿2,000 за 30 минут с лицензированным юристом, засчитывается в стоимость пакета.', q_en: 'How much is a consultation?', a_en: '฿2,000 for a 30-minute call with a licensed lawyer, credited toward the package.' },
      { q_ru: 'Делаете ли DTV-визы?', a_ru: 'Да, под ключ — от подачи в e-Visa до получения штампа. Срок 4-6 недель.', q_en: 'Do you handle DTV?', a_en: 'Yes, turnkey — from e-Visa submission to stamp. 4-6 weeks.' },
    ],
  },
  company: {
    id: 'company', emoji: '🏢',
    hero: {
      ru: { eyebrow: 'КОМПАНИЯ · ТАИЛАНД', title: 'Открытие компании в Таиланде', subtitle: 'Co. Ltd., BOI, USRO, представительство. Подбор структуры под ваш бизнес и долгосрочную визу.' },
      en: { eyebrow: 'COMPANY · THAILAND', title: 'Thai company formation', subtitle: 'Co. Ltd., BOI, USRO, rep office. Structure tailored to your business and long-term visa.' },
    },
    bullets: {
      ru: ['Регистрация Co. Ltd. за 2-3 недели', 'BOI-структура для IT/туризма с налоговыми льготами', 'Тайские номиналы с прозрачным договором', 'Бухгалтер и подача отчётности — отдельная подписка'],
      en: ['Co. Ltd. registration in 2-3 weeks', 'BOI structure for IT/tourism with tax incentives', 'Thai nominees with a transparent contract', 'Accountant & filings — separate retainer'],
    },
    ctaPrimary: { ru: 'Записаться на консультацию', en: 'Book a consultation', href: '/legal' },
    faq: [
      { q_ru: 'Нужно ли мне быть в Таиланде?', a_ru: 'Для подписания учредительных документов — да, хотя бы на 1-2 дня. Остальное можно дистанционно через доверенность.', q_en: 'Do I have to be in Thailand?', a_en: 'To sign founder documents — yes, at least 1-2 days. Everything else can be done remotely via PoA.' },
      { q_ru: 'Сколько стоит открытие?', a_ru: 'От ฿35,000 за Co. Ltd. под ключ + государственные сборы.', q_en: 'How much does it cost?', a_en: 'From ฿35,000 turnkey Co. Ltd. + government fees.' },
    ],
  },
  tax: {
    id: 'tax', emoji: '🧾',
    hero: {
      ru: { eyebrow: 'НАЛОГИ · ТАИЛАНД', title: 'Налоговое структурирование для экспатов', subtitle: 'Тайская налоговая резиденция, remittance basis, CFC, двойное налогообложение. Понятный план — без терминов.' },
      en: { eyebrow: 'TAX · THAILAND', title: 'Tax structuring for expats', subtitle: 'Thai tax residency, remittance basis, CFC, double-tax treaties. Plain-language plan — zero jargon.' },
    },
    bullets: {
      ru: ['Анализ вашей ситуации (страна, доходы, активы)', 'Резюме по тайскому налогу + договору об избежании', 'План на год с конкретными действиями и датами', 'Подготовка PND.90/91 если нужно подавать'],
      en: ['Analysis of your situation (country, income, assets)', 'Thai tax & DTA summary', '12-month plan with concrete actions and dates', 'PND.90/91 prep if filing is needed'],
    },
    ctaPrimary: { ru: 'Пройти налоговый квиз', en: 'Take the tax quiz', href: '/legal/tax-nav' },
    faq: [
      { q_ru: 'Я уже резидент — что делать с remittance?', a_ru: 'С 2024 года ввоз ранее заработанных средств в Таиланд может облагаться налогом. Разберём вашу ситуацию на консультации.', q_en: 'I am already resident — what about remittance?', a_en: 'Since 2024 remittance of prior-year income may be taxable. We will review your case on the consult.' },
      { q_ru: 'Помогаете с подачей в России/ЕС?', a_ru: 'По России — да, в партнёрстве с проверенными налоговыми. По ЕС — referral.', q_en: 'Do you help file in Russia/EU?', a_en: 'For Russia — yes, with trusted tax partners. For EU — referral.' },
    ],
  },
};

export function getLegalService(id: string | undefined): LegalServiceConfig | null {
  if (!id) return null;
  return (LEGAL_SERVICES as Record<string, LegalServiceConfig>)[id] ?? null;
}
