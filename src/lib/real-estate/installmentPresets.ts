/**
 * Installment plan templates for property sale / assignment financing.
 * No bank mortgages in Thailand for foreigners — only seller / developer financing.
 */

export interface InstallmentMilestone {
  /** Stable id (uuid or stage key) */
  id: string;
  /** Bilingual short label */
  labelEn: string;
  labelRu: string;
  /** Percent of total price (0-100). All milestones must sum to 100. */
  percent: number;
  /** When due, free-form text (e.g. "On signing", "On 50% construction", "2026-12-01") */
  dueAt?: string;
  dueAtRu?: string;
}

export interface InstallmentPreset {
  id: string;
  labelEn: string;
  labelRu: string;
  descEn: string;
  descRu: string;
  milestones: InstallmentMilestone[];
}

export const INSTALLMENT_PRESETS: InstallmentPreset[] = [
  {
    id: 'standard_25_75',
    labelEn: '25 / 75 (standard resale)',
    labelRu: '25 / 75 (стандарт вторички)',
    descEn: 'Deposit on signing, balance on transfer',
    descRu: 'Депозит при подписании, остаток при передаче',
    milestones: [
      { id: 'deposit', labelEn: 'Deposit on signing', labelRu: 'Депозит при подписании', percent: 25, dueAt: 'On contract signing', dueAtRu: 'При подписании' },
      { id: 'balance', labelEn: 'Balance on transfer', labelRu: 'Остаток при передаче', percent: 75, dueAt: 'On title transfer', dueAtRu: 'При передаче права' },
    ],
  },
  {
    id: 'developer_construction',
    labelEn: 'Developer construction-linked',
    labelRu: 'По стадиям стройки (застройщик)',
    descEn: 'Tied to construction milestones',
    descRu: 'Привязано к этапам строительства',
    milestones: [
      { id: 'booking', labelEn: 'Booking', labelRu: 'Бронь', percent: 5, dueAt: 'Reservation', dueAtRu: 'Бронирование' },
      { id: 'contract', labelEn: 'On SPA signing', labelRu: 'При подписании SPA', percent: 25, dueAt: 'SPA signing', dueAtRu: 'Подписание SPA' },
      { id: 'foundation', labelEn: 'Foundation done', labelRu: 'Готов фундамент', percent: 15, dueAt: 'Foundation completed', dueAtRu: 'Завершение фундамента' },
      { id: 'structure', labelEn: 'Structure 50%', labelRu: 'Каркас 50%', percent: 15, dueAt: '50% construction', dueAtRu: '50% строительства' },
      { id: 'roof', labelEn: 'Roof on', labelRu: 'Готова крыша', percent: 10, dueAt: 'Roofing completed', dueAtRu: 'Завершение крыши' },
      { id: 'transfer', labelEn: 'On transfer', labelRu: 'При передаче', percent: 30, dueAt: 'Title transfer', dueAtRu: 'Передача права' },
    ],
  },
  {
    id: 'seller_12_months',
    labelEn: '12 monthly installments',
    labelRu: 'Рассрочка на 12 мес',
    descEn: 'Equal monthly payments after deposit',
    descRu: 'Равные ежемесячные платежи после депозита',
    milestones: [
      { id: 'deposit', labelEn: 'Initial deposit', labelRu: 'Начальный депозит', percent: 20, dueAt: 'On contract', dueAtRu: 'При подписании' },
      { id: 'monthly', labelEn: 'Monthly × 12', labelRu: 'Ежемесячно × 12', percent: 80, dueAt: 'Equal monthly over 12 months', dueAtRu: 'Равными платежами 12 мес' },
    ],
  },
  {
    id: 'rent_to_own',
    labelEn: 'Rent-to-own (24m)',
    labelRu: 'Аренда с правом выкупа (24 мес)',
    descEn: 'Live in while paying down',
    descRu: 'Живёшь и выкупаешь параллельно',
    milestones: [
      { id: 'option_fee', labelEn: 'Option fee', labelRu: 'Опционный взнос', percent: 10, dueAt: 'On agreement', dueAtRu: 'При соглашении' },
      { id: 'monthly_rent_credit', labelEn: 'Monthly rent + credit × 24', labelRu: 'Аренда + взнос × 24 мес', percent: 50, dueAt: '24 monthly payments', dueAtRu: '24 ежемесячных платежа' },
      { id: 'balloon', labelEn: 'Balloon on transfer', labelRu: 'Остаток при выкупе', percent: 40, dueAt: 'End of term', dueAtRu: 'В конце срока' },
    ],
  },
  {
    id: 'cash_full',
    labelEn: '100% cash',
    labelRu: '100% сразу',
    descEn: 'No installments',
    descRu: 'Без рассрочки',
    milestones: [
      { id: 'full', labelEn: 'Full payment', labelRu: 'Полная оплата', percent: 100, dueAt: 'On transfer', dueAtRu: 'При передаче' },
    ],
  },
];

export function getInstallmentPreset(id: string): InstallmentPreset | undefined {
  return INSTALLMENT_PRESETS.find(p => p.id === id);
}

export function sumInstallmentPercent(milestones: InstallmentMilestone[] | null | undefined): number {
  if (!milestones || milestones.length === 0) return 0;
  return milestones.reduce((acc, m) => acc + (m.percent || 0), 0);
}

export function isInstallmentPlanValid(milestones: InstallmentMilestone[] | null | undefined): boolean {
  const total = sumInstallmentPercent(milestones);
  return Math.abs(total - 100) < 0.01;
}
