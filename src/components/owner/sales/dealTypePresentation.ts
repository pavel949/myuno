import { AgentDeal, DealType } from '@/hooks/useAgentDeals';

type LocalizedText = { en: string; ru: string };

export interface DealDisplayFact {
  key: string;
  label: string;
  value: string;
}

interface DealTypePresentation {
  badgeClassName: string;
  accentClassName: string;
  eyebrow: LocalizedText;
  emptyNote: LocalizedText;
}

const TYPE_PRESENTATION: Record<DealType, DealTypePresentation> = {
  sale: {
    badgeClassName: 'bg-success/10 text-success border-success/40',
    accentClassName: 'border-l-emerald-500',
    eyebrow: { en: 'Buyer profile', ru: 'Профиль покупателя' },
    emptyNote: {
      en: 'Budget and property preferences define the core sales brief.',
      ru: 'Бюджет и параметры объекта формируют основу заявки на покупку.',
    },
  },
  rent_short: {
    badgeClassName: 'bg-primary/10 text-primary border-primary/40',
    accentClassName: 'border-l-sky-500',
    eyebrow: { en: 'Short-term rental', ru: 'Краткосрочная аренда' },
    emptyNote: {
      en: 'Dates, area and bedrooms matter most for short-term rentals.',
      ru: 'Для краткосрочной аренды важны даты, район и спальни.',
    },
  },
  rent_long: {
    badgeClassName: 'bg-primary/10 text-primary border-primary/40',
    accentClassName: 'border-l-cyan-500',
    eyebrow: { en: 'Long-term rental', ru: 'Долгосрочная аренда' },
    emptyNote: {
      en: 'Bedrooms, area and timing matter most for long-term rentals.',
      ru: 'Для долгосрочной аренды важнее всего спальни, район и срок.',
    },
  },
  investment: {
    badgeClassName: 'bg-accent/10 text-accent border-accent/40',
    accentClassName: 'border-l-amber-500',
    eyebrow: { en: 'Investment brief', ru: 'Инвестиционный бриф' },
    emptyNote: {
      en: 'Investment deals focus on ticket size, value and priority.',
      ru: 'Инвестиционные сделки завязаны на чеке, сумме и приоритете.',
    },
  },
  management: {
    badgeClassName: 'bg-primary/10 text-primary border-primary/40',
    accentClassName: 'border-l-violet-500',
    eyebrow: { en: 'Management request', ru: 'Запрос на управление' },
    emptyNote: {
      en: 'Management leads need clear status, next steps and ops notes.',
      ru: 'Для управления важны статус, следующий шаг и операционные заметки.',
    },
  },
  club_deal: {
    badgeClassName: 'bg-primary/10 text-primary border-primary/40',
    accentClassName: 'border-l-indigo-500',
    eyebrow: { en: 'Club deal', ru: 'Клубная сделка' },
    emptyNote: {
      en: 'Club deals involve multiple investors pooling capital.',
      ru: 'Клубные сделки объединяют нескольких инвесторов.',
    },
  },
  resale: {
    badgeClassName: 'bg-accent/10 text-accent border-accent/40',
    accentClassName: 'border-l-orange-500',
    eyebrow: { en: 'Resale', ru: 'Вторичка' },
    emptyNote: {
      en: 'Resale deals focus on current market value and condition.',
      ru: 'Сделки вторички ориентированы на рыночную стоимость.',
    },
  },
  offplan: {
    badgeClassName: 'bg-success/10 text-success border-success/40',
    accentClassName: 'border-l-teal-500',
    eyebrow: { en: 'Off-Plan sale', ru: 'Продажа Off-Plan' },
    emptyNote: {
      en: 'Off-plan deals track project, reservation and payment plan.',
      ru: 'Off-plan сделки привязаны к проекту, брони и графику оплат.',
    },
  },
};

function formatMoney(value: number | null | undefined, currency?: string | null) {
  if (value == null) return null;
  return `${Number(value).toLocaleString()} ${currency || ''}`.trim();
}

