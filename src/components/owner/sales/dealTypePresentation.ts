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
    badgeClassName: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30',
    accentClassName: 'border-l-emerald-500',
    eyebrow: { en: 'Buyer profile', ru: 'Профиль покупателя' },
    emptyNote: {
      en: 'Budget and property preferences define the core sales brief.',
      ru: 'Бюджет и параметры объекта формируют основу заявки на покупку.',
    },
  },
  rent: {
    badgeClassName: 'bg-sky-500/10 text-sky-700 border-sky-500/30',
    accentClassName: 'border-l-sky-500',
    eyebrow: { en: 'Rental request', ru: 'Запрос на аренду' },
    emptyNote: {
      en: 'Bedrooms, area and timing matter most for rental requests.',
      ru: 'Для аренды важнее всего спальни, район и срок следующего шага.',
    },
  },
  investment: {
    badgeClassName: 'bg-amber-500/10 text-amber-700 border-amber-500/30',
    accentClassName: 'border-l-amber-500',
    eyebrow: { en: 'Investment brief', ru: 'Инвестиционный бриф' },
    emptyNote: {
      en: 'Investment deals focus on ticket size, value and priority.',
      ru: 'Инвестиционные сделки завязаны на чеке, сумме и приоритете.',
    },
  },
  management: {
    badgeClassName: 'bg-violet-500/10 text-violet-700 border-violet-500/30',
    accentClassName: 'border-l-violet-500',
    eyebrow: { en: 'Management request', ru: 'Запрос на управление' },
    emptyNote: {
      en: 'Management leads need clear status, next steps and ops notes.',
      ru: 'Для управления важны статус, следующий шаг и операционные заметки.',
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
    case 'rent':
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
