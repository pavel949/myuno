import { APP_ROUTES } from '@/lib/config/routes';

export type RelocationTimeline = 'urgent' | 'soon' | 'planned' | 'exploring';
export type RelocationHousehold = 'solo' | 'couple' | 'family';
export type RelocationBudget = 'low' | 'mid' | 'high' | 'premium';
export type RelocationHousingGoal = 'rent' | 'buy' | 'undecided';

export interface RelocationQuizAnswers {
  timeline: RelocationTimeline;
  household: RelocationHousehold;
  budget: RelocationBudget;
  housingGoal: RelocationHousingGoal;
  priorities: string[];
}

export type RelocationStepStatus = 'todo' | 'doing' | 'done';

export interface RelocationPlanStep {
  id: string;
  title_en: string;
  title_ru: string;
  article_slug?: string;
  route?: string;
  status: RelocationStepStatus;
}

const baseSteps = (): Omit<RelocationPlanStep, 'status'>[] => [
  {
    id: 'decide',
    title_en: 'Define goals & timeline',
    title_ru: 'Определите цели и сроки',
    route: APP_ROUTES.RELOCATION_GUIDES,
  },
  {
    id: 'visa',
    title_en: 'Choose visa route',
    title_ru: 'Выберите тип визы',
    article_slug: 'visa-overview',
    route: APP_ROUTES.VISA_COMPARE,
  },
  {
    id: 'housing',
    title_en: 'Secure long-term housing',
    title_ru: 'Найдите долгосрочное жильё',
    article_slug: 'housing-long-term',
    route: `${APP_ROUTES.PROPERTY_BROWSE}?mode=rent&tenancy=long`,
  },
  {
    id: 'school',
    title_en: 'Research schools & childcare',
    title_ru: 'Школы и детский сад',
    article_slug: 'schools-international',
    route: APP_ROUTES.EDUCATION,
  },
  {
    id: 'arrive',
    title_en: 'Airport transfer & first night',
    title_ru: 'Трансфер и первая ночь',
    route: APP_ROUTES.AIRPORT_TRANSFER,
  },
  {
    id: 'tm30',
    title_en: 'TM30 & 90-day reporting',
    title_ru: 'TM30 и 90-дневный отчёт',
    article_slug: 'tm30-ninety-day',
    route: APP_ROUTES.LEGAL_CLUSTER,
  },
  {
    id: 'bank',
    title_en: 'Open a Thai bank account',
    title_ru: 'Счёт в тайском банке',
    article_slug: 'banking-thailand',
    route: APP_ROUTES.BANKING,
  },
  {
    id: 'medical',
    title_en: 'Healthcare & insurance',
    title_ru: 'Медицина и страховка',
    article_slug: 'healthcare-insurance',
    route: APP_ROUTES.MEDICAL,
  },
  {
    id: 'transport',
    title_en: 'Transport & licences',
    title_ru: 'Транспорт и права',
    article_slug: 'drivers-license-thailand',
    route: APP_ROUTES.TRANSPORT,
  },
  {
    id: 'community',
    title_en: 'Community & lifestyle',
    title_ru: 'Комьюнити и быт',
    route: APP_ROUTES.EXPERIENCES,
  },
];

export function buildRelocationPlanSteps(quiz: RelocationQuizAnswers): RelocationPlanStep[] {
  const steps = baseSteps().filter((s) => {
    if (s.id === 'school') return quiz.household === 'family';
    return true;
  });

  return steps.map((s) => ({
    ...s,
    status: 'todo' as RelocationStepStatus,
  }));
}

export function mergePreservedStepStatus(
  next: RelocationPlanStep[],
  previous: RelocationPlanStep[] | null | undefined,
): RelocationPlanStep[] {
  if (!previous?.length) return next;
  const prevById = new Map(previous.map((p) => [p.id, p.status]));
  return next.map((s) => ({
    ...s,
    status: (prevById.get(s.id) as RelocationStepStatus | undefined) ?? s.status,
  }));
}
