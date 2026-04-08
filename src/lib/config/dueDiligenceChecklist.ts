/**
 * Due Diligence Checklist — Interactive checklist for new-build buyers
 */

export interface ChecklistItem {
  id: string;
  category: 'legal' | 'financial' | 'construction' | 'developer' | 'post_purchase';
  title_en: string;
  title_ru: string;
  description_en: string;
  description_ru: string;
  importance: 'critical' | 'high' | 'medium';
  service_link?: string;
  service_label_ru?: string;
}

export interface ChecklistCategory {
  id: string;
  label_en: string;
  label_ru: string;
  icon: string;
}

export const CHECKLIST_CATEGORIES: ChecklistCategory[] = [
  { id: 'legal', label_en: 'Legal', label_ru: 'Юридические', icon: 'scale' },
  { id: 'financial', label_en: 'Financial', label_ru: 'Финансовые', icon: 'banknote' },
  { id: 'construction', label_en: 'Construction', label_ru: 'Строительство', icon: 'hard-hat' },
  { id: 'developer', label_en: 'Developer', label_ru: 'Девелопер', icon: 'building' },
  { id: 'post_purchase', label_en: 'Post-Purchase', label_ru: 'После покупки', icon: 'key' },
];

export const CHECKLIST_ITEMS: ChecklistItem[] = [
  // Legal
  {
    id: 'title_deed',
    category: 'legal',
    title_en: 'Verify title deed (Chanote)',
    title_ru: 'Проверить документы на землю (Чанот)',
    description_en: 'Confirm the land title is Chanote (Nor Sor 4 Jor) — the highest form of Thai land ownership.',
    description_ru: 'Убедитесь, что земля имеет титул Чанот (Нор Сор 4 Джор) — высшую форму владения землёй в Таиланде.',
    importance: 'critical',
    service_link: '/legal',
    service_label_ru: 'Юридическая проверка',
  },
  {
    id: 'eia_check',
    category: 'legal',
    title_en: 'EIA (Environmental Impact Assessment)',
    title_ru: 'EIA (Оценка воздействия на окружающую среду)',
    description_en: 'For projects over 80 units, verify the EIA report has been approved by the ONEP.',
    description_ru: 'Для проектов более 80 юнитов проверьте, что отчёт EIA одобрен ONEP.',
    importance: 'critical',
  },
  {
    id: 'construction_permit',
    category: 'legal',
    title_en: 'Construction permit',
    title_ru: 'Разрешение на строительство',
    description_en: 'Verify valid construction permits issued by the local municipality.',
    description_ru: 'Проверьте наличие действующих разрешений на строительство от местного муниципалитета.',
    importance: 'critical',
  },
  {
    id: 'foreign_quota',
    category: 'legal',
    title_en: 'Foreign ownership quota',
    title_ru: 'Квота иностранного владения',
    description_en: 'For condominiums, verify the 49% foreign ownership quota is not exceeded.',
    description_ru: 'Для кондоминиумов проверьте, что квота иностранного владения 49% не превышена.',
    importance: 'critical',
  },
  {
    id: 'contract_review',
    category: 'legal',
    title_en: 'Review purchase contract',
    title_ru: 'Проверить договор купли-продажи',
    description_en: 'Have the SPA (Sale and Purchase Agreement) reviewed by an independent lawyer.',
    description_ru: 'Попросите независимого юриста проверить договор купли-продажи (SPA).',
    importance: 'critical',
    service_link: '/legal/contract-analysis',
    service_label_ru: 'Анализ контракта',
  },
  {
    id: 'fbt_registration',
    category: 'legal',
    title_en: 'FET registration & transfer',
    title_ru: 'Регистрация FET и перевод средств',
    description_en: 'Foreign Exchange Transaction form is required for foreigners buying freehold.',
    description_ru: 'Форма FET требуется для иностранцев, покупающих freehold. Перевод должен быть в иностранной валюте.',
    importance: 'high',
  },

  // Financial
  {
    id: 'payment_schedule',
    category: 'financial',
    title_en: 'Review payment schedule',
    title_ru: 'Проверить график платежей',
    description_en: 'Understand all milestone payments, deposits, and final transfer costs.',
    description_ru: 'Изучите все платежи по этапам, депозиты и финальные расходы на перевод.',
    importance: 'high',
  },
  {
    id: 'escrow_account',
    category: 'financial',
    title_en: 'Escrow account verification',
    title_ru: 'Проверка эскроу-счёта',
    description_en: 'Verify if developer uses an escrow account for buyer funds protection.',
    description_ru: 'Проверьте, использует ли девелопер эскроу-счёт для защиты средств покупателя.',
    importance: 'high',
  },
  {
    id: 'transfer_fees',
    category: 'financial',
    title_en: 'Transfer fees & taxes',
    title_ru: 'Расходы на перевод и налоги',
    description_en: 'Calculate transfer fee (2%), stamp duty (0.5%), withholding tax, and specific business tax.',
    description_ru: 'Рассчитайте: transfer fee (2%), гербовый сбор (0.5%), налог у источника и specific business tax.',
    importance: 'high',
  },
  {
    id: 'cam_fee',
    category: 'financial',
    title_en: 'CAM fee & sinking fund',
    title_ru: 'CAM fee и ремонтный фонд',
    description_en: 'Understand monthly Common Area Maintenance fee and one-time sinking fund payment.',
    description_ru: 'Уточните ежемесячный CAM fee и разовый платёж в ремонтный фонд.',
    importance: 'medium',
  },

  // Construction
  {
    id: 'progress_verification',
    category: 'construction',
    title_en: 'Verify construction progress',
    title_ru: 'Проверить ход строительства',
    description_en: 'Visit the site or request recent photos/video of actual construction progress.',
    description_ru: 'Посетите стройку или запросите свежие фото/видео реального хода строительства.',
    importance: 'high',
  },
  {
    id: 'material_quality',
    category: 'construction',
    title_en: 'Building materials & specs',
    title_ru: 'Строительные материалы и спецификации',
    description_en: 'Review the construction specifications, finishes, and materials used.',
    description_ru: 'Изучите спецификации строительства, отделку и используемые материалы.',
    importance: 'medium',
  },
  {
    id: 'completion_guarantee',
    category: 'construction',
    title_en: 'Completion guarantee',
    title_ru: 'Гарантия завершения',
    description_en: 'Check if there is a bank guarantee or insurance for project completion.',
    description_ru: 'Проверьте наличие банковской гарантии или страховки на завершение проекта.',
    importance: 'high',
  },
  {
    id: 'defect_warranty',
    category: 'construction',
    title_en: 'Defect warranty period',
    title_ru: 'Гарантийный период на дефекты',
    description_en: 'Standard is 1-2 years structural warranty. Confirm terms in the contract.',
    description_ru: 'Стандарт: 1-2 года гарантии на конструктив. Уточните условия в договоре.',
    importance: 'medium',
  },

  // Developer
  {
    id: 'developer_track_record',
    category: 'developer',
    title_en: 'Developer track record',
    title_ru: 'Репутация девелопера',
    description_en: 'Research completed projects, delivery timelines, and buyer reviews.',
    description_ru: 'Изучите завершённые проекты, соблюдение сроков и отзывы покупателей.',
    importance: 'critical',
    service_link: '/newbuilds/developers',
    service_label_ru: 'Каталог девелоперов',
  },
  {
    id: 'developer_financials',
    category: 'developer',
    title_en: 'Developer financial health',
    title_ru: 'Финансовое состояние девелопера',
    description_en: 'Check registered capital, ongoing projects, and financial stability.',
    description_ru: 'Проверьте уставной капитал, текущие проекты и финансовую стабильность.',
    importance: 'high',
  },
  {
    id: 'developer_company',
    category: 'developer',
    title_en: 'Company registration',
    title_ru: 'Регистрация компании',
    description_en: 'Verify company registration at DBD (Department of Business Development).',
    description_ru: 'Проверьте регистрацию компании в DBD (Департамент развития бизнеса).',
    importance: 'high',
  },

  // Post-purchase
  {
    id: 'property_management',
    category: 'post_purchase',
    title_en: 'Property management setup',
    title_ru: 'Организация управления',
    description_en: 'Arrange property management for rentals and maintenance.',
    description_ru: 'Организуйте управление недвижимостью для сдачи в аренду и обслуживания.',
    importance: 'high',
    service_link: '/mc',
    service_label_ru: 'Управляющие компании',
  },
  {
    id: 'insurance',
    category: 'post_purchase',
    title_en: 'Property insurance',
    title_ru: 'Страхование недвижимости',
    description_en: 'Get comprehensive property insurance covering natural disasters and liability.',
    description_ru: 'Оформите комплексное страхование, покрывающее стихийные бедствия и ответственность.',
    importance: 'medium',
    service_link: '/insurance',
    service_label_ru: 'Страхование',
  },
  {
    id: 'rental_license',
    category: 'post_purchase',
    title_en: 'Rental license',
    title_ru: 'Лицензия на аренду',
    description_en: 'If planning short-term rentals, check local regulations and licensing requirements.',
    description_ru: 'Если планируете краткосрочную аренду, проверьте местные правила и требования к лицензированию.',
    importance: 'medium',
  },
  {
    id: 'visa_planning',
    category: 'post_purchase',
    title_en: 'Visa & stay planning',
    title_ru: 'Планирование визы и проживания',
    description_en: 'Consider Thailand Elite visa, retirement visa, or other long-term stay options.',
    description_ru: 'Рассмотрите Thailand Elite визу, пенсионную визу или другие варианты долгосрочного проживания.',
    importance: 'medium',
    service_link: '/legal/visa',
    service_label_ru: 'Визовые услуги',
  },
];
