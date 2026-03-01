/**
 * Professional financial category classification system.
 * Standard defaults used when no company-specific overrides exist.
 */

export type CategoryClass = 'fixed' | 'variable' | 'semi_variable' | 'one_time';
export type CategoryGroup = 'operations' | 'administration' | 'marketing' | 'taxes_fees' | 'capex' | 'finance' | 'revenue' | 'other';
export type AllocationMethod = 'per_unit' | 'by_area' | 'equal_split' | 'direct';

export interface CategoryMeta {
  class: CategoryClass;
  group: CategoryGroup;
  affectsProfit: boolean;
  taxDeductible: boolean;
  allocation: AllocationMethod;
}

// ─── Expense category defaults ────────────────────────────────────────────
export const EXPENSE_CATEGORY_DEFAULTS: Record<string, CategoryMeta> = {
  cleaning:       { class: 'variable',      group: 'operations',     affectsProfit: true,  taxDeductible: true,  allocation: 'per_unit' },
  maintenance:    { class: 'semi_variable',  group: 'operations',     affectsProfit: true,  taxDeductible: true,  allocation: 'per_unit' },
  repair:         { class: 'semi_variable',  group: 'operations',     affectsProfit: true,  taxDeductible: true,  allocation: 'per_unit' },
  utilities:      { class: 'variable',       group: 'operations',     affectsProfit: true,  taxDeductible: true,  allocation: 'per_unit' },
  electricity:    { class: 'variable',       group: 'operations',     affectsProfit: true,  taxDeductible: true,  allocation: 'per_unit' },
  water:          { class: 'variable',       group: 'operations',     affectsProfit: true,  taxDeductible: true,  allocation: 'per_unit' },
  internet:       { class: 'fixed',          group: 'operations',     affectsProfit: true,  taxDeductible: true,  allocation: 'per_unit' },
  insurance:      { class: 'fixed',          group: 'administration', affectsProfit: true,  taxDeductible: true,  allocation: 'per_unit' },
  taxes:          { class: 'fixed',          group: 'taxes_fees',     affectsProfit: true,  taxDeductible: false, allocation: 'per_unit' },
  income_tax:     { class: 'fixed',          group: 'taxes_fees',     affectsProfit: true,  taxDeductible: false, allocation: 'direct' },
  management_fee: { class: 'variable',       group: 'administration', affectsProfit: true,  taxDeductible: false, allocation: 'per_unit' },
  platform_fee:   { class: 'variable',       group: 'marketing',      affectsProfit: true,  taxDeductible: false, allocation: 'direct' },
  supplies:       { class: 'variable',       group: 'operations',     affectsProfit: true,  taxDeductible: true,  allocation: 'per_unit' },
  shopping:       { class: 'variable',       group: 'operations',     affectsProfit: true,  taxDeductible: true,  allocation: 'per_unit' },
  furniture:      { class: 'one_time',       group: 'capex',          affectsProfit: false, taxDeductible: true,  allocation: 'per_unit' },
  appliances:     { class: 'one_time',       group: 'capex',          affectsProfit: false, taxDeductible: true,  allocation: 'per_unit' },
  depreciation:   { class: 'fixed',          group: 'finance',        affectsProfit: true,  taxDeductible: true,  allocation: 'per_unit' },
  loan_payment:   { class: 'fixed',          group: 'finance',        affectsProfit: false, taxDeductible: false, allocation: 'direct' },
  legal:          { class: 'semi_variable',  group: 'administration', affectsProfit: true,  taxDeductible: true,  allocation: 'direct' },
  advertising:    { class: 'variable',       group: 'marketing',      affectsProfit: true,  taxDeductible: true,  allocation: 'per_unit' },
  other:          { class: 'variable',       group: 'other',          affectsProfit: true,  taxDeductible: false, allocation: 'direct' },
  other_expense:  { class: 'variable',       group: 'other',          affectsProfit: true,  taxDeductible: false, allocation: 'direct' },
};

// ─── Income category defaults ────────────────────────────────────────────
export const INCOME_CATEGORY_DEFAULTS: Record<string, CategoryMeta> = {
  rent:           { class: 'variable',  group: 'revenue', affectsProfit: true,  taxDeductible: false, allocation: 'direct' },
  deposit:        { class: 'one_time',  group: 'revenue', affectsProfit: false, taxDeductible: false, allocation: 'direct' },
  cleaning_fee:   { class: 'variable',  group: 'revenue', affectsProfit: true,  taxDeductible: false, allocation: 'direct' },
  late_fee:       { class: 'variable',  group: 'revenue', affectsProfit: true,  taxDeductible: false, allocation: 'direct' },
  other_income:   { class: 'variable',  group: 'other',   affectsProfit: true,  taxDeductible: false, allocation: 'direct' },
};

/** Get defaults for any category code, with a safe fallback */
export function getCategoryDefaults(code: string, type: 'expense' | 'income'): CategoryMeta {
  const map = type === 'expense' ? EXPENSE_CATEGORY_DEFAULTS : INCOME_CATEGORY_DEFAULTS;
  return map[code] ?? { class: 'variable', group: 'other', affectsProfit: true, taxDeductible: false, allocation: 'direct' };
}

// ─── Localization maps ────────────────────────────────────────────────────
export const CLASS_LABELS: Record<CategoryClass, { en: string; ru: string }> = {
  fixed:         { en: 'Fixed',         ru: 'Постоянные' },
  variable:      { en: 'Variable',      ru: 'Переменные' },
  semi_variable: { en: 'Semi-variable', ru: 'Полупеременные' },
  one_time:      { en: 'One-time',      ru: 'Разовые' },
};

export const GROUP_LABELS: Record<CategoryGroup, { en: string; ru: string }> = {
  operations:     { en: 'Operations',     ru: 'Операционные' },
  administration: { en: 'Administration', ru: 'Административные' },
  marketing:      { en: 'Marketing',      ru: 'Маркетинг' },
  taxes_fees:     { en: 'Taxes & Fees',   ru: 'Налоги и сборы' },
  capex:          { en: 'CAPEX',          ru: 'Капитальные' },
  finance:        { en: 'Finance',        ru: 'Финансовые' },
  revenue:        { en: 'Revenue',        ru: 'Доходы' },
  other:          { en: 'Other',          ru: 'Прочее' },
};

export const ALLOCATION_LABELS: Record<AllocationMethod, { en: string; ru: string }> = {
  per_unit:    { en: 'Per unit',     ru: 'На юнит' },
  by_area:     { en: 'By area',     ru: 'По площади' },
  equal_split: { en: 'Equal split', ru: 'Поровну' },
  direct:      { en: 'Direct',      ru: 'Напрямую' },
};

export const CLASS_COLORS: Record<CategoryClass, string> = {
  fixed:         'bg-info/15 text-info border-info/30',
  variable:      'bg-success/15 text-success border-success/30',
  semi_variable: 'bg-warning/15 text-warning border-warning/30',
  one_time:      'bg-accent-amber/15 text-accent-amber border-accent-amber/30',
};

// ─── Group ordering for settings UI ──────────────────────────────────────
export const GROUP_ORDER: CategoryGroup[] = [
  'operations', 'administration', 'marketing', 'taxes_fees', 'capex', 'finance', 'revenue', 'other',
];