function formatBudgetRange(deal: AgentDeal) {
  if (deal.budget_min == null && deal.budget_max == null) return null;
  const min = formatMoney(deal.budget_min, deal.currency);
  const max = formatMoney(deal.budget_max, deal.currency);
  if (min && max) return `${min} - ${max}`;
  return min || max;
}

function formatList(values: string[] | null | undefined, fallback: string) {
  if (!values?.length) return fallback;
  return values.slice(0, 2).join(', ');
}

function formatNextAction(deal: AgentDeal, isRu: boolean) {
  if (!deal.next_action && !deal.next_action_date) {
    return isRu ? 'Не назначено' : 'Not scheduled';
  }
  const date = deal.next_action_date ? new Date(deal.next_action_date).toLocaleDateString(isRu ? 'ru-RU' : 'en-US') : null;
  if (deal.next_action && date) return `${deal.next_action} - ${date}`;
  return deal.next_action || date || (isRu ? 'Не назначено' : 'Not scheduled');
}

export function getDealTypePresentation(dealType: DealType | null | undefined) {
  return TYPE_PRESENTATION[dealType || 'sale'];
}

export function getDealTypeFacts(deal: AgentDeal, isRu: boolean): DealDisplayFact[] {
  const budgetLabel = isRu ? 'Бюджет' : 'Budget';
  const typesLabel = isRu ? 'Типы' : 'Types';
  const districtsLabel = isRu ? 'Районы' : 'Areas';
  const bedsLabel = isRu ? 'Спальни' : 'Beds';
  const valueLabel = isRu ? 'Сумма' : 'Value';
  const priorityLabel = isRu ? 'Приоритет' : 'Priority';
  const statusLabel = isRu ? 'Статус' : 'Status';
  const nextLabel = isRu ? 'Следующий шаг' : 'Next step';
  const notesLabel = isRu ? 'Заметки' : 'Notes';

  switch (deal.deal_type) {
    case 'rent_short':
    case 'rent_long':
      return [
        { key: 'budget', label: budgetLabel, value: formatBudgetRange(deal) || '—' },
        { key: 'beds', label: bedsLabel, value: deal.bedrooms_min ? `${deal.bedrooms_min}+` : '—' },
        { key: 'districts', label: districtsLabel, value: formatList(deal.preferred_districts, '—') },
      ];
    case 'investment':
      return [
        { key: 'value', label: valueLabel, value: formatMoney(deal.deal_value ?? deal.budget_max, deal.currency) || '—' },
        { key: 'budget', label: budgetLabel, value: formatBudgetRange(deal) || '—' },
        { key: 'priority', label: priorityLabel, value: deal.priority ? `${deal.priority}/3` : '—' },
      ];
    case 'management':
      return [
        { key: 'status', label: statusLabel, value: deal.deal_status || (isRu ? 'Активная' : 'Active') },
        { key: 'next_action', label: nextLabel, value: formatNextAction(deal, isRu) },
        { key: 'notes', label: notesLabel, value: deal.notes?.trim() ? deal.notes.trim().slice(0, 48) : '—' },
      ];
    case 'sale':
    default:
      return [
        { key: 'budget', label: budgetLabel, value: formatBudgetRange(deal) || '—' },
        { key: 'types', label: typesLabel, value: formatList(deal.preferred_types, '—') },
        { key: 'districts', label: districtsLabel, value: formatList(deal.preferred_districts, '—') },
      ];
  }
}

export function getDealTypeEmptyNote(dealType: DealType | null | undefined, isRu: boolean) {
  const presentation = getDealTypePresentation(dealType);
  return isRu ? presentation.emptyNote.ru : presentation.emptyNote.en;
}

export function getDealTypeEyebrow(dealType: DealType | null | undefined, isRu: boolean) {
  const presentation = getDealTypePresentation(dealType);
  return isRu ? presentation.eyebrow.ru : presentation.eyebrow.en;
}
